import { getDb } from '../connection'
import crypto from 'crypto'

export async function insertAuditLog(
    tx: any,
    data: {
        userId: string
        action: string
        tableName?: string
        recordId?: string
        oldValue?: any
        newValue?: any
        ipAddress?: string
    }
) {
    const dbOrTx = tx || getDb()
    const id = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const maskSensitive = (obj: any) => {
        if (!obj) return null;
        const copy = JSON.parse(JSON.stringify(obj))
        if ('password_hash' in copy) copy.password_hash = '***MASKED***'
        if ('totp_secret' in copy) copy.totp_secret = '***MASKED***'
        return JSON.stringify(copy)
    }

    await dbOrTx
        .insertInto('audit_log')
        .values({
            id,
            user_id: data.userId,
            action: data.action,
            table_name: data.tableName || null,
            record_id: data.recordId || null,
            old_value: maskSensitive(data.oldValue),
            new_value: maskSensitive(data.newValue),
            ip_address: data.ipAddress || null,
            timestamp
        })
        .execute()
}
