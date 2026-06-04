import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Download } from 'lucide-react'
import { Button } from '../../components/Button/Button'

export const StockLedger: React.FC = () => {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [selectedItemId, setSelectedItemId] = useState('')

    const { data: items = [] } = useQuery({
        queryKey: ['items'],
        queryFn: () => api.inventory.item.list()
    })

    const { data: ledgerData, isLoading } = useQuery({
        queryKey: ['stock-ledger', selectedItemId, dateFrom, dateTo],
        queryFn: () => api.inventory.reports.ledger(selectedItemId, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
        enabled: !!selectedItemId
    })

    const handleExport = () => {
        if (!ledgerData) return

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Voucher No,Voucher Type,Particulars,Inwards Qty,Outwards Qty,Rate,Value\n"
            + ledgerData.movements.map((m: any) => {
                const inQty = m.type === 'in' ? m.qty : 0
                const outQty = m.type === 'out' ? m.qty : 0
                return `"${m.date}","${m.voucher_no}","${m.voucher_type}","${m.ledger_name || '-'}","${inQty}","${outQty}","${(m.rate / 100).toFixed(2)}","${(m.amount / 100).toFixed(2)}"`
            }).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `stock_ledger_${ledgerData.item.name}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    let runningBalQty = ledgerData?.item?.opening_qty || 0

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Stock Ledger</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Detailed item movements and running balance.</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] min-w-[200px]"
                    >
                        <option value="">-- Select Item --</option>
                        {items.map((i: any) => (
                            <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                        ))}
                    </select>

                    <div className="flex bg-black/5 dark:bg-black/40 rounded-lg p-1 border border-white/10">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-3 py-1.5 focus:outline-none"
                        />
                        <div className="w-px bg-white/10 mx-1"></div>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-3 py-1.5 focus:outline-none"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleExport} disabled={!ledgerData || ledgerData.movements.length === 0} className="flex items-center gap-2">
                        <Download size={16} /> Export
                    </Button>
                </div>
            </div>

            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl flex-1 overflow-auto flex flex-col">
                {!selectedItemId ? (
                    <div className="flex-1 flex items-center justify-center text-white/40">
                        Select an item from the dropdown to view its ledger.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm sticky top-0 z-10">
                                <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Date</th>
                                <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Vch Type</th>
                                <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Vch No</th>
                                <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Particulars</th>
                                <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right text-[var(--color-debit)]">Inwards (Qty)</th>
                                <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right text-[var(--color-credit)]">Outwards (Qty)</th>
                                <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">Balance Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-white/50">Loading Stock Ledger...</td></tr>
                            ) : (
                                <>
                                    <tr className="bg-white/5 border-b border-white/10 font-medium">
                                        <td colSpan={6} className="px-4 py-3 text-right text-[var(--color-text-secondary)]">Opening Balance</td>
                                        <td className="px-4 text-right font-mono font-bold text-[var(--color-text-primary)]">{ledgerData?.item?.opening_qty || 0}</td>
                                    </tr>

                                    {ledgerData?.movements.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-white/50">No movements found in this period.</td></tr>
                                    ) : (
                                        ledgerData?.movements.map((m: any) => {
                                            if (m.type === 'in') runningBalQty += m.qty
                                            else runningBalQty -= m.qty

                                            return (
                                                <tr key={m.id} className="h-11 border-b border-white/5 hover:bg-white/10 transition-colors">
                                                    <td className="px-4 text-[var(--color-text-secondary)]">{m.date}</td>
                                                    <td className="px-4 uppercase text-xs font-bold text-[var(--color-text-muted)] tracking-wider">{m.voucher_type}</td>
                                                    <td className="px-4 text-[var(--color-text-secondary)]">{m.voucher_no}</td>
                                                    <td className="px-4 font-medium text-[var(--color-accent)]">{m.ledger_name || '-'}</td>
                                                    <td className="px-4 text-right text-[var(--color-debit)] font-mono">{m.type === 'in' ? m.qty : ''}</td>
                                                    <td className="px-4 text-right text-[var(--color-credit)] font-mono">{m.type === 'out' ? m.qty : ''}</td>
                                                    <td className="px-4 text-right font-mono font-bold text-[var(--color-text-primary)]">{runningBalQty}</td>
                                                </tr>
                                            )
                                        })
                                    )}

                                    <tr className="bg-[var(--color-accent)]/20 border-t-2 border-[var(--color-accent)]">
                                        <td colSpan={6} className="px-4 py-4 text-right font-bold text-white uppercase tracking-wider text-sm">
                                            Closing Stock Balance
                                        </td>
                                        <td className="px-4 py-4 text-right font-bold text-[var(--color-accent)] font-mono text-lg">
                                            {runningBalQty} {ledgerData?.item?.unit_of_measure}
                                        </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
