import Database from 'better-sqlite3-multiple-ciphers'
import { Kysely, SqliteDialect } from 'kysely'
import type { Database as DBSchema } from './schema'
import { join } from 'path'
import { app } from 'electron'
import { deriveKey, generateSalt } from '../lib/crypto'
import fs from 'fs'

let db: Kysely<DBSchema> | null = null;
let sqliteDb: any = null;
let initLock: Promise<void> | null = null;

export async function initDb(companyName: string, masterPassword?: string): Promise<void> {
    if (db) {
        // Already initialized for this company — safe to return
        return;
    }
    if (initLock) {
        await initLock;
        // After lock releases, check again — another caller may have initialized the same company
        if (db) return;
        // If a DIFFERENT company was initialized, we need to re-init for this one
        // (this shouldn't happen in normal flow but closeDb resets everything)
        await closeDb();
    }
    initLock = _initDb(companyName, masterPassword);
    try {
        await initLock;
    } finally {
        initLock = null;
    }
}

async function _initDb(companyName: string, masterPassword?: string): Promise<void> {
    if (db || sqliteDb) {
        await closeDb();
    }
    const userData = app.getPath('userData')
    const dbPath = join(userData, `${companyName}.lxdb`)
    const metaPath = join(userData, `${companyName}.meta`)

    let saltHex: string;

    if (fs.existsSync(metaPath)) {
        saltHex = fs.readFileSync(metaPath, 'utf8')
    } else {
        saltHex = generateSalt().toString('hex')
        fs.writeFileSync(metaPath, saltHex, 'utf8')
    }

    sqliteDb = new Database(dbPath)

    if (masterPassword) {
        const salt = Buffer.from(saltHex, 'hex')
        const key = deriveKey(masterPassword, salt).toString('hex')
        sqliteDb.pragma(`key = "x'${key}'"`)
    }

    // Set WAL mode for better concurrency
    sqliteDb.pragma('journal_mode = WAL')

    db = new Kysely<DBSchema>({
        dialect: new SqliteDialect({
            database: sqliteDb
        })
    })
}

export function getDb(): Kysely<DBSchema> {
    if (!db) {
        throw new Error('Database not initialized')
    }
    return db
}

export function getRawDb() {
    return sqliteDb;
}

export async function closeDb() {
    if (db) {
        await db.destroy()
        db = null
        sqliteDb = null
    }
}
