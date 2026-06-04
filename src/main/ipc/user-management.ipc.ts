import { ipcMain } from 'electron'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'
import { UserManagementService } from '../services/user-management.service'

export function registerUserManagementIpc() {
    const userService = new UserManagementService()

    ipcMain.handle('users:list', async (_, payload: { sessionToken?: string } = {}) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_USERS)
        return await userService.listUsers()
    })

    ipcMain.handle('users:create', async (_, payload: { data: any, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_USERS)
        return await userService.createUser(payload.data)
    })

    ipcMain.handle('users:update', async (_, payload: { id: string, data: any, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_USERS)
        return await userService.updateUser(payload.id, payload.data)
    })

    ipcMain.handle('users:deactivate', async (_, payload: { id: string, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_USERS)
        return await userService.deactivateUser(payload.id)
    })

    ipcMain.handle('users:resetPassword', async (_, payload: { id: string, newPassword: string, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_USERS)
        return await userService.resetPassword(payload.id, payload.newPassword)
    })

    ipcMain.handle('users:sessionLog', async (_, payload: { userId?: string, period?: { from: string, to: string }, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_USERS)
        return await userService.getSessionLog(payload.userId, payload.period)
    })

    ipcMain.handle('users:forceLogout', async (_, payload: { targetUserId: string, sessionToken?: string }) => {
        const session = await requirePermission(payload.sessionToken, Permission.MANAGE_USERS)
        if (session.id === payload.targetUserId) {
            throw new Error('Cannot force logout yourself')
        }
        return await userService.forceLogout(payload.targetUserId)
    })
}
