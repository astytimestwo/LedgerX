import { getDb, closeDb } from '../db/connection'
import { app } from 'electron'
import { join, resolve } from 'path'
import * as fs from 'fs'
import { logger } from '../lib/logger'

export interface BackupFile {
    name: string
    path: string
    sizeBytes: number
    createdAt: string
}

export class BackupService {
    async getSettings(): Promise<Record<string, string>> {
        const db = getDb()
        const rows = await db.selectFrom('app_settings').selectAll().execute()
        const settings: Record<string, string> = {}
        rows.forEach(row => {
            settings[row.key] = row.value
        })
        return settings
    }

    async updateSetting(key: string, value: string) {
        // Whitelist allowed keys to prevent arbitrary data injection
        const ALLOWED_KEYS = new Set([
            'backup_local_path', 'backup_retention_days', 'backup_auto_enabled',
            'backup_auto_time', 'gdrive_enabled', 'gdrive_token_encrypted',
            'gdrive_folder_id', 'gdrive_auto_sync'
        ])
        if (!ALLOWED_KEYS.has(key)) {
            throw new Error(`Setting key '${key}' is not allowed`)
        }

        const db = getDb()
        await db.insertInto('app_settings')
            .values({ key, value })
            .onConflict((oc) => oc.column('key').doUpdateSet({ value }))
            .execute()
    }

    private getDefaultBackupDir(companyName: string) {
        const docDir = app.getPath('documents')
        const dir = join(docDir, 'LedgerX', 'Backups', companyName)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        return dir
    }

    async createLocalBackup(companyName: string): Promise<string> {
        const settings = await this.getSettings()
        const backupDir = settings.backup_local_path || this.getDefaultBackupDir(companyName)

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true })
        }

        // e.g. 2024-05-12_15-30.lxdb
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)
        const fileName = `${dateStr}.lxdb`
        const destPath = join(backupDir, fileName)

        // Wait for current transactions to finish and copy
        // In WAL mode, we should ideally run a checkpoint or simply copy. 
        // better-sqlite3 `backup` API is safer for live databases.
        const sqlite = (await import('../db/connection')).getRawDb()
        await sqlite.backup(destPath)

        logger.info(`Backup created: ${destPath}`)

        await this.pruneOldBackups(companyName)

        return destPath
    }

    async pruneOldBackups(companyName: string) {
        const settings = await this.getSettings()
        const daysToKeep = parseInt(settings.backup_retention_days || '30', 10)
        const backupDir = settings.backup_local_path || this.getDefaultBackupDir(companyName)

        if (!fs.existsSync(backupDir)) return

        const files = fs.readdirSync(backupDir)
        const now = Date.now()

        files.forEach(file => {
            if (file.endsWith('.lxdb')) {
                const filePath = join(backupDir, file)
                const stats = fs.statSync(filePath)
                const diffDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24)
                if (diffDays > daysToKeep) {
                    fs.unlinkSync(filePath)
                    logger.info(`Pruned old backup: ${filePath}`)
                }
            }
        })
    }

    async listLocalBackups(companyName: string): Promise<BackupFile[]> {
        const settings = await this.getSettings()
        const backupDir = settings.backup_local_path || this.getDefaultBackupDir(companyName)

        if (!fs.existsSync(backupDir)) return []

        const files = fs.readdirSync(backupDir)
        const result: BackupFile[] = []

        files.forEach(file => {
            if (file.endsWith('.lxdb')) {
                const filePath = join(backupDir, file)
                const stats = fs.statSync(filePath)
                result.push({
                    name: file,
                    path: filePath,
                    sizeBytes: stats.size,
                    createdAt: stats.mtime.toISOString()
                })
            }
        })

        return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }

    async restoreFromBackup(backupPath: string, companyName: string): Promise<void> {
        // Sanitize companyName: allow only alphanumerics, spaces, hyphens and underscores
        const safeCompanyName = companyName.replace(/[^a-zA-Z0-9 _-]/g, '')
        if (!safeCompanyName || safeCompanyName !== companyName) {
            throw new Error('Invalid company name')
        }

        // Normalize the backup path and verify it exists
        const normalizedBackupPath = resolve(backupPath)
        if (!fs.existsSync(normalizedBackupPath)) {
            throw new Error('Backup file not found')
        }

        // Path traversal prevention: ensure the resolved path ends in .lxdb
        // and comes from a trusted location (userData OR documents/LedgerX/Backups)
        const allowedRoots = [
            resolve(app.getPath('userData')),
            resolve(app.getPath('documents'), 'LedgerX', 'Backups')
        ]
        const isAllowed = allowedRoots.some(root => normalizedBackupPath.startsWith(root))
        if (!isAllowed || !normalizedBackupPath.endsWith('.lxdb')) {
            throw new Error('Backup path is outside allowed directory')
        }

        const targetPath = join(app.getPath('userData'), `${safeCompanyName}.lxdb`)

        logger.info(`Starting restore from ${normalizedBackupPath} to ${targetPath}`)

        // Close active connections
        await closeDb()

        // Replace file
        fs.copyFileSync(normalizedBackupPath, targetPath)

        // Ensure WAL and SHM files attached to the old database are cleared if present
        const dbDir = app.getPath('userData')
        if (fs.existsSync(join(dbDir, `${safeCompanyName}.lxdb-wal`))) {
            fs.unlinkSync(join(dbDir, `${safeCompanyName}.lxdb-wal`))
        }
        if (fs.existsSync(join(dbDir, `${safeCompanyName}.lxdb-shm`))) {
            fs.unlinkSync(join(dbDir, `${safeCompanyName}.lxdb-shm`))
        }

        logger.info(`Restore completed successfully`)
    }
}
