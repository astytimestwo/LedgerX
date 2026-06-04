import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useUIStore } from '../../stores/ui.store'
import { Search, FileText, BookOpen, Box, ArrowRight, X } from 'lucide-react'

export const GlobalSearch: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
    const { showSearch, setShowSearch } = useUIStore()
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const titleId = React.useId()
    const listId = React.useId()

    // Debounce input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(timer)
    }, [query])

    // Focus input when opened
    useEffect(() => {
        if (showSearch) {
            setTimeout(() => inputRef.current?.focus(), 50)
            setQuery('')
            setSelectedIndex(0)
        }
    }, [showSearch])

    const { data: results = [], isLoading } = useQuery({
        queryKey: ['globalSearch', debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 2) return []
            return await api.search.global(debouncedQuery)
        },
        enabled: debouncedQuery.length >= 2,
    })

    const handleSelect = useCallback((item: any) => {
        // Navigate based on type
        if (item.type === 'ledger') {
            onNavigate('ledger')
        } else if (item.type === 'voucher') {
            onNavigate('daybook')
        } else if (item.type === 'hsn') {
            onNavigate('hsn_master')
        }
        setShowSearch(false)
    }, [onNavigate, setShowSearch])

    const closeSearch = useCallback(() => setShowSearch(false), [setShowSearch])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            closeSearch()
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault()
            const selected = results[selectedIndex]
            if (selected) {
                handleSelect(selected)
            }
        }
    }, [results, selectedIndex, setSelectedIndex, handleSelect, closeSearch])

    useEffect(() => {
        if (!showSearch) return

        window.addEventListener('keydown', handleKeyDown as EventListener, { capture: true })
        return () => window.removeEventListener('keydown', handleKeyDown as EventListener, { capture: true })
    }, [showSearch, handleKeyDown])

    if (!showSearch) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-[100] px-4 animate-in fade-in duration-200">
            {/* Click outside to close wrapper */}
            <div className="absolute inset-0 z-0" onClick={closeSearch} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={handleKeyDown}
                className="bg-[#1a1c23] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-top-4 duration-300"
            >
                <div className="relative flex items-center p-4 border-b border-white/10 shrink-0">
                    <Search className="absolute left-6 text-white/50" size={20} />
                    <h2 id={titleId} className="sr-only">Global Search</h2>
                    <input
                        ref={inputRef}
                        type="text"
                        aria-label="Search ledgers, vouchers, or HSN codes"
                        aria-controls={listId}
                        aria-activedescendant={results.length > 0 ? `global-search-result-${selectedIndex}` : undefined}
                        placeholder="Search ledgers, vouchers, or HSN codes..."
                        className="w-full bg-transparent border-none text-lg text-[var(--color-text-primary)] placeholder-white/30 pl-12 pr-12 outline-none"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                    />
                    <button
                        type="button"
                        onClick={closeSearch}
                        aria-label="Close global search"
                        className="absolute right-4 p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    {isLoading && (
                        <div className="absolute right-14 w-4 h-4 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
                    )}
                </div>

                <div id={listId} className="max-h-[60vh] overflow-y-auto">
                    {query.length > 0 && query.length < 2 && (
                        <div className="p-8 text-center text-sm text-white/40">
                            Type at least 2 characters to search...
                        </div>
                    )}

                    {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
                        <div className="p-8 text-center text-sm text-white/40">
                            No results found for {debouncedQuery}
                        </div>
                    )}

                    {results.length > 0 && (
                        <ul className="p-2 space-y-1" role="listbox" aria-label="Search results">
                            {(() => {
                                const grouped: Record<string, typeof results> = {}
                                results.forEach(r => {
                                    const key = r.type || 'other'
                                    if (!grouped[key]) grouped[key] = []
                                    grouped[key].push(r)
                                })

                                const groupLabels: Record<string, string> = {
                                    ledger: 'Ledger Accounts',
                                    voucher: 'Vouchers',
                                    hsn: 'HSN / SAC Codes'
                                }

                                const groupOrder = ['ledger', 'voucher', 'hsn']
                                let globalIndex = 0

                                return groupOrder.filter(g => grouped[g]?.length > 0).map(groupKey => (
                                    <li key={groupKey}>
                                        <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                                            {groupLabels[groupKey] || groupKey}
                                        </div>
                                        {grouped[groupKey].map(r => {
                                            const i = globalIndex++
                                            const active = i === selectedIndex

                                            let Icon = FileText
                                            let iconColor = 'text-blue-400'
                                            if (r.type === 'ledger') { Icon = BookOpen; iconColor = 'text-green-400' }
                                            if (r.type === 'hsn') { Icon = Box; iconColor = 'text-purple-400' }

                                            return (
                                                <li
                                                    key={`${r.type}-${r.id}`}
                                                    id={`global-search-result-${i}`}
                                                    role="option"
                                                    aria-selected={active}
                                                    onClick={() => handleSelect(r)}
                                                    onMouseEnter={() => setSelectedIndex(i)}
                                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-[var(--color-accent)]/20' : 'hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg bg-white/10 dark:bg-black/20 ${iconColor}`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sm text-[var(--color-text-primary)] leading-tight">{r.label}</p>
                                                            {r.subtitle && <p className="text-xs text-white/50 mt-1">{r.subtitle}</p>}
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={16} className={`transition-opacity ${active ? 'opacity-100 text-[var(--color-accent)]' : 'opacity-0'}`} />
                                                </li>
                                            )
                                        })}
                                    </li>
                                ))
                            })()}
                        </ul>
                    )}
                </div>

                {/* Footer hints */}
                <div className="bg-white/10 dark:bg-black/20 p-3 px-6 border-t border-white/5 flex items-center gap-6 text-xs text-white/40 shrink-0">
                    <span className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">↑↓</kbd> to navigate
                    </span>
                    <span className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">Enter</kbd> to select
                    </span>
                    <span className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">Esc</kbd> to close
                    </span>
                </div>
            </div>
        </div>
    )
}
