import {
    CreateCompanyInput,
    LoginInput,
    UnlockCompanyInput,
    CreateLedgerGroupInput,
    UpdateLedgerGroupInput,
    DeleteLedgerGroupInput,
    CreateLedgerAccountInput,
    UpdateLedgerAccountInput,
    DeleteLedgerAccountInput,
    User,
    CreateVoucherInput,
    UpdateVoucherInput,
    TrialBalanceRow,
    LedgerStatementRow,
    ProfitAndLossReport,
    BalanceSheetReport
} from '../../shared/types'
import { useSessionStore } from '../stores/session.store'
import { toast } from '../stores/toast.store'

interface RawApi {
    ping: () => Promise<string>
    checkFirstRun: () => Promise<boolean>
    getCompanies: () => Promise<string[]>
    unlockCompany: (args: UnlockCompanyInput) => Promise<{ success: boolean; error?: string }>
    createCompany: (args: CreateCompanyInput) => Promise<{ success: boolean; error?: string }>
    login: (args: LoginInput) => Promise<{ success: boolean; requiresTotp: boolean; user?: User; sessionToken?: string; error?: string }>
    setupTotp: (args: { userId: string }) => Promise<{ secret: string; qrUrl: string }>
    verifyTotp: (args: { companyName: string, sessionToken: string, token: string }) => Promise<{ success: boolean; user?: User; sessionToken?: string; error?: string }>

    // Ledger raw
    createLedgerGroup: (args: any) => Promise<any>
    updateLedgerGroup: (args: any) => Promise<any>
    deleteLedgerGroup: (args: any) => Promise<{ success: boolean; error?: string }>
    createLedgerAccount: (args: any) => Promise<any>
    updateLedgerAccount: (args: any) => Promise<any>
    deleteLedgerAccount: (args: any) => Promise<{ success: boolean; error?: string }>
    getLedgerGroups: (args: any) => Promise<any[]>
    getLedgerAccounts: (args: any) => Promise<any[]>

    // Vouchers raw
    createVoucher: (args: any) => Promise<string>
    updateVoucher: (args: any) => Promise<string>
    deleteVoucher: (args: any) => Promise<void>
    getDayBook: (args: any) => Promise<any[]>
    getLedgerStatement: (args: any) => Promise<LedgerStatementRow[]>
    getTrialBalance: (args: any) => Promise<TrialBalanceRow[]>
    getProfitAndLoss: (args: any) => Promise<ProfitAndLossReport>
    getBalanceSheet: (args: any) => Promise<BalanceSheetReport>

    // GST raw
    gst: {
        hsn: {
            list: (args: any) => Promise<any[]>
            get: (args: any) => Promise<any>
            create: (args: any) => Promise<any>
            update: (args: any) => Promise<any>
            delete: (args: any) => Promise<any>
        }
        reports: {
            gstr1: (args: any) => Promise<any>
            gstr3b: (args: any) => Promise<any>
            gstr2a: (args: any) => Promise<any>
            taxLiability: (args: any) => Promise<any[]>
            itcLedger: (args: any) => Promise<any[]>
        }
    }

    // Inventory raw
    inventory: {
        group: {
            list: (args: any) => Promise<any[]>
            create: (args: any) => Promise<any>
            update: (args: any) => Promise<any>
            delete: (args: any) => Promise<any>
        }
        item: {
            list: (args: any) => Promise<any[]>
            create: (args: any) => Promise<any>
            update: (args: any) => Promise<any>
            delete: (args: any) => Promise<any>
        }
        reports: {
            summary: (args: any) => Promise<any[]>
            ledger: (args: any) => Promise<any>
        }
    }

    // Users raw
    users: {
        list: (args: any) => Promise<any[]>
        create: (args: any) => Promise<any>
        update: (args: any) => Promise<any>
        deactivate: (args: any) => Promise<any>
        resetPassword: (args: any) => Promise<any>
        sessionLog: (args: any) => Promise<any[]>
        forceLogout: (args: any) => Promise<any>
    }

    // Audit raw
    audit: {
        list: (args: any) => Promise<any[]>
        export: (args: any) => Promise<any[]>
    }

    // Backup & Sync raw
    backup: {
        getSettings: (args: any) => Promise<Record<string, string>>
        updateSetting: (args: any) => Promise<{ success: boolean; error?: string }>
        listLocal: (args: any) => Promise<any[]>
        createLocal: (args: any) => Promise<string>
        restoreLocal: (args: any) => Promise<{ success: boolean; error?: string }>
        gdrive: {
            getAuthUrl: (args: any) => Promise<string>
            exchangeCode: (args: any) => Promise<{ success: boolean; error?: string }>
            revoke: (args: any) => Promise<{ success: boolean; error?: string }>
            list: (args: any) => Promise<any[]>
            upload: (args: any) => Promise<any>
            download: (args: any) => Promise<{ success: boolean; error?: string }>
        }
    }

