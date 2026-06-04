import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, ArrowRight, FileText, BookOpen, Layers, Settings, Shield, Activity, ClipboardList } from 'lucide-react'
import { useUIStore } from '../../stores/ui.store'
import { useShortcut } from '../../lib/shortcutManager'

interface CommandItem {
    id: string
    label: string
    category: 'Reports' | 'Vouchers' | 'Masters' | 'System'
    icon: React.ReactNode
    action: () => void
}

export const CommandPalette: React.FC = () => {
    const { 
        showCommandPalette, 
        setShowCommandPalette, 
        currentView, 
        setCurrentView, 
        pushView, 
        clearHistory,
        setVoucherModalOpen,
        setLedgerModalOpen,
        setItemModalOpen
    } = useUIStore()

    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Focus input when mounted
    useEffect(() => {
        if (showCommandPalette) {
            setTimeout(() => inputRef.current?.focus(), 50)
            setQuery('')
            setSelectedIndex(0)
        }
    }, [showCommandPalette])

    const isGoto = showCommandPalette === 'goto'

    const handleSelectView = (view: string) => {
        if (isGoto) {
            pushView(currentView)
        } else {
            clearHistory()
        }
        setCurrentView(view)
        setShowCommandPalette(null)
    }

    const handleOpenModal = (openFn: (isOpen: boolean) => void) => {
        openFn(true)
        setShowCommandPalette(null)
    }

    // Defined commands
    const commands = useMemo<CommandItem[]>(() => [
        // Reports
        { id: 'daybook', label: 'Day Book (Voucher List)', category: 'Reports', icon: <BookOpen size={16} className="text-blue-400" />, action: () => handleSelectView('daybook') },
        { id: 'trial_balance', label: 'Trial Balance', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('trial_balance') },
        { id: 'pnl', label: 'Profit & Loss Statement', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('pnl') },
        { id: 'balance_sheet', label: 'Balance Sheet', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('balance_sheet') },
        { id: 'ledger_statement', label: 'Ledger Statement', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('ledger_statement') },
        { id: 'stock_summary', label: 'Stock Summary', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('stock_summary') },
        { id: 'stock_ledger', label: 'Stock Ledger', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('stock_ledger') },
        { id: 'hsn_master', label: 'HSN / SAC Master', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('hsn_master') },
        { id: 'gstr1', label: 'GSTR-1 Report', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('gstr1') },
        { id: 'gstr3b', label: 'GSTR-3B Report', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('gstr3b') },
        { id: 'gstr2a', label: 'GSTR-2A Reconciliation', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('gstr2a') },
        { id: 'tax_liability', label: 'Tax Liability Report', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('tax_liability') },
        { id: 'itc_ledger', label: 'ITC Ledger Report', category: 'Reports', icon: <Layers size={16} className="text-blue-400" />, action: () => handleSelectView('itc_ledger') },

        // Vouchers (Create)
        { id: 'create_payment', label: 'Create Voucher (Payment)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            // Set some way to pass initial type. We can use sessionStorage or a global store property.
            sessionStorage.setItem('initialVoucherType', 'payment')
            handleOpenModal(setVoucherModalOpen)
        }},
        { id: 'create_receipt', label: 'Create Voucher (Receipt)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            sessionStorage.setItem('initialVoucherType', 'receipt')
            handleOpenModal(setVoucherModalOpen)
        }},
        { id: 'create_journal', label: 'Create Voucher (Journal)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            sessionStorage.setItem('initialVoucherType', 'journal')
            handleOpenModal(setVoucherModalOpen)
        }},
        { id: 'create_contra', label: 'Create Voucher (Contra)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            sessionStorage.setItem('initialVoucherType', 'contra')
            handleOpenModal(setVoucherModalOpen)
        }},
        { id: 'create_sales', label: 'Create Voucher (Sales)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            sessionStorage.setItem('initialVoucherType', 'sales')
            handleOpenModal(setVoucherModalOpen)
        }},
        { id: 'create_purchase', label: 'Create Voucher (Purchase)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            sessionStorage.setItem('initialVoucherType', 'purchase')
            handleOpenModal(setVoucherModalOpen)
        }},
        { id: 'create_debit_note', label: 'Create Voucher (Debit Note)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            sessionStorage.setItem('initialVoucherType', 'debit_note')
            handleOpenModal(setVoucherModalOpen)
        }},
        { id: 'create_credit_note', label: 'Create Voucher (Credit Note)', category: 'Vouchers', icon: <FileText size={16} className="text-orange-400" />, action: () => {
            sessionStorage.setItem('initialVoucherType', 'credit_note')
            handleOpenModal(setVoucherModalOpen)
        }},

        // Masters
        { id: 'create_ledger', label: 'Create Ledger Account', category: 'Masters', icon: <BookOpen size={16} className="text-green-400" />, action: () => handleOpenModal(setLedgerModalOpen) },
        { id: 'create_item', label: 'Create Inventory Item', category: 'Masters', icon: <Layers size={16} className="text-green-400" />, action: () => handleOpenModal(setItemModalOpen) },
        { id: 'chart_of_accounts', label: 'Chart of Accounts', category: 'Masters', icon: <Layers size={16} className="text-green-400" />, action: () => handleSelectView('ledger') },
        { id: 'ledger_groups', label: 'Ledger Groups List', category: 'Masters', icon: <Layers size={16} className="text-green-400" />, action: () => handleSelectView('ledger_groups') },
        { id: 'item_groups', label: 'Item Groups List', category: 'Masters', icon: <Layers size={16} className="text-green-400" />, action: () => handleSelectView('item_groups') },
        { id: 'item_master', label: 'Items List', category: 'Masters', icon: <Layers size={16} className="text-green-400" />, action: () => handleSelectView('item_master') },

        // System
        { id: 'users', label: 'User Management', category: 'System', icon: <Shield size={16} className="text-purple-400" />, action: () => handleSelectView('users') },
        { id: 'session_logs', label: 'Session Logs', category: 'System', icon: <Activity size={16} className="text-purple-400" />, action: () => handleSelectView('session_logs') },
        { id: 'audit_trail', label: 'Audit Trail', category: 'System', icon: <ClipboardList size={16} className="text-purple-400" />, action: () => handleSelectView('audit_trail') },
        { id: 'settings', label: 'Settings', category: 'System', icon: <Settings size={16} className="text-purple-400" />, action: () => handleSelectView('settings') },
    ], [currentView, isGoto])

    // Filter results
    const filteredCommands = useMemo(() => {
        if (!query) return commands
        const q = query.toLowerCase()
        return commands.filter(cmd => 
            cmd.label.toLowerCase().includes(q) || 
            cmd.category.toLowerCase().includes(q)
        )
    }, [query, commands])

    // Rove focus scroll inside list
    useEffect(() => {
        const activeEl = listRef.current?.querySelector('[data-active="true"]')
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex])

    // Handle keys via shortcut manager when mounted
    const isVisible = showCommandPalette !== null

    useShortcut('escape', () => {
        setShowCommandPalette(null)
    }, 'palette', 'Close Command Palette', { disabled: !isVisible })

    useShortcut('up', () => {
        setSelectedIndex(prev => Math.max(0, prev - 1))
    }, 'palette', 'Move selection up', { disabled: !isVisible })

    useShortcut('down', () => {
        setSelectedIndex(prev => Math.min(filteredCommands.length - 1, prev + 1))
    }, 'palette', 'Move selection down', { disabled: !isVisible })

    useShortcut('enter', () => {
        if (filteredCommands.length > 0 && filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
        }
    }, 'palette', 'Confirm command selection', { disabled: !isVisible })

    if (!isVisible) return null

    // Group commands by category for display
    const grouped = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {})

    const categoriesOrder: ('Reports' | 'Vouchers' | 'Masters' | 'System')[] = ['Reports', 'Vouchers', 'Masters', 'System']
    
    // Flat index mapper for roving hover index matching grouped display
    const flatItems: CommandItem[] = []
    categoriesOrder.forEach(cat => {
        if (grouped[cat]) {
            flatItems.push(...grouped[cat])
        }
    })

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-[100] px-4 animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 z-0" onClick={() => setShowCommandPalette(null)} />

            <div className="bg-[#16171d] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-top-4 duration-300">
                
                {/* Search Header */}
                <div className="relative flex items-center p-4 border-b border-white/10 shrink-0">
                    <Search className="absolute left-6 text-white/40" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={isGoto ? "Go To: Search reports, vouchers, masters..." : "Switch To: Search reports, vouchers..."}
                        className="w-full bg-transparent border-none text-lg text-white placeholder-white/30 pl-12 pr-12 outline-none font-sans"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                    />
                    <div className="absolute right-14 text-[10px] font-bold tracking-widest text-[var(--color-accent)] uppercase px-2 py-0.5 rounded border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5">
                        {isGoto ? "Go To" : "Switch To"}
                    </div>
                    <button
                        onClick={() => setShowCommandPalette(null)}
                        className="absolute right-4 p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body lists */}
                <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2 space-y-4">
                    {filteredCommands.length === 0 && (
                        <div className="p-8 text-center text-sm text-white/40">
                            No commands found matching &quot;{query}&quot;
                        </div>
                    )}

                    {categoriesOrder.map(cat => {
                        const items = grouped[cat]
                        if (!items || items.length === 0) return null

                        return (
                            <div key={cat}>
                                <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-white/35 uppercase border-b border-white/5 mb-1 select-none">
                                    {cat}
                                </div>
                                <ul className="space-y-0.5">
                                    {items.map(item => {
                                        // Match item index in flat list
                                        const globalIdx = flatItems.findIndex(x => x.id === item.id)
                                        const active = globalIdx === selectedIndex

                                        return (
                                            <li
                                                key={item.id}
                                                data-active={active}
                                                onClick={item.action}
                                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                className={`flex items-center justify-between p-2.5 px-4 rounded-xl cursor-pointer transition-colors ${
                                                    active ? 'bg-[var(--color-accent)]/20 text-white font-medium' : 'hover:bg-white/5 text-white/80'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded-lg bg-white/5 shrink-0">
                                                        {item.icon}
                                                    </div>
                                                    <span className="text-sm font-sans">{item.label}</span>
                                                </div>
                                                <ArrowRight size={14} className={`transition-all ${active ? 'opacity-100 translate-x-0 text-[var(--color-accent)]' : 'opacity-0 -translate-x-2'}`} />
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )
                    })}
                </div>

                {/* Help Hints */}
                <div className="bg-white/5 p-3 px-6 border-t border-white/5 flex items-center gap-6 text-[11px] text-white/40 select-none shrink-0">
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px]">Up/Down</kbd> Navigate
                    </span>
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px]">Enter</kbd> Select
                    </span>
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px]">Esc</kbd> Close
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
                        Tally Keyboard Mode
                    </div>
                </div>
            </div>
        </div>
    )
}
