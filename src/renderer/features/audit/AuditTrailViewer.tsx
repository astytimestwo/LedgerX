import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { DiffViewer } from './DiffViewer'
import { ChevronDown, ChevronRight, Search, FileDown } from 'lucide-react'
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import ExcelJS from 'exceljs'

try {
    const pdfMakeInstance = pdfMake as any
    pdfMakeInstance.vfs = (pdfFonts as any).pdfMake?.vfs || pdfMakeInstance.vfs
} catch (e) {
    // pdfMake is read-only in Vitest test modules
}

export const AuditTrailViewer: React.FC = () => {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [actionFilter, setActionFilter] = useState('')
    const [search, setSearch] = useState('')
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['audit-logs', dateFrom, dateTo, actionFilter, search],
        queryFn: () => api.audit.list({
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            action: actionFilter || undefined,
            search: search || undefined
        })
    })

    const toggleRow = (id: string) => {
        if (expandedRow === id) setExpandedRow(null)
        else setExpandedRow(id)
    }

    const exportPdf = async () => {
        try {
            const exportData = await api.audit.export({
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                action: actionFilter || undefined,
                search: search || undefined
            });

            const docDefinition = {
                content: [
                    { text: 'Audit Trail Report', style: 'header' },
                    { text: `Generated on: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 10] },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', '15%', 'auto', 'auto', '*'],
                            body: [
                                ['Timestamp', 'User', 'Action', 'Module', 'Record ID'],
                                ...exportData.map(log => [
                                    new Date(log.timestamp).toLocaleString(),
                                    log.user_name || log.user_id,
                                    log.action,
                                    log.table_name || '-',
                                    log.record_id || '-'
                                ])
                            ]
                        }
                    }
                ],
                styles: {
                    header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] }
                }
            };

            // @ts-ignore
            pdfMake.createPdf(docDefinition).download('Audit_Trail.pdf');
        } catch (e: any) {
            alert('PDF Export failed: ' + e.message);
        }
    }

    const exportExcel = async () => {
        try {
            const exportData = await api.audit.export({
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                action: actionFilter || undefined,
                search: search || undefined
            });

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Audit Trail');

            sheet.columns = [
                { header: 'Timestamp', key: 'timestamp', width: 25 },
                { header: 'User', key: 'user', width: 20 },
                { header: 'Action', key: 'action', width: 15 },
                { header: 'Module', key: 'module', width: 20 },
                { header: 'Record ID', key: 'record_id', width: 40 },
            ];

            exportData.forEach(log => {
                sheet.addRow({
                    timestamp: new Date(log.timestamp).toLocaleString(),
                    user: log.user_name || log.user_id,
                    action: log.action,
                    module: log.table_name || '-',
                    record_id: log.record_id || '-'
                });
            });

            sheet.getRow(1).font = { bold: true };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Audit_Trail.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (e: any) {
            alert('Excel Export failed: ' + e.message);
        }
    }

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Audit Trail</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Immutable log of system modifications.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-black/5 dark:bg-black/40 rounded-lg p-1 border border-white/10">
                        <Search className="w-4 h-4 text-white/40 ml-2" />
                        <input
                            type="text"
                            placeholder="Search data..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] w-32 focus:outline-none"
                        />
                    </div>

                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-black/5 dark:bg-black/40 text-sm text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    >
                        <option value="">All Actions</option>
                        <option value="INSERT">Create (INSERT)</option>
                        <option value="UPDATE">Update (UPDATE)</option>
                        <option value="DELETE">Delete (DELETE)</option>
                        <option value="LOGIN">Login</option>
                        <option value="LOGOUT">Logout</option>
                    </select>

                    <div className="flex bg-black/5 dark:bg-black/40 rounded-lg p-1 border border-white/10">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-2 focus:outline-none"
                        />
                        <div className="w-px bg-white/10 mx-1"></div>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-2 focus:outline-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button onClick={exportPdf} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-white/10 shadow-lg">
                            <FileDown className="w-4 h-4" />
                            PDF
                        </button>
                        <button onClick={exportExcel} className="flex items-center gap-1 bg-[var(--color-accent)]/80 hover:bg-[var(--color-accent)] text-white px-3 py-1.5 rounded-lg text-sm transition-colors shadow-lg shadow-[var(--color-accent)]/20">
                            <FileDown className="w-4 h-4" />
                            Excel
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm sticky top-0 z-10">
                            <th className="px-4 w-10"></th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Timestamp</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">User</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Action</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Module</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Record ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-white/50">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-white/50">No audit logs match criteria.</td></tr>
                        ) : logs.map((log: any) => (
                            <React.Fragment key={log.id}>
                                <tr
                                    className={`h-11 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer ${expandedRow === log.id ? 'bg-white/5' : ''}`}
                                    onClick={() => toggleRow(log.id)}
                                >
                                    <td className="px-4 text-white/40">
                                        {(log.action === 'UPDATE' || log.action === 'INSERT' || log.action === 'DELETE') ? (
                                            expandedRow === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                        ) : null}
                                    </td>
                                    <td className="px-4 text-[var(--color-text-primary)]">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-4 font-medium text-[var(--color-accent)]">{log.user_name || log.user_id}</td>
                                    <td className="px-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${log.action === 'INSERT' ? 'bg-green-400/20 text-green-400 border border-green-400/30' :
                                            log.action === 'UPDATE' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                                                log.action === 'DELETE' ? 'bg-red-400/20 text-red-400 border border-red-400/30' :
                                                    'bg-blue-400/20 text-blue-400 border border-blue-400/30'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 text-[var(--color-text-secondary)]">{log.table_name || '-'}</td>
                                    <td className="px-4 font-mono text-xs text-white/50" title={log.record_id || '-'}>{log.record_id ? log.record_id.slice(0, 20) + (log.record_id.length > 20 ? '...' : '') : '-'}</td>
                                </tr>
                                {expandedRow === log.id && (log.action === 'UPDATE' || log.action === 'INSERT' || log.action === 'DELETE') && (
                                    <tr className="bg-white/10 dark:bg-black/20">
                                        <td></td>
                                        <td colSpan={5} className="pb-4 pr-4">
                                            <DiffViewer oldValue={log.old_value} newValue={log.new_value} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
