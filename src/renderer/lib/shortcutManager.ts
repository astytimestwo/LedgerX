import { useEffect } from 'react'

export type ShortcutContext = 'global' | 'page' | 'modal' | 'palette' | 'help'

export interface Shortcut {
    combo: string // e.g. "ctrl+a", "f1", "shift+up"
    context: ShortcutContext
    description: string
    handler: (e: KeyboardEvent) => void
    preventDefault?: boolean
}

const CONTEXT_PRIORITIES: Record<ShortcutContext, number> = {
    palette: 5,
    help: 4,
    modal: 3,
    page: 2,
    global: 1
}

let registeredShortcuts: Shortcut[] = []

export function normalizeCombo(combo: string): string {
    const parts = combo.toLowerCase().split('+')
    const modifiers = {
        ctrl: parts.includes('ctrl'),
        alt: parts.includes('alt'),
        shift: parts.includes('shift'),
        meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('win'),
    }
    const key = parts.filter(p => !['ctrl', 'alt', 'shift', 'meta', 'cmd', 'win'].includes(p)).join('+')

    const normalizedParts: string[] = []
    if (modifiers.ctrl) normalizedParts.push('ctrl')
    if (modifiers.alt) normalizedParts.push('alt')
    if (modifiers.shift) normalizedParts.push('shift')
    if (modifiers.meta) normalizedParts.push('meta')

    let normKey = key
    if (normKey === 'plus') normKey = '+'
    if (normKey === 'minus') normKey = '-'
    if (normKey === 'spacebar') normKey = 'space'
    if (normKey === 'arrowup') normKey = 'up'
    if (normKey === 'arrowdown') normKey = 'down'
    if (normKey === 'arrowleft') normKey = 'left'
    if (normKey === 'arrowright') normKey = 'right'
    if (normKey === 'pageup') normKey = 'pgup'
    if (normKey === 'pagedown') normKey = 'pgdn'

    normalizedParts.push(normKey)
    return normalizedParts.join('+')
}

export function eventToCombo(e: KeyboardEvent): string {
    const parts: string[] = []
    if (e.ctrlKey) parts.push('ctrl')
    if (e.altKey) parts.push('alt')
    if (e.shiftKey) parts.push('shift')
    if (e.metaKey) parts.push('meta')

    let key = e.key.toLowerCase()
    if (key === ' ') key = 'space'
    if (key === 'arrowup') key = 'up'
    if (key === 'arrowdown') key = 'down'
    if (key === 'arrowleft') key = 'left'
    if (key === 'arrowright') key = 'right'
    if (key === 'pageup') key = 'pgup'
    if (key === 'pagedown') key = 'pgdn'

    parts.push(key)
    return parts.join('+')
}

function isInputActive(): boolean {
    const el = document.activeElement
    if (!el) return false
    const tagName = el.tagName
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable
}

// Register shortcut globally
export function registerShortcut(shortcut: Shortcut): () => void {
    registeredShortcuts.push(shortcut)
    return () => {
        registeredShortcuts = registeredShortcuts.filter(s => s !== shortcut)
    }
}

// Global window event listener for keydown events
function handleKeyDown(e: KeyboardEvent) {
    const isInput = isInputActive()
    
    // Check if user is focused on an input. If so, bypass unless it's a command chord (modifier + key) or F-key or Esc.
    if (isInput) {
        const hasCmdModifier = e.ctrlKey || e.altKey || e.metaKey
        const isFuncKey = /^f\d+$/i.test(e.key)
        const isEsc = e.key === 'Escape'
        
        if (!hasCmdModifier && !isFuncKey && !isEsc) {
            return
        }
    }

    const eventCombo = eventToCombo(e)
    const matches = registeredShortcuts.filter(s => normalizeCombo(s.combo) === eventCombo)

    if (matches.length === 0) return

    // Find the one with highest context priority
    let bestMatch: Shortcut | null = null
    let highestPriority = -1

    for (const match of matches) {
        const priority = CONTEXT_PRIORITIES[match.context] || 0
        if (priority > highestPriority) {
            highestPriority = priority
            bestMatch = match
        }
    }

    if (bestMatch) {
        if (bestMatch.preventDefault !== false) {
            e.preventDefault()
            e.stopPropagation()
        }
        bestMatch.handler(e)
    }
}

// Attach event listener
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown, { capture: true })
}

// React Hook helper
export function useShortcut(
    combo: string | string[],
    handler: (e: KeyboardEvent) => void,
    context: ShortcutContext,
    description: string,
    options: { preventDefault?: boolean; disabled?: boolean } = {}
) {
    useEffect(() => {
        if (options.disabled) return

        const combos = Array.isArray(combo) ? combo : [combo]
        const unregisters = combos.map(c =>
            registerShortcut({
                combo: c,
                context,
                description,
                handler,
                preventDefault: options.preventDefault
            })
        )

        return () => {
            unregisters.forEach(unreg => unreg())
        }
    }, [combo, handler, context, description, options.disabled, options.preventDefault])
}
