import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatPaise } from '../../lib/format'
import { Download, Search } from 'lucide-react'
import { Button } from '../../components/Button/Button'

export const StockSummary: React.FC = () => {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [search, setSearch] = useState('')

    const { data: reportData = [], isLoading } = useQuery({
        queryKey: ['stock-summary', dateFrom, dateTo],
        queryFn: () => api.inventory.reports.summary({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
    })

    const filteredData = useMemo(() => {
        if (!search) return reportData
        const s = search.toLowerCase()
        return reportData.filter((item: any) =>
            item.name.toLowerCase().includes(s) ||
            (item.code || '').toLowerCase().includes(s)
        )
    }, [reportData, search])

    const groupedData = useMemo(() => {
        const groups: Record<string, any[]> = {}
        let totalValue = 0

        filteredData.forEach((item: any) => {
            const group = item.group_name || 'Uncategorized'
            if (!groups[group]) groups[group] = []
            groups[group].push(item)
            totalValue += item.closing_value
        })

        return { groups, totalValue }
    }, [reportData])

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Group,Item Code,Item Name,Inwards Qty,Outwards Qty,Closing Qty,UOM,Closing Value\n"
            + Object.entries(groupedData.groups).map(([group, items]) => {
                return items.map(item =>
                    `"${group}","${item.code}","${item.name}",${item.inwards_qty},${item.outwards_qty},${item.closing_qty},"${item.unit_of_measure}",${(item.closing_value / 100).toFixed(2)}`
                ).join("\n")
            }).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `stock_summary_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Stock Summary</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Overview of inventory currently on hand.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 dark:bg-black/20 rounded-lg px-3 py-1.5 border border-white/10">
                        <Search size={14} className="text-white/40" />
                        <input
                            type="text"
                            placeholder="Search item name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent text-sm text-white w-44 focus:outline-none placeholder-white/40"
                        />
                    </div>
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
                    <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
                        <Download size={16} /> Export
                    </Button>
                </div>
            </div>

            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm sticky top-0 z-10">
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Particulars</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">Inwards</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">Outwards</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">Closing Qty</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">Closing Value (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-white/50">Loading Stock Summary...</td></tr>
                        ) : Object.keys(groupedData.groups).length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-white/50">No items found.</td></tr>
                        ) : (
                            Object.entries(groupedData.groups).map(([groupName, items]) => (
                                <React.Fragment key={groupName}>
                                    <tr className="bg-black/5 dark:bg-black/40 border-b border-white/10">
                                        <td colSpan={5} className="px-4 py-3 font-bold text-[var(--color-accent)] uppercase tracking-wide text-xs">
                                            {groupName}
                                        </td>
                                    </tr>
                                    {items.map((item: any) => (
                                        <tr key={item.item_id} className="h-12 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                            <td className="px-4">
                                                <div className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{item.name}</div>
                                                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.code}</div>
                                            </td>
                                            <td className="px-4 text-right">
                                                <span className="text-[var(--color-text-primary)] font-mono">{item.inwards_qty.toFixed(2)}</span>
                                                <span className="text-xs text-[var(--color-text-muted)] ml-1">{item.unit_of_measure}</span>
                                            </td>
                                            <td className="px-4 text-right">
                                                <span className="text-[var(--color-text-primary)] font-mono">{item.outwards_qty.toFixed(2)}</span>
                                                <span className="text-xs text-[var(--color-text-muted)] ml-1">{item.unit_of_measure}</span>
                                            </td>
                                            <td className="px-4 text-right">
                                                <span className="font-bold text-[var(--color-text-primary)] font-mono">{item.closing_qty.toFixed(2)}</span>
                                                <span className="text-xs text-[var(--color-text-muted)] ml-1">{item.unit_of_measure}</span>
                                            </td>
                                            <td className="px-4 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                                                {formatPaise(item.closing_value)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        )}

                        {!isLoading && Object.keys(groupedData.groups).length > 0 && (
                            <tr className="bg-[var(--color-accent)]/20 border-t-2 border-[var(--color-accent)]">
                                <td colSpan={4} className="px-4 py-4 text-right font-bold text-white uppercase tracking-wider text-sm">
                                    Grand Total Value
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-[var(--color-accent)] font-mono text-lg">
                                    {formatPaise(groupedData.totalValue)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
