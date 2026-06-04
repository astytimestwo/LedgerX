import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    previousUrl: string | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        previousUrl: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, previousUrl: document.referrer || null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        try {
            const w = window as any
            if (w.api && w.api.log) {
                w.api.log.error(error.stack || error.message)
            }
        } catch (e) {
            console.error('Failed to report error to logging API:', error)
        }
    }

    private handleReload = () => {
        window.location.reload()
    }

    private handleGoBack = () => {
        if (this.state.previousUrl) {
            window.location.href = this.state.previousUrl
        } else {
            window.history.back()
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-screen items-center justify-center bg-[#111] text-white p-6">
                    <div className="bg-[#1a1c23] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-500/10">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 tracking-wide text-white">LedgerX Encountered a Problem</h1>
                        <p className="text-white/60 mb-6 text-sm">
                            An unexpected error occurred in the application view. Your data is safe, but the current screen could not be rendered.
                        </p>

                        {this.state.error && (
                            <div className="bg-black/5 dark:bg-black/40 p-4 rounded-lg border border-red-500/20 w-full mb-8 overflow-auto max-h-32 text-left">
                                <p className="font-mono text-xs text-red-400 font-medium">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={this.handleGoBack}
                            className="flex items-center gap-2 px-4 py-2 rounded border border-white/20 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Go Back
                        </button>
                        <button
                            onClick={this.handleReload}
                            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all justify-center"
                        >
                            <RefreshCw size={18} />
                            Reload Application
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
