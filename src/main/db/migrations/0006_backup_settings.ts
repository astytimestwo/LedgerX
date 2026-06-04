import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('app_settings')
        .addColumn('key', 'text', (col) => col.primaryKey())
        .addColumn('value', 'text', (col) => col.notNull())
        .execute()

    // Insert default settings
    await db.insertInto('app_settings')
        .values([
            { key: 'backup_auto_enabled', value: '1' },
            { key: 'backup_auto_time', value: '23:00' },
            { key: 'backup_retention_days', value: '30' },
            { key: 'backup_local_path', value: '' },
            { key: 'gdrive_token_encrypted', value: '' },
            { key: 'gdrive_enabled', value: '0' },
            { key: 'gdrive_folder_id', value: '' }
        ])
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('app_settings').execute()
}
