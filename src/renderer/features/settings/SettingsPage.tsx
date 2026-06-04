import React, { useState } from 'react'
import { BackupSettings } from './BackupSettings'
import { FinancialYearSettings } from './FinancialYearSettings'
import { Settings, Calendar } from 'lucide-react'

export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'backup' | 'fy'>('fy')

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
            <div className="flex items-center gap-4 px-6 py-4 mx-6 mt-6 mb-4 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <button
                    onClick={() => setActiveTab('fy')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'fy' ? 'bg-[var(--color-accent)] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                    <Calendar size={18} /> Financial Year
                </button>
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'backup' ? 'bg-[var(--color-accent)] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                    <Settings size={18} /> Backup & Sync
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'backup' && <BackupSettings />}
                {activeTab === 'fy' && <FinancialYearSettings />}
            </div>
        </div>
    )
}
