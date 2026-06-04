import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// Set up mock window and document globals before importing
const mockListeners = new Set<(e: any) => void>()
const mockWindow = {
    addEventListener: vi.fn((event, handler) => {
        if (event === 'keydown') mockListeners.add(handler)
    }),
    removeEventListener: vi.fn((event, handler) => {
        if (event === 'keydown') mockListeners.delete(handler)
    }),
}
const mockDocument = {
    activeElement: null as any,
    body: {} as any
}

vi.stubGlobal('window', mockWindow)
vi.stubGlobal('document', mockDocument)

let normalizeCombo: any
let eventToCombo: any
let registerShortcut: any

describe('Shortcut Manager Unit Tests', () => {
    
    beforeAll(async () => {
        const mod = await import('./shortcutManager')
        normalizeCombo = mod.normalizeCombo
        eventToCombo = mod.eventToCombo
        registerShortcut = mod.registerShortcut
    })

    describe('normalizeCombo', () => {
        it('should normalize modifier order to standard order (ctrl+alt+shift+meta)', () => {
            expect(normalizeCombo('alt+ctrl+a')).toBe('ctrl+alt+a')
            expect(normalizeCombo('shift+alt+ctrl+meta+f5')).toBe('ctrl+alt+shift+meta+f5')
            expect(normalizeCombo('cmd+ctrl+z')).toBe('ctrl+meta+z')
        })

        it('should normalize special key names', () => {
            expect(normalizeCombo('ctrl+plus')).toBe('ctrl++')
            expect(normalizeCombo('ctrl+minus')).toBe('ctrl+-')
            expect(normalizeCombo('ctrl+spacebar')).toBe('ctrl+space')
            expect(normalizeCombo('shift+arrowup')).toBe('shift+up')
            expect(normalizeCombo('ctrl+pagedown')).toBe('ctrl+pgdn')
        })
    })

    describe('eventToCombo', () => {
        it('should extract matching combo from KeyboardEvent', () => {
            const event1 = {
                key: 'a',
                ctrlKey: true,
                altKey: true,
                shiftKey: false,
                metaKey: false
            } as KeyboardEvent

            expect(eventToCombo(event1)).toBe('ctrl+alt+a')

            const event2 = {
                key: 'ArrowDown',
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                metaKey: false
            } as KeyboardEvent

            expect(eventToCombo(event2)).toBe('shift+down')
        })
    })

    describe('Shortcut matching and precedence', () => {
        beforeEach(() => {
            mockDocument.activeElement = mockDocument.body
        })

        it('should invoke the matching shortcut', () => {
            const handler = vi.fn()
            const unregister = registerShortcut({
                combo: 'ctrl+a',
                context: 'global',
                description: 'test ctrl+a',
                handler
            })

            const event = {
                key: 'a',
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            } as any

            // Call mock listeners
            mockListeners.forEach(listener => listener(event))

            expect(handler).toHaveBeenCalledTimes(1)
            unregister()
        })

        it('should respect context precedence (modal > page > global)', () => {
            const globalHandler = vi.fn()
            const pageHandler = vi.fn()
            const modalHandler = vi.fn()

            const unreg1 = registerShortcut({ combo: 'escape', context: 'global', description: 'G', handler: globalHandler })
            const unreg2 = registerShortcut({ combo: 'escape', context: 'page', description: 'P', handler: pageHandler })
            const unreg3 = registerShortcut({ combo: 'escape', context: 'modal', description: 'M', handler: modalHandler })

            const event = {
                key: 'Escape',
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            } as any

            mockListeners.forEach(listener => listener(event))

            expect(modalHandler).toHaveBeenCalledTimes(1)
            expect(pageHandler).not.toHaveBeenCalled()
            expect(globalHandler).not.toHaveBeenCalled()

            unreg1()
            unreg2()
            unreg3()
        })

        it('should bypass plain characters when focused in inputs but allow command chords', () => {
            const mockInput = {
                tagName: 'INPUT'
            } as any
            mockDocument.activeElement = mockInput

            const plainHandler = vi.fn()
            const chordHandler = vi.fn()
            const escHandler = vi.fn()

            const unreg1 = registerShortcut({ combo: 'a', context: 'global', description: 'plain', handler: plainHandler })
            const unreg2 = registerShortcut({ combo: 'ctrl+a', context: 'global', description: 'chord', handler: chordHandler })
            const unreg3 = registerShortcut({ combo: 'escape', context: 'global', description: 'esc', handler: escHandler })

            // Send plain char key
            mockListeners.forEach(listener => listener({
                key: 'a',
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            } as any))
            expect(plainHandler).not.toHaveBeenCalled()

            // Send chord
            mockListeners.forEach(listener => listener({
                key: 'a',
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            } as any))
            expect(chordHandler).toHaveBeenCalledTimes(1)

            // Send Escape
            mockListeners.forEach(listener => listener({
                key: 'Escape',
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            } as any))
            expect(escHandler).toHaveBeenCalledTimes(1)

            unreg1()
            unreg2()
            unreg3()
        })
    })
})
