import { getDb } from '../connection'
import { insertAuditLog } from './audit.repo'
import crypto from 'crypto'
import { sql } from 'kysely'
import { CreateVoucherInput, UpdateVoucherInput } from '../../../shared/types'

export async function createVoucher(input: CreateVoucherInput, voucherNo: string, userId: string) {
    const db = getDb()
    const voucherId = crypto.randomUUID()
    const now = new Date().toISOString()

    return await db.transaction().execute(async (tx) => {
        // 1. Insert Voucher
        await tx.insertInto('vouchers').values({
            id: voucherId,
            voucher_no: voucherNo,
            voucher_type: input.voucher_type,
            date: input.date,
            narration: input.narration || null,
            is_posted: 1,
            created_by: userId,
            created_at: now,
            updated_at: now
        }).execute()

        // 2. Insert Entries
        const entriesToInsert = input.entries.map(e => ({
            id: crypto.randomUUID(),
            voucher_id: voucherId,
            ledger_id: e.ledger_id,
            type: e.type,
            amount: e.amount,
            taxable_value_paise: e.taxable_value_paise || 0,
            cgst_amount_paise: e.cgst_amount_paise || 0,
            sgst_amount_paise: e.sgst_amount_paise || 0,
            igst_amount_paise: e.igst_amount_paise || 0,
            utgst_amount_paise: e.utgst_amount_paise || 0,
            cess_amount_paise: e.cess_amount_paise || 0,
            gst_rate: e.gst_rate || 0,
            supply_type: e.supply_type || 'taxable',
            is_reverse_charge: e.is_reverse_charge || 0,
            place_of_supply: e.place_of_supply || undefined,
            item_id: e.item_id || undefined,
            qty: e.qty || undefined,
            rate: e.rate || undefined
        }))

        await tx.insertInto('voucher_entries').values(entriesToInsert).execute()

        // 3. Insert Inventory Movements
        const inventoryMovements = entriesToInsert
            .filter(e => e.item_id && e.qty)
            .map(e => {
                let moveType = 'in'
                if (['sales', 'debit_note'].includes(input.voucher_type)) moveType = 'out'
                else if (['purchase', 'credit_note'].includes(input.voucher_type)) moveType = 'in'
                else moveType = e.type === 'dr' ? 'in' : 'out'

                return {
                    id: crypto.randomUUID(),
                    voucher_id: voucherId,
                    voucher_entry_id: e.id,
                    item_id: e.item_id as string,
                    type: moveType,
                    qty: e.qty || 0,
                    rate: e.rate || 0,
                    amount: (e.qty || 0) * (e.rate || 0)
                }
            })

        if (inventoryMovements.length > 0) {
            await tx.insertInto('inventory_entries').values(inventoryMovements).execute()
        }

        // 3. Audit Log
        await insertAuditLog(tx, {
            userId,
            action: 'INSERT',
            tableName: 'vouchers',
            recordId: voucherId,
            newValue: { ...input, voucher_no: voucherNo }
        })

        return voucherId
    })
}

