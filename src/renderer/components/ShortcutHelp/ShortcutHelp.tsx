import React, { useState } from 'react'
import { X, Keyboard, Check, Info } from 'lucide-react'
import { useUIStore } from '../../stores/ui.store'
import { useShortcut } from '../../lib/shortcutManager'

interface ShortcutItem {
    combo: string
    description: string
    status: 'Available' | 'Contextual' | 'Not yet available'
}

interface ShortcutGroup {
    name: string
    shortcuts: ShortcutItem[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        name: 'General',
        shortcuts: [
            { combo: 'F1', description: 'Show Shortcut Help overlay', status: 'Available' },
            { combo: 'Ctrl+F1', description: 'Show contextual Help articles', status: 'Not yet available' },
            { combo: 'Esc', description: 'Close active overlay/modal or navigate back', status: 'Available' },
            { combo: 'Ctrl+S', description: 'Accept and save current master or voucher form', status: 'Contextual' },
            { combo: 'Alt+G', description: 'Open "Go To" command palette for quick actions', status: 'Available' },
            { combo: 'Ctrl+G', description: 'Open "Switch To" command palette', status: 'Available' },
            { combo: 'Alt+K', description: 'Open Company Management actions menu', status: 'Not yet available' },
            { combo: 'Alt+Y', description: 'Open Company Data management menu', status: 'Not yet available' },
            { combo: 'Alt+Z', description: 'Open Data Exchange / Send menu', status: 'Not yet available' },
            { combo: 'Alt+O', description: 'Open Import data menu', status: 'Not yet available' },
            { combo: 'Alt+M', description: 'Open Share / E-mail / WhatsApp menu', status: 'Not yet available' },
            { combo: 'Alt+P / Ctrl+P', description: 'Print current voucher or report', status: 'Contextual' },
            { combo: 'Alt+E / Ctrl+E', description: 'Export current voucher or report', status: 'Contextual' },
            { combo: 'Ctrl+K', description: 'Toggle screen display language (EN/HI)', status: 'Available' },
            { combo: 'Ctrl+W', description: 'Toggle keyboard data entry language', status: 'Not yet available' },
            { combo: 'F2', description: 'Change current voucher entry date', status: 'Not yet available' },
            { combo: 'Alt+F2', description: 'Change reporting period / active year', status: 'Not yet available' },
            { combo: 'F3', description: 'Switch active company', status: 'Not yet available' },
            { combo: 'Alt+F3', description: 'Select and load another company', status: 'Not yet available' },
            { combo: 'Ctrl+F3', description: 'Shut currently loaded company', status: 'Not yet available' },
            { combo: 'F11', description: 'Open Company Features setup screen', status: 'Not yet available' },
            { combo: 'F12', description: 'Open reporting configurations menu', status: 'Not yet available' },
            { combo: 'Ctrl+Q', description: 'Logout and quit current application session', status: 'Available' },
            { combo: 'Alt+F', description: 'Initiate find search within current report', status: 'Contextual' },
            { combo: 'Ctrl+N', description: 'Create a new voucher', status: 'Available' }
        ]
    },
    {
        name: 'Reports',
        shortcuts: [
            { combo: 'Enter', description: 'Drill down to view item details', status: 'Contextual' },
            { combo: 'Ctrl+Enter', description: 'Alter selected voucher or master from report', status: 'Contextual' },
            { combo: 'Space', description: 'Select or deselect line in report table', status: 'Available' },
            { combo: 'Shift+Space', description: 'Select or deselect active row', status: 'Available' },
            { combo: 'Alt+I', description: 'Insert new voucher into report', status: 'Not yet available' },
            { combo: 'Alt+2', description: 'Duplicate selected voucher', status: 'Not yet available' },
            { combo: 'Alt+D', description: 'Delete selected voucher entry', status: 'Not yet available' },
            { combo: 'Alt+A', description: 'Add new voucher to report', status: 'Not yet available' },
            { combo: 'Alt+X', description: 'Cancel selected voucher entry', status: 'Not yet available' },
            { combo: 'Ctrl+R', description: 'Remove / hide line entry from view', status: 'Contextual' },
            { combo: 'Ctrl+U', description: 'Restore last hidden line entry', status: 'Contextual' },
            { combo: 'Alt+U', description: 'Display all hidden line entries', status: 'Contextual' },
            { combo: 'Alt+F1 / Alt+F5', description: 'Toggle detailed or condensed format', status: 'Not yet available' },
            { combo: 'Alt+C', description: 'Add a new column to report table', status: 'Not yet available' },
            { combo: 'Alt+N', description: 'Auto repeat columns', status: 'Not yet available' },
            { combo: 'Ctrl+F / Alt+F12', description: 'Filter report details by condition', status: 'Contextual' },
            { combo: 'Ctrl+Alt+F', description: 'View applied filter details', status: 'Not yet available' },
            { combo: 'Ctrl+B', description: 'Change display values in report', status: 'Not yet available' },
            { combo: 'Ctrl+H', description: 'Change report display view layout', status: 'Not yet available' },
            { combo: 'Ctrl+J', description: 'View report exception entries list', status: 'Not yet available' },
            { combo: 'Shift+Enter', description: 'Expand or collapse details in table', status: 'Contextual' },
            { combo: 'Ctrl+Shift+End', description: 'Select rows from here to bottom', status: 'Not yet available' },
            { combo: 'Ctrl+Shift+Home', description: 'Select rows from here to top', status: 'Not yet available' },
            { combo: 'Ctrl+Alt+I', description: 'Invert selected items list', status: 'Not yet available' },
            { combo: 'Shift+Up / Down', description: 'Select multiple rows in sequence', status: 'Not yet available' },
            { combo: '+ / -', description: 'Increment / decrement report date', status: 'Not yet available' }
        ]
    },
    {
        name: 'Vouchers & Masters',
        shortcuts: [
            { combo: 'Ctrl+S', description: 'Save and accept master or voucher', status: 'Available' },
            { combo: 'Esc', description: 'Discard changes and close modal', status: 'Available' },
            { combo: 'Alt+D', description: 'Delete voucher', status: 'Available' },
            { combo: 'Alt+X', description: 'Cancel voucher', status: 'Available' },
            { combo: 'Ctrl+D', description: 'Remove item/ledger line in voucher', status: 'Available' },
            { combo: 'Ctrl+T', description: 'Mark voucher as Post-Dated', status: 'Not yet available' },
            { combo: 'Ctrl+F', description: 'Autofill details in stat vouchers', status: 'Not yet available' },
            { combo: 'Ctrl+H', description: 'Change voucher entry mode', status: 'Not yet available' },
            { combo: 'Alt+S', description: 'Open Stock Query report for selected item', status: 'Not yet available' },
            { combo: 'Ctrl+L', description: 'Mark voucher as Optional', status: 'Not yet available' },
            { combo: 'Ctrl+I', description: 'Add more details to master/voucher', status: 'Not yet available' },
            { combo: 'Alt+J', description: 'Define stat adjustments', status: 'Not yet available' },
            { combo: 'F10', description: 'View list of all voucher types', status: 'Not yet available' },
            { combo: 'Alt+R', description: 'Retrieve previous narration for party', status: 'Not yet available' },
            { combo: 'Ctrl+R', description: 'Retrieve previous narration for voucher type', status: 'Not yet available' },
            { combo: 'Alt+C', description: 'Open calculator from focused amount field', status: 'Not yet available' },
            { combo: 'Tab', description: 'Move to next input field', status: 'Available' },
            { combo: 'Shift+Tab', description: 'Move to previous input field', status: 'Available' },
            { combo: 'Backspace', description: 'Go back / remove text value', status: 'Available' },
            { combo: 'Ctrl+4', description: 'Insert base currency symbol in input', status: 'Available' }
        ]
    },
    {
        name: 'Voucher Types',
        shortcuts: [
            { combo: 'F4', description: 'Open Contra Voucher', status: 'Available' },
            { combo: 'F5', description: 'Open Payment Voucher', status: 'Available' },
            { combo: 'F6', description: 'Open Receipt Voucher', status: 'Available' },
            { combo: 'F7', description: 'Open Journal Voucher', status: 'Available' },
            { combo: 'F8', description: 'Open Sales Voucher', status: 'Available' },
            { combo: 'F9', description: 'Open Purchase Voucher', status: 'Available' },
            { combo: 'Alt+F5', description: 'Open Debit Note', status: 'Available' },
            { combo: 'Alt+F6', description: 'Open Credit Note', status: 'Available' },
            { combo: 'Alt+F7', description: 'Open Stock Journal', status: 'Not yet available' },
            { combo: 'Alt+F8', description: 'Open Delivery Note', status: 'Not yet available' },
            { combo: 'Alt+F9', description: 'Open Receipt Note', status: 'Not yet available' },
            { combo: 'Ctrl+F4', description: 'Open Payroll Voucher', status: 'Not yet available' },
            { combo: 'Ctrl+F5', description: 'Open Rejection Out', status: 'Not yet available' },
            { combo: 'Ctrl+F6', description: 'Open Rejection In', status: 'Not yet available' },
            { combo: 'Ctrl+F7', description: 'Open Physical Stock', status: 'Not yet available' },
            { combo: 'Ctrl+F8', description: 'Open Sales Order', status: 'Not yet available' },
            { combo: 'Ctrl+F9', description: 'Open Purchase Order', status: 'Not yet available' }
        ]
    },
    {
        name: 'Currency Symbols',
        shortcuts: [
            { combo: 'Ctrl+4', description: 'Insert Indian Rupee symbol (₹)', status: 'Available' },
            { combo: 'Ctrl+Shift+6', description: 'Insert UAE Dirham symbol', status: 'Not yet available' },
            { combo: 'Ctrl+Shift+7', description: 'Insert Saudi Riyal symbol', status: 'Not yet available' },
            { combo: 'Alt+0163', description: 'Insert Pound Sterling symbol (£)', status: 'Not yet available' },
            { combo: 'Alt+0128', description: 'Insert Euro symbol (€)', status: 'Not yet available' },
            { combo: 'Alt+0165', description: 'Insert Japanese Yen symbol (¥)', status: 'Not yet available' }
        ]
    }
]

