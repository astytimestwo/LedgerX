import React, { useEffect, useState, useCallback } from 'react'
import { useSessionStore } from './stores/session.store'
import { useUIStore } from './stores/ui.store'
import { CreateCompanyScreen } from './features/auth/CreateCompanyScreen'
import { SelectCompanyScreen } from './features/auth/SelectCompanyScreen'
import { WelcomeScreen } from './features/auth/WelcomeScreen'
import { LoginScreen } from './features/auth/LoginScreen'
import { TotpSetupScreen } from './features/auth/TotpSetupScreen'
import { AppShell } from './components/Layout/AppShell'
import { Dashboard } from './features/dashboard/Dashboard'
import { LedgerGroupList } from './features/ledger/LedgerGroupList'
import { ChartOfAccounts } from './features/ledger/ChartOfAccounts'
import { VoucherList } from './features/voucher/VoucherList'
import { LedgerStatement } from './features/reports/LedgerStatement'
import { TrialBalance } from './features/reports/TrialBalance'
import { ProfitAndLoss } from './features/reports/ProfitAndLoss'
import { BalanceSheet } from './features/reports/BalanceSheet'
import { HsnMaster } from './features/gst/HsnMaster'
import { Gstr1Report } from './features/gst/Gstr1Report'
import { Gstr3bReport } from './features/gst/Gstr3bReport'
import { Gstr2aReconcile } from './features/gst/Gstr2aReconcile'
import { TaxLiabilityReport } from './features/gst/TaxLiabilityReport'
import { ItcLedgerReport } from './features/gst/ItcLedgerReport'
import { ItemMaster } from './features/inventory/ItemMaster'
import { ItemGroupMaster } from './features/inventory/ItemGroupMaster'
import { StockSummary } from './features/inventory/StockSummary'
import { StockLedger } from './features/inventory/StockLedger'
import { UserList } from './features/admin/UserList'
import { SessionLogView } from './features/admin/SessionLogView'
import { AuditTrailViewer } from './features/audit/AuditTrailViewer'
import { SettingsPage } from './features/settings/SettingsPage'
import { VoucherFormModal } from './features/voucher/VoucherFormModal'
import { ShortcutHelp } from './components/ShortcutHelp/ShortcutHelp'
import { GlobalSearch } from './components/GlobalSearch/GlobalSearch'
import { LedgerAccountFormModal } from './features/ledger/LedgerAccountFormModal'
import { Modal } from './components/Modal/Modal'
import { ToastContainer } from './components/Toast/Toast'
import { useShortcut } from './lib/shortcutManager'
import { CommandPalette } from './components/CommandPalette/CommandPalette'
import { toast } from './stores/toast.store'
import { api } from './lib/api'
import { useQueryClient } from '@tanstack/react-query'