export async function updateVoucher(input: UpdateVoucherInput, userId: string) {
    const db = getDb()
    const now = new Date().toISOString()

    return await db.transaction().execute(async (tx) => {
        // Fetch old value for audit
        const oldVoucher = await tx.selectFrom('vouchers').selectAll().where('id', '=', input.id).executeTakeFirst()
        if (!oldVoucher) throw new Error('Voucher not found')

        const oldEntries = await tx.selectFrom('voucher_entries').selectAll().where('voucher_id', '=', input.id).execute()

        await tx.updateTable('vouchers').set({
            voucher_type: input.voucher_type,
            date: input.date,
            narration: input.narration || null,
            updated_at: now
        }).where('id', '=', input.id).execute()

        // 2. Replace Entries (delete old, insert new)
        await tx.deleteFrom('voucher_entries').where('voucher_id', '=', input.id).execute()

        const entriesToInsert = input.entries.map(e => ({
            id: crypto.randomUUID(),
            voucher_id: input.id,
            ledger_id: e.ledger_id,
            type: e.type,
            amount: e.amount,
            taxable_value_paise: e.taxable_value_paise || 0,
            cgst_amount_paise: e.cgst_amount_paise || 0,
            sgst_amount_paise: e.sgst_amount_paise || 0,
            igst_amount_paise: e.igst_amount_paise || 0,
            utgst_amount_paise: e.utgst_amount_paise || 0,
            cess_amount_paise: e.cess_amount_paise || 0,
            gst_rate: e.gst_rate || 0,
            supply_type: e.supply_type || 'taxable',
            is_reverse_charge: e.is_reverse_charge || 0,
            place_of_supply: e.place_of_supply || undefined,
            item_id: e.item_id || undefined,
            qty: e.qty || undefined,
            rate: e.rate || undefined
        }))

        await tx.insertInto('voucher_entries').values(entriesToInsert).execute()

        // 3. Replace Inventory Movements
        await tx.deleteFrom('inventory_entries').where('voucher_id', '=', input.id).execute()

        const inventoryMovements = entriesToInsert
            .filter(e => e.item_id && e.qty)
            .map(e => {
                let moveType = 'in'
                if (['sales', 'debit_note'].includes(input.voucher_type)) moveType = 'out'
                else if (['purchase', 'credit_note'].includes(input.voucher_type)) moveType = 'in'
                else moveType = e.type === 'dr' ? 'in' : 'out'

                return {
                    id: crypto.randomUUID(),
                    voucher_id: input.id,
                    voucher_entry_id: e.id,
                    item_id: e.item_id as string,
                    type: moveType,
                    qty: e.qty || 0,
                    rate: e.rate || 0,
                    amount: (e.qty || 0) * (e.rate || 0)
                }
            })

        if (inventoryMovements.length > 0) {
            await tx.insertInto('inventory_entries').values(inventoryMovements).execute()
        }

        // 3. Audit Log
        await insertAuditLog(tx, {
            userId,
            action: 'UPDATE',
            tableName: 'vouchers',
            recordId: input.id,
            oldValue: { voucher: oldVoucher, entries: oldEntries },
            newValue: input
        })

        return input.id
    })
}

export async function deleteVoucher(id: string, userId: string) {
    const db = getDb()
    const now = new Date().toISOString()

    return await db.transaction().execute(async (tx) => {
        const oldVoucher = await tx.selectFrom('vouchers').selectAll().where('id', '=', id).executeTakeFirst()
        if (!oldVoucher) throw new Error('Voucher not found')

        // Soft delete
        await tx.updateTable('vouchers').set({
            is_posted: 0,
            updated_at: now
        }).where('id', '=', id).execute()

        // Audit Log
        await insertAuditLog(tx, {
            userId,
            action: 'DELETE', // representing soft delete
            tableName: 'vouchers',
            recordId: id,
            oldValue: oldVoucher,
            newValue: { is_posted: 0 }
        })
    })
}

export async function getVouchers(filters?: { type?: string, dateFrom?: string, dateTo?: string }) {
    return await getDb().transaction().execute(async (tx) => {
        let query = tx.selectFrom('vouchers')
            .selectAll()
            .where('is_posted', '=', 1)
            .orderBy('date', 'desc')
            .orderBy('created_at', 'desc')

        if (filters?.type) {
            query = query.where('voucher_type', '=', filters.type)
        }
        if (filters?.dateFrom) {
            query = query.where('date', '>=', filters.dateFrom)
        }
        if (filters?.dateTo) {
            query = query.where('date', '<=', filters.dateTo)
        }

        const vouchers = await query.execute()

        if (vouchers.length === 0) return []

        const voucherIds = vouchers.map(v => v.id)
        const entries = await tx.selectFrom('voucher_entries')
            .selectAll()
            .where('voucher_id', 'in', voucherIds)
            .execute()

        return vouchers.map(v => ({
            ...v,
            entries: entries.filter(e => e.voucher_id === v.id)
        }))
    })
}

export async function getNextSequence(type: string, prefix: string): Promise<number> {
    const db = getDb()

    const result = await db.insertInto('voucher_sequences')
        .values({ voucher_type: type, prefix: prefix, last_seq: 1 })
        .onConflict(builder => builder.column('voucher_type').doUpdateSet({
            last_seq: sql<number>`${sql.ref('voucher_sequences.last_seq')} + 1`
        }))
        .returning('last_seq')
        .executeTakeFirst()

    return result!.last_seq
}
