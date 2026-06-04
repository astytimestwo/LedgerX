import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useVouchers, useDeleteVoucher } from './useVouchers'
import { formatPaise, formatDate } from '../../lib/format'
import { Plus, Trash2, Edit2, Search, CheckSquare, Square } from 'lucide-react'
import { useUIStore } from '../../stores/ui.store'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useShortcut } from '../../lib/shortcutManager'
import { toast } from '../../stores/toast.store'

const VOUCHER_TYPE_LABELS: Record<string, string> = {
  bank_receipt: 'Bank Receipt',
  bank_payment: 'Bank Payment',
  cash_receipt: 'Cash Receipt',
  cash_payment: 'Cash Payment',
  journal: 'Journal',
  sales: 'Sales',
  purchase: 'Purchase',
  debit_note: 'Debit Note',
  credit_note: 'Credit Note',
  contra: 'Contra',
}

export const VoucherList: React.FC = () => {
    const { t } = useTranslation()
    const { data: vouchers, isLoading } = useVouchers()
    const { mutateAsync: deleteVoucher } = useDeleteVoucher()
    const { setVoucherModalOpen } = useUIStore()
    const parentRef = useRef<HTMLDivElement>(null)

    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [search, setSearch] = useState('')

    // Keyboard selection state
    const [selectedIdx, setSelectedIdx] = useState<number>(0)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const filteredVouchers = useMemo(() => {
        if (!vouchers) return []
        return vouchers.filter(v => {
            if (dateFrom && v.date < dateFrom) return false
            if (dateTo && v.date > dateTo) return false
            if (typeFilter && v.voucher_type !== typeFilter) return false
            if (search) {
                const s = search.toLowerCase()
                if (!v.voucher_no.toLowerCase().includes(s) &&
                    !(v.narration || '').toLowerCase().includes(s)) return false
            }
            return true
        })
    }, [vouchers, dateFrom, dateTo, typeFilter, search])

    const rowVirtualizer = useVirtualizer({
        count: filteredVouchers.length || 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 48, // 48px height per row
        overscan: 10,
    })

    // Scroll active keyboard row into view
    useEffect(() => {
        if (selectedIdx >= 0 && filteredVouchers.length > 0) {
            rowVirtualizer.scrollToIndex(selectedIdx, { align: 'center' })
        }
    }, [selectedIdx, filteredVouchers.length])

    // Reset selection when list size changes
    useEffect(() => {
        setSelectedIdx(0)
    }, [filteredVouchers.length])

    // Toggle multi-selection
    const toggleRowSelection = (idx: number) => {
        const item = filteredVouchers[idx]
        if (!item) return
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(item.id)) {
                next.delete(item.id)
            } else {
                next.add(item.id)
            }
            return next
        })
    }

    const handleShiftUpDown = (direction: 'up' | 'down') => {
        const item = filteredVouchers[selectedIdx]
        if (!item) return
        toggleRowSelection(selectedIdx)
        setSelectedIdx(p => direction === 'up' ? Math.max(0, p - 1) : Math.min(filteredVouchers.length - 1, p + 1))
    }

    // Keyboard navigation register on context page
    const hasRows = filteredVouchers.length > 0

    useShortcut('up', () => {
        setSelectedIdx(p => Math.max(0, p - 1))
    }, 'page', 'Select previous row', { disabled: !hasRows })

    useShortcut('down', () => {
        setSelectedIdx(p => Math.min(filteredVouchers.length - 1, p + 1))
    }, 'page', 'Select next row', { disabled: !hasRows })

    useShortcut('home', () => {
        setSelectedIdx(0)
    }, 'page', 'Select first row', { disabled: !hasRows })

    useShortcut('end', () => {
        setSelectedIdx(filteredVouchers.length - 1)
    }, 'page', 'Select last row', { disabled: !hasRows })

    useShortcut('pgup', () => {
        setSelectedIdx(p => Math.max(0, p - 10))
    }, 'page', 'Move selection up 10 rows', { disabled: !hasRows })

    useShortcut('pgdn', () => {
        setSelectedIdx(p => Math.min(filteredVouchers.length - 1, p + 10))
    }, 'page', 'Move selection down 10 rows', { disabled: !hasRows })

    useShortcut(['space', 'shift+space'], () => {
        toggleRowSelection(selectedIdx)
    }, 'page', 'Toggle selection of current row', { disabled: !hasRows })

    useShortcut('shift+up', () => {
        handleShiftUpDown('up')
    }, 'page', 'Select and move up', { disabled: !hasRows })

    useShortcut('shift+down', () => {
        handleShiftUpDown('down')
    }, 'page', 'Select and move down', { disabled: !hasRows })

    useShortcut('enter', () => {
        const item = filteredVouchers[selectedIdx]
        if (item) {
            toast.info(`Shortcut recognized: Edit voucher "${item.voucher_no}" is not available yet.`)
        }
    }, 'page', 'Drill down to edit selected', { disabled: !hasRows })

    useShortcut('delete', () => {
        const item = filteredVouchers[selectedIdx]
        if (item) {
            handleDelete(item.id)
        }
    }, 'page', 'Delete selected voucher', { disabled: !hasRows })

    useShortcut('alt+f', () => {
        const searchInput = document.querySelector('input[placeholder*="Search voucher"]') as HTMLInputElement
        if (searchInput) {
            searchInput.focus()
            searchInput.select()
        }
    }, 'page', 'Focus Local Search')

    if (isLoading) return <div className="p-8 text-[var(--color-text-muted)] animate-pulse">{t('vouchers.loading')}</div>

    const handleDelete = async (id: string) => {
        if (confirm(t('vouchers.confirmDelete'))) {
            await deleteVoucher(id)
            toast.success('Voucher deleted successfully.')
        }
    }

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-base)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 mx-6 mt-6 mb-4 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">{t('vouchers.daybook')}</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('vouchers.daybookDesc')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setVoucherModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-bold shadow-lg transition-all"
                    >
                        <Plus size={16} /> {t('vouchers.newVoucher')}
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex items-center gap-3 px-6 mb-2">
                <div className="flex items-center gap-2 bg-white/5 dark:bg-black/20 rounded-lg px-3 py-1.5 border border-white/10">
                    <Search size={14} className="text-white/40" />
                    <input
                        type="text"
                        placeholder="Search voucher no. or narration... (Alt+F)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent text-sm text-white w-52 focus:outline-none placeholder-white/40 font-sans"
                    />
                </div>
                <div className="flex items-center gap-2 bg-white/5 dark:bg-black/20 rounded-lg px-3 py-1.5 border border-white/10">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="bg-transparent text-sm text-white focus:outline-none"
                        placeholder="From"
                    />
                    <span className="text-white/30">-</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="bg-transparent text-sm text-white focus:outline-none"
                        placeholder="To"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="bg-white/5 dark:bg-black/20 text-sm text-white px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                >
                    <option value="">All Types</option>
                    {Object.entries(VOUCHER_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Virtualized Table List */}
            <div ref={parentRef} className="flex-1 overflow-auto px-6 pb-6 relative">
                <div className="min-w-[900px] h-full bg-white/5 dark:bg-black/20 border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm relative">
                    {/* Header Row (Sticky) */}
                    <div className="sticky top-0 z-10 bg-black/5 dark:bg-black/40 border-b border-white/10 flex items-center text-xs font-semibold text-white uppercase tracking-wider py-3 px-6 shadow-md backdrop-blur-xl">
                        <div className="w-[4%] shrink-0 text-center">Sel</div>
                        <div className="w-[12%] shrink-0 pl-2">{t('vouchers.date')}</div>
                        <div className="w-[15%] shrink-0">{t('vouchers.voucherNo')}</div>
                        <div className="w-[12%] shrink-0">{t('vouchers.type')}</div>
                        <div className="flex-1 min-w-[200px] pl-2">{t('vouchers.narration')}</div>
                        <div className="w-[15%] shrink-0 text-right pr-4">{t('vouchers.debitTotal')}</div>
                        <div className="w-[15%] shrink-0 text-right pr-4">{t('vouchers.creditTotal')}</div>
                        <div className="w-[8%] shrink-0 text-right">{t('vouchers.actions')}</div>
                    </div>

                    {/* Virtual Body */}
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {filteredVouchers?.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center py-12 text-center text-[var(--color-text-muted)]">
                                {t('vouchers.noVouchersFound')}
                            </div>
                        )}
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const v = filteredVouchers[virtualRow.index]
                            let drTotal = 0; let crTotal = 0;
                            v.entries.forEach((e: any) => {
                                if (e.type === 'dr') drTotal += e.amount
                                else crTotal += e.amount
                            })

                            const isCurrent = virtualRow.index === selectedIdx
                            const isSelected = selectedIds.has(v.id)

                            return (
                                <div
                                    key={virtualRow.key}
                                    onClick={() => setSelectedIdx(virtualRow.index)}
                                    className={`absolute top-0 left-0 w-full flex items-center px-6 border-b border-white/5 cursor-pointer transition-colors ${
                                        isCurrent 
                                            ? 'bg-[var(--color-accent)]/15 border-l-2 border-[var(--color-accent)] text-white' 
                                            : isSelected
                                                ? 'bg-white/5'
                                                : virtualRow.index % 2 === 0 ? 'bg-black/10' : 'bg-transparent'
                                    }`}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`
                                    }}
                                >
                                    <div className="w-[4%] shrink-0 flex items-center justify-center text-white/50" onClick={(e) => { e.stopPropagation(); toggleRowSelection(virtualRow.index); }}>
                                        {isSelected ? <CheckSquare size={14} className="text-[var(--color-accent)]" /> : <Square size={14} />}
                                    </div>
                                    <div className="w-[12%] shrink-0 text-sm text-[var(--color-text-primary)] pl-2">{formatDate(v.date)}</div>
                                    <div className="w-[15%] shrink-0 text-sm font-mono text-[var(--color-accent)] truncate pr-2">{v.voucher_no}</div>
                                    <div className="w-[12%] shrink-0 text-sm text-[var(--color-text-primary)] truncate pr-2">{VOUCHER_TYPE_LABELS[v.voucher_type] || v.voucher_type}</div>
                                    <div className="flex-1 min-w-[200px] text-sm text-[var(--color-text-primary)] truncate pr-4 pl-2" title={v.narration}>{v.narration || '-'}</div>
                                    <div className="w-[15%] shrink-0 text-sm font-mono text-right text-[var(--color-debit)] pr-4">{formatPaise(drTotal)}</div>
                                    <div className="w-[15%] shrink-0 text-sm font-mono text-right text-[var(--color-credit)] pr-4">{formatPaise(crTotal)}</div>
                                    <div className="w-[8%] shrink-0 flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => toast.info('Shortcut recognized: Editing is not available yet.')} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-white/10 hover:text-white transition-colors" title="Edit">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-error)] hover:text-white transition-colors" title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
