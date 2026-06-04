import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
    throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
    contextBridge.exposeInMainWorld('api', {
        ping: () => ipcRenderer.invoke('ping'),
        // Auth & Company
        login: (args: any) => ipcRenderer.invoke('auth:login', args),
        setupTotp: (args: any) => ipcRenderer.invoke('auth:setupTotp', args),
        verifyTotp: (args: any) => ipcRenderer.invoke('auth:verifyTotp', args),
        createCompany: (args: any) => ipcRenderer.invoke('auth:createCompany', args),
        checkFirstRun: () => ipcRenderer.invoke('auth:checkFirstRun'),
        getCompanies: () => ipcRenderer.invoke('auth:getCompanies'),
        unlockCompany: (args: any) => ipcRenderer.invoke('auth:unlockCompany', args),
        // Ledger
        createLedgerGroup: (args: any) => ipcRenderer.invoke('ledger:createGroup', args),
        updateLedgerGroup: (args: any) => ipcRenderer.invoke('ledger:updateGroup', args),
        deleteLedgerGroup: (args: any) => ipcRenderer.invoke('ledger:deleteGroup', args),
        createLedgerAccount: (args: any) => ipcRenderer.invoke('ledger:createAccount', args),
        updateLedgerAccount: (args: any) => ipcRenderer.invoke('ledger:updateAccount', args),
        deleteLedgerAccount: (args: any) => ipcRenderer.invoke('ledger:deleteAccount', args),
        getLedgerGroups: (args: any) => ipcRenderer.invoke('ledger:getGroups', args),
        getLedgerAccounts: (args: any) => ipcRenderer.invoke('ledger:getAccounts', args),
        // Vouchers
        createVoucher: (args: any) => ipcRenderer.invoke('voucher:create', args),
        updateVoucher: (args: any) => ipcRenderer.invoke('voucher:update', args),
        deleteVoucher: (args: any) => ipcRenderer.invoke('voucher:delete', args),
        getDayBook: (args: any) => ipcRenderer.invoke('voucher:getDayBook', args),
        getLedgerStatement: (args: any) => ipcRenderer.invoke('voucher:getLedgerStatement', args),
        getTrialBalance: (args: any) => ipcRenderer.invoke('voucher:getTrialBalance', args),
        getProfitAndLoss: (args: any) => ipcRenderer.invoke('voucher:getProfitAndLoss', args),
        getBalanceSheet: (args: any) => ipcRenderer.invoke('voucher:getBalanceSheet', args),
        // GST
        gst: {
            hsn: {
                list: (args?: any) => ipcRenderer.invoke('gst:hsn:list', args),
                get: (code: string) => ipcRenderer.invoke('gst:hsn:get', code),
                create: (data: any) => ipcRenderer.invoke('gst:hsn:create', data),
                update: (code: string, data: any) => ipcRenderer.invoke('gst:hsn:update', code, data),
                delete: (code: string) => ipcRenderer.invoke('gst:hsn:delete', code)
            },
            reports: {
                gstr1: (args: any) => ipcRenderer.invoke('gst:report:gstr1', args),
                gstr3b: (args: any) => ipcRenderer.invoke('gst:report:gstr3b', args),
                gstr2a: (args: any) => ipcRenderer.invoke('gst:report:gstr2a', args),
                taxLiability: (args: any) => ipcRenderer.invoke('gst:report:tax-liability', args),
                itcLedger: (args: any) => ipcRenderer.invoke('gst:report:itc-ledger', args)
            }
        },
        // Inventory
        inventory: {
            group: {
                list: (args?: any) => ipcRenderer.invoke('inventory:group:list', args),
                create: (data: any) => ipcRenderer.invoke('inventory:group:create', data),
                update: (args: any) => ipcRenderer.invoke('inventory:group:update', args),
                delete: (args: any) => ipcRenderer.invoke('inventory:group:delete', args)
            },
            item: {
                list: (args?: any) => ipcRenderer.invoke('inventory:item:list', args),
                create: (data: any) => ipcRenderer.invoke('inventory:item:create', data),
                update: (args: any) => ipcRenderer.invoke('inventory:item:update', args),
                delete: (args: any) => ipcRenderer.invoke('inventory:item:delete', args)
            },
            reports: {
                summary: (args: any) => ipcRenderer.invoke('inventory:reports:summary', args),
                ledger: (args: any) => ipcRenderer.invoke('inventory:reports:ledger', args)
            }
        },
        // Users
        users: {
            list: (args: any) => ipcRenderer.invoke('users:list', args),
            create: (args: any) => ipcRenderer.invoke('users:create', args),
            update: (args: any) => ipcRenderer.invoke('users:update', args),
            deactivate: (args: any) => ipcRenderer.invoke('users:deactivate', args),
            resetPassword: (args: any) => ipcRenderer.invoke('users:resetPassword', args),
            sessionLog: (args: any) => ipcRenderer.invoke('users:sessionLog', args),
            forceLogout: (args: any) => ipcRenderer.invoke('users:forceLogout', args),
        },
        // Audit
        audit: {
            list: (args: any) => ipcRenderer.invoke('audit:list', args),
            export: (args: any) => ipcRenderer.invoke('audit:export', args),
        },
        // Backup & Sync
        backup: {
            getSettings: (args: any) => ipcRenderer.invoke('backup:getSettings', args),
            updateSetting: (args: any) => ipcRenderer.invoke('backup:updateSetting', args),
            listLocal: (args: any) => ipcRenderer.invoke('backup:listLocal', args),
            createLocal: (args: any) => ipcRenderer.invoke('backup:createLocal', args),
            restoreLocal: (args: any) => ipcRenderer.invoke('backup:restoreLocal', args),
            gdrive: {
                getAuthUrl: (args: any) => ipcRenderer.invoke('backup:gdrive:getAuthUrl', args),
                exchangeCode: (args: any) => ipcRenderer.invoke('backup:gdrive:exchangeCode', args),
                revoke: (args: any) => ipcRenderer.invoke('backup:gdrive:revoke', args),
                list: (args: any) => ipcRenderer.invoke('backup:gdrive:list', args),
                upload: (args: any) => ipcRenderer.invoke('backup:gdrive:upload', args),
                download: (args: any) => ipcRenderer.invoke('backup:gdrive:download', args),
            }
        },
        // Dialog
        dialog: {
            openFile: (options: any) => ipcRenderer.invoke('dialog:openFile', options),
            readJsonFile: () => ipcRenderer.invoke('dialog:readJsonFile')
        },
        // Search
        search: {
            global: (payload: any) => ipcRenderer.invoke('search:global', payload)
        },
        // FY
        fy: {
            list: () => ipcRenderer.invoke('fy:list'),
            create: (data: any) => ipcRenderer.invoke('fy:create', { data }),
            update: (id: string, data: any) => ipcRenderer.invoke('fy:update', { id, data }),
            toggleLock: (id: string, is_locked: number) => ipcRenderer.invoke('fy:toggleLock', { id, is_locked })
        },
        app: {
            logError: (stackDesc: string) => ipcRenderer.invoke('app:logError', stackDesc)
        }
    })
} catch (error) {
    console.error(error)
}
