import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function useDashboardData() {
    return useQuery({
        queryKey: ['dashboard-data'],
        queryFn: async () => {
            // Fetch trial balance to compute KPIs
            const tb = await api.getTrialBalance()

            // Fetch recent 10 vouchers
            const dayBook = await api.getDayBook()
            const recentVouchers = dayBook.slice(0, 10)

            // Calculate KPIs
            let bankBalance = 0
            let cashBalance = 0
            let receivables = 0
            let payables = 0

            tb.forEach(row => {
                const group = row.group_name?.toLowerCase() || ''
                const net = row.closing_balance || 0

                if (group.includes('bank')) {
                    bankBalance += net // Dr is positive, Cr is negative. We want standard net (Dr).
                } else if (group.includes('cash')) {
                    cashBalance += net
                } else if (group.includes('debtor')) {
                    receivables += net
                } else if (group.includes('creditor')) {
                    // Payables are liability (Cr), so net is usually negative. We want positive absolute value.
                    payables += Math.abs(net)
                }
            })

            return {
                summary: {
                    bankAndCash: bankBalance + cashBalance,
                    receivables,
                    payables
                },
                recentVouchers
            }
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
    })
}
