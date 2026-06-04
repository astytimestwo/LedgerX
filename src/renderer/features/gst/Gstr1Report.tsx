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

export const Gstr1Report: React.FC = () => {
    // Default to current month
    const currentDate = new Date()
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]

    const [period, setPeriod] = useState({ from: firstDay, to: lastDay })

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['gstr1', period],
        queryFn: () => api.gst.reports.gstr1(period)
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
                { text: 'GSTR-1 Report (Outward Supplies)', style: 'header' },
                { text: `Period: ${period.from} to ${period.to}`, margin: [0, 0, 0, 10] },
                { text: 'B2B Invoices', style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['Voucher #', 'Date', 'GSTIN', 'State', 'Taxable Val', 'CGST', 'SGST', 'IGST', 'Total Tax'],
                            ...report.b2b.map((r: any) => [
                                r.voucher_no, r.date, r.gstin, r.state_code,
                                r.taxable_value.toFixed(2),
                                r.cgst > 0 ? r.cgst.toFixed(2) : '-',
                                r.sgst > 0 ? r.sgst.toFixed(2) : '-',
                                r.igst > 0 ? r.igst.toFixed(2) : '-',
                                (r.cgst + r.sgst + r.igst + r.cess).toFixed(2)
                            ])
                        ]
                    },
                    margin: [0, 0, 0, 15]
                },
                { text: 'B2CS Invoices', style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['Voucher #', 'Date', 'State Code', 'Taxable Val', 'CGST', 'SGST', 'IGST', 'Total Tax'],
                            ...report.b2cs.map((r: any) => [
                                r.voucher_no, r.date, r.state_code || 'Unregistered',
                                r.taxable_value.toFixed(2),
                                r.cgst > 0 ? r.cgst.toFixed(2) : '-',
                                r.sgst > 0 ? r.sgst.toFixed(2) : '-',
                                r.igst > 0 ? r.igst.toFixed(2) : '-',
                                (r.cgst + r.sgst + r.igst + r.cess).toFixed(2)
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
        pdfMake.createPdf(docDefinition).download(`GSTR-1_${period.from}_${period.to}.pdf`);
    }

    const exportExcel = async () => {
        if (!report) return;

        const workbook = new ExcelJS.Workbook();

        // B2B Sheet
        const b2bSheet = workbook.addWorksheet('B2B');
        b2bSheet.columns = [
            { header: 'Voucher #', key: 'voucher', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Party GSTIN', key: 'gstin', width: 20 },
            { header: 'State Code', key: 'state', width: 15 },
            { header: 'Taxable Val', key: 'taxable', width: 15 },
            { header: 'CGST', key: 'cgst', width: 15 },
            { header: 'SGST', key: 'sgst', width: 15 },
            { header: 'IGST', key: 'igst', width: 15 },
            { header: 'Total Tax', key: 'total', width: 15 },
        ];

        report.b2b.forEach((r: any) => {
            b2bSheet.addRow({
                voucher: r.voucher_no,
                date: r.date,
                gstin: r.gstin,
                state: r.state_code,
                taxable: r.taxable_value,
                cgst: r.cgst,
                sgst: r.sgst,
                igst: r.igst,
                total: r.cgst + r.sgst + r.igst + r.cess
            });
        });

        // B2CS Sheet
        const b2cSheet = workbook.addWorksheet('B2CS');
        b2cSheet.columns = [
            { header: 'Voucher #', key: 'voucher', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'State Code', key: 'state', width: 20 },
            { header: 'Taxable Val', key: 'taxable', width: 15 },
            { header: 'CGST', key: 'cgst', width: 15 },
            { header: 'SGST', key: 'sgst', width: 15 },
            { header: 'IGST', key: 'igst', width: 15 },
            { header: 'Total Tax', key: 'total', width: 15 },
        ];

        report.b2cs.forEach((r: any) => {
            b2cSheet.addRow({
                voucher: r.voucher_no,
                date: r.date,
                state: r.state_code || 'Unregistered',
                taxable: r.taxable_value,
                cgst: r.cgst,
                sgst: r.sgst,
                igst: r.igst,
                total: r.cgst + r.sgst + r.igst + r.cess
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR-1_${period.from}_${period.to}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 h-full flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">GSTR-1 (Outward Supplies)</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">View and export your monthly outward supply return.</p>
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
                    <button type="button" onClick={exportPdf} className="h-9 flex items-center gap-2 px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium ml-2 border border-red-500/20">
                        <FileText size={16} /> PDF
                    </button>
                    <button type="button" onClick={exportExcel} className="h-9 flex items-center gap-2 px-3 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors text-sm font-medium border border-green-500/20">
                        <Download size={16} /> Excel
                    </button>
                </form>
            </div>

            {isLoading && <div className="text-[var(--color-text-muted)] animate-pulse">Generating Report...</div>}
            {error && <div className="text-[var(--color-error)] bg-[var(--color-error)]/10 p-4 rounded-lg">Failed to load report.</div>}

            {report && (
                <div className="flex-1 overflow-auto flex flex-col gap-6">
                    {/* B2B Table */}
                    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/10 font-semibold tracking-wide text-[var(--color-text-primary)]">
                            B2B Invoices (Registered)
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm">
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">Voucher #</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">Date</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">Party GSTIN</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">State Code</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Taxable Val</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">CGST</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">SGST</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">IGST</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Total Tax</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.b2b.length === 0 ? (
                                    <tr><td colSpan={9} className="px-4 py-8 text-center text-white/40">No B2B inward supplies for this period.</td></tr>
                                ) : (
                                    report.b2b.map((r: any, i: number) => (
                                        <tr key={i} className={`h-10 border-b border-white/5 hover:bg-white/10 transition-colors`}>
                                            <td className="px-4">{r.voucher_no}</td>
                                            <td className="px-4">{r.date}</td>
                                            <td className="px-4">{r.gstin}</td>
                                            <td className="px-4">{r.state_code}</td>
                                            <td className="px-4 text-right">₹{r.taxable_value.toFixed(2)}</td>
                                            <td className="px-4 text-right">{r.cgst > 0 ? `₹${r.cgst.toFixed(2)}` : '-'}</td>
                                            <td className="px-4 text-right">{r.sgst > 0 ? `₹${r.sgst.toFixed(2)}` : '-'}</td>
                                            <td className="px-4 text-right">{r.igst > 0 ? `₹${r.igst.toFixed(2)}` : '-'}</td>
                                            <td className="px-4 text-right font-semibold text-[var(--color-text-primary)]">
                                                ₹{(r.cgst + r.sgst + r.igst + r.cess).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* B2CS Table */}
                    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl overflow-hidden mb-8">
                        <div className="p-4 bg-white/5 border-b border-white/10 font-semibold tracking-wide text-[var(--color-text-primary)]">
                            B2CS Invoices (Unregistered - Small)
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm">
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">Voucher #</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">Date</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)]">State Code</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Taxable Val</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">CGST</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">SGST</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">IGST</th>
                                    <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Total Tax</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.b2cs.length === 0 ? (
                                    <tr><td colSpan={8} className="px-4 py-8 text-center text-white/40">No B2CS inward supplies for this period.</td></tr>
                                ) : (
                                    report.b2cs.map((r: any, i: number) => (
                                        <tr key={i} className={`h-10 border-b border-white/5 hover:bg-white/10 transition-colors`}>
                                            <td className="px-4">{r.voucher_no}</td>
                                            <td className="px-4">{r.date}</td>
                                            <td className="px-4">{r.state_code || 'Unregistered State'}</td>
                                            <td className="px-4 text-right">₹{r.taxable_value.toFixed(2)}</td>
                                            <td className="px-4 text-right">{r.cgst > 0 ? `₹${r.cgst.toFixed(2)}` : '-'}</td>
                                            <td className="px-4 text-right">{r.sgst > 0 ? `₹${r.sgst.toFixed(2)}` : '-'}</td>
                                            <td className="px-4 text-right">{r.igst > 0 ? `₹${r.igst.toFixed(2)}` : '-'}</td>
                                            <td className="px-4 text-right font-semibold text-[var(--color-text-primary)]">
                                                ₹{(r.cgst + r.sgst + r.igst + r.cess).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
