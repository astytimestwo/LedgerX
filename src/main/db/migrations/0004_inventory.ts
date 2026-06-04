import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    // 1. Item Groups
    await db.schema
        .createTable('item_groups')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('parent_id', 'text')
        .addColumn('created_at', 'text', (col) => col.notNull())
        .addColumn('updated_at', 'text', (col) => col.notNull())
        .execute()

    // 2. Items
    await db.schema
        .createTable('items')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('code', 'text', (col) => col.notNull().unique())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('name_hi', 'text')
        .addColumn('group_id', 'text', (col) => col.notNull())
        .addColumn('hsn_code', 'text')
        .addColumn('default_gst_rate', 'numeric')
        .addColumn('unit_of_measure', 'text', (col) => col.notNull().defaultTo('NOS'))
        .addColumn('opening_qty', 'numeric', (col) => col.notNull().defaultTo(0))
        .addColumn('opening_rate', 'numeric', (col) => col.notNull().defaultTo(0)) // in paise
        .addColumn('opening_value', 'numeric', (col) => col.notNull().defaultTo(0)) // in paise
        .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
        .addColumn('created_at', 'text', (col) => col.notNull())
        .addColumn('updated_at', 'text', (col) => col.notNull())
        .execute()

    // 3. Inventory Entries (Hooked to Vouchers)
    // When a Purchase or Sales voucher has items, they get listed here.
    await db.schema
        .createTable('inventory_entries')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('voucher_id', 'text', (col) => col.notNull())
        .addColumn('voucher_entry_id', 'text') // Nullable, can link to a specific financial entry line
        .addColumn('item_id', 'text', (col) => col.notNull())
        .addColumn('type', 'text', (col) => col.notNull()) // 'in' (purchase), 'out' (sales)
        .addColumn('qty', 'numeric', (col) => col.notNull())
        .addColumn('rate', 'numeric', (col) => col.notNull())
        .addColumn('amount', 'numeric', (col) => col.notNull())
        .execute()

    // Extend voucher_entries to optionally hold an item_id
    // NOTE: SQLite requires separate ALTER TABLE for each column
    await db.schema
        .alterTable('voucher_entries')
        .addColumn('item_id', 'text')
        .execute()

    await db.schema
        .alterTable('voucher_entries')
        .addColumn('qty', 'numeric')
        .execute()

    await db.schema
        .alterTable('voucher_entries')
        .addColumn('rate', 'numeric')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.alterTable('voucher_entries').dropColumn('rate').execute()
    await db.schema.alterTable('voucher_entries').dropColumn('qty').execute()
    await db.schema.alterTable('voucher_entries').dropColumn('item_id').execute()

    await db.schema.dropTable('inventory_entries').execute()
    await db.schema.dropTable('items').execute()
    await db.schema.dropTable('item_groups').execute()
}
