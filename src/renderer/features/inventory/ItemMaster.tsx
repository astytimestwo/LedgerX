import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/Button/Button'
import { Input } from '../../components/Input/Input'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from '../../components/Modal/Modal'

export const ItemMaster: React.FC = () => {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        group_id: '',
        hsn_code: '',
        default_gst_rate: '',
        unit_of_measure: 'NOS',
        opening_qty: '0',
        opening_rate: '0'
    })

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['items'],
        queryFn: () => api.inventory.item.list()
    })

    const { data: groups = [] } = useQuery({
        queryKey: ['item-groups'],
        queryFn: () => api.inventory.group.list()
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => api.inventory.item.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] })
            setIsModalOpen(false)
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.inventory.item.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] })
            setIsModalOpen(false)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.inventory.item.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] })
        }
    })

    const handleNew = () => {
        setEditingItem(null)
        setFormData({
            code: '',
            name: '',
            group_id: groups[0]?.id || '',
            hsn_code: '',
            default_gst_rate: '',
            unit_of_measure: 'NOS',
            opening_qty: '0',
            opening_rate: '0'
        })
        setIsModalOpen(true)
    }

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setFormData({
            code: item.code,
            name: item.name,
            group_id: item.group_id,
            hsn_code: item.hsn_code || '',
            default_gst_rate: item.default_gst_rate?.toString() || '',
            unit_of_measure: item.unit_of_measure,
            opening_qty: item.opening_qty.toString(),
            opening_rate: (item.opening_rate / 100).toString() // display in rupees
        })
        setIsModalOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Delete item "${name}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const payload = {
            ...formData,
            default_gst_rate: formData.default_gst_rate ? Number(formData.default_gst_rate) : undefined,
            opening_qty: Number(formData.opening_qty) || 0,
            opening_rate: Math.round((Number(formData.opening_rate) || 0) * 100) // to paise
        }

        if (editingItem) {
            updateMutation.mutate({ ...payload, id: editingItem.id })
        } else {
            createMutation.mutate(payload)
        }
    }

    const groupMap = new Map(groups.map((g: any) => [g.id, g.name]))

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Item Master</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Manage your inventory items, pricing, and tax rates.</p>
                </div>
                <Button onClick={handleNew} disabled={groups.length === 0} title={groups.length === 0 ? "Create an Item Group first" : ""}>New Item</Button>
            </div>

            {groups.length === 0 && (
                <div className="bg-[var(--color-warning)]/10 text-[var(--color-warning)] p-3 rounded-lg text-sm font-medium">
                    You must create at least one Item Group before creating items.
                </div>
            )}

            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm">
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Item Code</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Name</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">Group</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)]">UOM</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">O. Qty</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">GST %</th>
                            <th className="px-4 font-medium text-[var(--color-text-secondary)] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-white/50">Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-white/50">No items found.</td></tr>
                        ) : (
                            items.map((item: any) => (
                                <tr key={item.id} className="h-11 border-b border-white/5 hover:bg-white/10 transition-colors group">
                                    <td className="px-4 font-medium text-[var(--color-text-primary)]">{item.code}</td>
                                    <td className="px-4">{item.name}</td>
                                    <td className="px-4 text-[var(--color-text-secondary)]">{groupMap.get(item.group_id) || '-'}</td>
                                    <td className="px-4 text-[var(--color-text-secondary)]">{item.unit_of_measure}</td>
                                    <td className="px-4 text-right font-mono">{item.opening_qty}</td>
                                    <td className="px-4 text-right text-[var(--color-text-secondary)]">{item.default_gst_rate ? `${item.default_gst_rate}%` : '-'}</td>
                                    <td className="px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(item)} className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] rounded"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(item.id, item.name)} className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Item" : "New Item"}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2 w-[400px]">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                label="Item Code *"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                label="UOM *"
                                value={formData.unit_of_measure}
                                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value.toUpperCase() })}
                                required
                                placeholder="NOS, KG, PCS..."
                            />
                        </div>
                    </div>

                    <Input
                        label="Item Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[var(--color-text-primary)]">Item Group *</label>
                        <select
                            value={formData.group_id}
                            onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                            required
                            className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:border-[var(--color-accent)]"
                        >
                            {groups.map((g: any) => (
                                <option key={g.id} value={g.id} className="bg-black">{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                label="HSN Code"
                                value={formData.hsn_code}
                                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                type="number"
                                label="Default GST %"
                                value={formData.default_gst_rate}
                                onChange={(e) => setFormData({ ...formData, default_gst_rate: e.target.value })}
                                placeholder="e.g. 18"
                            />
                        </div>
                    </div>

                    <div className="border border-white/10 rounded-lg p-3 bg-white/5 flex flex-col gap-3 mt-2">
                        <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Opening Balances</h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    step="1"
                                    label={`Opening Qty (${formData.unit_of_measure})`}
                                    value={formData.opening_qty}
                                    onChange={(e) => setFormData({ ...formData, opening_qty: e.target.value })}
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    step="0.01"
                                    label="Rate (₹)"
                                    value={formData.opening_rate}
                                    onChange={(e) => setFormData({ ...formData, opening_rate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Item</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
