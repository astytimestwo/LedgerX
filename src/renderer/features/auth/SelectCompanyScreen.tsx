import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { unlockCompanySchema, UnlockCompanyInput } from '../../../shared/types'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { api } from '../../lib/api'
import { Server, ChevronLeft, LogOut, HelpCircle } from 'lucide-react'
import bgLogin from '../../assets/bg-login.png'

interface SelectCompanyProps {
    onUnlocked: (companyName: string) => void
    onCreateNew: () => void
}

export const SelectCompanyScreen: React.FC<SelectCompanyProps> = ({ onUnlocked, onCreateNew }) => {
    const [companies, setCompanies] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [showHelp, setShowHelp] = useState(false)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UnlockCompanyInput>({
        resolver: zodResolver(unlockCompanySchema)
    })

    useEffect(() => {
        api.getCompanies().then((list: string[]) => {
            setCompanies(list)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!showHelp) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                setShowHelp(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown, { capture: true })
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }, [showHelp])

    const onSubmit = async (data: UnlockCompanyInput) => {
        try {
            const res = await api.unlockCompany(data)
            if (res.success) {
                onUnlocked(data.companyName)
            } else {
                setError(res.error || 'Invalid Master Password')
            }
        } catch (err: any) {
            setError(err?.message || 'Unknown error')
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)] text-[var(--color-text-primary)]" style={{ backgroundImage: `url(${bgLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div role="status" className="rounded-xl bg-[var(--color-bg-surface)]/80 px-6 py-4 shadow-2xl backdrop-blur-xl">
                    Loading companies...
                </div>
            </div>
        )
    }

    if (companies.length === 0) {
        // Fallback if somehow they ended up here without companies
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)]" style={{ backgroundImage: `url(${bgLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <Button onClick={onCreateNew}>Create New Company</Button>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen relative items-center justify-center bg-[var(--color-bg-base)]" style={{ backgroundImage: `url(${bgLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

            {/* Middle Left Back Button */}
            <button
                onClick={() => {
                    if (window.confirm("Are you sure you want to go back? Any unsaved changes will be lost.")) {
                        window.history.back()
                    }
                }}
                className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center justify-center p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-2xl transition-all"
                title="Go Back"
                aria-label="Go back"
            >
                <ChevronLeft size={28} />
            </button>

            {/* Bottom Center Logo */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xl font-extrabold uppercase tracking-[0.4em] pointer-events-none drop-shadow-lg">
                LedgerX
            </div>

            {/* Bottom Right Actions */}
            <div className="absolute bottom-8 right-8 flex items-center gap-4">
                <button
                    onClick={() => {
                        if (window.confirm("Are you sure you want to force logout and close the session?")) {
                            window.location.reload()
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-xl backdrop-blur-md border border-red-500/30 transition-all font-semibold text-sm shadow-2xl"
                    title="Force Logout"
                    aria-label="Force logout"
                >
                    <LogOut size={18} /> Force Logout
                </button>
                <button
                    onClick={() => setShowHelp(true)}
                    className="flex items-center justify-center h-11 w-11 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all shadow-2xl"
                    title="Help"
                    aria-label="Open help"
                >
                    <HelpCircle size={22} />
                </button>

                {showHelp && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
                        <div role="dialog" aria-modal="true" aria-labelledby="ledgerx-help-title" className="bg-[var(--color-bg-surface)] rounded-2xl p-6 shadow-2xl max-w-md mx-4" onClick={e => e.stopPropagation()}>
                            <h3 id="ledgerx-help-title" className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">LedgerX Help</h3>
                            <div className="text-sm text-[var(--color-text-primary)] space-y-2">
                                <p>1. Select your company from the dropdown menu.</p>
                                <p>2. Enter the secure master password assigned to that company.</p>
                                <p>3. Click Unlock Database to proceed.</p>
                            </div>
                            <p className="mt-4 text-sm text-[var(--color-error)]">Lost your password? Contact your system administrator.</p>
                            <button type="button" onClick={() => setShowHelp(false)} className="mt-4 w-full py-2 bg-[var(--color-accent)] text-white rounded-lg font-semibold">Close</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="w-[400px] rounded-2xl bg-[var(--color-bg-surface)] backdrop-blur-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10">
                <div className="flex items-center justify-center mb-6 text-[var(--color-accent)]">
                    <Server size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-extrabold mb-2 text-center text-[var(--color-text-primary)] tracking-tight">Open Company</h1>
                <p className="text-sm font-medium text-[var(--color-text-primary)] opacity-80 text-center mb-8">Unlock your encrypted database to continue.</p>

                {error && <div className="mb-4 text-[var(--color-error)] text-sm">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3 w-full relative">
                        <label className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">Select Company</label>
                        <select
                            className="flex h-10 w-full rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3 py-2 text-sm text-[var(--color-text-primary)] backdrop-blur-md ring-offset-[var(--color-bg-base)] focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-white/20 dark:focus-visible:bg-black/5 dark:bg-black/40 transition-all custom-select"
                            {...register('companyName')}
                        >
                            {companies.map(c => <option key={c} value={c} className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]">{c}</option>)}
                        </select>
                        {errors.companyName && <span className="text-xs text-[var(--color-error)] mt-1">{errors.companyName.message}</span>}
                    </div>

                    <Input
                        label="Master Password"
                        type="password"
                        {...register('masterPassword')}
                        error={errors.masterPassword?.message}
                    />

                    <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                        {isSubmitting ? 'Unlocking...' : 'Unlock Database'}
                    </Button>
                </form>

                <div className="mt-8 border-t border-white/20 pt-6 text-center flex flex-col gap-4">
                    <button type="button" onClick={onCreateNew} className="text-sm font-medium text-[var(--color-text-primary)] hover:opacity-80 transition-opacity">
                        Create New Company
                    </button>
                </div>
            </div>
        </div>
    )
}
