import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

// We will bypass full Zod typing strictly here for speed but ensure it matches backend HsnMaster interface
interface HsnRow {
    code: string
    description: string
    gst_rate: number
    cess_rate: number
    type: 'goods' | 'service'
}

export const HsnMaster: React.FC = () => {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [editingCode, setEditingCode] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [formData, setFormData] = useState<Partial<HsnRow>>({})

    const { data: hsnList = [], isLoading } = useQuery({
        queryKey: ['hsnMaster'],
        queryFn: () => api.gst.hsn.list()
    })

    const createMutation = useMutation({
        mutationFn: (data: HsnRow) => api.gst.hsn.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hsnMaster'] })
            setIsAdding(false)
            setFormData({})
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ code, data }: { code: string, data: Partial<HsnRow> }) => api.gst.hsn.update(code, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hsnMaster'] })
            setEditingCode(null)
            setFormData({})
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (code: string) => api.gst.hsn.delete(code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hsnMaster'] })
        }
    })

    const filteredList = hsnList.filter((item: any) =>
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    )

    const handleSave = () => {
        if (!formData.code || !formData.description || formData.gst_rate === undefined) {
            alert('Code, Description, and GST Rate are required.')
            return
        }

        const payload: HsnRow = {
            code: formData.code,
            description: formData.description,
            gst_rate: Number(formData.gst_rate),
            cess_rate: Number(formData.cess_rate || 0),
            type: formData.type || 'goods'
        }

        if (isAdding) {
            createMutation.mutate(payload)
        } else if (editingCode) {
            updateMutation.mutate({ code: editingCode, data: payload })
        }
    }

    const startEdit = (item: HsnRow) => {
        setEditingCode(item.code)
        setIsAdding(false)
        setFormData(item)
    }

    const cancelEdit = () => {
        setEditingCode(null)
        setIsAdding(false)
        setFormData({})
    }

    const handleDelete = (code: string) => {
        if (confirm(`Delete HSN/SAC code ${code}? This may affect historical GST reports if used.`)) {
            deleteMutation.mutate(code)
        }
    }

    if (isLoading) return <div className="p-8 text-white/50">Loading HSN Master...</div>

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-base)]">
            <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-wide text-white">HSN / SAC Master</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Manage tax rates by product/service classification</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search code or desc..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/10 dark:bg-black/20 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)] focus:bg-black/5 dark:bg-black/40 transition-all w-64"
                        />
                    </div>
                    <button
                        onClick={() => { setIsAdding(true); setEditingCode(null); setFormData({ type: 'goods', gst_rate: 0, cess_rate: 0 }) }}
                        disabled={isAdding}
                        className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-[var(--color-accent)]/20 transition-all disabled:opacity-50"
                    >
                        <Plus size={16} /> Add HSN/SAC
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-8">
                <div className="bg-[var(--color-bg-surface)] backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/10 dark:bg-black/20 text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-bold">
                                <th className="p-4 w-32">Code</th>
                                <th className="p-4 w-28">Type</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 w-24 text-right">GST %</th>
                                <th className="p-4 w-24 text-right">Cess %</th>
                                <th className="p-4 w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                            {isAdding && (
                                <tr className="bg-[var(--color-accent)]/10 animate-fade-in">
                                    <td className="p-3">
                                        <input
                                            autoFocus
                                            placeholder="Code"
                                            value={formData.code || ''}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full bg-black/30 border border-white/20 rounded px-2 py-1 text-white outline-none focus:border-[var(--color-accent)]"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={formData.type || 'goods'}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                            className="w-full bg-black/30 border border-white/20 rounded px-2 py-1 text-white outline-none focus:border-[var(--color-accent)] uppercase text-xs"
                                        >
                                            <option value="goods">Goods</option>
                                            <option value="service">Service</option>
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <input
                                            placeholder="Description"
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-black/30 border border-white/20 rounded px-2 py-1 text-white outline-none focus:border-[var(--color-accent)]"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={formData.gst_rate || ''}
                                            onChange={e => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                                            className="w-full bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-right outline-none focus:border-[var(--color-accent)]"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={formData.cess_rate || ''}
                                            onChange={e => setFormData({ ...formData, cess_rate: Number(e.target.value) })}
                                            className="w-full bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-right outline-none focus:border-[var(--color-accent)]"
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300" title="Save"><Save size={16} /></button>
                                            <button onClick={cancelEdit} className="text-rose-400 hover:text-rose-300" title="Cancel"><X size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {filteredList.map((item: any) => {
                                const isEditing = editingCode === item.code

                                if (isEditing) {
                                    return (
                                        <tr key={item.code} className="bg-white/5">
                                            <td className="p-3 font-mono text-[var(--color-text-muted)] line-through">
                                                {item.code}
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={formData.type}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                                    className="w-full bg-black/30 border border-[var(--color-accent)] rounded px-2 py-1 text-white outline-none uppercase text-xs"
                                                >
                                                    <option value="goods">Goods</option>
                                                    <option value="service">Service</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    autoFocus
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full bg-black/30 border border-[var(--color-accent)] rounded px-2 py-1 text-white outline-none"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={formData.gst_rate}
                                                    onChange={e => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                                                    className="w-full bg-black/30 border border-[var(--color-accent)] rounded px-2 py-1 text-white text-right outline-none"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={formData.cess_rate}
                                                    onChange={e => setFormData({ ...formData, cess_rate: Number(e.target.value) })}
                                                    className="w-full bg-black/30 border border-[var(--color-accent)] rounded px-2 py-1 text-white text-right outline-none"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300"><Save size={16} /></button>
                                                    <button onClick={cancelEdit} className="text-rose-400 hover:text-rose-300"><X size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                }

                                return (
                                    <tr key={item.code} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-mono font-medium text-[var(--color-text-primary)]">{item.code}</td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${item.type === 'service' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-orange-500/20 text-orange-300'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[var(--color-text-secondary)]">{item.description}</td>
                                        <td className="p-4 text-right">
                                            <span className="inline-block bg-white/10 px-2.5 py-1 rounded text-white font-mono min-w-[3rem] text-center">
                                                {item.gst_rate}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {item.cess_rate > 0 ? (
                                                <span className="inline-block bg-red-400/10 px-2 py-1 rounded text-red-300 font-mono text-xs border border-red-500/20">
                                                    {item.cess_rate}%
                                                </span>
                                            ) : (
                                                <span className="text-white/20">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(item)} className="text-[var(--color-text-muted)] hover:text-white transition-colors" title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.code)} className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}

                            {filteredList.length === 0 && !isAdding && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/40 italic">
                                        No HSN / SAC codes found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
} 
