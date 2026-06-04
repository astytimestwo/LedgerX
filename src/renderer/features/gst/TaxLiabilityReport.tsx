import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { FileText, Download } from 'lucide-react'

// Note: Stub exports until pdfmake/exceljs are unified
const exportPdf = () => alert('PDF export coming in phase B')
const exportExcel = () => alert('Excel export coming in phase B')

export function TaxLiabilityReport() {
    const [period, setPeriod] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().substring(0, 10)
    })

    const { data: reportData, isLoading } = useQuery({
        queryKey: ['gst', 'tax-liability', period],
        queryFn: () => api.gst.reports.taxLiability(period)
    })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount)
    }

    return (
        <div className="p-4 h-full flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Tax Liability Report</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Output GST summarized by tax rate</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                        <input
                            type="date"
                            value={period.from}
                            onChange={(e) => setPeriod({ ...period, from: e.target.value })}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-2 py-1 outline-none"
                        />
                        <span className="text-[var(--color-text-muted)] px-2 py-1">to</span>
                        <input
                            type="date"
                            value={period.to}
                            onChange={(e) => setPeriod({ ...period, to: e.target.value })}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-2 py-1 outline-none"
                        />
                    </div>
                    <button onClick={exportPdf} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium">
                        <FileText size={16} /> PDF
                    </button>
                    <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors text-sm font-medium">
                        <Download size={16} /> Excel
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
                    </div>
                ) : (
                    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/10 dark:bg-black/20 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                                <tr>
                                    <th className="px-4 py-3">Tax Rate</th>
                                    <th className="px-4 py-3 text-right">Taxable Value (₹)</th>
                                    <th className="px-4 py-3 text-right">CGST (₹)</th>
                                    <th className="px-4 py-3 text-right">SGST (₹)</th>
                                    <th className="px-4 py-3 text-right">IGST (₹)</th>
                                    <th className="px-4 py-3 text-right">Cess (₹)</th>
                                    <th className="px-4 py-3 text-right font-bold">Total Tax (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-[var(--color-text-primary)]">
                                {!reportData?.length ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No outward supplies found in this period.</td>
                                    </tr>
                                ) : (
                                    reportData.map((row: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-semibold">{row.tax_rate}%</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(row.taxable_value)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-blue-300">{formatCurrency(row.cgst)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-purple-300">{formatCurrency(row.sgst)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-orange-300">{formatCurrency(row.igst)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-400">{formatCurrency(row.cess)}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-[var(--color-accent)]">{formatCurrency(row.total_tax)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
