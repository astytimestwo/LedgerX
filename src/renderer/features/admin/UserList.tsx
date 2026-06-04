import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/Button/Button'
import { Plus, Edit2, KeyRound } from 'lucide-react'
import { UserFormModal } from './UserFormModal'

export const UserList: React.FC = () => {
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.users.list()
    })

    const saveMutation = useMutation({
        mutationFn: (data: any) => {
            if (selectedUser) {
                return api.users.update(selectedUser.id, data)
            } else {
                return api.users.create(data)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setIsFormOpen(false)
        }
    })

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, newPassword }: { id: string, newPassword: string }) => api.users.resetPassword(id, newPassword),
        onSuccess: () => {
            alert('Password reset successfully')
        }
    })

    const handleCreate = () => {
        setSelectedUser(null)
        setIsFormOpen(true)
    }

    const handleEdit = (user: any) => {
        setSelectedUser(user)
        setIsFormOpen(true)
    }

    const handleResetPassword = (user: any) => {
        const newPass = prompt(`Enter new password for ${user.username}:`)
        if (newPass) {
            resetPasswordMutation.mutate({ id: user.id, newPassword: newPass })
        }
    }

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">User Management</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Manage system access and roles.</p>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                    <Plus size={16} /> New User
                </Button>
            </div>

            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 rounded-xl flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 h-10 backdrop-blur-sm sticky top-0 z-10">
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Username</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Role</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Status</th>
                            <th className="px-4 font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-white/50">Loading users...</td></tr>
                        ) : users.map((user: any) => (
                            <tr key={user.id} className="h-12 border-b border-white/5 hover:bg-white/10 transition-colors">
                                <td className="px-4 font-medium text-[var(--color-text-primary)]">{user.username}</td>
                                <td className="px-4 text-[var(--color-text-secondary)] capitalize">{user.role}</td>
                                <td className="px-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleResetPassword(user)} className="p-1.5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white rounded transition-colors" title="Reset Password">
                                            <KeyRound size={16} />
                                        </button>
                                        <button onClick={() => handleEdit(user)} className="p-1.5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white rounded transition-colors" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UserFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialData={selectedUser}
                onSave={(data) => saveMutation.mutate(data)}
            />
        </div>
    )
}
