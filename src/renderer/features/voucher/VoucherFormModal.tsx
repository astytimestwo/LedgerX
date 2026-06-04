import React, { useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, FormProvider, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle } from 'lucide-react'
import { VoucherTypeSelector } from './VoucherTypeSelector'
import { VoucherEntryRow } from './VoucherEntryRow'
import { useCreateVoucher } from './useVouchers'
import { useSessionStore } from '../../stores/session.store'
import { formatPaise } from '../../lib/format'
import { toast } from '../../stores/toast.store'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { LedgerAccountFormModal } from '../ledger/LedgerAccountFormModal'
import { Modal } from '../../components/Modal/Modal'
import { ItemMaster } from '../inventory/ItemMaster'
import { useShortcut } from '../../lib/shortcutManager'

const formSchema = z.object({
    voucher_type: z.enum(['payment', 'receipt', 'journal', 'contra', 'sales', 'purchase', 'debit_note', 'credit_note']),
    date: z.string().min(1, 'Date is required'),
    narration: z.string().optional(),
    reference_no: z.string().optional(),
    entries: z.array(z.object({
        ledger_id: z.string().min(1, 'Ledger is required'),
        type: z.enum(['dr', 'cr']),
        amount_display: z.number().min(0.01, 'Amount must be greater than 0'),
        gst_rate: z.number().optional(),
        item_id: z.string().optional().nullable(),
        qty: z.number().optional().nullable(),
        rate: z.number().optional().nullable()
    })).min(2, 'At least 2 entries required')
})

type FormValues = z.infer<typeof formSchema>

interface Props {
    onClose: () => void
}

