import { getDb } from '../connection'
import crypto from 'crypto'
import { insertAuditLog } from './audit.repo'

// --- Item Groups ---

export async function getItemGroups() {
    return await getDb().selectFrom('item_groups').selectAll().execute()
}

export async function createItemGroup(data: { name: string, parent_id?: string }, userId: string) {
    const db = getDb()
    const id = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const toInsert = {
        id,
        name: data.name,
        parent_id: data.parent_id || null,
        created_at: timestamp,
        updated_at: timestamp
    }

    return db.transaction().execute(async (tx) => {
        await tx.insertInto('item_groups').values(toInsert).execute()
        await insertAuditLog(tx, {
            userId,
            action: 'INSERT',
            tableName: 'item_groups',
            recordId: id,
            newValue: toInsert
        })
        return toInsert
    })
}

export async function updateItemGroup(id: string, data: { name: string, parent_id?: string }, userId: string) {
    const db = getDb()
    const timestamp = new Date().toISOString()

    return db.transaction().execute(async (tx) => {
        const oldRecord = await tx.selectFrom('item_groups').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

        const toUpdate = {
            name: data.name,
            parent_id: data.parent_id || null,
            updated_at: timestamp
        }

        await tx.updateTable('item_groups').set(toUpdate).where('id', '=', id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'UPDATE',
            tableName: 'item_groups',
            recordId: id,
            oldValue: oldRecord,
            newValue: { ...oldRecord, ...toUpdate }
        })

        return { ...oldRecord, ...toUpdate }
    })
}

export async function deleteItemGroup(id: string, userId: string) {
    const db = getDb()
    return db.transaction().execute(async (tx) => {
        const oldRecord = await tx.selectFrom('item_groups').selectAll().where('id', '=', id).executeTakeFirstOrThrow()
        await tx.deleteFrom('item_groups').where('id', '=', id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'DELETE',
            tableName: 'item_groups',
            recordId: id,
            oldValue: oldRecord,
            newValue: null
        })
    })
}

// --- Items ---

export async function getItems() {
    return await getDb().selectFrom('items').selectAll().execute()
}

export async function createItem(data: { code: string, name: string, group_id: string, hsn_code?: string, default_gst_rate?: number, unit_of_measure: string, opening_qty?: number, opening_rate?: number }, userId: string) {
    const db = getDb()
    const id = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const openingQty = data.opening_qty || 0
    const openingRate = data.opening_rate || 0
    const openingValue = openingQty * openingRate

    const toInsert = {
        id,
        code: data.code,
        name: data.name,
        name_hi: null,
        group_id: data.group_id,
        hsn_code: data.hsn_code || null,
        default_gst_rate: data.default_gst_rate || null,
        unit_of_measure: data.unit_of_measure || 'NOS',
        opening_qty: openingQty,
        opening_rate: openingRate,
        opening_value: openingValue,
        is_active: 1,
        created_at: timestamp,
        updated_at: timestamp
    }

    return db.transaction().execute(async (tx) => {
        await tx.insertInto('items').values(toInsert).execute()
        await insertAuditLog(tx, {
            userId,
            action: 'INSERT',
            tableName: 'items',
            recordId: id,
            newValue: toInsert
        })
        return toInsert
    })
}

export async function updateItem(id: string, data: { code: string, name: string, group_id: string, hsn_code?: string, default_gst_rate?: number, unit_of_measure: string, opening_qty?: number, opening_rate?: number }, userId: string) {
    const db = getDb()
    const timestamp = new Date().toISOString()

    const openingQty = data.opening_qty || 0
    const openingRate = data.opening_rate || 0
    const openingValue = openingQty * openingRate

    return db.transaction().execute(async (tx) => {
        const oldRecord = await tx.selectFrom('items').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

        const toUpdate = {
            code: data.code,
            name: data.name,
            group_id: data.group_id,
            hsn_code: data.hsn_code || null,
            default_gst_rate: data.default_gst_rate || null,
            unit_of_measure: data.unit_of_measure || 'NOS',
            opening_qty: openingQty,
            opening_rate: openingRate,
            opening_value: openingValue,
            updated_at: timestamp
        }

        await tx.updateTable('items').set(toUpdate).where('id', '=', id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'UPDATE',
            tableName: 'items',
            recordId: id,
            oldValue: oldRecord,
            newValue: { ...oldRecord, ...toUpdate }
        })

        return { ...oldRecord, ...toUpdate }
    })
}

