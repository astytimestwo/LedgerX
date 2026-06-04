import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardData } from './useDashboard'
import { WalletCards, Users, CreditCard, Receipt, ArrowRight } from 'lucide-react'

export const Dashboard: React.FC = () => {
    const { t } = useTranslation()
    const { data, isLoading, isError } = useDashboardData()

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="p-6 text-[var(--color-error)] bg-[var(--color-error)]/10 rounded-lg">
                Failed to load dashboard data. Please try again.
            </div>
        )
    }

    const formatCurrency = (amount: number, compact = false) => {
        if (compact && Math.abs(amount) >= 100000) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(amount / 100)
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount / 100)
    }

    const getBalanceColor = (amount: number) => {
        if (amount > 0) return 'text-teal-400'
        if (amount < 0) return 'text-red-400'
        return 'text-[var(--color-text-primary)]'
    }

    const getFlowColor = (voucherType: string) => {
        const inflowTypes = ['RECEIPT', 'Contra', 'JOURNAL']
        const outflowTypes = ['PAYMENT']
        if (inflowTypes.includes(voucherType)) return 'text-teal-400'
        if (outflowTypes.includes(voucherType)) return 'text-red-400'
        return 'text-[var(--color-text-primary)]'
    }

    const handleKpiClick = (type: string) => {
        console.log(`Drill down to ${type}`)
    }

    const handleVoucherClick = (voucherId: string) => {
        console.log(`View voucher ${voucherId}`)
    }

    return (
        <div className="p-4 h-full flex flex-col gap-6 overflow-auto">
            <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('dashboard.title')}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{t('dashboard.subtitle')}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    className="bg-white/5 dark:bg-black/20 p-6 rounded-xl border border-white/10 shadow-lg backdrop-blur-md relative overflow-hidden group cursor-pointer hover:border-[var(--color-accent)]/50 transition-all"
                    onClick={() => handleKpiClick('bankAndCash')}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <WalletCards size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--color-accent)]/20 rounded-lg text-[var(--color-accent)]">
                            <WalletCards size={20} />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t('dashboard.bankAndCash')}</h3>
                    </div>
                    <div className={`text-3xl font-bold ml-1 ${getBalanceColor(data.summary.bankAndCash)}`}>
                        {formatCurrency(data.summary.bankAndCash, true)}
                    </div>
                    <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-accent)] text-xs font-medium flex items-center gap-1">
                        View <ArrowRight size={12} />
                    </div>
                </div>

                <div
                    className="bg-white/5 dark:bg-black/20 p-6 rounded-xl border border-white/10 shadow-lg backdrop-blur-md relative overflow-hidden group cursor-pointer hover:border-[var(--color-success)]/50 transition-all"
                    onClick={() => handleKpiClick('receivables')}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-[var(--color-success)]">
                        <Users size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--color-success)]/20 rounded-lg text-[var(--color-success)]">
                            <Users size={20} />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t('dashboard.receivables')}</h3>
                    </div>
                    <div className={`text-3xl font-bold ml-1 ${getBalanceColor(data.summary.receivables)}`}>
                        {formatCurrency(data.summary.receivables, true)}
                    </div>
                    <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-success)] text-xs font-medium flex items-center gap-1">
                        View <ArrowRight size={12} />
                    </div>
                </div>

                <div
                    className="bg-white/5 dark:bg-black/20 p-6 rounded-xl border border-white/10 shadow-lg backdrop-blur-md relative overflow-hidden group cursor-pointer hover:border-[var(--color-error)]/50 transition-all"
                    onClick={() => handleKpiClick('payables')}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-[var(--color-error)]">
                        <CreditCard size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--color-error)]/20 rounded-lg text-[var(--color-error)]">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t('dashboard.payables')}</h3>
                    </div>
                    <div className={`text-3xl font-bold ml-1 ${getBalanceColor(data.summary.payables)}`}>
                        {formatCurrency(data.summary.payables, true)}
                    </div>
                    <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-error)] text-xs font-medium flex items-center gap-1">
                        View <ArrowRight size={12} />
                    </div>
                </div>
            </div>

            {/* Recent Vouchers */}
            <div className="bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 shadow-lg backdrop-blur-md flex-1 flex flex-col min-h-[300px]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Receipt className="text-[var(--color-accent)]" size={18} />
                        <h3 className="font-bold text-[var(--color-text-primary)]">{t('dashboard.recentActivity')}</h3>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-white/10 dark:bg-black/20 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">{t('dashboard.date')}</th>
                                <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">{t('dashboard.voucherNo')}</th>
                                <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">{t('dashboard.type')}</th>
                                <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)] text-right">{t('dashboard.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentVouchers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">{t('dashboard.noRecentVouchers')}</td>
                                </tr>
                            ) : (
                                data.recentVouchers.map((v: any) => (
                                    <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleVoucherClick(v.id)}>
                                        <td className="px-4 py-3 text-[var(--color-text-primary)]">{new Date(v.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-[var(--color-accent)]">{v.voucher_no}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-[var(--color-text-secondary)]">
                                                {v.voucher_type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold">
                                            <span className={getFlowColor(v.voucher_type)}>
                                                {formatCurrency(v.total_amount || 0)}
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 ml-2 text-[10px] text-[var(--color-accent)] font-normal">
                                                <ArrowRight size={10} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
