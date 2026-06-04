import { authenticator } from 'otplib'
import { encrypt, getSystemKey } from '../lib/crypto'
import { createSession } from '../lib/session'
import { initDb, getDb, getRawDb } from '../db/connection'
import { createUser, getUserByUsername, updateTotpSecret } from '../db/repositories/user.repo'
import { CreateCompanyInput, LoginInput } from '../../shared/types'
import { Migrator } from 'kysely'
import * as InitialMigration from '../db/migrations/0001_init'
import * as vouchersMigration from '../db/migrations/0002_vouchers'
import * as gstMigration from '../db/migrations/0003_gst'
import * as inventoryMigration from '../db/migrations/0004_inventory'
import * as userRolesMigration from '../db/migrations/0005_user_roles'
import * as backupSettingsMigration from '../db/migrations/0006_backup_settings'
import * as indexesMigration from '../db/migrations/0007_indexes'
import * as fyMigration from '../db/migrations/0008_financial_years'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

import { app } from 'electron'
import fs from 'fs'
import { join } from 'path'

export async function checkFirstRun(): Promise<boolean> {
    try {
        const userData = app.getPath('userData')
        if (!fs.existsSync(userData)) return true;

        const files = fs.readdirSync(userData)
        const hasDb = files.some(f => f.endsWith('.lxdb'))
        return !hasDb
    } catch (e) {
        return true
    }
}

export async function getCompanies(): Promise<string[]> {
    try {
        const userData = app.getPath('userData')
        if (!fs.existsSync(userData)) return [];

        const files = fs.readdirSync(userData)
        return files
            .filter(f => f.endsWith('.lxdb'))
            .map(f => f.replace('.lxdb', ''))
    } catch (e) {
        return []
    }
}

export async function unlockCompany(companyName: string, masterPassword?: string): Promise<boolean> {
    try {
        const userData = app.getPath('userData')
        const dbPath = join(userData, `${companyName}.lxdb`)

        // Log marker when DB file doesn't exist - this helps distinguish from wrong password errors
        if (!fs.existsSync(dbPath)) {
            console.warn(`[AUTH] Company DB not found: ${companyName}`)
        }

        initDb(companyName, masterPassword)
        // Verify we can actually read from it (will throw if key is wrong)
        const rawDb = getRawDb()
        rawDb.prepare('SELECT count(*) FROM sqlite_master').get()
        return true
    } catch (e) {
        return false
    }
}

export async function createCompany(data: CreateCompanyInput): Promise<boolean> {
    initDb(data.companyName, data.masterPassword)

    // Run migrations programmatically
    const migrator = new Migrator({
        db: getDb(),
        provider: {
            async getMigrations() {
                return {
                    '0001_init': { up: InitialMigration.up, down: InitialMigration.down },
                    '0002_vouchers': { up: vouchersMigration.up, down: vouchersMigration.down },
                    '0003_gst': { up: gstMigration.up, down: gstMigration.down },
                    '0004_inventory': { up: inventoryMigration.up, down: inventoryMigration.down },
                    '0005_user_roles': { up: userRolesMigration.up, down: userRolesMigration.down },
                    '0006_backup_settings': { up: backupSettingsMigration.up, down: backupSettingsMigration.down },
                    '0007_indexes': { up: indexesMigration.up, down: indexesMigration.down },
                    '0008_financial_years': { up: fyMigration.up, down: fyMigration.down }
                }
            }
        }
    })

    const { error } = await migrator.migrateToLatest()
    if (error) {
        throw error
    }

    // Create admin user (no TOTP secret stored initially - user will set it up on first login)
    const passwordHash = await bcrypt.hash(data.masterPassword, 12)

    await createUser({
        username: 'admin',
        password_hash: passwordHash,
        totp_secret: '', // Empty string satisfies NOT NULL constraint and evaluates to false for TOTP checks
        role: 'admin',
        permissions: null,
        permissions_json: null,
        is_active: 1
    }, 'system-init')

    // Auto-create the first financial year based on user input
    try {
        const startDate = new Date(data.financialYearStart);
        const startYear = startDate.getFullYear();
        // Assume FY is April 1 to March 31
        const fyName = `${startYear}-${startYear + 1}`;
        const endDateStr = `${startYear + 1}-03-31`;

        await getDb().insertInto('financial_years')
            .values({
                id: uuidv4(),
                name: fyName,
                start_date: data.financialYearStart,
                end_date: endDateStr,
                is_locked: 0
            })
            .execute()
    } catch (e) {
        console.error('Failed to create initial financial year:', e)
    }

    return true
}

export async function login(data: LoginInput): Promise<{
    success: boolean;
    requiresTotp: boolean;
    user?: { id: string; username: string; role: string };
    sessionToken?: string;
    error?: string;
}> {
    const GENERIC_ERROR = 'Invalid username or password'

    const user = await getUserByUsername(data.username)
    if (!user) {
        // Use constant-time comparison to avoid timing attacks even on missing user.
        await bcrypt.compare(data.password, '$2b$12$invalidhashpadding000000000000000000000000000000000000000')
        return { success: false, requiresTotp: false, error: GENERIC_ERROR }
    }

    // Check account is active before doing anything else
    if (!user.is_active) {
        return { success: false, requiresTotp: false, error: GENERIC_ERROR }
    }

    const valid = await bcrypt.compare(data.password, user.password_hash)
    if (!valid) return { success: false, requiresTotp: false, error: GENERIC_ERROR }

    // Enforce TOTP if the user has an active secret
    if (user.totp_secret) {
        // Create a provisional session token so verifyTotp can authenticate
        const sessionToken = createSession({ id: user.id, username: user.username, role: user.role })
        return {
            success: true,
            requiresTotp: true,
            user: { id: user.id, username: user.username, role: user.role },
            sessionToken
        }
    }

    const sessionToken = createSession({ id: user.id, username: user.username, role: user.role })

    return {
        success: true,
        requiresTotp: false,
        user: { id: user.id, username: user.username, role: user.role },
        sessionToken
    }
}

export async function setupTotp(userId: string): Promise<{ secret: string; qrUrl: string }> {
    // Look up the actual username for the QR URI so it's user-specific
    const db = getDb()
    const user = await db.selectFrom('users').select(['username']).where('id', '=', userId).executeTakeFirst()
    const displayName = user?.username || 'user'
    const secret = authenticator.generateSecret()
    const qrUrl = authenticator.keyuri(displayName, 'LedgerX', secret)
    return { secret, qrUrl }
}

export async function verifyTotp(companyName: string, userId: string, token: string, secret: string) {
    const isValid = authenticator.verify({ token, secret })
    if (isValid) {
        // Encrypt and save the verified secret
        const systemKey = getSystemKey(companyName)
        const encryptedSecret = encrypt(secret, systemKey)
        await updateTotpSecret(userId, encryptedSecret, userId)

        // Fixed: look up user by ID (userId is a UUID), not by username
        const db = getDb()
        const user = await db.selectFrom('users').selectAll().where('id', '=', userId).executeTakeFirst()
        if (!user) return { success: false }

        const sessionToken = createSession({ id: user.id, username: user.username, role: user.role })

        return {
            success: true,
            user: { id: user.id, username: user.username, role: user.role },
            sessionToken
        }
    }
    return { success: false }
}
