import { create } from 'zustand'

interface UIState {
    sidebarExpanded: boolean
    theme: 'light' | 'dark'
    isVoucherModalOpen: boolean
    showShortcutHelp: boolean
    showSearch: boolean
    isLedgerModalOpen: boolean
    isItemModalOpen: boolean
    currentView: string
    viewHistory: string[]
    showCommandPalette: 'goto' | 'switchto' | null
    toggleSidebar: () => void
    setTheme: (theme: 'light' | 'dark') => void
    setVoucherModalOpen: (isOpen: boolean) => void
    setShowShortcutHelp: (show: boolean) => void
    setShowSearch: (show: boolean) => void
    setLedgerModalOpen: (isOpen: boolean) => void
    setItemModalOpen: (isOpen: boolean) => void
    setCurrentView: (view: string) => void
    pushView: (view: string) => void
    popView: () => void
    clearHistory: () => void
    setShowCommandPalette: (mode: 'goto' | 'switchto' | null) => void
}

export const useUIStore = create<UIState>((set) => ({
    sidebarExpanded: true,
    theme: 'light',
    isVoucherModalOpen: false,
    showShortcutHelp: false,
    showSearch: false,
    isLedgerModalOpen: false,
    isItemModalOpen: false,
    currentView: 'daybook',
    viewHistory: [],
    showCommandPalette: null,
    toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
    setTheme: (theme) => set({ theme }),
    setVoucherModalOpen: (isOpen) => set({ isVoucherModalOpen: isOpen }),
    setShowShortcutHelp: (show) => set({ showShortcutHelp: show }),
    setShowSearch: (show) => set({ showSearch: show }),
    setLedgerModalOpen: (isOpen) => set({ isLedgerModalOpen: isOpen }),
    setItemModalOpen: (isOpen) => set({ isItemModalOpen: isOpen }),
    setCurrentView: (view) => set({ currentView: view }),
    pushView: (view) => set((state) => ({ viewHistory: [...state.viewHistory, view] })),
    popView: () => set((state) => {
        if (state.viewHistory.length === 0) return {}
        const newHistory = [...state.viewHistory]
        const previousView = newHistory.pop()
        return {
            viewHistory: newHistory,
            currentView: previousView
        }
    }),
    clearHistory: () => set({ viewHistory: [] }),
    setShowCommandPalette: (mode) => set({ showCommandPalette: mode })
}))
