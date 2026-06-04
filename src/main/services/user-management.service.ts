import { getDb } from '../db/connection'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { destroyUserSessions } from '../lib/session'

export class UserManagementService {
    async listUsers() {
        const db = getDb()
        const users = await db.selectFrom('users')
            .select(['id', 'username', 'role', 'is_active', 'created_at', 'updated_at', 'permissions_json'])
            .execute()
        return users
    }

    async createUser(data: any) {
        const db = getDb()

        // Validate username: alphanumerics, underscores, hyphens only (prevents special chars)
        if (!data.username || !/^[a-zA-Z0-9_-]{3,64}$/.test(data.username)) {
            throw new Error('Username must be 3-64 characters and contain only letters, numbers, underscores, hyphens')
        }

        // Validate password length
        if (!data.password || data.password.length < 8) {
            throw new Error('Password must be at least 8 characters')
        }

        const passwordHash = await bcrypt.hash(data.password, 12)

        await db.insertInto('users').values({
            id: crypto.randomUUID(),
            username: data.username,
            password_hash: passwordHash,
            totp_secret: '', // Handled separately or during setup
            role: data.role,
            permissions: null,
            permissions_json: data.permissions_json ? JSON.stringify(data.permissions_json) : null,
            is_active: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).execute()

        return { success: true }
    }

    async updateUser(id: string, data: any) {
        const db = getDb()
        const updateData: any = {
            role: data.role,
            is_active: data.is_active,
            permissions_json: data.permissions_json ? JSON.stringify(data.permissions_json) : null,
            updated_at: new Date().toISOString()
        }

        if (data.password) {
            updateData.password_hash = await bcrypt.hash(data.password, 12)
        }

        await db.updateTable('users')
            .set(updateData)
            .where('id', '=', id)
            .execute()

        return { success: true }
    }

    async deactivateUser(id: string) {
        const db = getDb()
        await db.updateTable('users')
            .set({ is_active: 0, updated_at: new Date().toISOString() })
            .where('id', '=', id)
            .execute()
        return { success: true }
    }

    async resetPassword(id: string, newPassword: string) {
        // Enforce minimum password length on resets
        if (!newPassword || newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters')
        }

        const db = getDb()
        const passwordHash = await bcrypt.hash(newPassword, 12)
        await db.updateTable('users')
            .set({ password_hash: passwordHash, updated_at: new Date().toISOString() })
            .where('id', '=', id)
            .execute()
        return { success: true }
    }

    async getSessionLog(userId?: string, period?: { from: string, to: string }) {
        const db = getDb()
        let query = db.selectFrom('session_log').selectAll()

        if (userId) query = query.where('user_id', '=', userId)
        if (period && period.from) query = query.where('login_at', '>=', period.from + 'T00:00:00.000Z')
        if (period && period.to) query = query.where('login_at', '<=', period.to + 'T23:59:59.999Z')

        return await query.orderBy('login_at', 'desc').execute()
    }

    async forceLogout(targetUserId: string) {
        const db = getDb()

        const openSessions = await db.selectFrom('session_log')
            .selectAll()
            .where('user_id', '=', targetUserId)
            .where('logout_at', 'is', null)
            .execute()

        for (const session of openSessions) {
            const loginTime = new Date(session.login_at).getTime()
            const logoutTime = new Date().getTime()
            const durationSec = Math.floor((logoutTime - loginTime) / 1000)

            await db.updateTable('session_log')
                .set({
                    logout_at: new Date(logoutTime).toISOString(),
                    duration_sec: durationSec
                })
                .where('id', '=', session.id)
                .execute()
        }

        destroyUserSessions(targetUserId)

        return { success: true }
    }
}
