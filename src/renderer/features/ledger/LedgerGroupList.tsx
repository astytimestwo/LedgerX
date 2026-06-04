import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from '../../stores/toast.store'
import { Button } from '../../components/Button/Button'
import { LedgerGroupFormModal } from './LedgerGroupFormModal'
import { Pencil, Trash2 } from 'lucide-react'

export const LedgerGroupList: React.FC = () => {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGroup, setEditingGroup] = useState<any | undefined>(undefined)

    const { data: groups = [], isLoading, error } = useQuery({
        queryKey: ['ledger-groups'],
        queryFn: () => api.getLedgerGroups()
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteLedgerGroup({ id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-groups'] })
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Failed to delete group')
        }
    })

    const handleNew = () => {
        setEditingGroup(undefined)
        setIsModalOpen(true)
    }

    const handleEdit = (group: any) => {
        setEditingGroup(group)
        setIsModalOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the group "${name}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    if (isLoading) return <div className="p-4 text-[var(--color-text-muted)]">Loading groups...</div>
    if (error) return <div className="p-4 text-[var(--color-error)]">Failed to load groups</div>

    // Helper map for displaying parent names instead of IDs
    const groupNameMap = new Map(groups.map(g => [g.id, g.name]))

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Ledger Groups</h2>
                <Button onClick={handleNew}>New Group (Ctrl+N)</Button>
            </div>
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 dark:border-white/10 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 dark:bg-black/20 h-10 backdrop-blur-sm">
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Name</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Nature</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Parent</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((g, i) => (
                            <tr key={g.id} className={`h-11 border-b border-white/5 ${i % 2 === 1 ? 'bg-white/5 dark:bg-white/5' : ''} hover:bg-white/10 dark:hover:bg-white/10 transition-colors group`}>
                                <td className="px-4">{g.name}</td>
                                <td className="px-4">{g.nature}</td>
                                <td className="px-4 text-[var(--color-text-muted)]">
                                    {g.parent_id ? groupNameMap.get(g.parent_id) || g.parent_id : '-'}
                                </td>
                                <td className="px-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(g)}
                                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] rounded hover:bg-[var(--color-bg-subtle)]"
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(g.id, g.name)}
                                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] rounded hover:bg-[var(--color-bg-subtle)]"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {groups.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No groups found. Create one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <LedgerGroupFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editData={editingGroup}
            />
        </div>
    )
}
