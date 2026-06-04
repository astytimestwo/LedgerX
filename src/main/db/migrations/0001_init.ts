import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('users')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('username', 'text', (col) => col.unique().notNull())
        .addColumn('password_hash', 'text', (col) => col.notNull())
        .addColumn('totp_secret', 'text', (col) => col.notNull())
        .addColumn('role', 'text', (col) => col.notNull())
        .addColumn('permissions', 'text')
        .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
        .addColumn('created_at', 'text', (col) => col.notNull())
        .addColumn('updated_at', 'text', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('ledger_groups')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('parent_id', 'text')
        .addColumn('nature', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) => col.notNull())
        .addColumn('updated_at', 'text', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('ledger_accounts')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('code', 'text', (col) => col.unique().notNull())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('name_hi', 'text')
        .addColumn('group_id', 'text', (col) => col.notNull())
        .addColumn('opening_balance', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('opening_type', 'text', (col) => col.notNull())
        .addColumn('gst_applicable', 'integer', (col) => col.defaultTo(0))
        .addColumn('gstin', 'text')
        .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
        .addColumn('created_at', 'text', (col) => col.notNull())
        .addColumn('updated_at', 'text', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('audit_log')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('user_id', 'text', (col) => col.notNull())
        .addColumn('action', 'text', (col) => col.notNull())
        .addColumn('table_name', 'text')
        .addColumn('record_id', 'text')
        .addColumn('old_value', 'text')
        .addColumn('new_value', 'text')
        .addColumn('ip_address', 'text')
        .addColumn('timestamp', 'text', (col) => col.notNull())
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('audit_log').execute()
    await db.schema.dropTable('ledger_accounts').execute()
    await db.schema.dropTable('ledger_groups').execute()
    await db.schema.dropTable('users').execute()
}
