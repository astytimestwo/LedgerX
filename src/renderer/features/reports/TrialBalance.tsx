import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useTrialBalance } from './useReports'
import { formatPaise } from '../../lib/format'
import { Download, Printer, ChevronUp, ChevronDown } from 'lucide-react'
import { useShortcut } from '../../lib/shortcutManager'
import { toast } from '../../stores/toast.store'

type SortField = 'account_name' | 'debit' | 'credit'
type SortDir = 'asc' | 'desc'

export const TrialBalance: React.FC = () => {
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
    const [sortField, setSortField] = useState<SortField>('account_name')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const { data: rows, isLoading } = useTrialBalance(dateTo)

    // Keyboard navigation & hidden rows state
    const [selectedIdx, setSelectedIdx] = useState<number>(0)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [hiddenLedgerIds, setHiddenLedgerIds] = useState<string[]>([])
    const tableBodyRef = useRef<HTMLTableSectionElement>(null)

    const sortedRows = useMemo(() => {
        if (!rows) return []
        return [...rows].sort((a, b) => {
            let cmp = 0
            if (sortField === 'account_name') {
                cmp = a.account_name.localeCompare(b.account_name)
            } else if (sortField === 'debit') {
                const aVal = a.closing_type === 'dr' ? a.closing_balance : 0
                const bVal = b.closing_type === 'dr' ? b.closing_balance : 0
                cmp = aVal - bVal
            } else if (sortField === 'credit') {
                const aVal = a.closing_type === 'cr' ? a.closing_balance : 0
                const bVal = b.closing_type === 'cr' ? b.closing_balance : 0
                cmp = aVal - bVal
            }
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [rows, sortField, sortDir])

    // Filter out hidden lines
    const visibleRows = useMemo(() => {
        return sortedRows.filter(r => !hiddenLedgerIds.includes(r.ledger_id))
    }, [sortedRows, hiddenLedgerIds])

    // Auto-scroll selected row in table
    useEffect(() => {
        const activeRow = tableBodyRef.current?.querySelector('[data-active="true"]')
        if (activeRow) {
            activeRow.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIdx])

    // Reset selected index when visible row list changes
    useEffect(() => {
        setSelectedIdx(0)
    }, [visibleRows.length])

    // Keyboard shortcuts for Trial Balance report page
    const hasRows = visibleRows.length > 0

    useShortcut('up', () => {
        setSelectedIdx(p => Math.max(0, p - 1))
    }, 'page', 'Select previous report row', { disabled: !hasRows })

    useShortcut('down', () => {
        setSelectedIdx(p => Math.min(visibleRows.length - 1, p + 1))
    }, 'page', 'Select next report row', { disabled: !hasRows })

    useShortcut('home', () => {
        setSelectedIdx(0)
    }, 'page', 'Select first report row', { disabled: !hasRows })

    useShortcut('end', () => {
        setSelectedIdx(visibleRows.length - 1)
    }, 'page', 'Select last report row', { disabled: !hasRows })

    useShortcut(['space', 'shift+space'], () => {
        const activeRow = visibleRows[selectedIdx]
        if (activeRow) {
            setSelectedIds(prev => {
                const next = new Set(prev)
                if (next.has(activeRow.ledger_id)) {
                    next.delete(activeRow.ledger_id)
                } else {
                    next.add(activeRow.ledger_id)
                }
                return next
            })
        }
    }, 'page', 'Toggle selection of current report row', { disabled: !hasRows })

    useShortcut('ctrl+r', () => {
        const activeRow = visibleRows[selectedIdx]
        if (activeRow) {
            setHiddenLedgerIds(prev => [...prev, activeRow.ledger_id])
            toast.success(`Hidden line: ${activeRow.account_name}`)
        }
    }, 'page', 'Remove / hide line entry', { disabled: !hasRows })

    useShortcut('ctrl+u', () => {
        if (hiddenLedgerIds.length > 0) {
            const nextHidden = [...hiddenLedgerIds]
            const restoredId = nextHidden.pop()
            setHiddenLedgerIds(nextHidden)
            const restoredRow = sortedRows.find(r => r.ledger_id === restoredId)
            if (restoredRow) {
                toast.success(`Restored hidden line: ${restoredRow.account_name}`)
            }
        } else {
            toast.error('No hidden lines to restore.')
        }
    }, 'page', 'Restore last hidden line')

    useShortcut('alt+u', () => {
        if (hiddenLedgerIds.length > 0) {
            setHiddenLedgerIds([])
            toast.success('All hidden lines restored.')
        } else {
            toast.error('No hidden lines to restore.')
        }
    }, 'page', 'Restore all hidden lines')

    useShortcut('ctrl+p', () => {
        toast.info('Shortcut recognized: Exporting Trial Balance to PDF...')
    }, 'page', 'Export report to PDF')

    useShortcut('ctrl+e', () => {
        toast.info('Shortcut recognized: Exporting Trial Balance to Excel...')
    }, 'page', 'Export report to Excel')

    useShortcut('alt+f', () => {
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
        if (dateInput) {
            dateInput.focus()
            dateInput.select()
        }
    }, 'page', 'Focus date selection')

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('asc')
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => sortField === field
        ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
        : <ChevronUp size={12} className="opacity-30" />

    if (isLoading) return <div className="p-8 text-[var(--color-text-muted)] animate-pulse">Calculating Trial Balance...</div>

    // Calculate Grand Totals based on visible lines
    let grandDebit = 0
    let grandCredit = 0

    visibleRows.forEach((r) => {
        if (r.closing_type === 'dr') grandDebit += r.closing_balance
        else grandCredit += r.closing_balance
    })

    const isBalanced = grandDebit === grandCredit

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-base)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 mx-6 mt-6 mb-4 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">Trial Balance</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Verification of arithmetical accuracy of ledgers</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">As of</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="text-sm bg-black/5 dark:bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Trial Balance to PDF...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors" title="Export to PDF (Ctrl+P)">
                            <Printer size={15} /> PDF
                        </button>
                        <button onClick={() => toast.info('Shortcut recognized: Exporting Trial Balance to Excel...')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors" title="Export to Excel (Ctrl+E)">
                            <Download size={15} /> Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-6 pb-6 w-full flex justify-center">
                <div className="w-full max-w-5xl bg-white/5 dark:bg-black/20 border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-black/5 dark:bg-black/40 backdrop-blur-md z-10">
                            <tr className="border-b border-white/10">
                                <th
                                    className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10"
                                    onClick={() => handleSort('account_name')}
                                >
                                    <span className="flex items-center gap-1">Particulars <SortIcon field="account_name" /></span>
                                </th>
                                <th
                                    className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider text-right w-48 cursor-pointer hover:bg-white/10"
                                    onClick={() => handleSort('debit')}
                                >
                                    <span className="flex items-center justify-end gap-1">Debit (₹) <SortIcon field="debit" /></span>
                                </th>
                                <th
                                    className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider text-right w-48 cursor-pointer hover:bg-white/10"
                                    onClick={() => handleSort('credit')}
                                >
                                    <span className="flex items-center justify-end gap-1">Credit (₹) <SortIcon field="credit" /></span>
                                </th>
                            </tr>
                        </thead>
                        <tbody ref={tableBodyRef}>
                            {visibleRows.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-[var(--color-text-muted)] border-b border-white/5 bg-black/10">
                                        No ledger balances found up to this date.
                                    </td>
                                </tr>
                            )}

                            {visibleRows.map((row, index) => {
                                const isCurrent = index === selectedIdx
                                const isSelected = selectedIds.has(row.ledger_id)

                                return (
                                    <tr 
                                        key={row.ledger_id}
                                        data-active={isCurrent}
                                        onClick={() => setSelectedIdx(index)}
                                        className={`border-b border-white/5 hover:bg-white/10 transition-colors cursor-default ${
                                            isCurrent 
                                                ? 'bg-[var(--color-accent)]/20 text-white border-l-2 border-[var(--color-accent)] shadow-inner' 
                                                : isSelected
                                                    ? 'bg-white/5'
                                                    : index % 2 === 0 ? 'bg-black/10' : 'bg-transparent'
                                        }`}
                                    >
                                        <td className="py-2.5 px-4 flex items-center gap-2">
                                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />}
                                            <div>
                                                <div className="text-sm font-medium text-white">{row.account_name}</div>
                                                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">{row.group_name}</div>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 text-sm font-mono text-right text-[var(--color-text-primary)]">
                                            {row.closing_type === 'dr' ? (row.closing_balance > 0 ? formatPaise(row.closing_balance) : '-') : '-'}
                                        </td>
                                        <td className="py-2.5 px-4 text-sm font-mono text-right text-[var(--color-text-primary)]">
                                            {row.closing_type === 'cr' ? (row.closing_balance > 0 ? formatPaise(row.closing_balance) : '-') : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-[#16171d] border-t border-white/30 backdrop-blur-md shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                            <tr>
                                <td className="py-4 px-4 text-sm font-bold text-white text-right uppercase tracking-wider">Grand Total</td>
                                <td className={`py-4 px-4 text-sm font-mono font-bold text-right ${isBalanced ? 'text-[var(--color-success)]' : 'text-[var(--color-error)] border-b-2 border-[var(--color-error)]'}`}>
                                    {formatPaise(grandDebit)}
                                </td>
                                <td className={`py-4 px-4 text-sm font-mono font-bold text-right ${isBalanced ? 'text-[var(--color-success)]' : 'text-[var(--color-error)] border-b-2 border-[var(--color-error)]'}`}>
                                    {formatPaise(grandCredit)}
                                </td>
                            </tr>
                            {!isBalanced && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-2 text-center text-xs font-bold text-[var(--color-error)] underline bg-red-900/20 animate-pulse">
                                        ERROR: Trial Balance does not match. Difference: {formatPaise(Math.abs(grandDebit - grandCredit))}
                                    </td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    )
}