    dialog: {
        openFile: (options: any) => Promise<any>
        readJsonFile: () => Promise<any>
    }

    fy: {
        list: (args?: any) => Promise<any[]>
        create: (args: { data: any }) => Promise<any>
        update: (args: { id: string, data: any }) => Promise<any>
        toggleLock: (args: { id: string, is_locked: number }) => Promise<any>
    }
    search: {
        global: (query?: any) => Promise<any[]>
    }
    app: {
        logError: (stackDesc: string) => Promise<void>
    }
}

const rawApi = ((window as any).api || {}) as RawApi;

function withSession<T>(data: T = {} as T) {
    const sessionToken = useSessionStore.getState().sessionToken
    return { ...data, sessionToken }
}

function requireDesktopApi<T extends (...args: any[]) => any>(fn: T | undefined, name: string): T {
    if (!fn) {
        throw new Error(`Desktop API unavailable: ${name}. Open LedgerX in the desktop app.`)
    }
    return fn
}

export const api = {
    ...rawApi,
    checkFirstRun: () => requireDesktopApi(rawApi.checkFirstRun, 'checkFirstRun')(),
    getCompanies: () => requireDesktopApi(rawApi.getCompanies, 'getCompanies')(),
    unlockCompany: (args: UnlockCompanyInput) => requireDesktopApi(rawApi.unlockCompany, 'unlockCompany')(args),
    createCompany: (args: CreateCompanyInput) => requireDesktopApi(rawApi.createCompany, 'createCompany')(args),
    login: (args: LoginInput) => requireDesktopApi(rawApi.login, 'login')(args),
    setupTotp: (args: { userId: string }) => requireDesktopApi(rawApi.setupTotp, 'setupTotp')(args),
    verifyTotp: (args: { companyName: string, sessionToken: string, token: string }) => requireDesktopApi(rawApi.verifyTotp, 'verifyTotp')(args),
    createLedgerGroup: (args: CreateLedgerGroupInput) => rawApi.createLedgerGroup(withSession(args)).catch((e: any) => { toast.error(e?.message || 'Failed to create ledger group'); throw e }),
    updateLedgerGroup: (args: UpdateLedgerGroupInput) => rawApi.updateLedgerGroup(withSession(args)).catch((e: any) => { toast.error(e?.message || 'Failed to update ledger group'); throw e }),
    deleteLedgerGroup: (args: DeleteLedgerGroupInput) => rawApi.deleteLedgerGroup(withSession(args)).catch((e: any) => { toast.error(e?.message || 'Failed to delete ledger group'); throw e }),
    createLedgerAccount: (args: CreateLedgerAccountInput) => rawApi.createLedgerAccount(withSession(args)).catch((e: any) => { toast.error(e?.message || 'Failed to create ledger account'); throw e }),
    updateLedgerAccount: (args: UpdateLedgerAccountInput) => rawApi.updateLedgerAccount(withSession(args)).catch((e: any) => { toast.error(e?.message || 'Failed to update ledger account'); throw e }),
    deleteLedgerAccount: (args: DeleteLedgerAccountInput) => rawApi.deleteLedgerAccount(withSession(args)).catch((e: any) => { toast.error(e?.message || 'Failed to delete ledger account'); throw e }),
    getLedgerGroups: () => rawApi.getLedgerGroups(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load ledger groups'); throw e }),
    getLedgerAccounts: () => rawApi.getLedgerAccounts(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load ledger accounts'); throw e }),

    // Vouchers
    createVoucher: (input: CreateVoucherInput) => rawApi.createVoucher(withSession({ input })).catch((e: any) => { toast.error(e?.message || 'Failed to create voucher'); throw e }),
    updateVoucher: (input: UpdateVoucherInput) => rawApi.updateVoucher(withSession({ input })).catch((e: any) => { toast.error(e?.message || 'Failed to update voucher'); throw e }),
    deleteVoucher: (id: string) => rawApi.deleteVoucher(withSession({ id })).catch((e: any) => { toast.error(e?.message || 'Failed to delete voucher'); throw e }),
    getDayBook: (filters?: { dateFrom?: string, dateTo?: string, type?: string }) => rawApi.getDayBook(withSession(filters)).catch((e: any) => { toast.error(e?.message || 'Failed to load daybook'); throw e }),
    getLedgerStatement: (ledgerId: string, dateFrom?: string, dateTo?: string) => rawApi.getLedgerStatement(withSession({ ledgerId, dateFrom, dateTo })).catch((e: any) => { toast.error(e?.message || 'Failed to load ledger statement'); throw e }),
    getTrialBalance: (dateTo?: string) => rawApi.getTrialBalance(withSession({ dateTo })).catch((e: any) => { toast.error(e?.message || 'Failed to load trial balance'); throw e }),
    getProfitAndLoss: (dateFrom?: string, dateTo?: string) => rawApi.getProfitAndLoss(withSession({ dateFrom, dateTo })).catch((e: any) => { toast.error(e?.message || 'Failed to load profit & loss'); throw e }),
    getBalanceSheet: (dateTo?: string) => rawApi.getBalanceSheet(withSession({ dateTo })).catch((e: any) => { toast.error(e?.message || 'Failed to load balance sheet'); throw e }),

    // GST
    gst: {
        hsn: {
            list: () => rawApi.gst.hsn.list(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load HSN codes'); throw e }),
            get: (code: string) => rawApi.gst.hsn.get(withSession({ code })).catch((e: any) => { toast.error(e?.message || 'Failed to load HSN code'); throw e }),
            create: (data: any) => rawApi.gst.hsn.create(withSession({ data })).catch((e: any) => { toast.error(e?.message || 'Failed to create HSN code'); throw e }),
            update: (code: string, data: any) => rawApi.gst.hsn.update(withSession({ code, data })).catch((e: any) => { toast.error(e?.message || 'Failed to update HSN code'); throw e }),
            delete: (code: string) => rawApi.gst.hsn.delete(withSession({ code })).catch((e: any) => { toast.error(e?.message || 'Failed to delete HSN code'); throw e }),
        },
        reports: {
            gstr1: (period: { from: string, to: string }) => rawApi.gst.reports.gstr1(withSession({ period })).catch((e: any) => { toast.error(e?.message || 'Failed to load GSTR-1'); throw e }),
            gstr3b: (period: { from: string, to: string }) => rawApi.gst.reports.gstr3b(withSession({ period })).catch((e: any) => { toast.error(e?.message || 'Failed to load GSTR-3B'); throw e }),
            gstr2a: (data: { period: { from: string, to: string }, portalData: any }) => rawApi.gst.reports.gstr2a(withSession({ data })).catch((e: any) => { toast.error(e?.message || 'Failed to load GSTR-2A'); throw e }),
            taxLiability: (period: { from: string, to: string }) => rawApi.gst.reports.taxLiability(withSession({ period })).catch((e: any) => { toast.error(e?.message || 'Failed to load tax liability'); throw e }),
            itcLedger: (period: { from: string, to: string }) => rawApi.gst.reports.itcLedger(withSession({ period })).catch((e: any) => { toast.error(e?.message || 'Failed to load ITC ledger'); throw e }),
        }
    },

    // Inventory
    inventory: {
        group: {
            list: () => rawApi.inventory.group.list(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load item groups'); throw e }),
            create: (data: any) => rawApi.inventory.group.create(withSession({ data })).catch((e: any) => { toast.error(e?.message || 'Failed to create item group'); throw e }),
            update: (id: string, data: any) => rawApi.inventory.group.update(withSession({ id, data })).catch((e: any) => { toast.error(e?.message || 'Failed to update item group'); throw e }),
            delete: (id: string) => rawApi.inventory.group.delete(withSession({ id })).catch((e: any) => { toast.error(e?.message || 'Failed to delete item group'); throw e })
        },
        item: {
            list: () => rawApi.inventory.item.list(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load items'); throw e }),
            create: (data: any) => rawApi.inventory.item.create(withSession({ data })).catch((e: any) => { toast.error(e?.message || 'Failed to create item'); throw e }),
            update: (id: string, data: any) => rawApi.inventory.item.update(withSession({ id, data })).catch((e: any) => { toast.error(e?.message || 'Failed to update item'); throw e }),
            delete: (id: string) => rawApi.inventory.item.delete(withSession({ id })).catch((e: any) => { toast.error(e?.message || 'Failed to delete item'); throw e })
        },
        reports: {
            summary: (filters?: { dateFrom?: string, dateTo?: string }) => rawApi.inventory.reports.summary(withSession({ filters })).catch((e: any) => { toast.error(e?.message || 'Failed to load stock summary'); throw e }),
            ledger: (itemId: string, filters?: { dateFrom?: string, dateTo?: string }) => rawApi.inventory.reports.ledger(withSession({ itemId, filters })).catch((e: any) => { toast.error(e?.message || 'Failed to load stock ledger'); throw e })
        }
    },

    // Users
    users: {
        list: () => rawApi.users.list(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load users'); throw e }),
        create: (data: any) => rawApi.users.create(withSession({ data })).catch((e: any) => { toast.error(e?.message || 'Failed to create user'); throw e }),
        update: (id: string, data: any) => rawApi.users.update(withSession({ id, data })).catch((e: any) => { toast.error(e?.message || 'Failed to update user'); throw e }),
        deactivate: (id: string) => rawApi.users.deactivate(withSession({ id })).catch((e: any) => { toast.error(e?.message || 'Failed to deactivate user'); throw e }),
        resetPassword: (id: string, newPassword: string) => rawApi.users.resetPassword(withSession({ id, newPassword })).catch((e: any) => { toast.error(e?.message || 'Failed to reset password'); throw e }),
        sessionLog: (userId?: string, period?: { from: string, to: string }) => rawApi.users.sessionLog(withSession({ userId, period })).catch((e: any) => { toast.error(e?.message || 'Failed to load session log'); throw e }),
        forceLogout: (targetUserId: string) => rawApi.users.forceLogout(withSession({ targetUserId })).catch((e: any) => { toast.error(e?.message || 'Failed to force logout'); throw e }),
    },

    // Audit
    audit: {
        list: (filters: any) => rawApi.audit.list(withSession({ filters })).catch((e: any) => { toast.error(e?.message || 'Failed to load audit trail'); throw e }),
        export: (filters: any) => rawApi.audit.export(withSession({ filters })).catch((e: any) => { toast.error(e?.message || 'Failed to export audit trail'); throw e }),
    },

    // Backup
    backup: {
        getSettings: () => rawApi.backup.getSettings(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load backup settings'); throw e }),
        updateSetting: (key: string, value: string, companyName: string) => rawApi.backup.updateSetting(withSession({ key, value, companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to update backup setting'); throw e }),
        listLocal: (companyName: string) => rawApi.backup.listLocal(withSession({ companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to list local backups'); throw e }),
        createLocal: (companyName: string) => rawApi.backup.createLocal(withSession({ companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to create local backup'); throw e }),
        restoreLocal: (path: string, companyName: string) => rawApi.backup.restoreLocal(withSession({ path, companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to restore backup'); throw e }),
        gdrive: {
            getAuthUrl: () => rawApi.backup.gdrive.getAuthUrl(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to get Google Drive auth URL'); throw e }),
            exchangeCode: (code: string, companyName: string) => rawApi.backup.gdrive.exchangeCode(withSession({ code, companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to connect Google Drive'); throw e }),
            revoke: (companyName: string) => rawApi.backup.gdrive.revoke(withSession({ companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to disconnect Google Drive'); throw e }),
            list: (companyName: string) => rawApi.backup.gdrive.list(withSession({ companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to list Google Drive files'); throw e }),
            upload: (localPath: string, companyName: string) => rawApi.backup.gdrive.upload(withSession({ localPath, companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to upload to Google Drive'); throw e }),
            download: (fileId: string, destPath: string, companyName: string) => rawApi.backup.gdrive.download(withSession({ fileId, destPath, companyName })).catch((e: any) => { toast.error(e?.message || 'Failed to download from Google Drive'); throw e }),
        }
    },

    dialog: {
        openFile: (options: any) => rawApi.dialog.openFile(options).catch((e: any) => { toast.error(e?.message || 'Failed to open file dialog'); throw e }),
        readJsonFile: () => rawApi.dialog.readJsonFile().catch((e: any) => { toast.error(e?.message || 'Failed to read JSON file'); throw e })
    },

    search: {
        global: (query: string) => rawApi.search.global(withSession({ query })).catch((e: any) => { toast.error(e?.message || 'Search failed'); throw e })
    },

    fy: {
        list: () => rawApi.fy.list(withSession()).catch((e: any) => { toast.error(e?.message || 'Failed to load financial years'); throw e }),
        create: (data: any) => rawApi.fy.create(withSession({ data })).catch((e: any) => { toast.error(e?.message || 'Failed to create financial year'); throw e }),
        update: (id: string, data: any) => rawApi.fy.update(withSession({ id, data })).catch((e: any) => { toast.error(e?.message || 'Failed to update financial year'); throw e }),
        toggleLock: (id: string, is_locked: number) => rawApi.fy.toggleLock(withSession({ id, is_locked })).catch((e: any) => { toast.error(e?.message || 'Failed to toggle financial year lock'); throw e })
    },

    app: {
        logError: (stackDesc: string) => rawApi.app.logError(stackDesc).catch(() => { /* swallow logging errors */ })
    }
}
