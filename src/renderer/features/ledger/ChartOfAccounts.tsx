import React, { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { ChevronRight, ChevronDown, FolderOpen, FileText, Plus } from 'lucide-react'
import { LedgerAccountFormModal } from './LedgerAccountFormModal'
import { Button } from '../../components/Button/Button'
import { useShortcut } from '../../lib/shortcutManager'
import { toast } from '../../stores/toast.store'

export const ChartOfAccounts: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ['ledger-groups'],
        queryFn: () => api.getLedgerGroups()
    })

    const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['ledger-accounts'],
        queryFn: () => api.getLedgerAccounts()
    })

    // Manage expanded groups at top level
    const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())
    const [selectedIdx, setSelectedIdx] = useState<number>(0)

    // Compute tree structure
    const tree = useMemo(() => {
        if (!groups.length) return []

        const groupMap = new Map<string, any>()
        const roots: any[] = []

        // Initialize maps
        groups.forEach(g => {
            groupMap.set(g.id, { ...g, children: [], accounts: [] })
        })

        // Attach accounts
        accounts.forEach(a => {
            const groupNode = groupMap.get(a.group_id)
            if (groupNode) {
                groupNode.accounts.push(a)
            }
        })

        // Build tree
        groups.forEach(g => {
            const node = groupMap.get(g.id)
            if (g.parent_id) {
                const parentNode = groupMap.get(g.parent_id)
                if (parentNode) {
                    parentNode.children.push(node)
                } else {
                    roots.push(node) // Fallback if parent not found
                }
            } else {
                roots.push(node)
            }
        })

        // Sort Roots by Nature standard order: Assets, Liabilities, Income, Expense
        const order = { 'Assets': 1, 'Liabilities': 2, 'Income': 3, 'Expense': 4 }
        roots.sort((a, b) => (order[a.nature as keyof typeof order] || 99) - (order[b.nature as keyof typeof order] || 99))

        return roots
    }, [groups, accounts])

    // Expand all groups by default on first load
    useEffect(() => {
        if (groups.length > 0 && expandedGroupIds.size === 0) {
            setExpandedGroupIds(new Set(groups.map(g => g.id)))
        }
    }, [groups])

    // Flatten tree to visible items list for roving focus selection
    const visibleFlatList = useMemo(() => {
        const list: any[] = []

        const traverse = (node: any, level: number) => {
            list.push({
                id: node.id,
                type: 'group',
                name: node.name,
                nature: node.nature,
                level,
                raw: node
            })

            if (expandedGroupIds.has(node.id)) {
                node.children.forEach((child: any) => traverse(child, level + 1))
                node.accounts.forEach((acc: any) => {
                    list.push({
                        id: acc.id,
                        type: 'account',
                        name: acc.name,
                        code: acc.code,
                        opening_balance: acc.opening_balance,
                        opening_type: acc.opening_type,
                        level: level + 1,
                        raw: acc
                    })
                })
            }
        }

        tree.forEach(root => traverse(root, 0))
        return list
    }, [tree, expandedGroupIds])

    // Keep active selected row in view
    useEffect(() => {
        const container = document.querySelector('.tree-container')
        const activeRow = container?.querySelector('[data-active="true"]')
        if (activeRow) {
            activeRow.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIdx])

    // Keyboard navigation register on context page
    const hasRows = visibleFlatList.length > 0

    useShortcut('up', () => {
        setSelectedIdx(p => Math.max(0, p - 1))
    }, 'page', 'Select previous group/account', { disabled: !hasRows })

    useShortcut('down', () => {
        setSelectedIdx(p => Math.min(visibleFlatList.length - 1, p + 1))
    }, 'page', 'Select next group/account', { disabled: !hasRows })

    useShortcut('home', () => {
        setSelectedIdx(0)
    }, 'page', 'Select first item', { disabled: !hasRows })

    useShortcut('end', () => {
        setSelectedIdx(visibleFlatList.length - 1)
    }, 'page', 'Select last item', { disabled: !hasRows })

    useShortcut(['enter', 'shift+enter', 'alt+enter'], () => {
        const item = visibleFlatList[selectedIdx]
        if (!item) return
        if (item.type === 'group') {
            setExpandedGroupIds(prev => {
                const next = new Set(prev)
                if (next.has(item.id)) {
                    next.delete(item.id)
                } else {
                    next.add(item.id)
                }
                return next
            })
        } else {
            toast.info(`Shortcut recognized: Edit account "${item.name}" is not available yet.`)
        }
    }, 'page', 'Expand/collapse group or edit account', { disabled: !hasRows })

    useShortcut('left', () => {
        const item = visibleFlatList[selectedIdx]
        if (!item) return
        if (item.type === 'group' && expandedGroupIds.has(item.id)) {
            // Collapse
            setExpandedGroupIds(prev => {
                const next = new Set(prev)
                next.delete(item.id)
                return next
            })
        } else {
            // Jump to parent group
            const parentId = item.raw.parent_id || item.raw.group_id
            if (parentId) {
                const parentIdx = visibleFlatList.findIndex(x => x.id === parentId)
                if (parentIdx !== -1) {
                    setSelectedIdx(parentIdx)
                }
            }
        }
    }, 'page', 'Collapse group or move focus to parent', { disabled: !hasRows })

    useShortcut('right', () => {
        const item = visibleFlatList[selectedIdx]
        if (!item) return
        if (item.type === 'group') {
            if (!expandedGroupIds.has(item.id)) {
                // Expand
                setExpandedGroupIds(prev => {
                    const next = new Set(prev)
                    next.add(item.id)
                    return next
                })
            } else {
                // Select first child / account inside
                setSelectedIdx(p => Math.min(visibleFlatList.length - 1, p + 1))
            }
        }
    }, 'page', 'Expand group or move focus to child', { disabled: !hasRows })

    if (isLoadingGroups || isLoadingAccounts) {
        return <div className="p-4 text-[var(--color-text-muted)]">Loading chart of accounts...</div>
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white tracking-wide">Chart of Accounts</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    New Account
                </Button>
            </div>

            <div className="tree-container bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-xl border border-white/20 dark:border-white/10 rounded-xl flex-1 overflow-auto py-2">
                {visibleFlatList.map((item, index) => {
                    const isSelected = index === selectedIdx

                    if (item.type === 'group') {
                        const isExpanded = expandedGroupIds.has(item.id)
                        const hasChildren = item.raw.children.length > 0 || item.raw.accounts.length > 0

                        return (
                            <div
                                key={item.id}
                                data-active={isSelected}
                                onClick={() => setSelectedIdx(index)}
                                className={`flex items-center h-10 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer group transition-colors rounded-md mx-2 ${
                                    isSelected ? 'bg-[var(--color-accent)]/20 text-white font-semibold border-l-2 border-[var(--color-accent)]' : ''
                                }`}
                                style={{ paddingLeft: `${item.level * 24 + 8}px` }}
                            >
                                <div className="w-5 flex justify-center text-[var(--color-text-muted)]">
                                    {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                                </div>
                                <FolderOpen size={14} className="text-[var(--color-accent)] mx-2" />
                                <span className="text-sm text-[var(--color-text-primary)]">{item.name}</span>
                                <span className="ml-4 text-[11px] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                                    ({item.nature})
                                </span>
                            </div>
                        )
                    } else {
                        return (
                            <div
                                key={item.id}
                                data-active={isSelected}
                                onClick={() => setSelectedIdx(index)}
                                className={`flex items-center h-10 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer transition-colors rounded-md mx-2 ${
                                    isSelected ? 'bg-[var(--color-accent)]/25 text-white font-semibold border-l-2 border-[var(--color-accent)]' : ''
                                }`}
                                style={{ paddingLeft: `${item.level * 24 + 8 + 20}px` }}
                            >
                                <FileText size={14} className="text-[var(--color-text-muted)] mr-2" />
                                <span className="text-sm font-mono text-[var(--color-text-secondary)] mr-3">{item.code}</span>
                                <span className="text-sm text-[var(--color-text-primary)]">{item.name}</span>

                                <div className="ml-auto mr-4 flex gap-4 text-xs font-mono">
                                    <span>{item.opening_balance > 0 ? (item.opening_balance / 100).toFixed(2) : '-'}</span>
                                    <span className={item.opening_type === 'dr' ? 'text-[var(--color-debit)] w-4' : 'text-[var(--color-credit)] w-4'}>
                                        {item.opening_balance > 0 ? item.opening_type.toUpperCase() : ''}
                                    </span>
                                </div>
                            </div>
                        )
                    }
                })}

                {visibleFlatList.length === 0 && (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        No accounts configured.
                    </div>
                )}
            </div>

            <LedgerAccountFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
