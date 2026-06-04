import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../stores/ui.store'
import { useSessionStore } from '../../stores/session.store'
import { Home, FileText, Settings, Menu, LogOut, BookOpen, PieChart, TrendingUp, DollarSign, Box, Shield, Activity, ClipboardList, Moon, Sun, Plus, Keyboard, Building, Layers, Receipt, Calculator, FileCheck, Archive, ListChecks, ChevronRight } from 'lucide-react'
import { useSessionTimeout } from '../../hooks/useSessionTimeout'
import bgDashboard from '../../assets/bg-dashboard.jpg'
import { useQueryClient } from '@tanstack/react-query'

export const AppShell: React.FC<{
    children: React.ReactNode,
    currentView?: string,
    onViewChange?: (view: string) => void
}> = ({ children, currentView = 'dashboard', onViewChange }) => {
    const { t } = useTranslation()
    const { sidebarExpanded, toggleSidebar, theme, setTheme, setShowSearch, setVoucherModalOpen, setLedgerModalOpen, setItemModalOpen, setShowShortcutHelp } = useUIStore()
    const { companyName, activeYear, user, logout } = useSessionStore()
    const queryClient = useQueryClient()

    const handleLogout = () => {
        queryClient.clear()
        logout()
    }

    // 15 minutes of inactivity will trigger a logout
    useSessionTimeout(15)

    // Breadcrumb mapping for location indicator
    const viewLabels: Record<string, string> = {
        dashboard: 'Dashboard',
        daybook: 'Daybook',
        ledger: 'Chart of Accounts',
        ledger_groups: 'Ledger Groups',
        ledger_statement: 'Ledger Statement',
        trial_balance: 'Trial Balance',
        pnl: 'Profit & Loss',
        balance_sheet: 'Balance Sheet',
        gstr1: 'GSTR-1',
        gstr3b: 'GSTR-3B',
        gstr2a: 'GSTR-2A Reconcile',
        tax_liability: 'Tax Liability',
        itc_ledger: 'ITC Ledger',
        hsn_master: 'HSN / SAC Master',
        item_master: 'Item Master',
        item_groups: 'Item Groups',
        stock_summary: 'Stock Summary',
        stock_ledger: 'Stock Ledger',
        users: 'User Management',
        session_logs: 'Session Logs',
        audit_trail: 'Audit Trail',
        settings: 'Settings',
    }

    const sectionLabels: Record<string, string> = {
        dashboard: '',
        daybook: 'Vouchers',
        ledger: 'Accounting',
        ledger_groups: 'Accounting',
        ledger_statement: 'Reports',
        trial_balance: 'Reports',
        pnl: 'Reports',
        balance_sheet: 'Reports',
        gstr1: 'GST',
        gstr3b: 'GST',
        gstr2a: 'GST',
        tax_liability: 'GST',
        itc_ledger: 'GST',
        hsn_master: 'GST',
        item_master: 'Inventory',
        item_groups: 'Inventory',
        stock_summary: 'Inventory',
        stock_ledger: 'Inventory',
        users: 'System',
        session_logs: 'System',
        audit_trail: 'System',
        settings: 'System',
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-base)] relative text-[var(--color-text-primary)]">
            {/* Background & Dark Mode Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${bgDashboard})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 z-0 pointer-events-none bg-white/10 dark:bg-black/70 transition-colors duration-300" />

            {/* Sidebar */}
            <div
                className="flex flex-col border-r border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-2xl transition-all duration-150 relative z-20"
                style={{ width: sidebarExpanded ? '260px' : '64px' }}
            >
                <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
                    {sidebarExpanded && <span className="font-bold text-lg tracking-wide text-[var(--color-text-primary)]">LedgerX</span>}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        className="p-1.5 hover:bg-white/10 dark:hover:bg-white/5 transition-colors rounded-md flex-shrink-0 text-[var(--color-text-primary)]"
                    >
                        <Menu size={18} />
                    </button>
                </div>

                <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
                    <NavItem icon={<Home size={22} />} label={t('nav.dashboard')} expanded={sidebarExpanded} active={currentView === 'dashboard'} onClick={() => onViewChange?.('dashboard')} />

                    <div className="mt-5 mb-2 px-4 flex items-center justify-center">
                        {sidebarExpanded ? <span className="text-[11px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase w-full">Accounting</span> : <div className="h-px w-8 bg-black/10 dark:bg-white/10 rounded-full" />}
                    </div>
                    {user?.role !== 'viewer' && (
                        <NavItem icon={<FileText size={22} />} label="Voucher Entry" expanded={sidebarExpanded} active={false} onClick={() => setVoucherModalOpen(true)} />
                    )}
                    <NavItem icon={<BookOpen size={22} />} label="Day Book" expanded={sidebarExpanded} active={currentView === 'daybook'} onClick={() => onViewChange?.('daybook')} />
                    <NavItem icon={<Building size={22} />} label="Ledger Groups" expanded={sidebarExpanded} active={currentView === 'ledger_groups'} onClick={() => onViewChange?.('ledger_groups')} />
                    <NavItem icon={<Layers size={22} />} label={t('nav.ledger')} expanded={sidebarExpanded} active={currentView === 'ledger'} onClick={() => onViewChange?.('ledger')} />
                    {user?.role !== 'viewer' && (
                        <NavItem icon={<Plus size={16} />} label="Add Ledger Account" expanded={sidebarExpanded} active={false} onClick={() => setLedgerModalOpen(true)} className="text-[var(--color-accent)] opacity-80 hover:opacity-100" />
                    )}

                    <div className="mt-5 mb-2 px-4 flex items-center justify-center">
                        {sidebarExpanded ? <span className="text-[11px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase w-full">Reports</span> : <div className="h-px w-8 bg-black/10 dark:bg-white/10 rounded-full" />}
                    </div>
                    <NavItem icon={<Receipt size={22} />} label="Ledger Statement" expanded={sidebarExpanded} active={currentView === 'ledger_statement'} onClick={() => onViewChange?.('ledger_statement')} />
                    <NavItem icon={<Calculator size={22} />} label="Trial Balance" expanded={sidebarExpanded} active={currentView === 'trial_balance'} onClick={() => onViewChange?.('trial_balance')} />
                    <NavItem icon={<TrendingUp size={22} />} label="Profit & Loss" expanded={sidebarExpanded} active={currentView === 'pnl'} onClick={() => onViewChange?.('pnl')} />
                    <NavItem icon={<DollarSign size={22} />} label="Balance Sheet" expanded={sidebarExpanded} active={currentView === 'balance_sheet'} onClick={() => onViewChange?.('balance_sheet')} />

                    <div className="mt-5 mb-2 px-4 flex items-center justify-center">
                        {sidebarExpanded ? <span className="text-[11px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase w-full">GST</span> : <div className="h-px w-8 bg-black/10 dark:bg-white/10 rounded-full" />}
                    </div>
                    <NavItem icon={<FileCheck size={22} />} label="GSTR-1" expanded={sidebarExpanded} active={currentView === 'gstr1'} onClick={() => onViewChange?.('gstr1')} />
                    <NavItem icon={<FileCheck size={22} />} label="GSTR-3B" expanded={sidebarExpanded} active={currentView === 'gstr3b'} onClick={() => onViewChange?.('gstr3b')} />
                    <NavItem icon={<Archive size={22} />} label="GSTR-2A Recon" expanded={sidebarExpanded} active={currentView === 'gstr2a'} onClick={() => onViewChange?.('gstr2a')} />
                    <NavItem icon={<Calculator size={22} />} label="Tax Liability" expanded={sidebarExpanded} active={currentView === 'tax_liability'} onClick={() => onViewChange?.('tax_liability')} />
                    <NavItem icon={<ListChecks size={22} />} label="ITC Ledger" expanded={sidebarExpanded} active={currentView === 'itc_ledger'} onClick={() => onViewChange?.('itc_ledger')} />
                    {user?.role !== 'viewer' && (
                        <NavItem icon={<Archive size={22} />} label="HSN / SAC Master" expanded={sidebarExpanded} active={currentView === 'hsn_master'} onClick={() => onViewChange?.('hsn_master')} />
                    )}

                    <div className="mt-5 mb-2 px-4 flex items-center justify-center">
                        {sidebarExpanded ? <span className="text-[11px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase w-full">Inventory</span> : <div className="h-px w-8 bg-black/10 dark:bg-white/10 rounded-full" />}
                    </div>
                    {user?.role !== 'viewer' && (
                        <>
                            <NavItem icon={<Box size={22} />} label="Item Groups" expanded={sidebarExpanded} active={currentView === 'item_groups'} onClick={() => onViewChange?.('item_groups')} />
                            <NavItem icon={<Box size={22} />} label="Items" expanded={sidebarExpanded} active={currentView === 'item_master'} onClick={() => onViewChange?.('item_master')} />
                        </>
                    )}
                    <NavItem icon={<PieChart size={22} />} label="Stock Summary" expanded={sidebarExpanded} active={currentView === 'stock_summary'} onClick={() => onViewChange?.('stock_summary')} />
                    <NavItem icon={<TrendingUp size={22} />} label="Stock Ledger" expanded={sidebarExpanded} active={currentView === 'stock_ledger'} onClick={() => onViewChange?.('stock_ledger')} />
                    {user?.role !== 'viewer' && (
                        <NavItem icon={<Plus size={16} />} label="Add Inventory Item" expanded={sidebarExpanded} active={false} onClick={() => setItemModalOpen(true)} className="text-[var(--color-accent)] opacity-80 hover:opacity-100" />
                    )}

                    <div className="mt-5 mb-2 px-4 flex items-center justify-center">
                        {sidebarExpanded ? <span className="text-[11px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase w-full">System</span> : <div className="h-px w-8 bg-black/10 dark:bg-white/10 rounded-full" />}
                    </div>
                    {user?.role === 'admin' && (
                        <>
                            <NavItem icon={<Shield size={22} />} label="User Management" expanded={sidebarExpanded} active={currentView === 'users'} onClick={() => onViewChange?.('users')} />
                            <NavItem icon={<Activity size={22} />} label="Session Logs" expanded={sidebarExpanded} active={currentView === 'session_logs'} onClick={() => onViewChange?.('session_logs')} />
                            <NavItem icon={<ClipboardList size={22} />} label="Audit Trail" expanded={sidebarExpanded} active={currentView === 'audit_trail'} onClick={() => onViewChange?.('audit_trail')} />
                        </>
                    )}
                    <NavItem icon={<Settings size={22} />} label={t('nav.settings')} expanded={sidebarExpanded} active={currentView === 'settings'} onClick={() => onViewChange?.('settings')} />
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Top Bar */}
                <header className="h-14 border-b border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-2xl flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Company:</span>{' '}
                            <span>{companyName || 'No Company Selected'}</span>
                        </h1>
                        {activeYear && (
                            <span className="text-[var(--color-text-primary)] font-medium px-2 py-0.5 rounded bg-white/10 text-xs">
                                {activeYear.name}
                            </span>
                        )}
                        {sectionLabels[currentView] && (
                            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                <ChevronRight size={14} />
                                <span>{sectionLabels[currentView]}</span>
                                <ChevronRight size={14} />
                                <span className="font-medium text-[var(--color-text-primary)]">{viewLabels[currentView]}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            aria-label="Toggle theme"
                            className="flex items-center justify-center h-10 w-10 text-[var(--color-text-primary)] hover:bg-white/10 dark:hover:bg-white/5 rounded-lg border border-white/20 transition-all"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Global Search */}
                        <button
                            onClick={() => setShowSearch(true)}
                            aria-label="Open global search"
                            className="flex items-center h-10 border border-white/30 rounded-lg px-3 bg-white/10 dark:bg-black/30 w-64 backdrop-blur-md transition-all hover:bg-white/20 focus-within:bg-white/20 focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20 cursor-text"
                            title="Global Search (Ctrl+F)"
                        >
                            <span className="text-[13px] text-white opacity-90 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">Search (Ctrl+F)</span>
                            <div className="ml-auto w-1.5 h-4 bg-white/60 animate-pulse hidden group-focus-within:block"></div>
                        </button>
                        <button
                            onClick={() => setShowShortcutHelp(true)}
                            aria-label="Open keyboard shortcuts"
                            className="flex items-center justify-center h-10 w-10 text-[var(--color-text-primary)] hover:bg-white/10 dark:hover:bg-white/5 rounded-lg border border-white/20 transition-all"
                            title="Keyboard Shortcuts"
                        >
                            <Keyboard size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">{user?.username}</span>
                            <button type="button" onClick={handleLogout} aria-label="Logout" className="p-2 hover:bg-[var(--color-error)]/80 text-[var(--color-text-primary)] hover:text-white rounded-md transition-colors" title="Logout">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 relative">
                    {children}
                </main>

                {/* Status Bar */}
                <footer className="h-8 border-t border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-2xl flex items-center px-4 text-[12px] font-medium text-[var(--color-text-primary)] opacity-80 justify-between flex-shrink-0">
                    <div>Status: Ready | Role: {user?.role}</div>
                    <div>Synced: Just now</div>
                </footer>
            </div>
        </div>
    )
}

function NavItem({ icon, label, expanded, active = false, onClick, className = "" }: { icon: React.ReactNode, label: string, expanded: boolean, active?: boolean, onClick?: () => void, className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`h-11 w-[calc(100%-24px)] flex items-center select-none group transition-all rounded-lg mx-3 my-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50 ${expanded ? 'px-4 justify-start text-left' : 'justify-center'} ${active
                ? 'bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 shadow-sm backdrop-blur-md text-[var(--color-accent)]'
                : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                } ${className}`}
            title={!expanded ? label : undefined}
        >
            <div className={`flex items-center justify-center flex-shrink-0 transition-transform ${expanded ? 'scale-100' : 'scale-110'}`}>
                {icon}
            </div>
            {expanded && (
                <span className={`ml-4 truncate font-medium tracking-wide`}>
                    {label}
                </span>
            )}
        </button>
    )
}
