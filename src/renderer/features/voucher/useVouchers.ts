import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { CreateVoucherInput, UpdateVoucherInput } from '../../../shared/types'

export function useVouchers(filters?: { type?: string, dateFrom?: string, dateTo?: string }) {
    return useQuery({
        queryKey: ['vouchers', filters],
        queryFn: () => api.getDayBook(filters)
    })
}

export function useCreateVoucher() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateVoucherInput) => api.createVoucher(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        }
    })
}

export function useUpdateVoucher() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateVoucherInput) => api.updateVoucher(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        }
    })
}

export function useDeleteVoucher() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => api.deleteVoucher(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        }
    })
}
