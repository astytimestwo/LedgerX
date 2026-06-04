import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastMessage {
    id: string
    message: string
    variant: ToastVariant
}

interface ToastState {
    toasts: ToastMessage[]
    addToast: (msg: string, variant: ToastVariant) => void
    removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, variant) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
        set((state) => ({
            toasts: [...state.toasts, { id, message, variant }]
        }))
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }))
        }, 4000)
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }))
}))

// Convenience object matching the requested API
export const toast = {
    success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
    error: (msg: string) => useToastStore.getState().addToast(msg, 'error'),
    info: (msg: string) => useToastStore.getState().addToast(msg, 'info')
}