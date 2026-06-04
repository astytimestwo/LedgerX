import { getDb } from '../db/connection'
import { getSession } from './session'
import { hasPermission, Permission } from './rbac'

export async function requirePermission(sessionToken: string | undefined, permission: Permission) {
    if (!sessionToken) throw new Error('Unauthorized')

    const session = getSession(sessionToken)
    if (!session) throw new Error('Unauthorized')

    const db = getDb()
    const user = await db.selectFrom('users').selectAll().where('id', '=', session.id).executeTakeFirst()

    if (!user || !user.is_active || !hasPermission({ role: user.role, permissions_json: user.permissions_json }, permission)) {
        throw new Error('Forbidden: Insufficient privileges')
    }

    return session
}

export async function requireAdmin(sessionToken: string | undefined) {
    if (!sessionToken) throw new Error('Unauthorized')

    const session = getSession(sessionToken)
    if (!session) throw new Error('Unauthorized')

    const db = getDb()
    const user = await db.selectFrom('users').selectAll().where('id', '=', session.id).executeTakeFirst()

    if (!user || !user.is_active || user.role !== 'admin') {
        throw new Error('Forbidden: Admin privileges required')
    }

    return session
}