export const ShortcutHelp: React.FC = () => {
    const { setShowShortcutHelp } = useUIStore()
    const [activeTab, setActiveTab] = useState<string>('General')
    const titleId = React.useId()

    const handleClose = () => {
        setShowShortcutHelp(false)
    }

    useShortcut('escape', handleClose, 'help', 'Close Shortcut Help')

    const currentGroup = SHORTCUT_GROUPS.find(g => g.name === activeTab) || SHORTCUT_GROUPS[0]

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={handleClose}>
            <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="bg-[#121318] w-full max-w-3xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-xl border border-[var(--color-accent)]/25">
                            <Keyboard size={24} />
                        </div>
                        <div>
                            <h2 id={titleId} className="text-xl font-bold text-white tracking-wide font-sans">Keyboard Shortcuts Help</h2>
                            <p className="text-xs text-white/50 font-sans mt-0.5">TallyPrime-compatible controls for navigation and operations</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close keyboard shortcuts"
                        className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs selection */}
                <div className="flex border-b border-white/5 bg-black/20 px-4 py-1 shrink-0 overflow-x-auto gap-1">
                    {SHORTCUT_GROUPS.map(g => (
                        <button
                            key={g.name}
                            onClick={() => setActiveTab(g.name)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg font-sans border border-transparent transition-all whitespace-nowrap ${
                                activeTab === g.name
                                    ? 'bg-white/10 text-white border-white/10 shadow-inner'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                            }`}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>

                {/* Body lists */}
                <div className="p-6 overflow-y-auto flex-1 bg-black/10">
                    <div className="space-y-2">
                        {currentGroup.shortcuts.map((s, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-white/95 font-sans leading-tight">{s.description}</span>
                                    <span className="text-[10px] text-white/35 font-sans tracking-wide">Category: {currentGroup.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Availability Status Pill */}
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                        s.status === 'Available' 
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                            : s.status === 'Contextual'
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                : 'bg-white/5 text-white/30 border border-white/5'
                                    }`}>
                                        {s.status}
                                    </span>
                                    <div className="flex gap-1 shrink-0">
                                        {s.combo.split('+').map((keyPart, keyIdx) => (
                                            <kbd key={keyIdx} className="px-2 py-1 rounded bg-[#20222a] border border-white/10 text-xs font-mono text-white/90 shadow-sm leading-none">
                                                {keyPart.trim()}
                                            </kbd>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer hints */}
                <div className="p-4 bg-white/5 border-t border-white/10 text-center shrink-0 flex items-center justify-center gap-6 text-[10px] text-white/30 select-none">
                    <span className="flex items-center gap-1"><Check size={11} className="text-green-400" /> Active shortcut matches standard TallyPrime</span>
                    <span className="flex items-center gap-1"><Info size={11} className="text-white/40" /> Press Esc to close this help overlay</span>
                </div>
            </div>
        </div>
    )
}
