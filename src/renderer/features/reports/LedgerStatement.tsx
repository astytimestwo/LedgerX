import React, { useState, useEffect, useRef } from 'react'
import { useLedgerStatement } from './useReports'
import { api } from '../../lib/api'
import { formatPaise, formatDate } from '../../lib/format'
import { Download, Printer, Search } from 'lucide-react'
import { useShortcut } from '../../lib/shortcutManager'
import { toast } from '../../stores/toast.store'

export const LedgerStatement: React.FC = () => {
    const [ledgers, setLedgers] = useState<any[]>([])
    const [selectedLedgerId, setSelectedLedgerId] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

    const [selectedIdx, setSelectedIdx] = useState<number>(0)
    const tableBodyRef = useRef<HTMLTableSectionElement>(null)

    // Load available ledgers
    useEffect(() => {
        api.getLedgerAccounts().then(accounts => {
            setLedgers(accounts)
            if (accounts.length > 0 && !selectedLedgerId) {
                setSelectedLedgerId(accounts[0].id)
            }
        })
    }, [])

    const { data: rows, isLoading } = useLedgerStatement(selectedLedgerId, dateFrom, dateTo)

    const isVisible = rows && rows.length > 0

    useEffect(() => {
        setSelectedIdx(0)
    }, [rows?.length])

    useEffect(() => {
        const activeRow = tableBodyRef.current?.querySelector('[data-active="true"]')
        if (activeRow) {
            activeRow.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIdx])

    useShortcut('up', () => {
        setSelectedIdx(p => Math.max(0, p - 1))
    }, 'page', 'Select previous row', { disabled: !isVisible })

    useShortcut('down', () => {
        setSelectedIdx(p => Math.min((rows?.length || 1) - 1, p + 1))
    }, 'page', 'Select next row', { disabled: !isVisible })

    useShortcut('home', () => {
        setSelectedIdx(0)
    }, 'page', 'Select first row', { disabled: !isVisible })

    useShortcut('end', () => {
        setSelectedIdx((rows?.length || 1) - 1)
    }, 'page', 'Select last row', { disabled: !isVisible })

    useShortcut('enter', () => {
        const item = rows?.[selectedIdx]
        if (item && item.id !== 'opening') {
            toast.info(`Shortcut recognized: Details drill down for "${item.voucher_no}" is not available yet.`)
        }
    }, 'page', 'Drill down to details', { disabled: !isVisible })

    useShortcut('ctrl+p', () => {
        toast.info('Shortcut recognized: Exporting Ledger Statement to PDF...')
    }, 'page', 'Export report to PDF')

    useShortcut('ctrl+e', () => {
        toast.info('Shortcut recognized: Exporting Ledger Statement to Excel...')
    }, 'page', 'Export report to Excel')

    useShortcut('alt+f', () => {
        const searchSelect = document.querySelector('select') as HTMLSelectElement
        if (searchSelect) {
            searchSelect.focus()
        }
    }, 'page', 'Focus Ledger selection')

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-base)]">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 px-6 py-4 mx-6 mt-6 mb-4 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">Ledger Statement</h1>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Detailed transaction history and running balance</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Ledger Statement to PDF...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors" title="Export to PDF (Ctrl+P)">
                            <Printer size={15} /> PDF
                        </button>
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Ledger Statement to Excel...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors" title="Export to Excel (Ctrl+E)">
                            <Download size={15} /> Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-6 bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="flex-1 max-w-sm flex items-center gap-3">
                        <Search size={16} className="text-[var(--color-text-muted)]" />
                        <select
                            value={selectedLedgerId}
                            onChange={(e) => setSelectedLedgerId(e.target.value)}
                            className="flex-1 text-sm bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none font-medium"
                        >
                            {ledgers.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-6 bg-white/20 mx-2"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">From</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="text-sm bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">To</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="text-sm bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-6 pb-6 w-full flex justify-center">
                {isLoading ? (
                    <div className="text-center text-[var(--color-text-muted)] animate-pulse mt-10">Loading transactions...</div>
                ) : (
                    <div className="w-full max-w-6xl bg-white/5 dark:bg-black/20 border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-black/5 dark:bg-black/40 backdrop-blur-md z-10">
                                <tr className="border-b border-white/10">
                                    <th className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider w-28">Date</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider w-40">Voucher No.</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider">Particulars (Narration)</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider text-right w-32">Debit (₹)</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider text-right w-32">Credit (₹)</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider text-right w-36 bg-black/20 animate-pulse">Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {rows?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)] border-b border-white/5 bg-black/10">
                                            No transactions found for this period.
                                        </td>
                                    </tr>
                                )}

                                {rows?.map((row, index) => {
                                    const isOpening = row.id === 'opening'
                                    const isCurrent = index === selectedIdx
                                    
                                    return (
                                        <tr 
                                            key={row.id + index}
                                            data-active={isCurrent}
                                            onClick={() => setSelectedIdx(index)}
                                            className={`border-b border-white/5 hover:bg-white/10 transition-colors cursor-default ${
                                                isCurrent
                                                    ? 'bg-[var(--color-accent)]/20 text-white font-semibold border-l-2 border-[var(--color-accent)]'
                                                    : isOpening 
                                                        ? 'bg-white/5 font-bold' 
                                                        : (index % 2 === 0 ? 'bg-black/10' : 'bg-transparent')
                                            }`}
                                        >
                                            <td className="py-2.5 px-4 text-sm text-[var(--color-text-primary)]">{isOpening ? '' : formatDate(row.date)}</td>
                                            <td className="py-2.5 px-4 text-sm font-mono text-[var(--color-accent)]">{row.voucher_no}</td>
                                            <td className="py-2.5 px-4 text-sm text-[var(--color-text-primary)] truncate max-w-sm" title={row.narration || ''}>
                                                {row.narration || '-'}
                                            </td>
                                            <td className="py-2.5 px-4 text-sm font-mono text-right text-[var(--color-debit)]">
                                                {row.type === 'dr' ? formatPaise(row.amount) : ''}
                                            </td>
                                            <td className="py-2.5 px-4 text-sm font-mono text-right text-[var(--color-credit)]">
                                                {row.type === 'cr' ? formatPaise(row.amount) : ''}
                                            </td>
                                            <td className="py-2.5 px-4 text-sm font-mono text-right font-bold bg-black/20 flex justify-end gap-1">
                                                <span className="text-white">{formatPaise(row.balance)}</span>
                                                <span className={`text-[10px] uppercase w-4 text-right ${row.balance_type === 'dr' ? 'text-[var(--color-debit)]' : 'text-[var(--color-credit)]'}`}>
                                                    {row.balance > 0 ? row.balance_type : ''}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
