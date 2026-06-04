import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as ledgerRepo from '../db/repositories/ledger.repo'
import {
    createLedgerGroupSchema,
    createLedgerAccountSchema,
    updateLedgerGroupSchema,
    deleteLedgerGroupSchema,
    updateLedgerAccountSchema,
    deleteLedgerAccountSchema
} from '../../shared/types'
import { logger } from '../lib/logger'
import { requirePermission } from '../lib/ipc-auth'
import { Permission } from '../lib/rbac'

export function registerLedgerIpcHandlers() {
    ipcMain.handle(IPC.LEDGER.CREATE_GROUP, async (_, args) => {
        try {
            const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)

            const parsed = createLedgerGroupSchema.parse(args)
            const res = await ledgerRepo.createGroup(parsed, session.id)
            return { success: true, data: res }
        } catch (error: any) {
            logger.error('Failed to create ledger group', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.LEDGER.CREATE_ACCOUNT, async (_, args) => {
        try {
            const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)

            const parsed = createLedgerAccountSchema.parse(args)
            const res = await ledgerRepo.createAccount(parsed, session.id)
            return { success: true, data: res }
        } catch (error: any) {
            logger.error('Failed to create ledger account', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.LEDGER.GET_GROUPS, async (_, args) => {
        await requirePermission(args?.sessionToken, Permission.VIEW_REPORTS)
        return ledgerRepo.getGroups()
    })

    ipcMain.handle(IPC.LEDGER.GET_ACCOUNTS, async (_, args) => {
        await requirePermission(args?.sessionToken, Permission.VIEW_REPORTS)
        return ledgerRepo.getAccounts()
    })

    ipcMain.handle(IPC.LEDGER.UPDATE_GROUP, async (_, args) => {
        try {
            const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)

            const parsed = updateLedgerGroupSchema.parse(args)
            const res = await ledgerRepo.updateGroup(parsed, session.id)
            return { success: true, data: res }
        } catch (error: any) {
            logger.error('Failed to update ledger group', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.LEDGER.DELETE_GROUP, async (_, args) => {
        try {
            const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)

            const parsed = deleteLedgerGroupSchema.parse(args)
            await ledgerRepo.deleteGroup(parsed.id, session.id)
            return { success: true }
        } catch (error: any) {
            logger.error('Failed to delete ledger group', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.LEDGER.UPDATE_ACCOUNT, async (_, args) => {
        try {
            const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)

            const parsed = updateLedgerAccountSchema.parse(args)
            const res = await ledgerRepo.updateAccount(parsed, session.id)
            return { success: true, data: res }
        } catch (error: any) {
            logger.error('Failed to update ledger account', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.LEDGER.DELETE_ACCOUNT, async (_, args) => {
        try {
            const session = await requirePermission(args.sessionToken, Permission.MANAGE_MASTERS)

            const parsed = deleteLedgerAccountSchema.parse(args)
            await ledgerRepo.deleteAccount(parsed.id, session.id)
            return { success: true }
        } catch (error: any) {
            logger.error('Failed to delete ledger account', error)
            return { success: false, error: error.message }
        }
    })
}
