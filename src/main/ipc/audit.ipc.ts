import { ipcMain } from 'electron'
import { AuditService, AuditFilters } from '../services/audit.service'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'

export function registerAuditIpc() {
    const auditService = new AuditService()

    ipcMain.handle('audit:list', async (_, payload: { filters: AuditFilters, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_AUDIT)
        return await auditService.getAuditLog(payload.filters || {})
    })

    ipcMain.handle('audit:export', async (_, payload: { filters: AuditFilters, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.EXPORT_REPORTS)
        // Hard cap export at 10,000 rows server-side to prevent memory exhaustion
        const MAX_EXPORT_ROWS = 10000
        const exportFilters = { ...payload.filters, limit: Math.min(payload.filters?.limit || MAX_EXPORT_ROWS, MAX_EXPORT_ROWS), offset: 0 }
        return await auditService.getAuditLog(exportFilters)
    })
}
