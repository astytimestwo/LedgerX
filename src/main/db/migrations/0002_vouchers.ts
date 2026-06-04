import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('vouchers')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('voucher_no', 'text', (col) => col.unique().notNull())
        .addColumn('voucher_type', 'text', (col) => col.notNull())
        .addColumn('date', 'text', (col) => col.notNull())
        .addColumn('narration', 'text')
        .addColumn('reference_no', 'text')
        .addColumn('is_posted', 'integer', (col) => col.notNull().defaultTo(1))
        .addColumn('created_by', 'text', (col) => col.notNull()) // References users(id)
        .addColumn('created_at', 'text', (col) => col.notNull())
        .addColumn('updated_at', 'text', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('voucher_entries')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('voucher_id', 'text', (col) => col.notNull()) // References vouchers(id)
        .addColumn('ledger_id', 'text', (col) => col.notNull())  // References ledger_accounts(id)
        .addColumn('type', 'text', (col) => col.notNull())       // 'dr' | 'cr'
        .addColumn('amount', 'integer', (col) => col.notNull())  // paise
        .addColumn('gst_type', 'text')
        .addColumn('tax_rate', 'integer')
        .execute()

    await db.schema
        .createTable('voucher_sequences')
        .addColumn('voucher_type', 'text', (col) => col.primaryKey())
        .addColumn('prefix', 'text', (col) => col.notNull())
        .addColumn('last_seq', 'integer', (col) => col.notNull().defaultTo(0))
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('voucher_sequences').execute()
    await db.schema.dropTable('voucher_entries').execute()
    await db.schema.dropTable('vouchers').execute()
}
