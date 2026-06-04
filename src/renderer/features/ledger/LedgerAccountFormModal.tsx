import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Modal } from '../../components/Modal/Modal'
import { Button } from '../../components/Button/Button'
import { Input } from '../../components/Input/Input'
import { api } from '../../lib/api'
import { createLedgerAccountSchema, CreateLedgerAccountInput, UpdateLedgerAccountInput } from '../../../shared/types'

interface LedgerAccountFormModalProps {
    isOpen: boolean
    onClose: () => void
    editData?: UpdateLedgerAccountInput
}

export const LedgerAccountFormModal: React.FC<LedgerAccountFormModalProps> = ({ isOpen, onClose, editData }) => {
    const queryClient = useQueryClient()

    // Fetch groups for the group_id dropdown
    const { data: groups = [] } = useQuery({
        queryKey: ['ledger-groups'],
        queryFn: () => api.getLedgerGroups()
    })

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CreateLedgerAccountInput>({
        resolver: zodResolver(createLedgerAccountSchema)
    })

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                reset({
                    code: editData.code,
                    name: editData.name,
                    group_id: editData.group_id,
                    opening_balance: editData.opening_balance, // in paise
                    opening_type: editData.opening_type,
                    gst_applicable: editData.gst_applicable,
                    gstin: editData.gstin || ''
                })
            } else {
                reset({
                    code: '',
                    name: '',
                    group_id: '',
                    opening_balance: 0,
                    opening_type: 'dr',
                    gst_applicable: false,
                    gstin: '',
                    gst_treatment: 'regular',
                    state_code: '',
                    hsn_code: ''
                })
            }
        }
    }, [isOpen, editData, reset])

    const createMutation = useMutation({
        mutationFn: (data: CreateLedgerAccountInput) => api.createLedgerAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] })
            onClose()
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: UpdateLedgerAccountInput) => api.updateLedgerAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] })
            onClose()
        }
    })

    const onSubmit = (data: CreateLedgerAccountInput) => {
        // Convert input value (rupees if handled in UI) properly. Since schema expects int (paise),
        // let's ensure it's cast correctly. We'll assume the Input field for number returns strings
        // or floats so we cast cleanly here.
        const submittedData = {
            ...data,
            opening_balance: Math.round(Number(data.opening_balance)),
            gstin: data.gstin || undefined
        }

        if (editData) {
            updateMutation.mutate({ ...submittedData, id: editData.id })
        } else {
            createMutation.mutate(submittedData)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending
    const error = createMutation.error || updateMutation.error

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? 'Edit Ledger Account' : 'New Ledger Account'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-2">
                <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-1">
                        <Input
                            label="Account Code *"
                            {...register('code')}
                            error={errors.code?.message}
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>
                    <div className="col-span-2">
                        <Input
                            label="Account Name *"
                            {...register('name')}
                            error={errors.name?.message}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
                        Under Group *
                    </label>
                    <select
                        {...register('group_id')}
                        disabled={isLoading}
                        className="flex h-10 w-full rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3 py-2 text-sm text-[var(--color-text-primary)] backdrop-blur-md transition-all focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-white/20 dark:focus-visible:bg-black/5 dark:bg-black/40"
                    >
                        <option value="" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Select Group...</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id} className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">{g.name}</option>
                        ))}
                    </select>
                    {errors.group_id && (
                        <p className="text-sm text-[var(--color-error)] mt-1">{errors.group_id.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <Input
                        label="Opening Balance (₹) *"
                        type="number"
                        step="0.01"
                        {...register('opening_balance', { valueAsNumber: true })}
                        error={errors.opening_balance?.message}
                        disabled={isLoading}
                    />
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
                            Dr / Cr *
                        </label>
                        <select
                            {...register('opening_type')}
                            disabled={isLoading}
                            className="flex h-10 w-full rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3 py-2 text-sm text-[var(--color-text-primary)] backdrop-blur-md transition-all focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-white/20 dark:focus-visible:bg-black/5 dark:bg-black/40"
                        >
                            <option value="dr" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Debit (Dr)</option>
                            <option value="cr" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Credit (Cr)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="gst_applicable"
                        {...register('gst_applicable')}
                        className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                        disabled={isLoading}
                    />
                    <label htmlFor="gst_applicable" className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide cursor-pointer h-10 flex items-center">
                        GST Applicable
                    </label>
                </div>

                <Controller
                    control={control}
                    name="gst_applicable"
                    render={({ field: { value } }) => (
                        value ? (
                            <div className="grid grid-cols-2 gap-5 bg-black/10 p-4 rounded-lg border border-white/5">
                                <Input
                                    label="GSTIN"
                                    {...register('gstin')}
                                    error={errors.gstin?.message}
                                    disabled={isLoading}
                                    placeholder="22AAAAA0000A1Z5"
                                />
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
                                        GST Treatment
                                    </label>
                                    <select
                                        {...register('gst_treatment')}
                                        disabled={isLoading}
                                        className="flex h-10 w-full rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3 py-2 text-sm text-[var(--color-text-primary)] backdrop-blur-md transition-all focus-visible:outline-none focus-visible:border-[var(--color-accent)]"
                                    >
                                        <option value="regular" className="bg-black">Regular</option>
                                        <option value="composition" className="bg-black">Composition</option>
                                        <option value="unregistered" className="bg-black">Unregistered</option>
                                        <option value="consumer" className="bg-black">Consumer</option>
                                        <option value="overseas" className="bg-black">Overseas</option>
                                    </select>
                                </div>
                                <Input
                                    label="State Code (e.g. 29)"
                                    {...register('state_code')}
                                    error={errors.state_code?.message}
                                    disabled={isLoading}
                                    placeholder="29"
                                />
                                <Input
                                    label="Default HSN/SAC (Optional)"
                                    {...register('hsn_code')}
                                    error={errors.hsn_code?.message}
                                    disabled={isLoading}
                                    placeholder="9983"
                                />
                            </div>
                        ) : <div />
                    )}
                />

                {error && (
                    <div className="p-3 text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 rounded">
                        {error.message}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Account'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
