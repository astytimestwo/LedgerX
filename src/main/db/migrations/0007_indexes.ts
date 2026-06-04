import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema.createIndex('idx_audit_log_user_time').on('audit_log').columns(['user_id', 'timestamp']).execute()
    await db.schema.createIndex('idx_session_log_user_time').on('session_log').columns(['user_id', 'login_at']).execute()
    await db.schema.createIndex('idx_voucher_entries_ledger').on('voucher_entries').column('ledger_id').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropIndex('idx_voucher_entries_ledger').execute()
    await db.schema.dropIndex('idx_session_log_user_time').execute()
    await db.schema.dropIndex('idx_audit_log_user_time').execute()
}