export async function deleteItem(id: string, userId: string) {
    const db = getDb()
    return db.transaction().execute(async (tx) => {
        const oldRecord = await tx.selectFrom('items').selectAll().where('id', '=', id).executeTakeFirstOrThrow()
        await tx.deleteFrom('items').where('id', '=', id).execute()

        await insertAuditLog(tx, {
            userId,
            action: 'DELETE',
            tableName: 'items',
            recordId: id,
            oldValue: oldRecord,
            newValue: null
        })
    })
}

// --- Reports ---

export async function getStockSummary(filters?: { dateFrom?: string, dateTo?: string }) {
    const db = getDb()

    // Get all items with their opening balances
    const items = await db.selectFrom('items')
        .leftJoin('item_groups', 'items.group_id', 'item_groups.id')
        .select([
            'items.id as item_id',
            'items.code',
            'items.name',
            'items.unit_of_measure',
            'items.opening_qty',
            'items.opening_rate',
            'items.opening_value',
            'item_groups.name as group_name'
        ])
        .execute()

    // Get all inventory entries within date range
    let entriesQuery = db.selectFrom('inventory_entries')
        .innerJoin('vouchers', 'inventory_entries.voucher_id', 'vouchers.id')
        .select([
            'inventory_entries.item_id',
            'inventory_entries.type',
            'inventory_entries.qty',
            'inventory_entries.amount'
        ])
        .where('vouchers.is_posted', '=', 1)

    if (filters?.dateFrom) {
        entriesQuery = entriesQuery.where('vouchers.date', '>=', filters.dateFrom)
    }
    if (filters?.dateTo) {
        entriesQuery = entriesQuery.where('vouchers.date', '<=', filters.dateTo)
    }

    const entries = await entriesQuery.execute()

    // Aggregate
    return items.map(item => {
        let inwardsQty = 0
        let inwardsValue = 0
        let outwardsQty = 0
        let outwardsValue = 0

        const itemEntries = entries.filter(e => e.item_id === item.item_id)

        itemEntries.forEach(e => {
            if (e.type === 'in') {
                inwardsQty += e.qty
                inwardsValue += e.amount
            } else {
                outwardsQty += e.qty
                outwardsValue += e.amount
            }
        })

        const closingQty = item.opening_qty + inwardsQty - outwardsQty
        // Calculate closing value simply. A real app might use FIFO or weighted average.
        const closingValue = item.opening_value + inwardsValue - outwardsValue

        return {
            ...item,
            inwards_qty: inwardsQty,
            inwards_value: inwardsValue,
            outwards_qty: outwardsQty,
            outwards_value: outwardsValue,
            closing_qty: closingQty,
            closing_value: closingValue
        }
    })
}

export async function getStockLedger(itemId: string, filters?: { dateFrom?: string, dateTo?: string }) {
    const db = getDb()

    const item = await db.selectFrom('items').selectAll().where('id', '=', itemId).executeTakeFirst()
    if (!item) throw new Error('Item not found')

    let query = db.selectFrom('inventory_entries')
        .innerJoin('vouchers', 'inventory_entries.voucher_id', 'vouchers.id')
        .leftJoin('voucher_entries', 'inventory_entries.voucher_entry_id', 'voucher_entries.id')
        .leftJoin('ledger_accounts', 'voucher_entries.ledger_id', 'ledger_accounts.id')
        .select([
            'inventory_entries.id',
            'inventory_entries.type',
            'inventory_entries.qty',
            'inventory_entries.rate',
            'inventory_entries.amount',
            'vouchers.date',
            'vouchers.voucher_no',
            'vouchers.voucher_type',
            'ledger_accounts.name as ledger_name'
        ])
        .where('inventory_entries.item_id', '=', itemId)
        .where('vouchers.is_posted', '=', 1)
        .orderBy('vouchers.date', 'asc')
        .orderBy('vouchers.created_at', 'asc')

    if (filters?.dateFrom) {
        query = query.where('vouchers.date', '>=', filters.dateFrom)
    }
    if (filters?.dateTo) {
        query = query.where('vouchers.date', '<=', filters.dateTo)
    }

    const movements = await query.execute()

    return {
        item,
        movements
    }
}
