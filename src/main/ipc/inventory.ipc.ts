import { ipcMain } from 'electron'
import * as inventoryRepo from '../db/repositories/inventory.repo'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'

export function registerInventoryIpc() {
    // --- Item Groups ---
    ipcMain.handle('inventory:group:list', async (_, payload: { sessionToken?: string } = {}) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await inventoryRepo.getItemGroups()
    })

    ipcMain.handle('inventory:group:create', async (_, args: { data: any, sessionToken?: string }) => {
        const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)
        return await inventoryRepo.createItemGroup(args.data, session.id)
    })

    ipcMain.handle('inventory:group:update', async (_, args: { id: string, data: any, sessionToken?: string }) => {
        const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)
        return await inventoryRepo.updateItemGroup(args.id, args.data, session.id)
    })

    ipcMain.handle('inventory:group:delete', async (_, args: { id: string, sessionToken?: string }) => {
        const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)
        return await inventoryRepo.deleteItemGroup(args.id, session.id)
    })

    // --- Items ---
    ipcMain.handle('inventory:item:list', async (_, payload: { sessionToken?: string } = {}) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await inventoryRepo.getItems()
    })

    ipcMain.handle('inventory:item:create', async (_, args: { data: any, sessionToken?: string }) => {
        const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)
        return await inventoryRepo.createItem(args.data, session.id)
    })

    ipcMain.handle('inventory:item:update', async (_, args: { id: string, data: any, sessionToken?: string }) => {
        const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)
        return await inventoryRepo.updateItem(args.id, args.data, session.id)
    })

    ipcMain.handle('inventory:item:delete', async (_, args: { id: string, sessionToken?: string }) => {
        const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)
        return await inventoryRepo.deleteItem(args.id, session.id)
    })

    // --- Reports ---
    ipcMain.handle('inventory:reports:summary', async (_, args: { filters?: { dateFrom?: string, dateTo?: string }, sessionToken?: string }) => {
        await requirePermission(args.sessionToken, Permission.VIEW_REPORTS)
        return await inventoryRepo.getStockSummary(args.filters)
    })

    ipcMain.handle('inventory:reports:ledger', async (_, args: { itemId: string, filters?: { dateFrom?: string, dateTo?: string }, sessionToken?: string }) => {
        await requirePermission(args.sessionToken, Permission.VIEW_REPORTS)
        return await inventoryRepo.getStockLedger(args.itemId, args.filters)
    })
}
