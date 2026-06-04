import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Modal } from '../../components/Modal/Modal'
import { Button } from '../../components/Button/Button'
import { Input } from '../../components/Input/Input'
import { api } from '../../lib/api'
import { createLedgerGroupSchema, CreateLedgerGroupInput, UpdateLedgerGroupInput } from '../../../shared/types'

interface LedgerGroupFormModalProps {
    isOpen: boolean
    onClose: () => void
    editData?: UpdateLedgerGroupInput
}

export const LedgerGroupFormModal: React.FC<LedgerGroupFormModalProps> = ({ isOpen, onClose, editData }) => {
    const queryClient = useQueryClient()
    const natureId = React.useId()
    const parentId = React.useId()

    // Fetch existing groups for the parent_id dropdown
    const { data: groups = [] } = useQuery({
        queryKey: ['ledger-groups'],
        queryFn: () => api.getLedgerGroups()
    })

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateLedgerGroupInput>({
        resolver: zodResolver(createLedgerGroupSchema),
        mode: 'onChange'
    })

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                reset({
                    name: editData.name,
                    nature: editData.nature,
                    parent_id: editData.parent_id
                })
            } else {
                reset({ name: '', nature: 'Assets', parent_id: null })
            }
        }
    }, [isOpen, editData, reset])

    const createMutation = useMutation({
        mutationFn: (data: CreateLedgerGroupInput) => api.createLedgerGroup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-groups'] })
            onClose()
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: UpdateLedgerGroupInput) => api.updateLedgerGroup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-groups'] })
            onClose()
        }
    })

    const onSubmit = (data: CreateLedgerGroupInput) => {
        if (editData) {
            updateMutation.mutate({ ...data, id: editData.id })
        } else {
            createMutation.mutate(data)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending
    const error = createMutation.error || updateMutation.error

    const availableParents = groups.filter(g => g.id !== editData?.id) // Prevent self-referencing

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? 'Edit Ledger Group' : 'New Ledger Group'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-2">
                <Input
                    label="Group Name *"
                    {...register('name')}
                    error={errors.name?.message}
                    disabled={isLoading}
                    autoFocus
                />

                <div className="flex flex-col gap-3">
                    <label htmlFor={natureId} className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
                        Nature *
                    </label>
                    <select
                        id={natureId}
                        {...register('nature')}
                        aria-invalid={!!errors.nature}
                        disabled={isLoading}
                        className="flex h-10 w-full rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3 py-2 text-sm text-[var(--color-text-primary)] backdrop-blur-md transition-all focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-white/20 dark:focus-visible:bg-black/5 dark:bg-black/40"
                    >
                        <option value="Assets" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Assets</option>
                        <option value="Liabilities" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Liabilities</option>
                        <option value="Income" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Income</option>
                        <option value="Expense" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Expense</option>
                    </select>
                    {errors.nature && (
                        <p role="alert" className="text-sm text-[var(--color-error)] mt-1">{errors.nature.message}</p>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <label htmlFor={parentId} className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
                        Under Group
                    </label>
                    <select
                        id={parentId}
                        {...register('parent_id', { setValueAs: value => value === '' ? null : value })}
                        disabled={isLoading}
                        className="flex h-10 w-full rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3 py-2 text-sm text-[var(--color-text-primary)] backdrop-blur-md transition-all focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-white/20 dark:focus-visible:bg-black/5 dark:bg-black/40"
                    >
                        <option value="" className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">Primary</option>
                        {availableParents.map(g => (
                            <option key={g.id} value={g.id} className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">{g.name}</option>
                        ))}
                    </select>
                </div>

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
                        {isLoading ? 'Saving...' : 'Save Group'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
