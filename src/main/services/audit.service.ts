import { getDb } from '../db/connection'

export interface AuditFilters {
    dateFrom?: string
    dateTo?: string
    userId?: string
    action?: string
    tableName?: string
    search?: string
    limit?: number
    offset?: number
}

export class AuditService {
    async getAuditLog(filters: AuditFilters) {
        const db = getDb()
        let query = db.selectFrom('audit_log as a')
            .leftJoin('users as u', 'u.id', 'a.user_id')
            .select([
                'a.id',
                'a.user_id',
                'u.username as user_name',
                'a.action',
                'a.table_name',
                'a.record_id',
                'a.old_value',
                'a.new_value',
                'a.ip_address',
                'a.timestamp'
            ])

        if (filters.dateFrom) {
            query = query.where('a.timestamp', '>=', filters.dateFrom + 'T00:00:00.000Z')
        }
        if (filters.dateTo) {
            query = query.where('a.timestamp', '<=', filters.dateTo + 'T23:59:59.999Z')
        }
        if (filters.userId) {
            query = query.where('a.user_id', '=', filters.userId)
        }
        if (filters.action) {
            query = query.where('a.action', '=', filters.action)
        }
        if (filters.tableName) {
            query = query.where('a.table_name', '=', filters.tableName)
        }
        if (filters.search) {
            const term = `%${filters.search}%`
            query = query.where((eb) => eb.or([
                eb('a.old_value', 'like', term),
                eb('a.new_value', 'like', term),
                eb('a.record_id', 'like', term)
            ]))
        }

        query = query.orderBy('a.timestamp', 'desc')

        if (filters.limit) {
            query = query.limit(filters.limit)
        } else {
            query = query.limit(500)
        }

        if (filters.offset) {
            query = query.offset(filters.offset)
        }

        const results = await query.execute()

        // Safely parse JSON strings before returning; treat malformed JSON as null
        return results.map(row => ({
            ...row,
            old_value: row.old_value ? (() => { try { return JSON.parse(row.old_value as string) } catch { return null } })() : null,
            new_value: row.new_value ? (() => { try { return JSON.parse(row.new_value as string) } catch { return null } })() : null
        }))
    }
}
