import React, { useState, useMemo, useEffect } from 'react'
import { useProfitAndLoss } from './useReports'
import { formatPaise } from '../../lib/format'
import { Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShortcut } from '../../lib/shortcutManager'
import { toast } from '../../stores/toast.store'

export const ProfitAndLoss: React.FC = () => {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
    const [showExpense, setShowExpense] = useState(true)
    const [showIncome, setShowIncome] = useState(true)

    const { data: report, isLoading } = useProfitAndLoss(dateFrom, dateTo)
    const [selectedIdx, setSelectedIdx] = useState<number>(0)

    const isProfit = report ? report.netProfit >= 0 : true

    // Flat visible items list for roving selection
    const visibleRows = useMemo(() => {
        if (!report) return []
        const list: any[] = []
        if (showExpense) {
            report.expenseGroups.forEach((g: any) => list.push({ ...g, type: 'expense' }))
            if (isProfit) {
                list.push({ ledger_id: 'net_profit', account_name: 'Net Profit', closing_balance: Math.abs(report.netProfit), type: 'expense' })
            }
        }
        if (showIncome) {
            report.incomeGroups.forEach((g: any) => list.push({ ...g, type: 'income' }))
            if (!isProfit) {
                list.push({ ledger_id: 'net_loss', account_name: 'Net Loss', closing_balance: Math.abs(report.netProfit), type: 'income' })
            }
        }
        return list
    }, [report, showExpense, showIncome, isProfit])

    const hasRows = visibleRows.length > 0
    const activeItem = hasRows ? visibleRows[selectedIdx] : null

    useEffect(() => {
        setSelectedIdx(0)
    }, [visibleRows.length])

    useShortcut('up', () => {
        setSelectedIdx(p => Math.max(0, p - 1))
    }, 'page', 'Select previous row', { disabled: !hasRows })

    useShortcut('down', () => {
        setSelectedIdx(p => Math.min(visibleRows.length - 1, p + 1))
    }, 'page', 'Select next row', { disabled: !hasRows })

    useShortcut('home', () => {
        setSelectedIdx(0)
    }, 'page', 'Select first row', { disabled: !hasRows })

    useShortcut('end', () => {
        setSelectedIdx(visibleRows.length - 1)
    }, 'page', 'Select last row', { disabled: !hasRows })

    useShortcut('left', () => {
        setShowExpense(s => !s)
        toast.info('Shortcut recognized: Toggled Expense column')
    }, 'page', 'Toggle Expense Column')

    useShortcut('right', () => {
        setShowIncome(s => !s)
        toast.info('Shortcut recognized: Toggled Income column')
    }, 'page', 'Toggle Income Column')

    useShortcut('enter', () => {
        if (activeItem) {
            toast.info(`Shortcut recognized: Details drill down for "${activeItem.account_name}" is not available yet.`)
        }
    }, 'page', 'Drill down details', { disabled: !hasRows })

    useShortcut('ctrl+p', () => {
        toast.info('Shortcut recognized: Exporting Profit & Loss to PDF...')
    }, 'page', 'Export report to PDF')

    useShortcut('ctrl+e', () => {
        toast.info('Shortcut recognized: Exporting Profit & Loss to Excel...')
    }, 'page', 'Export report to Excel')

    useShortcut('alt+f', () => {
        const input = document.querySelector('input[type="date"]') as HTMLInputElement
        if (input) {
            input.focus()
            input.select()
        }
    }, 'page', 'Focus date input')

    if (isLoading || !report) return <div className="p-8 text-[var(--color-text-muted)] animate-pulse">Calculating Profit & Loss...</div>

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-base)]">
            <div className="flex items-center justify-between px-6 py-4 mx-6 mt-6 mb-4 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">Profit & Loss Statement</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Financial performance over a specific period</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">From</span>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm bg-black/5 dark:bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">To</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm bg-black/5 dark:bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none" />
                    </div>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    <button
                        onClick={() => setShowExpense(s => !s)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${showExpense ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
                        title="Toggle Expense column (Left Arrow)"
                    >
                        {showExpense ? <ChevronRight size={15} /> : <ChevronLeft size={15} />} Expense
                    </button>
                    <button
                        onClick={() => setShowIncome(s => !s)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${showIncome ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
                        title="Toggle Income column (Right Arrow)"
                    >
                        {showIncome ? <ChevronRight size={15} /> : <ChevronLeft size={15} />} Income
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    <div className="flex gap-2">
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Profit & Loss to PDF...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors"><Printer size={15} /> PDF</button>
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Profit & Loss to Excel...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors"><Download size={15} /> Excel</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 flex justify-center">
                <div className="w-full max-w-5xl flex border border-white/10 rounded-2xl shadow-2xl bg-white/5 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
                    {/* Expenses */}
                    {showExpense && (
                    <div className="flex-1 border-r border-white/20 flex flex-col">
                        <div className="bg-black/5 dark:bg-black/40 py-3 px-4 border-b border-white/20 flex justify-between">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Particulars (Expenses)</h3>
                            <span className="text-sm font-bold text-white uppercase tracking-widest">Amount (₹)</span>
                        </div>
                        <div className="flex-1 p-4 space-y-2">
                            {report.expenseGroups.map((g: any) => {
                                const isSelected = activeItem?.type === 'expense' && activeItem?.ledger_id === g.ledger_id
                                return (
                                    <div 
                                        key={g.ledger_id}
                                        onClick={() => {
                                            const idx = visibleRows.findIndex(x => x.type === 'expense' && x.ledger_id === g.ledger_id)
                                            if (idx !== -1) setSelectedIdx(idx)
                                        }}
                                        className={`flex justify-between items-center group cursor-pointer p-1.5 px-3 rounded transition-colors ${
                                            isSelected ? 'bg-[var(--color-accent)]/20 text-white border-l-2 border-[var(--color-accent)] font-semibold' : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-white transition-colors">{g.account_name}</span>
                                        <span className="text-sm font-mono text-white">{formatPaise(g.closing_balance)}</span>
                                    </div>
                                )
                            })}
                            
                            {isProfit && (
                                (() => {
                                    const isSelected = activeItem?.type === 'expense' && activeItem?.ledger_id === 'net_profit'
                                    return (
                                        <div 
                                            onClick={() => {
                                                const idx = visibleRows.findIndex(x => x.type === 'expense' && x.ledger_id === 'net_profit')
                                                if (idx !== -1) setSelectedIdx(idx)
                                            }}
                                            className={`flex justify-between items-center pt-8 cursor-pointer p-1.5 px-3 rounded transition-colors ${
                                                isSelected ? 'bg-[var(--color-accent)]/20 text-white border-l-2 border-[var(--color-accent)] font-semibold' : ''
                                            }`}
                                        >
                                            <span className="text-sm font-bold text-[var(--color-success)] uppercase tracking-wide">Net Profit</span>
                                            <span className="text-sm font-mono font-bold text-[var(--color-success)]">{formatPaise(Math.abs(report.netProfit))}</span>
                                        </div>
                                    )
                                })()
                            )}
                        </div>
                        <div className="bg-black/60 py-4 px-4 border-t border-white/20 flex justify-between">
                            <span className="text-sm font-bold text-white uppercase">Total</span>
                            <span className="text-sm font-mono font-bold text-white">
                                {formatPaise(report.totalExpense + (isProfit ? Math.abs(report.netProfit) : 0))}
                            </span>
                        </div>
                    </div>
                    )}

                    {/* Income */}
                    {showIncome && (
                    <div className="flex-1 flex flex-col">
                        <div className="bg-black/5 dark:bg-black/40 py-3 px-4 border-b border-white/20 flex justify-between">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Particulars (Income)</h3>
                            <span className="text-sm font-bold text-white uppercase tracking-widest">Amount (₹)</span>
                        </div>
                        <div className="flex-1 p-4 space-y-2">
                            {report.incomeGroups.map((g: any) => {
                                const isSelected = activeItem?.type === 'income' && activeItem?.ledger_id === g.ledger_id
                                return (
                                    <div 
                                        key={g.ledger_id}
                                        onClick={() => {
                                            const idx = visibleRows.findIndex(x => x.type === 'income' && x.ledger_id === g.ledger_id)
                                            if (idx !== -1) setSelectedIdx(idx)
                                        }}
                                        className={`flex justify-between items-center group cursor-pointer p-1.5 px-3 rounded transition-colors ${
                                            isSelected ? 'bg-[var(--color-accent)]/20 text-white border-l-2 border-[var(--color-accent)] font-semibold' : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-white transition-colors">{g.account_name}</span>
                                        <span className="text-sm font-mono text-white">{formatPaise(g.closing_balance)}</span>
                                    </div>
                                )
                            })}
                            
                            {!isProfit && (
                                (() => {
                                    const isSelected = activeItem?.type === 'income' && activeItem?.ledger_id === 'net_loss'
                                    return (
                                        <div 
                                            onClick={() => {
                                                const idx = visibleRows.findIndex(x => x.type === 'income' && x.ledger_id === 'net_loss')
                                                if (idx !== -1) setSelectedIdx(idx)
                                            }}
                                            className={`flex justify-between items-center pt-8 cursor-pointer p-1.5 px-3 rounded transition-colors ${
                                                isSelected ? 'bg-[var(--color-accent)]/20 text-white border-l-2 border-[var(--color-accent)] font-semibold' : ''
                                            }`}
                                        >
                                            <span className="text-sm font-bold text-[var(--color-error)] uppercase tracking-wide">Net Loss</span>
                                            <span className="text-sm font-mono font-bold text-[var(--color-error)]">{formatPaise(Math.abs(report.netProfit))}</span>
                                        </div>
                                    )
                                })()
                            )}
                        </div>
                        <div className="bg-black/60 py-4 px-4 border-t border-white/20 flex justify-between">
                            <span className="text-sm font-bold text-white uppercase">Total</span>
                            <span className="text-sm font-mono font-bold text-white">
                                {formatPaise(report.totalIncome + (!isProfit ? Math.abs(report.netProfit) : 0))}
                            </span>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    )
}
