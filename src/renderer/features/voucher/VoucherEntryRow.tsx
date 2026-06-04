import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { X } from 'lucide-react'

interface Props {
    index: number
    onRemove: () => void
    isLast: boolean
    voucherType: string
    onAddNext: () => void
    ledgers: any[]
    items: any[]
    error?: any
}

export const VoucherEntryRow: React.FC<Props> = ({ index, onRemove, isLast, voucherType, onAddNext, ledgers, items }) => {
    const { register, watch, setValue, formState: { errors } } = useFormContext()
    const entryErrors = Array.isArray(errors.entries) ? errors.entries[index] as any : undefined

    const typeValue = watch(`entries.${index}.type`)

    const [gstAutoFilled, setGstAutoFilled] = useState(false)

    const handleAmountKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && !e.shiftKey && isLast) {
            e.preventDefault()
            onAddNext()
        }
    }

    const isInventoryApplicable = ['sales', 'purchase', 'credit_note', 'debit_note'].includes(voucherType)

    const qty = watch(`entries.${index}.qty`)
    const rate = watch(`entries.${index}.rate`)

    useEffect(() => {
        if (isInventoryApplicable && qty !== undefined && rate !== undefined) {
            const calculatedAmount = Number((qty * rate).toFixed(2))
            if (!isNaN(calculatedAmount) && calculatedAmount > 0) {
                setValue(`entries.${index}.amount_display`, calculatedAmount, { shouldValidate: true, shouldDirty: true })
            }
        }
    }, [qty, rate, isInventoryApplicable, index, setValue])

    const itemId = watch(`entries.${index}.item_id`)

    useEffect(() => {
        if (itemId) {
            const selectedItem = items.find(i => i.id === itemId)
            if (selectedItem) {
                setGstAutoFilled(true)
                setValue(`entries.${index}.gst_rate`, selectedItem.default_gst_rate || 0, { shouldValidate: true })
            }
        } else {
            setGstAutoFilled(false)
        }
    }, [itemId, items, index, setValue])

    return (
        <div className="flex items-center gap-2 mb-2 px-1 group">
            <div className="w-16">
                <select
                    {...register(`entries.${index}.type`)}
                    aria-label={`Debit or credit for line ${index + 1}`}
                    className="w-full text-xs font-semibold uppercase bg-white/10 dark:bg-black/20 border border-white/10 rounded px-2 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                    style={{ color: typeValue === 'dr' ? 'var(--color-debit)' : 'var(--color-credit)' }}
                >
                    <option value="dr">Dr</option>
                    <option value="cr">Cr</option>
                </select>
            </div>

            <div className="flex-1 min-w-[120px]">
                <select
                    {...register(`entries.${index}.ledger_id`)}
                    aria-label={`Ledger account for line ${index + 1}`}
                    className="w-full text-sm bg-white/10 dark:bg-black/20 border border-white/10 rounded px-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                >
                    <option value="">-- Ledger --</option>
                    {ledgers.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            {isInventoryApplicable && (
                <>
                    <div className="w-32">
                        <select
                            {...register(`entries.${index}.item_id`)}
                            aria-label={`Inventory item for line ${index + 1}`}
                            className="w-full text-sm bg-white/10 dark:bg-black/20 border border-white/10 rounded px-2 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                        >
                            <option value="">-- Item --</option>
                            {items.map((i: any) => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-24 relative">
                        <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`entries.${index}.qty`, {
                                setValueAs: v => v === '' ? null : parseInt(v, 10)
                            })}
                            aria-label={`Quantity for line ${index + 1}`}
                            className="w-full text-sm text-right bg-white/10 dark:bg-black/20 border border-white/10 rounded pr-8 pl-2 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                            placeholder="Qty"
                        />
                        {itemId && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-[9px] font-bold tracking-tighter uppercase pointer-events-none">
                                {items.find(i => i.id === itemId)?.unit_of_measure?.substring(0, 3)}
                            </span>
                        )}
                    </div>

                    <div className="w-20">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register(`entries.${index}.rate`, {
                                setValueAs: v => v === '' ? null : parseFloat(v)
                            })}
                            aria-label={`Rate for line ${index + 1}`}
                            className="w-full text-sm text-right bg-white/10 dark:bg-black/20 border border-white/10 rounded px-2 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none"
                            placeholder="Rate"
                        />
                    </div>

                    <div className="w-16 relative">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            {...register(`entries.${index}.gst_rate`, {
                                setValueAs: v => v === '' ? 0 : parseInt(v, 10)
                            })}
                            aria-label={`GST rate for line ${index + 1}`}
                            className={`w-full text-sm text-right bg-white/10 dark:bg-black/20 border border-white/10 rounded px-2 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none ${gstAutoFilled ? 'border-[var(--color-accent)] border-opacity-50' : ''}`}
                            placeholder="0"
                            title={gstAutoFilled ? 'Auto-filled from item' : ''}
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-bold">%</span>
                        {gstAutoFilled && (
                            <span className="absolute -top-3 right-0 text-[8px] text-[var(--color-accent)] font-bold">AUTO</span>
                        )}
                    </div>
                </>
            )}

            <div className="w-28 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`entries.${index}.amount_display`, {
                        setValueAs: v => v === '' ? 0 : parseFloat(v)
                    })}
                    aria-label={`Amount for line ${index + 1}`}
                    onKeyDown={handleAmountKeyDown}
                    className="w-full text-sm text-right bg-white/10 dark:bg-black/20 border border-white/10 rounded pl-7 pr-3 py-1.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white outline-none font-mono"
                    placeholder="0.00"
                />
            </div>

            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove voucher line ${index + 1}`}
                className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-[var(--color-error)] transition-colors focus:opacity-100 group-hover:opacity-100 opacity-100"
                tabIndex={0}
            >
                <X size={16} />
            </button>

            {(entryErrors?.ledger_id || entryErrors?.amount_display) && (
                <div className="text-[10px] text-[var(--color-error)] mt-0.5 px-1 pl-20">
                    {entryErrors.ledger_id && <span>{entryErrors.ledger_id.message}</span>}
                    {entryErrors.amount_display && <span> {entryErrors.amount_display.message}</span>}
                </div>
            )}
        </div>
    )
}
