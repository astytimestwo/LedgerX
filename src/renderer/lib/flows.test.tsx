// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import App from '../App'
import { useUIStore } from '../stores/ui.store'
import { useSessionStore } from '../stores/session.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const renderApp = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    return render(
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    )
}

// Mock the api wrapper completely
vi.mock('../lib/api', () => ({
    api: {
        checkFirstRun: vi.fn().mockResolvedValue(false),
        fy: {
            list: vi.fn().mockResolvedValue([{ id: 'fy1', name: '2026-2027', start_date: '2026-04-01', end_date: '2027-03-31' }])
        },
        getLedgerAccounts: vi.fn().mockResolvedValue([]),
        inventory: {
            item: {
                list: vi.fn().mockResolvedValue([])
            }
        }
    }
}))

// Mock AppShell and subcomponents to isolate shortcut tests
vi.mock('../components/Layout/AppShell', () => ({
    AppShell: ({ children }: any) => <div data-testid="app-shell">{children}</div>
}))

vi.mock('../features/voucher/VoucherList', () => ({
    VoucherList: () => <div data-testid="voucher-list">Voucher List Screen</div>
}))

describe('React Keyboard Flow Integration Tests', () => {
    beforeEach(() => {
        // Set up active user and unlocked company to bypass login screens
        useSessionStore.setState({
            user: { id: 'u1', username: 'testadmin', role: 'admin' },
            companyName: 'Test Company',
            activeYear: { id: 'fy1', name: '2026-2027', start_date: '2026-04-01', end_date: '2027-03-31' }
        })
        
        // Reset UI State
        useUIStore.setState({
            currentView: 'daybook',
            viewHistory: [],
            isVoucherModalOpen: false,
            showShortcutHelp: false,
            showSearch: false,
            showCommandPalette: null
        })
    })

    it('should open VoucherFormModal preselected with Journal when pressing F7', async () => {
        renderApp()
        
        // Press F7 globally
        fireEvent.keyDown(window, { key: 'F7' })
        
        // Modal should open
        expect(useUIStore.getState().isVoucherModalOpen).toBe(true)
        expect(sessionStorage.getItem('initialVoucherType')).toBe('journal')
    })

    it('should open VoucherFormModal preselected with Payment when pressing F5', async () => {
        renderApp()
        
        // Press F5 globally
        fireEvent.keyDown(window, { key: 'F5' })
        
        expect(useUIStore.getState().isVoucherModalOpen).toBe(true)
        expect(sessionStorage.getItem('initialVoucherType')).toBe('payment')
    })

    it('should open VoucherFormModal preselected with Sales when pressing F8', async () => {
        renderApp()
        
        // Press F8 globally
        fireEvent.keyDown(window, { key: 'F8' })
        
        expect(useUIStore.getState().isVoucherModalOpen).toBe(true)
        expect(sessionStorage.getItem('initialVoucherType')).toBe('sales')
    })

    it('should open Go To command palette when pressing Alt+G', async () => {
        renderApp()
        
        // Press Alt+G
        fireEvent.keyDown(window, { key: 'g', altKey: true })
        
        expect(useUIStore.getState().showCommandPalette).toBe('goto')
    })

    it('should open Switch To command palette when pressing Ctrl+G', async () => {
        renderApp()
        
        // Press Ctrl+G
        fireEvent.keyDown(window, { key: 'g', ctrlKey: true })
        
        expect(useUIStore.getState().showCommandPalette).toBe('switchto')
    })
})
