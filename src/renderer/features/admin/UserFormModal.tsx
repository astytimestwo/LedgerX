import React, { useEffect } from 'react'
import { Modal } from '../../components/Modal/Modal'
import { Button } from '../../components/Button/Button'
import { Input } from '../../components/Input/Input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Permission } from '../../../main/lib/rbac'

const userSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().optional(),
    role: z.string().min(1, 'Role is required'),
    is_active: z.coerce.number(),
    permissions_json: z.array(z.string()).optional()
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: any) => void
    initialData?: any
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: '',
            password: '',
            role: 'viewer',
            is_active: 1,
            permissions_json: []
        }
    })

    const selectedRole = watch('role')

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                let perms = []
                if (initialData.permissions_json) {
                    try {
                        perms = JSON.parse(initialData.permissions_json)
                    } catch {
                        perms = []
                    }
                }
                reset({
                    username: initialData.username,
                    password: '', // Never populate password on edit
                    role: initialData.role,
                    is_active: initialData.is_active,
                    permissions_json: perms
                })
            } else {
                reset({
                    username: '',
                    password: '',
                    role: 'viewer',
                    is_active: 1,
                    permissions_json: []
                })
            }
        }
    }, [isOpen, initialData, reset])

    const onSubmit = (data: UserFormValues) => {
        onSave(data)
    }

    const availablePermissions = Object.values(Permission)

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit User" : "Create User"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Username"
                    {...register('username')}
                    error={errors.username?.message}
                    disabled={!!initialData} // Usually username cannot be changed after creation easily, or just disable it
                />

                {!initialData && (
                    <Input
                        label="Password"
                        type="password"
                        {...register('password')}
                        error={errors.password?.message}
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Role</label>
                    <select
                        {...register('role')}
                        className="w-full bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                    >
                        <option value="admin">Admin</option>
                        <option value="accountant">Accountant</option>
                        <option value="viewer">Viewer</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                {selectedRole === 'custom' && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Custom Permissions</label>
                        <div className="grid grid-cols-2 gap-2 bg-white/10 dark:bg-black/20 p-3 rounded-lg border border-white/10 max-h-40 overflow-auto">
                            {availablePermissions.map(perm => (
                                <label key={perm} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={perm}
                                        {...register('permissions_json')}
                                        className="rounded border-white/20 bg-black/5 dark:bg-black/40 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                                    />
                                    {perm}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {initialData && (
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer pt-2">
                        <input
                            type="checkbox"
                            {...register('is_active')}
                            className="rounded border-white/20 bg-black/5 dark:bg-black/40 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                        />
                        Active User
                    </label>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    )
}
