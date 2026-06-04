import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TABLE financial_years (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            is_locked INTEGER DEFAULT 0
        )
    `.execute(db)

    // Optionally insert the current financial year as default
    // e.g. '2023-2024' depending on the current date, but we can do that from JS layer.
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('financial_years').execute()
}
