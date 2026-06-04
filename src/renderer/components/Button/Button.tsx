import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg backdrop-blur-md border border-white/20 h-10 px-6': variant === 'primary',
                        'bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/5 dark:bg-black/40 border border-white/20 dark:border-white/10 text-[var(--color-text-primary)] backdrop-blur-md shadow-sm h-10 px-6': variant === 'secondary',
                        'bg-[var(--color-error)]/80 hover:bg-[var(--color-error)] text-white shadow-lg backdrop-blur-md border border-white/20 h-10 px-6': variant === 'destructive',
                        'h-8 w-8 p-0 hover:bg-white/10 dark:hover:bg-white/10 dark:bg-black/20 rounded-lg backdrop-blur-sm transition-colors': variant === 'icon'
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'
