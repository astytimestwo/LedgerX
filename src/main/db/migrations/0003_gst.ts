import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    // 1. Add GST tracking columns to voucher_entries
    // NOTE: SQLite requires separate ALTER TABLE statements for each column
    await db.schema.alterTable('voucher_entries')
        .addColumn('taxable_value_paise', 'integer', (col) => col.defaultTo(0))
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('cgst_amount_paise', 'integer', (col) => col.defaultTo(0))
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('sgst_amount_paise', 'integer', (col) => col.defaultTo(0))
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('igst_amount_paise', 'integer', (col) => col.defaultTo(0))
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('utgst_amount_paise', 'integer', (col) => col.defaultTo(0))
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('cess_amount_paise', 'integer', (col) => col.defaultTo(0))
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('gst_rate', 'integer', (col) => col.defaultTo(0)) // percentage * 100
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('supply_type', 'text', (col) => col.defaultTo('taxable')) // taxable | nil_rated | exempt | non_gst | zero_rated
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('is_reverse_charge', 'integer', (col) => col.defaultTo(0))
        .execute()

    await db.schema.alterTable('voucher_entries')
        .addColumn('place_of_supply', 'text') // 2-digit state code
        .execute()

    // 2. Create HSN/SAC Master
    await db.schema.createTable('hsn_master')
        .addColumn('code', 'text', (col) => col.primaryKey())
        .addColumn('description', 'text', (col) => col.notNull())
        .addColumn('gst_rate', 'integer', (col) => col.notNull()) // percentage * 100
        .addColumn('cess_rate', 'integer', (col) => col.defaultTo(0))
        .addColumn('type', 'text', (col) => col.notNull()) // 'goods' | 'service'
        .execute()

    // 3. Extend ledger_accounts for GST profiling
    // gstin already added in 0001_init - skip it here
    await db.schema.alterTable('ledger_accounts')
        .addColumn('gst_treatment', 'text') // registered_regular | unregistered | composition | consumer
        .execute()

    await db.schema.alterTable('ledger_accounts')
        .addColumn('state_code', 'text') // 2-digit GST state code
        .execute()

    await db.schema.alterTable('ledger_accounts')
        .addColumn('hsn_code', 'text')
        .execute()

    await db.schema.alterTable('ledger_accounts')
        .addColumn('gst_rate', 'integer')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    // SQLite doesn't robustly support dropping columns via alter table in older versions,
    // but Kysely handles the table recreation magic for us if needed, or we just ignore 
    // down steps for columns in SQLite for safety unless strictly required.
    await db.schema.dropTable('hsn_master').execute()
}
