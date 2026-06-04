import { getDb } from '../connection'
import { insertAuditLog } from './audit.repo'
import crypto from 'crypto'
import type { LedgerGroups, LedgerAccounts } from '../schema'
import { CreateLedgerGroupInput, CreateLedgerAccountInput } from '../../../shared/types'

export async function getGroups(): Promise<LedgerGroups[]> {
    return getDb().selectFrom('ledger_groups').selectAll().execute()
}

export async function getAccounts(): Promise<LedgerAccounts[]> {
    return getDb().selectFrom('ledger_accounts').selectAll().execute()
}

export async function createGroup(data: CreateLedgerGroupInput, userId: string): Promise<LedgerGroups> {
    const db = getDb()
    const id = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const toInsert = {
        id,
        name: data.name,
        parent_id: data.parent_id,
        nature: data.nature,
        created_at: timestamp,
        updated_at: timestamp
    }

    return db.transaction().execute(async (tx) => {
        await tx.insertInto('ledger_groups').values(toInsert).execute()
        await insertAuditLog(tx, {
            userId,
            action: 'INSERT',
            tableName: 'ledger_groups',
            recordId: id,
            newValue: toInsert
        })
        return toInsert
    })
}

export async function createAccount(data: CreateLedgerAccountInput, userId: string): Promise<LedgerAccounts> {
    const db = getDb()
    const id = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const toInsert = {
        id,
        code: data.code,
        name: data.name,
        name_hi: null,
        group_id: data.group_id,
        opening_balance: data.opening_balance,
        opening_type: data.opening_type,
        gst_applicable: data.gst_applicable ? 1 : 0,
        gstin: data.gstin || null,
        gst_treatment: data.gst_treatment || null,
        state_code: data.state_code || null,
        hsn_code: data.hsn_code || null,
        gst_rate: data.gst_rate || null,
        is_active: 1,
        created_at: timestamp,
        updated_at: timestamp
    }

    return db.transaction().execute(async (tx) => {
        await tx.insertInto('ledger_accounts').values(toInsert).execute()
        await insertAuditLog(tx, {
            userId,
            action: 'INSERT',
            tableName: 'ledger_accounts',
            recordId: id,
            newValue: toInsert
        })
        return toInsert
    })
}

export async function updateGroup(data: { id: string, name: string, parent_id: string | null, nature: 'Assets' | 'Liabilities' | 'Income' | 'Expense' }, userId: string): Promise<LedgerGroups> {
    const db = getDb()
    const timestamp = new Date().toISOString()

    return db.transaction().execute(async (tx) => {
        const oldRecord = await tx.selectFrom('ledger_groups').selectAll().where('id', '=', data.id).executeTakeFirstOrThrow()

        const toUpdate = {
            name: data.name,
            parent_id: data.parent_id,
            nature: data.nature,
            updated_at: timestamp
        }

        await tx.updateTable('ledger_groups').set(toUpdate).where('id', '=', data.id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'UPDATE',
            tableName: 'ledger_groups',
            recordId: data.id,
            oldValue: oldRecord,
            newValue: { ...oldRecord, ...toUpdate }
        })

        return { ...oldRecord, ...toUpdate }
    })
}

export async function deleteGroup(id: string, userId: string): Promise<void> {
    const db = getDb()

    return db.transaction().execute(async (tx) => {
        const childGroups = await tx.selectFrom('ledger_groups')
            .selectAll()
            .where('parent_id', '=', id)
            .execute()
        if (childGroups.length > 0) {
            throw new Error('Cannot delete group: has child groups')
        }

        const accountsInGroup = await tx.selectFrom('ledger_accounts')
            .selectAll()
            .where('group_id', '=', id)
            .execute()
        if (accountsInGroup.length > 0) {
            throw new Error('Cannot delete group: contains accounts')
        }

        const oldRecord = await tx.selectFrom('ledger_groups').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

        await tx.deleteFrom('ledger_groups').where('id', '=', id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'DELETE',
            tableName: 'ledger_groups',
            recordId: id,
            oldValue: oldRecord,
            newValue: null
        })
    })
}

export async function updateAccount(data: { id: string, code: string, name: string, group_id: string, opening_balance: number, opening_type: 'dr' | 'cr', gst_applicable: boolean, gstin?: string, gst_treatment?: string, state_code?: string, hsn_code?: string, gst_rate?: number }, userId: string): Promise<LedgerAccounts> {
    const db = getDb()
    const timestamp = new Date().toISOString()

    return db.transaction().execute(async (tx) => {
        const oldRecord = await tx.selectFrom('ledger_accounts').selectAll().where('id', '=', data.id).executeTakeFirstOrThrow()

        const toUpdate = {
            code: data.code,
            name: data.name,
            group_id: data.group_id,
            opening_balance: data.opening_balance,
            opening_type: data.opening_type,
            gst_applicable: data.gst_applicable ? 1 : 0,
            gstin: data.gstin || null,
            gst_treatment: data.gst_treatment || null,
            state_code: data.state_code || null,
            hsn_code: data.hsn_code || null,
            gst_rate: data.gst_rate || null,
            updated_at: timestamp
        }

        await tx.updateTable('ledger_accounts').set(toUpdate).where('id', '=', data.id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'UPDATE',
            tableName: 'ledger_accounts',
            recordId: data.id,
            oldValue: oldRecord,
            newValue: { ...oldRecord, ...toUpdate }
        })

        return { ...oldRecord, ...toUpdate } as LedgerAccounts
    })
}

export async function deleteAccount(id: string, userId: string): Promise<void> {
    const db = getDb()

    return db.transaction().execute(async (tx) => {
        const vouchersUsingAccount = await tx.selectFrom('voucher_entries')
            .selectAll()
            .where('ledger_id', '=', id)
            .limit(1)
            .execute()
        if (vouchersUsingAccount.length > 0) {
            throw new Error('Cannot delete account: account is referenced by existing vouchers')
        }

        const oldRecord = await tx.selectFrom('ledger_accounts').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

        await tx.deleteFrom('ledger_accounts').where('id', '=', id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'DELETE',
            tableName: 'ledger_accounts',
            recordId: id,
            oldValue: oldRecord,
            newValue: null
        })
    })
}
