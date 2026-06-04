import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '../../../shared/types'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { api } from '../../lib/api'
import { useSessionStore } from '../../stores/session.store'
import bgLogin from '../../assets/bg-login.png'

interface LoginScreenProps {
    onRequiresTotp: (userId: string, companyName: string | undefined, sessionToken?: string) => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onRequiresTotp }) => {
    const [error, setError] = useState<string | null>(null)
    const { setUser, companyName, setCompany } = useSessionStore()

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange'
    })

    // For real scenario we also store company id.
    const onSubmit = async (data: LoginInput) => {
        setError(null)
        try {
            const res = await api.login(data)
            if (res.success && res.user && res.sessionToken) {
                // Store user first so sessionToken is active for subsequent API calls
                setUser(res.user, res.sessionToken)

                const years = await api.fy.list();
                if (companyName && years.length > 0) {
                    setCompany(companyName, years[0] as any)
                }
            } else if (res.requiresTotp && res.user) {
                // TOTP required - don't set user yet, go to TOTP screen
                onRequiresTotp(res.user.id, companyName ?? undefined, res.sessionToken)
            } else {
                setError(res.error || 'Invalid credentials')
            }
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)]" style={{ backgroundImage: `url(${bgLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="w-[360px] rounded-2xl bg-[var(--color-bg-surface)] backdrop-blur-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10">
                <h1 className="text-3xl font-extrabold mb-8 text-center text-[var(--color-text-primary)] tracking-tight">LedgerX Login</h1>

                {error && <div role="alert" className="mb-4 text-[var(--color-error)] text-sm">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit, () => setError(null))} onChange={() => error && setError(null)} className="flex flex-col gap-5">
                    <Input
                        label="Username"
                        placeholder="Enter username"
                        {...register('username')}
                        error={errors.username?.message}
                    />

                    <Input
                        label="Password"
                        type="password"
                        {...register('password')}
                        error={errors.password?.message}
                    />

                    <p className="text-sm text-[var(--color-text-secondary)] text-right mt-1">
                        Password recovery requires your system administrator.
                    </p>

                    <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
