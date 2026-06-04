import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', label, error, id, ...props }, ref) => {
        const generatedId = React.useId()
        const inputId = id || props.name || generatedId
        const errorId = error ? `${inputId}-error` : undefined

        return (
            <div className="flex flex-col gap-3 w-full relative">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    type={type}
                    aria-invalid={!!error}
                    aria-describedby={errorId}
                    className={cn(
                        'flex h-10 w-full rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3 py-2 text-sm text-[var(--color-text-primary)] backdrop-blur-md ring-offset-[var(--color-bg-base)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-white/20 dark:focus-visible:bg-black/5 dark:bg-black/40 transition-all disabled:cursor-not-allowed disabled:opacity-50',
                        {
                            'border-[var(--color-error)]': !!error
                        },
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <span id={errorId} role="alert" className="text-xs text-[var(--color-error)] mt-1">{error}</span>}
            </div>
        )
    }
)
Input.displayName = 'Input'
