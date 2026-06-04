import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { useShortcut } from '../../lib/shortcutManager'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const titleId = React.useId()
    useShortcut('escape', onClose, 'modal', `Close Modal: ${title}`, { disabled: !isOpen })

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            window.setTimeout(() => {
                const active = document.activeElement
                if (active?.closest('[role="dialog"]')) return

                const firstFocusable = document.querySelector<HTMLElement>(
                    '[role="dialog"] input:not([disabled]), [role="dialog"] select:not([disabled]), [role="dialog"] textarea:not([disabled]), [role="dialog"] button:not([disabled])'
                )
                firstFocusable?.focus()
            }, 0)
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative bg-[var(--color-bg-surface)] backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-xl m-4 flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <h2 id={titleId} className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={`Close ${title}`}
                        className="p-1 rounded hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}
