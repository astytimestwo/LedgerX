import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    // 1. Add permissions_json to existings users table
    await db.schema.alterTable('users')
        .addColumn('permissions_json', 'text')
        .execute()

    // 2. Create session_log table
    await db.schema.createTable('session_log')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('user_id', 'text', (col) => col.notNull())
        .addColumn('login_at', 'text', (col) => col.notNull())
        .addColumn('logout_at', 'text')
        .addColumn('duration_sec', 'integer')
        .addColumn('ip_address', 'text')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('session_log').execute()

    // SQLite doesn't strictly support DROP COLUMN in older versions cleanly without table recreation,
    // but in newer SQLite versions (3.35.0+) it's supported. We'll attempt the standard drop.
    try {
        await db.schema.alterTable('users').dropColumn('permissions_json').execute()
    } catch (e) {
        console.warn('Could not drop permissions_json column. Using older SQLite version?')
    }
}
