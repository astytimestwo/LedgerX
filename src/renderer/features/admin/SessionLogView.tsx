import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export const SessionLogView: React.FC = () => {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['session-logs', dateFrom, dateTo],
        queryFn: () => api.users.sessionLog(undefined, {
            from: dateFrom || undefined,
            to: dateTo || undefined
        } as any)
    })

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.users.list()
    })

    const getUserName = (id: string) => {
        const u = users.find((u: any) => u.id === id)
        return u ? u.username : 'Unknown'
    }

    const formatDuration = (seconds?: number | null) => {
        if (!seconds) return '-'
        if (seconds < 60) return `${seconds}s`
        const m = Math.floor(seconds / 60)
        return `${m}m`
    }

    const handleForceLogout = async (logId: string, userId: string) => {
        if (!confirm('Are you sure you want to force logout this user?')) return
        try {
            await api.users.forceLogout(userId)
            // Invalidating query is handled by useQuery refetch if needed, but we can just reload for simplicity
            window.location.reload()
        } catch (e: any) {
            alert('Error: ' + e.message)
        }
    }

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Session Logs</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Audit trail of user logins and sessions.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-black/5 dark:bg-black/40 rounded-lg p-1 border border-white/10">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-3 py-1.5 focus:outline-none"
                        />
                        <div className="w-px bg-white/10 mx-1"></div>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent text-sm text-[var(--color-text-primary)] px-3 py-1.5 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm sticky top-0 z-10">
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">User</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Login Time</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Logout Time</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Duration</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">IP Address</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-white/50">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-white/50">No session logs found.</td></tr>
                        ) : logs.map((log: any) => (
                            <tr key={log.id} className="h-11 border-b border-white/5 hover:bg-white/10 transition-colors">
                                <td className="px-4 font-medium text-[var(--color-accent)]">{getUserName(log.user_id)}</td>
                                <td className="px-4 text-[var(--color-text-primary)]">{new Date(log.login_at).toLocaleString()}</td>
                                <td className="px-4 text-[var(--color-text-secondary)] text-xs">
                                    {log.logout_at ? new Date(log.logout_at).toLocaleString() : <span className="text-green-400">Active</span>}
                                </td>
                                <td className="px-4 font-mono text-xs">{formatDuration(log.duration_sec)}</td>
                                <td className="px-4 text-right text-xs text-[var(--color-text-muted)] font-mono">{log.ip_address || '-'}</td>
                                <td className="px-4 text-right">
                                    {!log.logout_at && (
                                        <button
                                            onClick={() => handleForceLogout(log.id, log.user_id)}
                                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Force Logout
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