const App: React.FC = () => {
    const { user, setCompany, logout } = useSessionStore()
    const [checking, setChecking] = useState(true)
    const [isFirstRun, setIsFirstRun] = useState(false)
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [isCreatingNew, setIsCreatingNew] = useState(false)
    const [hasSeenWelcome, setHasSeenWelcome] = useState(false)
    const [totpUserId, setTotpUserId] = useState<string | null>(null)
    const [totpSessionToken, setTotpSessionToken] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { 
        theme, 
        isVoucherModalOpen, 
        setVoucherModalOpen, 
        toggleSidebar, 
        showShortcutHelp, 
        setShowShortcutHelp, 
        showSearch, 
        setShowSearch, 
        isLedgerModalOpen, 
        setLedgerModalOpen, 
        isItemModalOpen, 
        setItemModalOpen,
        currentView,
        setCurrentView,
        viewHistory,
        popView,
        showCommandPalette,
        setShowCommandPalette
    } = useUIStore()

    const handleLogout = useCallback(() => {
        queryClient.clear()
        logout()
    }, [logout, queryClient])

    // --- Global / App Keyboard Shortcuts Registry ---
    
    // F1: Help Overlay
    useShortcut('f1', () => setShowShortcutHelp(true), 'global', 'Show Shortcut Help')
    useShortcut('ctrl+f1', () => toast.info('Shortcut recognized: Context Help is not available yet.'), 'global', 'Context Help')

    // Escape: Close / Cancel / Back
    useShortcut('escape', () => {
        if (viewHistory.length > 0) {
            popView()
        } else if (currentView !== 'daybook') {
            setCurrentView('daybook')
        }
    }, 'global', 'Close active view / overlay')

    // Alt+G / Ctrl+G: Command Palette (Go To / Switch To)
    useShortcut('alt+g', () => setShowCommandPalette('goto'), 'global', 'Open Go To command palette')
    useShortcut('ctrl+g', () => setShowCommandPalette('switchto'), 'global', 'Open Switch To command palette')

    // Unsupported menus / shortcuts with toasted feedback
    const toastNotAvailable = (name: string) => {
        toast.info(`Shortcut recognized: ${name} is not available yet.`)
    }

    useShortcut('alt+k', () => toastNotAvailable('Company Menu'), 'global', 'Company Menu')
    useShortcut('alt+y', () => toastNotAvailable('Company Data Menu'), 'global', 'Company Data Menu')
    useShortcut('alt+z', () => toastNotAvailable('Exchange Data Menu'), 'global', 'Exchange Data Menu')
    useShortcut('alt+o', () => toastNotAvailable('Import Menu'), 'global', 'Import Menu')
    useShortcut('alt+m', () => toastNotAvailable('Share Menu'), 'global', 'Share Menu')
    useShortcut('alt+p', () => toastNotAvailable('Print'), 'global', 'Print')
    useShortcut('alt+e', () => toastNotAvailable('Export'), 'global', 'Export')
    
    useShortcut('ctrl+w', () => toastNotAvailable('Data Entry Language'), 'global', 'Select Data Entry Language')
    
    useShortcut('f2', () => toastNotAvailable('Date Selection'), 'global', 'Change Date')
    useShortcut('alt+f2', () => toastNotAvailable('Period Selection'), 'global', 'Change Period')
    useShortcut('f3', () => toastNotAvailable('Switch Company'), 'global', 'Switch Company')
    useShortcut('alt+f3', () => toastNotAvailable('Select Company'), 'global', 'Select Company')
    useShortcut('ctrl+f3', () => toastNotAvailable('Shut Company'), 'global', 'Shut Company')
    useShortcut('f11', () => toastNotAvailable('Company Features'), 'global', 'Company Features')
    useShortcut('f12', () => toastNotAvailable('Configuration'), 'global', 'Configuration')
    
    useShortcut('ctrl+q', () => {
        const confirmed = window.confirm('Are you sure you want to logout and exit the current app session?')
        if (confirmed) {
            handleLogout()
        }
    }, 'global', 'Exit current session')
    
    useShortcut('ctrl+n', () => {
        if (user) {
            setVoucherModalOpen(true)
        } else if (isFirstRun || isCreatingNew) {
            setIsCreatingNew(true)
        } else {
            toast.info('Unlock a company before creating a voucher.')
        }
    }, 'global', 'Create new voucher')

    // Voucher types preselection triggers
    const handleOpenVoucher = (type: string) => {
        if (user) {
            sessionStorage.setItem('initialVoucherType', type)
            setVoucherModalOpen(true)
        }
    }

    useShortcut('f4', () => handleOpenVoucher('contra'), 'global', 'Open Contra Voucher')
    useShortcut('f5', () => handleOpenVoucher('payment'), 'global', 'Open Payment Voucher')
    useShortcut('f6', () => handleOpenVoucher('receipt'), 'global', 'Open Receipt Voucher')
    useShortcut('f7', () => handleOpenVoucher('journal'), 'global', 'Open Journal Voucher')
    useShortcut('f8', () => handleOpenVoucher('sales'), 'global', 'Open Sales Voucher')
    useShortcut('f9', () => handleOpenVoucher('purchase'), 'global', 'Open Purchase Voucher')
    
    useShortcut('alt+f5', () => handleOpenVoucher('debit_note'), 'global', 'Open Debit Note')
    useShortcut('alt+f6', () => handleOpenVoucher('credit_note'), 'global', 'Open Credit Note')
    
    useShortcut('alt+f7', () => toastNotAvailable('Stock Journal'), 'global', 'Open Stock Journal')
    useShortcut('alt+f8', () => toastNotAvailable('Delivery Note'), 'global', 'Open Delivery Note')
    useShortcut('alt+f9', () => toastNotAvailable('Receipt Note'), 'global', 'Open Receipt Note')
    
    useShortcut('ctrl+f4', () => toastNotAvailable('Payroll Voucher'), 'global', 'Open Payroll Voucher')
    useShortcut('ctrl+f5', () => toastNotAvailable('Rejection Out'), 'global', 'Open Rejection Out')
    useShortcut('ctrl+f6', () => toastNotAvailable('Rejection In'), 'global', 'Open Rejection In')
    useShortcut('ctrl+f7', () => toastNotAvailable('Physical Stock'), 'global', 'Open Physical Stock')
    useShortcut('ctrl+f8', () => toastNotAvailable('Sales Order'), 'global', 'Open Sales Order')
    useShortcut('ctrl+f9', () => toastNotAvailable('Purchase Order'), 'global', 'Open Purchase Order')

    // Central layout/app search trigger
    useShortcut('ctrl+f', () => setShowSearch(true), 'global', 'Search bar focus')
    useShortcut('ctrl+b', () => toggleSidebar(), 'global', 'Toggle Sidebar')

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [theme])

    useEffect(() => {
        const init = async () => {
            try {
                const res = await api.checkFirstRun()
                setIsFirstRun(res)
            } catch (e) {
                setIsFirstRun(true)
            } finally {
                setChecking(false)
            }
        }
        init()
    }, [])

    const renderStandalone = (screen: React.ReactNode) => (
        <>
            {screen}
            {showShortcutHelp && <ShortcutHelp />}
            <ToastContainer />
        </>
    )

    if (checking) return <div className="p-8 text-center text-[var(--color-text-muted)] mt-20">Loading LedgerX...</div>

    if (!hasSeenWelcome) {
        return renderStandalone(
            <WelcomeScreen
                onCreateNew={() => {
                    setHasSeenWelcome(true)
                    setIsCreatingNew(true)
                }}
                onOpenExisting={() => setHasSeenWelcome(true)}
            />
        )
    }

    if (isFirstRun || isCreatingNew) {
        return renderStandalone(<CreateCompanyScreen />)
    }

    if (!isUnlocked) {
        return renderStandalone(
            <SelectCompanyScreen
                onUnlocked={async (name) => {
                    const years = await api.fy.list();
                    setCompany(name, years.length > 0 ? years[0] : null as any)
                    setIsUnlocked(true)
                }}
                onCreateNew={() => setIsCreatingNew(true)}
            />
        )
    }

    if (!user) {
        return renderStandalone(
            <LoginScreen onRequiresTotp={(uid, companyName, sessionToken) => {
                setTotpUserId(uid)
                setTotpSessionToken(sessionToken || null)
                if (companyName) {
                    setCompany(companyName, null as any)
                }
            }} />
        )
    }

    if (totpUserId) {
        return renderStandalone(
            <TotpSetupScreen userId={totpUserId} sessionToken={totpSessionToken || undefined} onComplete={() => {
                setTotpUserId(null)
                setTotpSessionToken(null)
            }} />
        )
    }

    return (
        <>
            <AppShell currentView={currentView} onViewChange={setCurrentView}>
                <div className="flex-1 overflow-hidden">
                    {currentView === 'dashboard' && <Dashboard />}
                    {currentView === 'ledger' && <ChartOfAccounts />}
                    {currentView === 'ledger_groups' && <LedgerGroupList />}
                    {currentView === 'daybook' && <VoucherList />}
                    {currentView === 'ledger_statement' && <LedgerStatement />}
                    {currentView === 'trial_balance' && <TrialBalance />}
                    {currentView === 'pnl' && <ProfitAndLoss />}
                    {currentView === 'balance_sheet' && <BalanceSheet />}
                    {currentView === 'hsn_master' && <HsnMaster />}
                    {currentView === 'gstr1' && <Gstr1Report />}
                    {currentView === 'gstr3b' && <Gstr3bReport />}
                    {currentView === 'gstr2a' && <Gstr2aReconcile />}
                    {currentView === 'tax_liability' && <TaxLiabilityReport />}
                    {currentView === 'itc_ledger' && <ItcLedgerReport />}
                    {currentView === 'item_master' && <ItemMaster />}
                    {currentView === 'item_groups' && <ItemGroupMaster />}
                    {currentView === 'stock_summary' && <StockSummary />}
                    {currentView === 'stock_ledger' && <StockLedger />}
                    {currentView === 'users' && <UserList />}
                    {currentView === 'session_logs' && <SessionLogView />}
                    {currentView === 'audit_trail' && <AuditTrailViewer />}
                    {currentView === 'settings' && <SettingsPage />}
                    {!['dashboard','ledger','ledger_groups','daybook','ledger_statement','trial_balance','pnl','balance_sheet','hsn_master','gstr1','gstr3b','gstr2a','tax_liability','itc_ledger','item_master','item_groups','stock_summary','stock_ledger','users','session_logs','audit_trail','settings'].includes(currentView) && <VoucherList />}
                </div>
            </AppShell>
            {isVoucherModalOpen && <VoucherFormModal onClose={() => setVoucherModalOpen(false)} />}
            {showShortcutHelp && <ShortcutHelp />}
            {showSearch && <GlobalSearch onNavigate={setCurrentView} />}
            {showCommandPalette !== null && <CommandPalette />}
            {isLedgerModalOpen && <LedgerAccountFormModal isOpen={true} onClose={() => setLedgerModalOpen(false)} />}
            {isItemModalOpen && <Modal isOpen={true} onClose={() => setItemModalOpen(false)} title="Quick Item Add"><ItemMaster /></Modal>}
            <ToastContainer />
        </>
    )
}

export default App
