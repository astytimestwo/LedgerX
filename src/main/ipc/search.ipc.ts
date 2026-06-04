import { ipcMain } from 'electron'
import { searchService } from '../services/search.service'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'

export function registerSearchIpc() {
    ipcMain.handle('search:global', async (_, payload: { query: string, sessionToken?: string }) => {
        // Enforce user is logged in and has basic report viewing or similar generic read access
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await searchService.globalSearch(payload.query)
    })
}
