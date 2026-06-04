import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/Button/Button'
import { Input } from '../../components/Input/Input'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from '../../components/Modal/Modal'

interface GroupData {
    id?: string
    name: string
    parent_id?: string
}

export const ItemGroupMaster: React.FC = () => {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGroup, setEditingGroup] = useState<GroupData | null>(null)
    const [formData, setFormData] = useState<GroupData>({ name: '', parent_id: '' })

    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['item-groups'],
        queryFn: () => api.inventory.group.list()
    })

    const createMutation = useMutation({
        mutationFn: (data: GroupData) => api.inventory.group.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item-groups'] })
            setIsModalOpen(false)
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: GroupData) => api.inventory.group.update(data.id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item-groups'] })
            setIsModalOpen(false)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.inventory.group.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item-groups'] })
        }
    })

    const handleNew = () => {
        setEditingGroup(null)
        setFormData({ name: '', parent_id: '' })
        setIsModalOpen(true)
    }

    const handleEdit = (grp: any) => {
        setEditingGroup(grp)
        setFormData({ name: grp.name, parent_id: grp.parent_id || '' })
        setIsModalOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Delete item group "${name}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingGroup) {
            updateMutation.mutate({ ...formData, id: editingGroup.id })
        } else {
            createMutation.mutate(formData)
        }
    }

    const parentMap = new Map(groups.map(g => [g.id, g.name]))

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Item Groups</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Manage hierarchical categories for your inventory items.</p>
                </div>
                <Button onClick={handleNew}>New Group</Button>
            </div>

            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm">
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] w-1/2">Group Name</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] w-1/3">Parent Group</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-white/50">Loading...</td></tr>
                        ) : groups.length === 0 ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-white/50">No groups found.</td></tr>
                        ) : (
                            groups.map((g: any) => (
                                <tr key={g.id} className="h-11 border-b border-white/5 hover:bg-white/10 transition-colors group">
                                    <td className="px-4 font-medium text-[var(--color-text-primary)]">{g.name}</td>
                                    <td className="px-4 text-[var(--color-text-secondary)]">{g.parent_id ? parentMap.get(g.parent_id) : '-'}</td>
                                    <td className="px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(g)} className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] rounded"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(g.id, g.name)} className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGroup ? "Edit Item Group" : "New Item Group"}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                    <Input
                        label="Group Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                    />
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[var(--color-text-primary)]">Parent Group</label>
                        <select
                            value={formData.parent_id}
                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                            className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:border-[var(--color-accent)]"
                        >
                            <option value="" className="bg-black">Primary (No Parent)</option>
                            {groups.filter(g => g.id !== editingGroup?.id).map((g: any) => (
                                <option key={g.id} value={g.id} className="bg-black">{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Group</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
