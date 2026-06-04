import { ipcMain } from 'electron'
import { FyService } from '../services/fy.service'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'

export function registerFyIpc() {
    const fyService = new FyService()

    ipcMain.handle('fy:list', async () => {
        // Anyone logged in can view FYs (they need to pick one)
        return await fyService.getFinancialYears()
    })

    ipcMain.handle('fy:create', async (_, payload: { data: any, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_MASTERS)
        return await fyService.createFinancialYear(payload.data)
    })

    ipcMain.handle('fy:update', async (_, payload: { id: string, data: any, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_MASTERS)
        return await fyService.updateFinancialYear(payload.id, payload.data)
    })

    ipcMain.handle('fy:toggleLock', async (_, payload: { id: string, is_locked: number, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_MASTERS)
        return await fyService.toggleLock(payload.id, payload.is_locked)
    })
}
