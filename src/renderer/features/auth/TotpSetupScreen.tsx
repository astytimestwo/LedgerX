import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { totpSchema, TotpInput } from '../../../shared/types'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { api } from '../../lib/api'
import { useSessionStore } from '../../stores/session.store'

interface TotpSetupProps {
    userId: string
    onComplete: () => void
    isVerification?: boolean
    companyName?: string
    sessionToken?: string
}

export const TotpSetupScreen: React.FC<TotpSetupProps> = ({ userId, onComplete, isVerification = false, companyName, sessionToken: propSessionToken }) => {
    const [error, setError] = useState<string | null>(null)
    const [qrUrl, setQrUrl] = useState<string>('')
    const [secret, setSecret] = useState<string>('')
    const [localSessionToken] = useState<string>(propSessionToken || '')
    const { setUser, companyName: storeCompanyName } = useSessionStore()

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TotpInput>({
        resolver: zodResolver(totpSchema)
    })

    useEffect(() => {
        if (isVerification) {
            // During verification, we don't need a new secret - just prompt for token
            // The secret is stored server-side and retrieved during verifyTotp
            return
        }
        // Only generate new secret during initial TOTP setup
        api.setupTotp({ userId }).then((res: any) => {
            setSecret(res.secret)
            setQrUrl(res.qrUrl)
        })
    }, [userId, isVerification])

    const onSubmit = async (data: TotpInput) => {
        try {
            const tokenToUse = propSessionToken || localSessionToken
            const res = await api.verifyTotp({ companyName: companyName || storeCompanyName!, sessionToken: tokenToUse, token: data.token })
            if (res.success && res.user && res.sessionToken) {
                setUser(res.user, res.sessionToken)
                onComplete()
            } else {
                setError('Invalid TOTP token')
            }
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)]" style={{ backgroundImage: "url('../assets/bg-login.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="w-[420px] rounded-2xl bg-[var(--color-bg-surface)] backdrop-blur-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10">
                <h1 className="text-3xl font-extrabold mb-8 text-center text-[var(--color-text-primary)] tracking-tight">{isVerification ? 'Verify 2FA' : 'Setup 2FA'}</h1>

                {error && <div className="mb-4 text-[var(--color-error)] text-sm">{error}</div>}

                {qrUrl && !isVerification && (
                    <div className="mb-6 flex flex-col items-center">
                        <img src={qrUrl} alt="TOTP QR Code" className="w-48 h-48 rounded-lg" />
                        <p className="mt-3 text-sm text-[var(--color-text-muted)]">Scan this QR code with your authenticator app</p>
                        {secret && <p className="mt-2 text-xs text-[var(--color-text-muted)] font-mono">Manual key: {secret}</p>}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <Input
                        label="6-Digit Token"
                        maxLength={6}
                        placeholder="000000"
                        {...register('token')}
                        error={errors.token?.message}
                    />

                    <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                        {isSubmitting ? 'Verifying...' : (isVerification ? 'Verify' : 'Setup & Verify')}
                    </Button>
                </form>
            </div>
        </div>
    )
}
