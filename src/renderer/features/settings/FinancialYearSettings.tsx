import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useSessionStore } from '../../stores/session.store'
import { Calendar, Plus, Lock, Unlock } from 'lucide-react'

export const FinancialYearSettings: React.FC = () => {
    const { activeYear, companyName, setCompany } = useSessionStore()
    const [years, setYears] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [newStart, setNewStart] = useState('')
    const [newEnd, setNewEnd] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadYears()
    }, [])

    const loadYears = async () => {
        setLoading(true)
        try {
            const list = await api.fy.list()
            setYears(list)
        } catch (e) {
            console.error('Failed to load FYs', e)
        } finally {
            setLoading(false)
        }
    }

    const switchYear = (fy: any) => {
        if (!companyName) return
        setCompany(companyName, fy)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            await api.fy.create({ name: newName, start_date: newStart, end_date: newEnd })
            setShowModal(false)
            setNewName('')
            setNewStart('')
            setNewEnd('')
            await loadYears()
        } catch (e: any) {
            alert('Failed to create Financial Year: ' + e.message)
        } finally {
            setCreating(false)
        }
    }

    const toggleLock = async (id: string, currentLock: number) => {
        try {
            await api.fy.toggleLock(id, currentLock ? 0 : 1)
            await loadYears()
        } catch (e: any) {
            alert('Failed to toggle lock: ' + e.message)
        }
    }

    if (loading) return <div className="p-8 text-center text-white/50">Loading Financial Years...</div>

    return (
        <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
            <div className="flex justify-between items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Financial Years</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Manage accounting periods and opening balances.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
                >
                    <Plus size={18} />
                    New Financial Year
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {years.map(fy => (
                    <div key={fy.id} className={`p-5 rounded-xl border backdrop-blur-md flex flex-col gap-4 transition-all
                        ${activeYear?.id === fy.id
                            ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/50'
                            : 'bg-white/5 dark:bg-black/20 border-white/10 hover:border-white/20'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                    <Calendar size={18} className="text-[var(--color-accent)]" />
                                    {fy.name}
                                </h3>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{fy.start_date} to {fy.end_date}</p>
                            </div>
                            <button
                                onClick={() => toggleLock(fy.id, fy.is_locked)}
                                className={`p-2 rounded-md ${fy.is_locked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                                title={fy.is_locked ? 'Unlock Year' : 'Lock Year'}
                            >
                                {fy.is_locked ? <Lock size={16} /> : <Unlock size={16} />}
                            </button>
                        </div>

                        <div className="mt-auto pt-2 border-t border-white/10">
                            {activeYear?.id === fy.id ? (
                                <span className="text-[var(--color-accent)] font-semibold text-sm">Active Session</span>
                            ) : (
                                <button
                                    onClick={() => switchYear(fy)}
                                    className="text-sm text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors w-full text-center"
                                >
                                    Switch to this Year
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1c23] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Create Financial Year</h3>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name (e.g., 2024-2025)</label>
                                    <input
                                        type="text"
                                        required
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2 text-[var(--color-text-primary)]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={newStart}
                                            onChange={e => setNewStart(e.target.value)}
                                            className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2 text-[var(--color-text-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={newEnd}
                                            onChange={e => setNewEnd(e.target.value)}
                                            className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2 text-[var(--color-text-primary)]"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-2 rounded-lg font-medium text-[var(--color-text-secondary)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 py-2 rounded-lg font-medium text-white bg-[var(--color-accent)] hover:bg-opacity-90 transition disabled:opacity-50"
                                    >
                                        {creating ? 'Creating...' : 'Create Year'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
