import React, { useState, useMemo, useEffect } from 'react'
import { useBalanceSheet } from './useReports'
import { formatPaise } from '../../lib/format'
import { Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShortcut } from '../../lib/shortcutManager'
import { toast } from '../../stores/toast.store'

export const BalanceSheet: React.FC = () => {
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
    const [showLiabilities, setShowLiabilities] = useState(true)
    const [showAssets, setShowAssets] = useState(true)

    const { data: report, isLoading } = useBalanceSheet(dateTo)
    const [selectedIdx, setSelectedIdx] = useState<number>(0)

    // Flat visible items list for roving focus selection
    const visibleRows = useMemo(() => {
        if (!report) return []
        const list: any[] = []
        if (showLiabilities) {
            report.liabilityGroups.forEach((g: any) => list.push({ ...g, type: 'liability' }))
            list.push({ ledger_id: 'pnl_balancing', account_name: 'P&L Account', closing_balance: report.pnlBalancing, type: 'liability' })
        }
        if (showAssets) {
            report.assetGroups.forEach((g: any) => list.push({ ...g, type: 'asset' }))
        }
        return list
    }, [report, showLiabilities, showAssets])

    const hasRows = visibleRows.length > 0
    const activeItem = hasRows ? visibleRows[selectedIdx] : null

    // Reset index on change
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
        setShowLiabilities(s => !s)
        toast.info('Shortcut recognized: Toggled Liabilities & Equity column')
    }, 'page', 'Toggle Liabilities Column')

    useShortcut('right', () => {
        setShowAssets(s => !s)
        toast.info('Shortcut recognized: Toggled Assets column')
    }, 'page', 'Toggle Assets Column')

    useShortcut('enter', () => {
        if (activeItem) {
            toast.info(`Shortcut recognized: Details drill down for "${activeItem.account_name}" is not available yet.`)
        }
    }, 'page', 'Drill down to details', { disabled: !hasRows })

    useShortcut('ctrl+p', () => {
        toast.info('Shortcut recognized: Exporting Balance Sheet to PDF...')
    }, 'page', 'Export report to PDF')

    useShortcut('ctrl+e', () => {
        toast.info('Shortcut recognized: Exporting Balance Sheet to Excel...')
    }, 'page', 'Export report to Excel')

    useShortcut('alt+f', () => {
        const input = document.querySelector('input[type="date"]') as HTMLInputElement
        if (input) {
            input.focus()
            input.select()
        }
    }, 'page', 'Focus date picker')

    if (isLoading || !report) return <div className="p-8 text-[var(--color-text-muted)] animate-pulse">Calculating Balance Sheet...</div>

    const totalAssetsStr = formatPaise(report.totalAssets)
    const liabilitySideTotal = report.totalLiabilities + report.pnlBalancing
    const liabilitySideStr = formatPaise(liabilitySideTotal)

    const isBalanced = totalAssetsStr === liabilitySideStr

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-base)]">
            <div className="flex items-center justify-between px-6 py-4 mx-6 mt-6 mb-4 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">Balance Sheet</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Financial position as of a specific date</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">As of</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm bg-black/5 dark:bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none" />
                    </div>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    <button
                        onClick={() => setShowLiabilities(s => !s)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${showLiabilities ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
                        title="Toggle Liabilities & Equity column (Left Arrow)"
                    >
                        {showLiabilities ? <ChevronRight size={15} /> : <ChevronLeft size={15} />} L&E
                    </button>
                    <button
                        onClick={() => setShowAssets(s => !s)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${showAssets ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
                        title="Toggle Assets column (Right Arrow)"
                    >
                        {showAssets ? <ChevronRight size={15} /> : <ChevronLeft size={15} />} Assets
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    <div className="flex gap-2">
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Balance Sheet to PDF...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors"><Printer size={15} /> PDF</button>
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Balance Sheet to Excel...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors"><Download size={15} /> Excel</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 flex justify-center">
                <div className="w-full max-w-5xl flex border border-white/10 rounded-2xl shadow-2xl bg-white/5 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
                    {/* Liabilities */}
                    {showLiabilities && (
                    <div className="flex-1 border-r border-white/20 flex flex-col">
                        <div className="bg-black/5 dark:bg-black/40 py-3 px-4 border-b border-white/20 flex justify-between">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Liabilities & Equity</h3>
                            <span className="text-sm font-bold text-white uppercase tracking-widest">Amount (₹)</span>
                        </div>
                        <div className="flex-1 p-4 space-y-2">
                            {report.liabilityGroups.map((g: any) => {
                                const isSelected = activeItem?.type === 'liability' && activeItem?.ledger_id === g.ledger_id
                                return (
                                    <div 
                                        key={g.ledger_id}
                                        onClick={() => {
                                            const idx = visibleRows.findIndex(x => x.type === 'liability' && x.ledger_id === g.ledger_id)
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
                            
                            {(() => {
                                const isSelected = activeItem?.type === 'liability' && activeItem?.ledger_id === 'pnl_balancing'
                                return (
                                    <div 
                                        onClick={() => {
                                            const idx = visibleRows.findIndex(x => x.type === 'liability' && x.ledger_id === 'pnl_balancing')
                                            if (idx !== -1) setSelectedIdx(idx)
                                        }}
                                        className={`flex justify-between items-center pt-8 mt-8 border-t border-white/10 cursor-pointer p-1.5 px-3 rounded transition-colors ${
                                            isSelected ? 'bg-[var(--color-accent)]/20 text-white border-l-2 border-[var(--color-accent)] font-semibold' : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide">P&L Account</span>
                                        <span className={`text-sm font-mono font-bold ${report.pnlBalancing >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                                            {formatPaise(report.pnlBalancing)}
                                        </span>
                                    </div>
                                )
                            })()}
                        </div>
                        <div className="bg-black/60 py-4 px-4 border-t border-white/20 flex justify-between">
                            <span className="text-sm font-bold text-white uppercase">Total</span>
                            <span className={`text-sm font-mono font-bold ${isBalanced ? 'text-white' : 'text-[var(--color-error)]'}`}>
                                {liabilitySideStr}
                            </span>
                        </div>
                    </div>
                    )}

                    {/* Assets */}
                    {showAssets && (
                    <div className="flex-1 flex flex-col">
                        <div className="bg-black/5 dark:bg-black/40 py-3 px-4 border-b border-white/20 flex justify-between">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Assets</h3>
                            <span className="text-sm font-bold text-white uppercase tracking-widest">Amount (₹)</span>
                        </div>
                        <div className="flex-1 p-4 space-y-2">
                            {report.assetGroups.map((g: any) => {
                                const isSelected = activeItem?.type === 'asset' && activeItem?.ledger_id === g.ledger_id
                                return (
                                    <div 
                                        key={g.ledger_id}
                                        onClick={() => {
                                            const idx = visibleRows.findIndex(x => x.type === 'asset' && x.ledger_id === g.ledger_id)
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
                        </div>
                        <div className="bg-black/60 py-4 px-4 border-t border-white/20 flex justify-between">
                            <span className="text-sm font-bold text-white uppercase">Total</span>
                            <span className={`text-sm font-mono font-bold ${isBalanced ? 'text-white' : 'text-[var(--color-error)]'}`}>
                                {totalAssetsStr}
                            </span>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    )
}