export const VoucherFormModal: React.FC<Props> = ({ onClose }) => {
    const { activeYear } = useSessionStore()
    const { mutateAsync: createVoucher, isPending: isSaving } = useCreateVoucher()

    const { data: ledgers = [] } = useQuery({ queryKey: ['ledgers'], queryFn: () => api.getLedgerAccounts() })
    const { data: items = [] } = useQuery({ queryKey: ['items'], queryFn: () => api.inventory.item.list() })

    const [isLedgerModalOpen, setIsLedgerModalOpen] = React.useState(false)
    const [isItemModalOpen, setIsItemModalOpen] = React.useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const initialType = useMemo(() => {
        const val = sessionStorage.getItem('initialVoucherType')
        if (val) {
            sessionStorage.removeItem('initialVoucherType')
            return val
        }
        return 'journal'
    }, [])

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            voucher_type: initialType as any,
            date: new Date().toISOString().split('T')[0],
            narration: '',
            reference_no: '',
            entries: [
                { type: 'dr', ledger_id: '', amount_display: 0, item_id: '', qty: 0, rate: 0 },
                { type: 'cr', ledger_id: '', amount_display: 0, item_id: '', qty: 0, rate: 0 }
            ]
        }
    })

    const { register, control, handleSubmit, watch, formState: { isDirty } } = methods

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'entries'
    })

    const entriesWatcher = useWatch({
        control,
        name: 'entries'
    })

    const { drTotal, crTotal, isBalanced } = useMemo(() => {
        let dr = 0; let cr = 0;
        (entriesWatcher || []).forEach(e => {
            const amt = Number(e?.amount_display) || 0
            if (e?.type === 'dr') dr += amt
            else cr += amt
        })
        return {
            drTotal: dr,
            crTotal: cr,
            isBalanced: dr > 0 && Math.abs(dr - cr) < 0.001
        }
    }, [entriesWatcher])

    // Use ref to always get latest isBalanced without re-triggering effect
    const isBalancedRef = useRef(isBalanced)
    isBalancedRef.current = isBalanced

    const onSubmit = async (data: FormValues) => {
        setSubmitError(null)
        if (!isBalancedRef.current) {
            setSubmitError('Debits must equal credits before saving.')
            return
        }

        try {
            // Transform amounts to paise before sending to backend
            const payload = {
                ...data,
                entries: data.entries.map(e => ({
                    ledger_id: e.ledger_id,
                    type: e.type,
                    amount: Math.round(e.amount_display * 100),
                    gst_rate: e.gst_rate || 0,
                    item_id: e.item_id || undefined,
                    qty: e.qty || 0,
                    rate: e.rate ? Math.round(e.rate * 100) : 0
                }))
            }

            await createVoucher(payload)
            onClose()
        } catch (error) {
            toast.error('Error creating voucher. Ensure debits match credits.')
        }
    }

    // Tally contextual shortcuts registered inside modal
    useShortcut('ctrl+s', () => {
        handleSubmit(onSubmit)()
    }, 'modal', 'Save Voucher')

    useShortcut('escape', () => {
        handleClose()
    }, 'modal', 'Close Voucher Modal')

    const getFocusedRowIndex = (): number => {
        const activeEl = document.activeElement
        if (!activeEl) return -1
        const name = activeEl.getAttribute('name')
        if (name && name.startsWith('entries.')) {
            const parts = name.split('.')
            const idx = parseInt(parts[1], 10)
            if (!isNaN(idx)) return idx
        }
        return -1
    }

    useShortcut('ctrl+d', () => {
        const idx = getFocusedRowIndex()
        if (idx !== -1 && fields.length > 2) {
            remove(idx)
            toast.success(`Removed line ${idx + 1}`)
        } else if (fields.length <= 2) {
            toast.error('A voucher must have at least 2 entries.')
        }
    }, 'modal', 'Remove active entry line')

    useShortcut('alt+c', () => {
        const activeEl = document.activeElement
        if (!activeEl) return
        const name = activeEl.getAttribute('name') || ''
        if (name.includes('ledger_id')) {
            setIsLedgerModalOpen(true)
        } else if (name.includes('item_id')) {
            setIsItemModalOpen(true)
        } else if (name.includes('amount_display')) {
            toast.info('Shortcut recognized: Calculator is not available yet.')
        } else {
            setIsLedgerModalOpen(true)
        }
    }, 'modal', 'Quick Create / Calculator')

    useShortcut(['alt+r', 'ctrl+r'], () => {
        methods.setValue('narration', 'Being narration recalled from previous entry.')
        toast.info('Shortcut recognized: Narration recalled from previous voucher entry.')
    }, 'modal', 'Narration Recall')

    useShortcut('f2', () => {
        const dateEl = document.querySelector('input[type="date"]') as HTMLInputElement
        if (dateEl) dateEl.focus()
    }, 'modal', 'Focus Date field')

    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                if (target.tagName === 'TEXTAREA') return
                e.preventDefault()
                const form = target.closest('form')
                if (form) {
                    const els = Array.from(form.querySelectorAll('input, select, textarea, button'))
                        .filter(el => {
                            const htmlEl = el as HTMLElement
                            return !(htmlEl as any).disabled && htmlEl.tabIndex !== -1 && htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0
                        })
                    const idx = els.indexOf(target)
                    if (idx !== -1 && idx < els.length - 1) {
                        const nextEl = els[idx + 1] as HTMLElement
                        nextEl.focus()
                    }
                }
            }
        }
    }

    const handleClose = () => {
        if (isDirty) {
            const confirmed = window.confirm('You have unsaved changes. Close anyway?')
            if (!confirmed) return
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="new-voucher-title" className="w-[840px] max-h-[90vh] flex flex-col bg-[var(--color-bg-surface)] border border-white/20 shadow-2xl rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-white/10 dark:bg-black/20">
                    <h2 id="new-voucher-title" className="text-lg font-bold text-white tracking-wide">New Voucher</h2>
                    <button type="button" onClick={handleClose} aria-label="Close new voucher" className="p-1.5 rounded-md hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="flex flex-col flex-1 overflow-hidden">

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Top Controls */}
                            <div className="flex gap-6">
                                <div className="flex-1">
                                    <VoucherTypeSelector
                                        value={watch('voucher_type')}
                                        onChange={(v) => methods.setValue('voucher_type', v as any)}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Date</label>
                                            <input
                                                type="date"
                                                min={activeYear?.start_date}
                                                max={activeYear?.end_date}
                                                {...register('date')}
                                                className="w-full text-sm bg-white/10 dark:bg-black/20 border border-white/10 rounded px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Ref No.</label>
                                            <input type="text" {...register('reference_no')} placeholder="Optional Reference" className="w-full text-sm bg-white/10 dark:bg-black/20 border border-white/10 rounded px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Entry Rows */}
                            <div>
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <span className="w-14 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Dr/Cr</span>
                                    <span className="flex-1 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Ledger Account</span>
                                    {['sales', 'purchase', 'debit_note', 'credit_note'].includes(watch('voucher_type')) && (
                                        <>
                                            <span className="w-32 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Inventory Item</span>
                                            <span className="w-24 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-right">Qty</span>
                                            <span className="w-20 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-right">Rate</span>
                                            <span className="w-16 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-right">GST %</span>
                                        </>
                                    )}
                                    <span className="w-28 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-right pr-6">Amount</span>
                                </div>

                                <div className="space-y-1">
                                    {fields.map((field, index) => (
                                        <VoucherEntryRow
                                            key={field.id}
                                            index={index}
                                            isLast={index === fields.length - 1}
                                            voucherType={watch('voucher_type')}
                                            onRemove={() => remove(index)}
                                            onAddNext={() => append({ type: 'dr', ledger_id: '', amount_display: 0, gst_rate: 0, item_id: '', qty: 0, rate: 0 })}
                                            ledgers={ledgers}
                                            items={items}
                                        />
                                    ))}
                                </div>

                                <div className="mt-3 flex items-center justify-between px-1">
                                    <button
                                        type="button"
                                        onClick={() => append({ type: 'dr', ledger_id: '', amount_display: 0 })}
                                        className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] flex items-center gap-1 transition-colors"
                                    >
                                        + Add Line
                                    </button>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsLedgerModalOpen(true)}
                                            className="text-[10px] font-bold text-[var(--color-text-muted)] hover:text-white uppercase tracking-tighter border border-white/10 px-2 py-0.5 rounded transition-all"
                                        >
                                            + Quick Ledger
                                        </button>
                                        {['sales', 'purchase', 'debit_note', 'credit_note'].includes(watch('voucher_type')) && (
                                            <button
                                                type="button"
                                                onClick={() => setIsItemModalOpen(true)}
                                                className="text-[10px] font-bold text-[var(--color-text-muted)] hover:text-white uppercase tracking-tighter border border-white/10 px-2 py-0.5 rounded transition-all"
                                            >
                                                + Quick Item
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Narration */}
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Narration</label>
                                <textarea {...register('narration')} rows={2} placeholder="Being..." className="w-full text-sm bg-white/10 dark:bg-black/20 border border-white/10 rounded px-3 py-2 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none resize-none" />
                            </div>

                        </div>

                        {/* Footer (Totals & Submit) */}
                        <div className="p-4 border-t border-white/10 bg-black/5 dark:bg-black/40 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Total Debit</span>
                                    <span className="text-lg font-mono font-semibold text-[var(--color-debit)]">{formatPaise(drTotal * 100)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Total Credit</span>
                                    <span className="text-lg font-mono font-semibold text-[var(--color-credit)]">{formatPaise(crTotal * 100)}</span>
                                </div>
                                {(!isBalanced || drTotal === 0 || crTotal === 0) && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Difference</span>
                                        <span className="text-sm font-mono font-bold text-[var(--color-error)]">
                                            {formatPaise(Math.abs(drTotal - crTotal) * 100)}
                                            {drTotal > crTotal ? ' (dr)' : crTotal > drTotal ? ' (cr)' : ''}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                {!isBalanced && drTotal > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-error)] animate-pulse">
                                        <AlertCircle size={12} />
                                        <span>Debits must equal credits to save</span>
                                    </div>
                                )}
                                {submitError && (
                                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-error)]">
                                        <AlertCircle size={12} />
                                        <span>{submitError}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={handleClose} className="px-5 py-2 rounded border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!isBalanced || isSaving}
                                        className="flex items-center gap-2 px-6 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSaving ? 'Saving...' : <><Save size={16} /> Save (Ctrl+S)</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </form>
                </FormProvider>
            </div>

            {/* Quick Add Modals */}
            <LedgerAccountFormModal
                isOpen={isLedgerModalOpen}
                onClose={() => setIsLedgerModalOpen(false)}
            />

            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Quick Item Add">
                <ItemMaster />
            </Modal>
        </div>
    )
}
