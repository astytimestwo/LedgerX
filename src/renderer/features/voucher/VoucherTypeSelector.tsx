import React from 'react'
import { FileText, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ShoppingCart, Archive, FileMinus, FilePlus } from 'lucide-react'

export const VOUCHER_TYPES = [
    { id: 'payment', label: 'Payment (F5)', icon: <ArrowUpRight size={14} />, color: 'var(--color-warning)' },
    { id: 'receipt', label: 'Receipt (F6)', icon: <ArrowDownLeft size={14} />, color: 'var(--color-success)' },
    { id: 'journal', label: 'Journal (F7)', icon: <FileText size={14} />, color: 'var(--color-accent)' },
    { id: 'contra', label: 'Contra (F4)', icon: <ArrowLeftRight size={14} />, color: 'var(--color-text-secondary)' },
    { id: 'sales', label: 'Sales (F8)', icon: <ShoppingCart size={14} />, color: 'var(--color-success)' },
    { id: 'purchase', label: 'Purchase (F9)', icon: <Archive size={14} />, color: 'var(--color-warning)' },
    { id: 'debit_note', label: 'Debit Note', icon: <FileMinus size={14} />, color: 'var(--color-error)' },
    { id: 'credit_note', label: 'Credit Note', icon: <FilePlus size={14} />, color: 'var(--color-success)' }
]

interface Props {
    value: string
    onChange: (type: string) => void
}

export const VoucherTypeSelector: React.FC<Props> = ({ value, onChange }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {VOUCHER_TYPES.map(t => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => onChange(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${value === t.id
                            ? 'bg-white/20 text-white border-white/40 shadow-sm backdrop-blur-md'
                            : 'bg-white/5 text-[var(--color-text-muted)] border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <span style={{ color: value === t.id ? 'white' : t.color }}>{t.icon}</span>
                    {t.label}
                </button>
            ))}
        </div>
    )
}
