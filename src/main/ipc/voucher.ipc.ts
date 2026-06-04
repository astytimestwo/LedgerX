import { ipcMain } from 'electron'
import { createNewVoucher, editVoucher, removeVoucher, getDayBook, getLedgerStatement, getTrialBalance, buildProfitAndLoss, buildBalanceSheet } from '../services/voucher.service'
import { createVoucherSchema, updateVoucherSchema } from '../../shared/types'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'

// local requirePermission removed

export function registerVoucherIpc() {
    ipcMain.handle('voucher:create', async (event, payload: any) => {
        const { input, sessionToken } = payload
        const user = await requirePermission(sessionToken, Permission.CREATE_VOUCHER)
        const parsed = createVoucherSchema.parse(input)
        return await createNewVoucher(parsed, user.id)
    })

    ipcMain.handle('voucher:update', async (event, payload: any) => {
        const { input, sessionToken } = payload
        const user = await requirePermission(sessionToken, Permission.EDIT_VOUCHER)
        const parsed = updateVoucherSchema.parse(input)
        return await editVoucher(parsed, user.id)
    })

    ipcMain.handle('voucher:delete', async (event, payload: { id: string, sessionToken: string }) => {
        const user = await requirePermission(payload.sessionToken, Permission.DELETE_VOUCHER)
        return await removeVoucher(payload.id, user.id)
    })

    ipcMain.handle('voucher:getDayBook', async (event, filters: any) => {
        await requirePermission(filters?.sessionToken, Permission.VIEW_REPORTS)
        return await getDayBook(filters)
    })

    ipcMain.handle('voucher:getLedgerStatement', async (event, params: { ledgerId: string, dateFrom?: string, dateTo?: string, sessionToken?: string }) => {
        await requirePermission(params.sessionToken, Permission.VIEW_REPORTS)
        return await getLedgerStatement(params.ledgerId, params.dateFrom, params.dateTo)
    })

    ipcMain.handle('voucher:getTrialBalance', async (event, filters: { dateTo?: string, sessionToken?: string }) => {
        await requirePermission(filters?.sessionToken, Permission.VIEW_REPORTS)
        return await getTrialBalance(filters?.dateTo)
    })

    ipcMain.handle('voucher:getProfitAndLoss', async (event, filters: { dateFrom?: string, dateTo?: string, sessionToken?: string }) => {
        await requirePermission(filters?.sessionToken, Permission.VIEW_REPORTS)
        return await buildProfitAndLoss(filters?.dateFrom, filters?.dateTo)
    })

    ipcMain.handle('voucher:getBalanceSheet', async (event, filters: { dateTo?: string, sessionToken?: string }) => {
        await requirePermission(filters?.sessionToken, Permission.VIEW_REPORTS)
        return await buildBalanceSheet(filters?.dateTo)
    })
}
