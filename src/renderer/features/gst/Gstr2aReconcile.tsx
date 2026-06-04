import React, { useState } from 'react'
import { api } from '../../lib/api'
import { Upload, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'

export const Gstr2aReconcile: React.FC = () => {
    const [period, setPeriod] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().substring(0, 10)
    })

    const [isReconciling, setIsReconciling] = useState(false)
    const [reconciliationResult, setReconciliationResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleImportJson = async () => {
        try {
            setError(null)
            const jsonStr = await api.dialog.readJsonFile()
            if (!jsonStr) return // user canceled

            setIsReconciling(true)
            const result = await api.gst.reports.gstr2a({
                period,
                portalData: jsonStr
            })
            setReconciliationResult(result)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to import and reconcile JSON.')
        } finally {
            setIsReconciling(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount)
    }

    return (
        <div className="p-4 flex flex-col h-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] gap-5">
            <div className="bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <h2 className="text-xl font-bold mb-2">GSTR-2A Reconciliation</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">Match your purchase register against the GSTR-2A JSON from the GST Portal.</p>

                <div className="flex items-end gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">From Date</label>
                        <input
                            type="date"
                            value={period.from}
                            onChange={(e) => setPeriod({ ...period, from: e.target.value })}
                            className="w-40 h-10 px-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">To Date</label>
                        <input
                            type="date"
                            value={period.to}
                            onChange={(e) => setPeriod({ ...period, to: e.target.value })}
                            className="w-40 h-10 px-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                        />
                    </div>

                    <button
                        onClick={handleImportJson}
                        disabled={isReconciling}
                        className="h-10 px-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Upload size={18} />
                        {isReconciling ? 'Reconciling...' : 'Import GSTR-2A JSON'}
                    </button>
                </div>
                {error && <div className="mt-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-lg flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}
            </div>

            <div className="flex-1 overflow-auto">
                {!reconciliationResult && !isReconciling && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] border-2 border-dashed border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <HelpCircle size={48} className="mb-4 opacity-50" />
                        <p className="text-lg">No data loaded.</p>
                        <p className="text-sm">Select a date range and upload the JSON file downloaded from the GST portal to begin.</p>
                    </div>
                )}

                {reconciliationResult && (
                    <div className="space-y-8">
                        {/* Summary */}
                        <div className="grid grid-cols-4 gap-4">
                            <SummaryCard title="Total Portal Invoices" count={reconciliationResult.summary.totalPortal} icon={<Upload className="text-blue-400" />} />
                            <SummaryCard title="Total Local Purchases" count={reconciliationResult.summary.totalLocal} icon={<HelpCircle className="text-purple-400" />} />
                            <SummaryCard title="Exact Matches" count={reconciliationResult.exactMatches.length} border="border-green-500/50" icon={<CheckCircle className="text-green-500" />} />
                            <SummaryCard title="Missing in Books" count={reconciliationResult.missingInBooks.length} border="border-red-500/50" icon={<XCircle className="text-red-500" />} />
                        </div>

                        {/* Mismatches */}
                        {reconciliationResult.partialMatches.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-yellow-500 flex items-center gap-2 mb-3">
                                    <AlertTriangle size={20} /> Value Mismatches ({reconciliationResult.partialMatches.length})
                                </h3>
                                <TableWrapper>
                                    <thead className="bg-white/10 dark:bg-black/20 text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">GSTIN</th>
                                            <th className="px-4 py-3 text-left">Invoice No</th>
                                            <th className="px-4 py-3 text-right">Portal Value</th>
                                            <th className="px-4 py-3 text-right">Local Value</th>
                                            <th className="px-4 py-3 text-right">Difference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {reconciliationResult.partialMatches.map((m: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5">
                                                <td className="px-4 py-3">{m.portal.gstin}</td>
                                                <td className="px-4 py-3 font-mono">{m.portal.voucher_no}</td>
                                                <td className="px-4 py-3 text-right text-blue-300">{formatCurrency(m.portal.val)}</td>
                                                <td className="px-4 py-3 text-right text-purple-300">{formatCurrency(m.local.total_amount / 100)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-yellow-500">{formatCurrency(m.diff)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableWrapper>
                            </div>
                        )}

                        {/* Missing in Books */}
                        {reconciliationResult.missingInBooks.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-3">
                                    <XCircle size={20} /> Missing in Books (In Portal Only) ({reconciliationResult.missingInBooks.length})
                                </h3>
                                <TableWrapper>
                                    <thead className="bg-white/10 dark:bg-black/20 text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">GSTIN</th>
                                            <th className="px-4 py-3 text-left">Invoice No</th>
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-right">Value (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {reconciliationResult.missingInBooks.map((m: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 text-red-100">
                                                <td className="px-4 py-3">{m.gstin}</td>
                                                <td className="px-4 py-3 font-mono">{m.voucher_no}</td>
                                                <td className="px-4 py-3">{m.date}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(m.val)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableWrapper>
                            </div>
                        )}

                        {/* Missing in Portal */}
                        {reconciliationResult.missingInPortal.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-3">
                                    <HelpCircle size={20} /> Missing in Portal (In Books Only) ({reconciliationResult.missingInPortal.length})
                                </h3>
                                <TableWrapper>
                                    <thead className="bg-white/10 dark:bg-black/20 text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Local GSTIN</th>
                                            <th className="px-4 py-3 text-left">Voucher No</th>
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-right">Value (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {reconciliationResult.missingInPortal.map((m: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 text-blue-100">
                                                <td className="px-4 py-3">{m.gstin}</td>
                                                <td className="px-4 py-3 font-mono">{m.voucher_no}</td>
                                                <td className="px-4 py-3">{new Date(m.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(m.total_amount / 100)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableWrapper>
                            </div>
                        )}

                        {/* Exact Matches (Collapsible or just preview) */}
                        {reconciliationResult.exactMatches.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-green-500 flex items-center gap-2 mb-3">
                                    <CheckCircle size={20} /> Exact Matches ({reconciliationResult.exactMatches.length})
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-4">These invoices match perfectly between your books and the GST portal.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function SummaryCard({ title, count, border = 'border-white/10', icon }: any) {
    return (
        <div className={`p-4 bg-white/5 rounded-xl border ${border} relative overflow-hidden flex items-center justify-between`}>
            <div>
                <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] font-semibold mb-1">{title}</div>
                <div className="text-3xl font-bold text-white">{count}</div>
            </div>
            <div className="opacity-80">
                {icon}
            </div>
        </div>
    )
}

function TableWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
                {children}
            </table>
        </div>
    )
}
