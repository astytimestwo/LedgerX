import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/Button/Button'
import { LedgerAccountFormModal } from './LedgerAccountFormModal'
import { Pencil, Trash2, Search } from 'lucide-react'

export const LedgerAccountList: React.FC = () => {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<any | undefined>(undefined)
    const [search, setSearch] = useState('')

    const { data: accounts = [], isLoading: isLoadingAccs, error: errorAccs } = useQuery({
        queryKey: ['ledger-accounts'],
        queryFn: () => api.getLedgerAccounts()
    })

    const { data: groups = [] } = useQuery({
        queryKey: ['ledger-groups'],
        queryFn: () => api.getLedgerGroups()
    })

    const filteredAccounts = useMemo(() => {
        if (!search) return accounts
        const s = search.toLowerCase()
        return accounts.filter((a: any) =>
            a.name.toLowerCase().includes(s) ||
            (a.code || '').toLowerCase().includes(s)
        )
    }, [accounts, search])

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteLedgerAccount({ id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] })
        }
    })

    const handleNew = () => {
        setEditingAccount(undefined)
        setIsModalOpen(true)
    }

    const handleEdit = (account: any) => {
        setEditingAccount(account)
        setIsModalOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the account "${name}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    const isLoading = isLoadingAccs
    const error = errorAccs

    if (isLoading) return <div className="p-4 text-[var(--color-text-muted)]">Loading accounts...</div>
    if (error) return <div className="p-4 text-[var(--color-error)]">Failed to load accounts</div>

    const groupNameMap = new Map(groups.map(g => [g.id, g.name]))

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Ledger Accounts</h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 dark:bg-black/20 rounded-lg px-3 py-1.5 border border-white/10">
                        <Search size={14} className="text-white/40" />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent text-sm text-white w-40 focus:outline-none placeholder-white/40"
                        />
                    </div>
                    <Button onClick={handleNew}>New Account (Ctrl+N)</Button>
                </div>
            </div>
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 dark:border-white/10 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 dark:bg-black/20 h-10 backdrop-blur-sm">
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Code</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Name</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Group</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Opening Bal</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAccounts.map((a, i) => (
                            <tr key={a.id} className={`h-11 border-b border-white/5 ${i % 2 === 1 ? 'bg-white/5 dark:bg-white/5' : ''} hover:bg-white/10 dark:hover:bg-white/10 transition-colors`}>
                                <td className="px-4 font-mono">{a.code}</td>
                                <td className="px-4">{a.name}</td>
                                <td className="px-4">{groupNameMap.get(a.group_id) || a.group_id}</td>
                                <td className="px-4 font-mono text-right">
                                    <span className={a.opening_type === 'dr' ? 'text-[var(--color-debit)]' : 'text-[var(--color-credit)]'}>
                                        {(a.opening_balance / 100).toFixed(2)} {a.opening_type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(a)}
                                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] rounded hover:bg-[var(--color-bg-subtle)]"
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(a.id, a.name)}
                                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] rounded hover:bg-[var(--color-bg-subtle)]"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredAccounts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No accounts found. Create one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <LedgerAccountFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editData={editingAccount}
            />
        </div>
    )
}
