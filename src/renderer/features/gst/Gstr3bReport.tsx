import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/Button/Button'
import { FileText, Download } from 'lucide-react'
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import ExcelJS from 'exceljs'

try {
    const pdfMakeInstance = pdfMake as any
    pdfMakeInstance.vfs = (pdfFonts as any).pdfMake?.vfs || pdfMakeInstance.vfs
} catch (e) {
    // pdfMake is read-only in Vitest test modules
}

export const Gstr3bReport: React.FC = () => {
    // Default to current month
    const currentDate = new Date()
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]

    const [period, setPeriod] = useState({ from: firstDay, to: lastDay })

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['gstr3b', period],
        queryFn: () => api.gst.reports.gstr3b(period)
    })

    const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setPeriod({
            from: fd.get('from') as string,
            to: fd.get('to') as string
        })
    }

    const exportPdf = () => {
        if (!report) return;

        const docDefinition: any = {
            content: [
                { text: 'GSTR-3B Report (Summary)', style: 'header' },
                { text: `Period: ${period.from} to ${period.to}`, margin: [0, 0, 0, 10] },

                { text: '3.1 Details of Outward Supplies', style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['Nature of Supplies', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'],
                            ...report.table3_1.map((r: any) => [
                                r.nature,
                                r.taxable_value.toFixed(2),
                                r.igst > 0 ? r.igst.toFixed(2) : '-',
                                r.cgst > 0 ? r.cgst.toFixed(2) : '-',
                                r.sgst > 0 ? r.sgst.toFixed(2) : '-',
                                r.cess > 0 ? r.cess.toFixed(2) : '-'
                            ])
                        ]
                    },
                    margin: [0, 0, 0, 15]
                },

                { text: '4. Eligible ITC', style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['Details', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'],
                            ...report.table4.map((r: any) => [
                                r.nature,
                                r.igst > 0 ? r.igst.toFixed(2) : '-',
                                r.cgst > 0 ? r.cgst.toFixed(2) : '-',
                                r.sgst > 0 ? r.sgst.toFixed(2) : '-',
                                r.cess > 0 ? r.cess.toFixed(2) : '-'
                            ])
                        ]
                    }
                }
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
            },
            defaultStyle: {
                fontSize: 9
            }
        };

        // @ts-ignore
        pdfMake.createPdf(docDefinition).download(`GSTR-3B_${period.from}_${period.to}.pdf`);
    }

    const exportExcel = async () => {
        if (!report) return;

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('GSTR-3B');

        sheet.addRow(['GSTR-3B Report']);
        sheet.addRow([`Period: ${period.from} to ${period.to}`]);
        sheet.addRow([]);

        // Table 3.1
        sheet.addRow(['3.1 Details of Outward Supplies']);
        sheet.addRow(['Nature of Supplies', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess']);

        report.table3_1.forEach((r: any) => {
            sheet.addRow([r.nature, r.taxable_value, r.igst, r.cgst, r.sgst, r.cess]);
        });

        sheet.addRow([]);

        // Table 4
        sheet.addRow(['4. Eligible ITC']);
        sheet.addRow(['Details', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess']);

        report.table4.forEach((r: any) => {
            sheet.addRow([r.nature, r.igst, r.cgst, r.sgst, r.cess]);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR-3B_${period.from}_${period.to}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 h-full flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">GSTR-3B (Summary)</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">View and export your monthly summary tax return.</p>
                </div>
                <form onSubmit={handleFilter} className="flex gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">From Date</label>
                        <input
                            type="date"
                            name="from"
                            defaultValue={period.from}
                            className="h-9 px-3 rounded-lg border border-white/20 bg-white/10 dark:bg-black/20 text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">To Date</label>
                        <input
                            type="date"
                            name="to"
                            defaultValue={period.to}
                            className="h-9 px-3 rounded-lg border border-white/20 bg-white/10 dark:bg-black/20 text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                        />
                    </div>
                    <Button type="submit" className="h-9 px-4 text-sm font-medium">Filter</Button>
                    <button type="button" onClick={exportPdf} className="h-9 flex items-center gap-2 px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors text-sm font-medium ml-2 border border-red-500/20">
                        <FileText size={16} /> PDF
                    </button>
                    <button type="button" onClick={exportExcel} className="h-9 flex items-center gap-2 px-3 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md transition-colors text-sm font-medium border border-green-500/20">
                        <Download size={16} /> Excel
                    </button>
                </form>
            </div>

            {isLoading && <div className="text-[var(--color-text-muted)] animate-pulse">Generating Report...</div>}
            {error && <div className="text-[var(--color-error)] bg-[var(--color-error)]/10 p-4 rounded-lg">Failed to load report.</div>}

            {report && (
                <div className="flex-1 overflow-auto flex flex-col gap-6">
                    {/* Table 3.1: Outward Supplies */}
                    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/10 font-semibold tracking-wide text-[var(--color-text-primary)]">
                            3.1 Details of Outward Supplies and inward supplies liable to reverse charge
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm">
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">Nature of Supplies</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Total Taxable Value</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Integrated Tax</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Central Tax</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">State/UT Tax</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Cess</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.table3_1.map((r: any, i: number) => (
                                    <tr key={i} className={`h-11 border-b border-white/5 hover:bg-white/10 transition-colors`}>
                                        <td className="px-4 py-2">{r.nature}</td>
                                        <td className="px-4 py-2 text-right font-mono">₹{r.taxable_value.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.igst > 0 ? `₹${r.igst.toFixed(2)}` : '-'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.cgst > 0 ? `₹${r.cgst.toFixed(2)}` : '-'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.sgst > 0 ? `₹${r.sgst.toFixed(2)}` : '-'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.cess > 0 ? `₹${r.cess.toFixed(2)}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table 4: Eligible ITC */}
                    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl overflow-hidden mb-8">
                        <div className="p-4 bg-white/5 border-b border-white/10 font-semibold tracking-wide text-[var(--color-text-primary)]">
                            4. Eligible ITC
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm">
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">Details</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Integrated Tax</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Central Tax</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">State/UT Tax</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Cess</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.table4.map((r: any, i: number) => (
                                    <tr key={i} className={`h-11 border-b border-white/5 hover:bg-white/10 transition-colors`}>
                                        <td className="px-4 py-2">{r.nature}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.igst > 0 ? `₹${r.igst.toFixed(2)}` : '-'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.cgst > 0 ? `₹${r.cgst.toFixed(2)}` : '-'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.sgst > 0 ? `₹${r.sgst.toFixed(2)}` : '-'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{r.cess > 0 ? `₹${r.cess.toFixed(2)}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
