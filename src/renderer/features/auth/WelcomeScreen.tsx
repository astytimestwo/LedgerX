import React from 'react'
import { Server, ArrowRight } from 'lucide-react'
import bgLogin from '../../assets/bg-login.png'

interface WelcomeScreenProps {
    onCreateNew: () => void
    onOpenExisting: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateNew, onOpenExisting }) => {
    return (
        <div className="flex h-screen w-screen relative items-center justify-center bg-[var(--color-bg-base)]" style={{ backgroundImage: `url(${bgLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

            <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-center h-32 w-32 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-8">
                    <Server size={64} className="text-white drop-shadow-lg" strokeWidth={1} />
                </div>

                <h1 className="text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                    LedgerX
                </h1>

                <p className="text-lg text-white/70 tracking-wide font-medium mb-12 max-w-sm text-center">
                    The next-generation encrypted accounting engine.
                </p>

                <div className="flex flex-col gap-4 w-64">
                    <button
                        onClick={onCreateNew}
                        className="group relative flex items-center justify-center gap-3 bg-[var(--color-accent)] hover:bg-opacity-90 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10">Create New Company</span>
                        <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                    </button>
                    <button
                        onClick={onOpenExisting}
                        className="group relative flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10">Open Existing Company</span>
                    </button>
                </div>
            </div>

            {/* Bottom Credits */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs font-semibold uppercase tracking-widest text-center">
                Secure • Offline • Blazing Fast
            </div>
        </div>
    )
}
