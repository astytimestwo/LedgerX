import crypto from 'crypto'

const SESSION_TTL_MS = 60 * 60 * 1000 // 60 minutes

export interface SessionData {
    id: string
    username: string
    role: string
    expiresAt: number
}

const sessions = new Map<string, SessionData>()

let cleanupInterval: NodeJS.Timeout | null = null

export function createSession(user: Omit<SessionData, 'expiresAt'>, previousToken?: string): string {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + SESSION_TTL_MS
    sessions.set(token, { ...user, expiresAt })

    if (previousToken) {
        sessions.delete(previousToken)
    }

    return token
}

export function getSession(token: string): SessionData | undefined {
    const session = sessions.get(token)
    if (session && session.expiresAt < Date.now()) {
        sessions.delete(token)
        return undefined
    }
    if (session) {
        session.expiresAt = Date.now() + SESSION_TTL_MS
    }
    return session
}

export function destroySession(token: string): void {
    sessions.delete(token)
}

export function destroyUserSessions(userId: string): void {
    const tokensToRemove: string[] = []
    for (const [token, data] of sessions.entries()) {
        if (data.id === userId) {
            tokensToRemove.push(token)
        }
    }
    for (const token of tokensToRemove) {
        sessions.delete(token)
    }
}

export function cleanupExpiredSessions(): void {
    const now = Date.now()
    for (const [token, data] of sessions.entries()) {
        if (data.expiresAt < now) {
            sessions.delete(token)
        }
    }
}

export function startSessionCleanup(intervalMs: number = 10 * 60 * 1000): void {
    if (cleanupInterval) return
    cleanupInterval = setInterval(cleanupExpiredSessions, intervalMs)
    cleanupExpiredSessions()
}

export function stopSessionCleanup(): void {
    if (cleanupInterval) {
        clearInterval(cleanupInterval)
        cleanupInterval = null
    }
}
