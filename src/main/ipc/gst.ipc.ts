import { ipcMain } from 'electron'
import { GstService } from '../services/gst.service'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'

export function registerGstIpc() {
    const gstService = new GstService()
    // --- HSN Master ---
    ipcMain.handle('gst:hsn:list', async (_, payload: { sessionToken?: string } = {}) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await gstService.getHsnList()
    })

    ipcMain.handle('gst:hsn:get', async (_, payload: { code: string, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await gstService.getHsn(payload.code)
    })

    ipcMain.handle('gst:hsn:create', async (_, payload: { data: any, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_MASTERS)
        return await gstService.createHsn(payload.data)
    })

    ipcMain.handle('gst:hsn:update', async (_, payload: { code: string, data: any, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_MASTERS)
        return await gstService.updateHsn(payload.code, payload.data)
    })

    ipcMain.handle('gst:hsn:delete', async (_, payload: { code: string, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.MANAGE_MASTERS)
        return await gstService.deleteHsn(payload.code)
    })

    // --- Reports ---
    ipcMain.handle('gst:report:gstr1', async (_, payload: { period: { from: string, to: string }, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await gstService.buildGstr1(payload.period)
    })

    ipcMain.handle('gst:report:gstr3b', async (_, payload: { period: { from: string, to: string }, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await gstService.buildGstr3B(payload.period)
    })

    ipcMain.handle('gst:report:gstr2a', async (_, payload: { data: { period: { from: string, to: string }, portalData: any }, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await gstService.buildGstr2aReconciliation(payload.data)
    })

    ipcMain.handle('gst:report:tax-liability', async (_, payload: { period: { from: string, to: string }, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await gstService.buildTaxLiabilityReport(payload.period)
    })

    ipcMain.handle('gst:report:itc-ledger', async (_, payload: { period: { from: string, to: string }, sessionToken?: string }) => {
        await requirePermission(payload.sessionToken, Permission.VIEW_REPORTS)
        return await gstService.buildItcLedger(payload.period)
    })
}
