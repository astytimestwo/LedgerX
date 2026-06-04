import React from 'react'
import { useToastStore } from '../../stores/toast.store'
import { X, CheckCircle2, XCircle, Info } from 'lucide-react'

const variantConfig = {
    success: {
        icon: CheckCircle2,
        bg: 'bg-green-500/90 dark:bg-green-600/90',
        border: 'border-green-400/30',
        text: 'text-green-50'
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-500/90 dark:bg-red-600/90',
        border: 'border-red-400/30',
        text: 'text-red-50'
    },
    info: {
        icon: Info,
        bg: 'bg-blue-500/90 dark:bg-blue-600/90',
        border: 'border-blue-400/30',
        text: 'text-blue-50'
    }
}

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore()

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => {
                const config = variantConfig[t.variant]
                const Icon = config.icon
                return (
                    <div
                        key={t.id}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-xl
                            min-w-[280px] max-w-[380px] pointer-events-auto
                            ${config.bg} ${config.border}
                            animate-in slide-in-from-right fade-in duration-300
                        `}
                    >
                        <Icon size={18} className={config.text} />
                        <span className={`flex-1 text-sm font-medium ${config.text}`}>
                            {t.message}
                        </span>
                        <button
                            onClick={() => removeToast(t.id)}
                            className={`p-0.5 rounded hover:bg-white/20 ${config.text} opacity-70 hover:opacity-100 transition-opacity`}
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}