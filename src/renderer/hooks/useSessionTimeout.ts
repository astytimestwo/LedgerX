import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '../stores/session.store'

export function useSessionTimeout(timeoutMinutes: number = 15) {
    const user = useSessionStore(state => state.user)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        if (user) {
            timeoutRef.current = setTimeout(() => {
                console.log(`Session expired due to ${timeoutMinutes} minutes of inactivity. Logging out.`)
                useSessionStore.getState().logout()
            }, timeoutMinutes * 60 * 1000)
        }
    }, [user, timeoutMinutes])

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

        const handleActivity = () => {
            resetTimer()
        }

        if (user) {
            resetTimer()
            events.forEach(event => window.addEventListener(event, handleActivity))
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            events.forEach(event => window.removeEventListener(event, handleActivity))
        }
    }, [user, timeoutMinutes])
}
