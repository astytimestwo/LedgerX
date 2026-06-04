import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function useTrialBalance(dateTo?: string) {
    return useQuery({
        queryKey: ['trial-balance', { dateTo }],
        queryFn: () => api.getTrialBalance(dateTo)
    })
}

export function useLedgerStatement(ledgerId: string, dateFrom?: string, dateTo?: string) {
    return useQuery({
        queryKey: ['ledger-statement', { ledgerId, dateFrom, dateTo }],
        queryFn: () => api.getLedgerStatement(ledgerId, dateFrom, dateTo),
        enabled: !!ledgerId
    })
}

export function useProfitAndLoss(dateFrom?: string, dateTo?: string) {
    return useQuery({
        queryKey: ['profit-and-loss', { dateFrom, dateTo }],
        queryFn: () => api.getProfitAndLoss(dateFrom, dateTo)
    })
}

export function useBalanceSheet(dateTo?: string) {
    return useQuery({
        queryKey: ['balance-sheet', { dateTo }],
        queryFn: () => api.getBalanceSheet(dateTo)
    })
}
