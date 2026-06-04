import { ipcMain, app } from 'electron'
import { BackupService } from '../services/backup.service'
import { SyncService } from '../services/sync.service'
import { requireAdmin } from '../lib/ipc-auth'
import { startBackupScheduler } from '../lib/scheduler'

export function registerBackupIpc() {
    const backupService = new BackupService()
    const syncService = new SyncService()

    ipcMain.handle('backup:getSettings', async (_, payload: { sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        return await backupService.getSettings()
    })

    ipcMain.handle('backup:updateSetting', async (_, payload: { key: string, value: string, companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        await backupService.updateSetting(payload.key, payload.value)

        // If they updated auto backup settings, restart the scheduler
        if (payload.key === 'backup_auto_enabled' || payload.key === 'backup_auto_time') {
            await startBackupScheduler(payload.companyName)
        }
        return { success: true }
    })

    ipcMain.handle('backup:listLocal', async (_, payload: { companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        return await backupService.listLocalBackups(payload.companyName)
    })

    ipcMain.handle('backup:createLocal', async (_, payload: { companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        return await backupService.createLocalBackup(payload.companyName)
    })

    ipcMain.handle('backup:restoreLocal', async (_, payload: { path: string, companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        await backupService.restoreFromBackup(payload.path, payload.companyName)
        app.relaunch()
        app.quit()
        return { success: true }
    })

    // Google Drive
    ipcMain.handle('backup:gdrive:getAuthUrl', async (_, payload: { sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        return await syncService.getAuthUrl()
    })

    ipcMain.handle('backup:gdrive:exchangeCode', async (_, payload: { code: string, companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        await syncService.exchangeCode(payload.code, payload.companyName)
        return { success: true }
    })

    ipcMain.handle('backup:gdrive:revoke', async (_, payload: { companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        await syncService.revokeAccess(payload.companyName)
        return { success: true }
    })

    ipcMain.handle('backup:gdrive:list', async (_, payload: { companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        return await syncService.listDriveBackups(payload.companyName)
    })

    ipcMain.handle('backup:gdrive:upload', async (_, payload: { localPath: string, companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        return await syncService.uploadBackup(payload.localPath, payload.companyName)
    })

    ipcMain.handle('backup:gdrive:download', async (_, payload: { fileId: string, destPath: string, companyName: string, sessionToken?: string }) => {
        await requireAdmin(payload.sessionToken)
        await syncService.downloadBackup(payload.fileId, payload.destPath, payload.companyName)
        return { success: true }
    })
}
