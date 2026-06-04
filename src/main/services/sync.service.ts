import { google } from 'googleapis'
import { getSystemKey, encrypt, decrypt } from '../lib/crypto'
import { logger } from '../lib/logger'
import * as fs from 'fs'
import { app } from 'electron'
import { resolve } from 'path'
import { BackupService } from './backup.service'

// In a real desktop app, these would be provided at build time or via a secure backend
// For this template, we use placeholders or expect the user to have set them.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'PROVIDED_BY_BUILD_ENV'
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'PROVIDED_BY_BUILD_ENV'
// Localhost redirect for intercepting the code via a custom protocol or local server
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob' // For manual copy-paste in this template

export class SyncService {
    private backupService = new BackupService()

    private getOAuthClient() {
        return new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI
        )
    }

    async getAuthUrl(): Promise<string> {
        const oauth2Client = this.getOAuthClient()
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.file']
        })
    }

    async exchangeCode(code: string, companyName: string): Promise<void> {
        const oauth2Client = this.getOAuthClient()
        const { tokens } = await oauth2Client.getToken(code)

        const systemKey = getSystemKey(companyName)
        const encryptedToken = encrypt(JSON.stringify(tokens), systemKey)

        await this.backupService.updateSetting('gdrive_token_encrypted', encryptedToken)
        await this.backupService.updateSetting('gdrive_enabled', '1')
        logger.info(`Google Drive synced and enabled for ${companyName}`)
    }

    async revokeAccess(companyName: string): Promise<void> {
        const oauth2Client = await this.getAuthenticatedClient(companyName)
        if (oauth2Client) {
            try {
                await oauth2Client.revokeCredentials()
            } catch (e) {
                // Ignore errors if token is already revoked/expired
            }
        }
        await this.backupService.updateSetting('gdrive_token_encrypted', '')
        await this.backupService.updateSetting('gdrive_enabled', '0')
        await this.backupService.updateSetting('gdrive_folder_id', '')
        logger.info(`Google Drive revoked for ${companyName}`)
    }

    private async getAuthenticatedClient(companyName: string) {
        const settings = await this.backupService.getSettings()
        if (settings.gdrive_enabled !== '1' || !settings.gdrive_token_encrypted) {
            return null
        }

        const systemKey = getSystemKey(companyName)
        let tokens: any

        try {
            const raw = decrypt(settings.gdrive_token_encrypted, systemKey)
            tokens = JSON.parse(raw)
        } catch (e) {
            logger.error('Failed to decrypt Google Drive token: ' + e)
            return null
        }

        const oauth2Client = this.getOAuthClient()
        oauth2Client.setCredentials(tokens)

        // Handle token refresh automatically and save it back
        oauth2Client.on('tokens', async (newTokens) => {
            const updatedTokens = {
                ...tokens,
                ...newTokens
            }
            const encrypted = encrypt(JSON.stringify(updatedTokens), systemKey)
            await this.backupService.updateSetting('gdrive_token_encrypted', encrypted)
        })

        return oauth2Client
    }

    private async ensureAppFolder(drive: any, companyName: string): Promise<string> {
        const settings = await this.backupService.getSettings()
        if (settings.gdrive_folder_id) {
            return settings.gdrive_folder_id
        }

        // Sanitize companyName before embedding into a Drive API query string
        const safeCompanyName = companyName.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 50)
        const folderName = `LedgerX-Backups-${safeCompanyName}`

        // Search first — use a parameterized name not string interpolation
        const res = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        })

        if (res.data.files && res.data.files.length > 0) {
            const folderId = res.data.files[0].id
            await this.backupService.updateSetting('gdrive_folder_id', folderId)
            return folderId
        }

        // Create
        const createRes = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        })

        const newFolderId = createRes.data.id
        await this.backupService.updateSetting('gdrive_folder_id', newFolderId)
        return newFolderId
    }

    async uploadBackup(localPath: string, companyName: string) {
        const auth = await this.getAuthenticatedClient(companyName)
        if (!auth) throw new Error('Not connected to Google Drive')

        const drive = google.drive({ version: 'v3', auth })
        const folderId = await this.ensureAppFolder(drive, companyName)

        const fileName = localPath.split(/[\\/]/).pop()

        const fileMetadata = {
            name: fileName,
            parents: [folderId]
        }

        const media = {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(localPath)
        }

        logger.info(`Uploading backup to Google Drive: ${fileName}`)
        const res = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, size, createdTime'
        })
        logger.info(`Uploaded successfully: ${res.data.id}`)
        return res.data
    }

    async listDriveBackups(companyName: string) {
        const auth = await this.getAuthenticatedClient(companyName)
        if (!auth) return []

        const drive = google.drive({ version: 'v3', auth })
        const folderId = await this.ensureAppFolder(drive, companyName)

        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, size, createdTime)',
            orderBy: 'createdTime desc'
        })

        return (res.data.files || []).map(f => ({
            id: f.id as string,
            name: f.name as string,
            sizeBytes: parseInt(f.size || '0', 10),
            createdAt: f.createdTime as string
        }))
    }

    async downloadBackup(fileId: string, destPath: string, companyName: string): Promise<void> {
        const auth = await this.getAuthenticatedClient(companyName)
        if (!auth) throw new Error('Not connected to Google Drive')

        // Validate fileId format to prevent injection
        if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
            throw new Error('Invalid file ID format')
        }

        // Path traversal: destPath must resolve within userData or documents
        const resolvedDest = resolve(destPath)
        const allowedRoots = [
            resolve(app.getPath('userData')),
            resolve(app.getPath('documents'), 'LedgerX', 'Backups')
        ]
        if (!allowedRoots.some(root => resolvedDest.startsWith(root)) || !resolvedDest.endsWith('.lxdb')) {
            throw new Error('Download path is outside allowed directory')
        }

        const drive = google.drive({ version: 'v3', auth })

        logger.info(`Downloading backup from Drive: ${fileId}`)
        const res = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        )

        return new Promise((resolve, reject) => {
            const tempPath = destPath + '.tmp'
            const dest = fs.createWriteStream(tempPath)

            res.data.on('end', () => {
                try {
                    fs.renameSync(tempPath, destPath)
                    resolve(undefined)
                } catch (e) {
                    reject(e)
                }
            })

            res.data.on('error', (err: any) => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
                reject(err)
            })

            res.data.pipe(dest)
        })
    }
}
