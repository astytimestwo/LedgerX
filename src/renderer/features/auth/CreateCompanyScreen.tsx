import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCompanySchema, CreateCompanyInput } from '../../../shared/types'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { api } from '../../lib/api'
import bgLogin from '../../assets/bg-login.png'

export const CreateCompanyScreen: React.FC = () => {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateCompanyInput>({
        resolver: zodResolver(createCompanySchema)
    })

    const onSubmit = async (data: CreateCompanyInput) => {
        try {
            const res = await api.createCompany(data)
            if (res.success) {
                setSuccess(true)
                setTimeout(() => window.location.reload(), 1500)
            } else {
                setError(res.error || 'Failed to create company')
            }
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)]" style={{ backgroundImage: `url(${bgLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="w-[480px] rounded-2xl bg-[var(--color-bg-surface)] backdrop-blur-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10">
                <h1 className="text-3xl font-extrabold mb-8 text-[var(--color-text-primary)] tracking-tight">Create New Company</h1>

                {error && <div className="mb-4 text-[var(--color-error)] text-sm">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <Input
                        label="Company Name"
                        {...register('companyName')}
                        error={errors.companyName?.message}
                    />

                    <div className="flex gap-5">
                        <Input
                            label="GSTIN (Optional)"
                            {...register('gstin')}
                            error={errors.gstin?.message}
                        />
                        <Input
                            label="State (e.g., MH)"
                            {...register('state')}
                            error={errors.state?.message}
                        />
                    </div>

                    <Input
                        label="Financial Year Start (YYYY-MM-DD)"
                        type="text"
                        placeholder="2026-04-01"
                        {...register('financialYearStart')}
                        error={errors.financialYearStart?.message}
                    />

                    <Input
                        label="Master Password (min 8 chars)"
                        type="password"
                        {...register('masterPassword')}
                        error={errors.masterPassword?.message}
                    />
                    <p className="text-sm text-[var(--color-error)] -mt-3">Important: There is no password recovery. Store this securely.</p>

                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/20 text-green-400 text-sm text-center">
                            Company created successfully! Redirecting...
                        </div>
                    )}

                    <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                        {isSubmitting ? 'Creating...' : 'Create Company'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
