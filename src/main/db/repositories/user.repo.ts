import { getDb } from '../connection'
import { insertAuditLog } from './audit.repo'
import crypto from 'crypto'
import type { Users } from '../schema'

export async function getUserCount(): Promise<number> {
    const db = getDb()
    const count = await db.selectFrom('users').select(db.fn.count<number>('id').as('c')).executeTakeFirst()
    return count?.c || 0
}

export async function getUserByUsername(username: string): Promise<Users | undefined> {
    const db = getDb()
    return db.selectFrom('users').selectAll().where('username', '=', username).executeTakeFirst()
}

export async function getUserById(id: string): Promise<Users | undefined> {
    const db = getDb()
    return db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function createUser(data: Omit<Users, 'id' | 'created_at' | 'updated_at'>, actionUserLineId: string): Promise<Users> {
    const db = getDb()
    const id = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const newUser = {
        ...data,
        id,
        created_at: timestamp,
        updated_at: timestamp
    };

    return db.transaction().execute(async (tx) => {
        await tx.insertInto('users').values(newUser).execute()
        await insertAuditLog(tx, {
            userId: actionUserLineId,
            action: 'INSERT',
            tableName: 'users',
            recordId: id,
            newValue: newUser
        })
        return newUser
    })
}

export async function updateTotpSecret(id: string, secret: string, actionUserId: string): Promise<void> {
    const db = getDb()
    const timestamp = new Date().toISOString()

    await db.transaction().execute(async (tx) => {
        const oldRes = await tx.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst()
        await tx.updateTable('users').set({ totp_secret: secret, updated_at: timestamp }).where('id', '=', id).execute()

        await insertAuditLog(tx, {
            userId: actionUserId,
            action: 'UPDATE',
            tableName: 'users',
            recordId: id,
            oldValue: oldRes ? { totp_secret: oldRes.totp_secret } : null,
            newValue: { totp_secret: secret }
        })
    })
}
