import { getDb } from '../db/connection'
import { createVoucher, updateVoucher, deleteVoucher as repoDeleteVoucher, getVouchers, getNextSequence } from '../db/repositories/voucher.repo'
import { CreateVoucherInput, UpdateVoucherInput, VoucherEntryInput, TrialBalanceRow, LedgerStatementRow } from '../../shared/types'
import { determineGstType, computeGstAmounts } from '../lib/gst-calc'

// Double-Entry Validation
function validateDoubleEntry(entries: VoucherEntryInput[]) {
    let debitTotal = 0
    let creditTotal = 0

    entries.forEach(e => {
        if (e.type === 'dr') debitTotal += e.amount
        else if (e.type === 'cr') creditTotal += e.amount
    })

    if (debitTotal !== creditTotal) {
        throw new Error(`Double-entry validation failed: Debits (₹${(debitTotal / 100).toFixed(2)}) do not equal Credits (₹${(creditTotal / 100).toFixed(2)}).`)
    }
}

// Generate Voucher Number
const PREFIX_MAP: Record<string, string> = {
    'payment': 'PV',
    'receipt': 'RV',
    'journal': 'JV',
    'contra': 'CV',
    'sales': 'SV',
    'purchase': 'PU',
    'debit_note': 'DN',
    'credit_note': 'CN'
}

async function generateVoucherNumber(type: string, dateStr: string): Promise<string> {
    const prefix = PREFIX_MAP[type] || 'V'
    const year = dateStr.substring(0, 4)
    const seq = await getNextSequence(type, prefix)
    const seqStr = String(seq).padStart(4, '0')
    return `${prefix}-${year}-${seqStr}`
}

export async function createNewVoucher(input: CreateVoucherInput, userId: string) {
    validateDoubleEntry(input.entries)

    // Process GST for sales/purchases
    if (['sales', 'purchase', 'debit_note', 'credit_note'].includes(input.voucher_type)) {
        await processGstEntries(input.entries)
    }

    const voucherNo = await generateVoucherNumber(input.voucher_type, input.date)
    return await createVoucher(input, voucherNo, userId)
}

export async function editVoucher(input: UpdateVoucherInput, userId: string) {
    validateDoubleEntry(input.entries)

    if (['sales', 'purchase', 'debit_note', 'credit_note'].includes(input.voucher_type)) {
        await processGstEntries(input.entries)
    }

    return await updateVoucher(input, userId)
}

async function processGstEntries(entries: VoucherEntryInput[]) {
    const db = getDb()

    // Look up company state from app_settings
    let companyStateCode: string | null = null
    const companySetting = await db.selectFrom('app_settings')
        .selectAll()
        .where('key', '=', 'company_state_code')
        .executeTakeFirst()
    if (companySetting?.value) {
        companyStateCode = companySetting.value as string
    }
    if (!companyStateCode) {
        throw new Error('company_state_code not configured in app_settings')
    }

    // Find the party ledger entry (Sundry Debtors/Creditors) — not assuming first entry
    let partyStateCode: string | null = null
    const partyLedgerIds = entries.map(e => e.ledger_id)

    const ledgersWithGroups = await db.selectFrom('ledger_accounts as la')
        .innerJoin('ledger_groups as lg', 'la.group_id', 'lg.id')
        .select(['la.id', 'la.state_code', 'lg.name as group_name'])
        .where('la.id', 'in', partyLedgerIds)
        .execute()

    const partyLedger = ledgersWithGroups.find(l =>
        l.group_name === 'Sundry Debtors' || l.group_name === 'Sundry Creditors'
    )
    if (partyLedger?.state_code) {
        partyStateCode = partyLedger.state_code
    }

    if (!partyStateCode) {
        // Fallback: look for any ledger in the entries that has a state_code
        const fallback = ledgersWithGroups.find(l => l.state_code && l.state_code !== '00')
        if (fallback) partyStateCode = fallback.state_code
    }

    if (!partyStateCode) {
        throw new Error('Could not determine party state code for GST calculation')
    }

    const gstType = determineGstType(companyStateCode, partyStateCode)

    for (const entry of entries) {
        // Only process GST for income/expense/item lines, not the party ledger line itself
        // Identifying this might require looking at the ledger group, but if `gst_rate` is passed from UI, we process it.
        if (entry.gst_rate && entry.gst_rate > 0) {
            const amountPaise = entry.amount
            const taxableValue = amountPaise

            // Assuming exclusive for now unless flag is passed (flag not yet in type, assuming exclusive)
            const computedGst = computeGstAmounts(taxableValue, entry.gst_rate, gstType, 0)

            entry.taxable_value_paise = taxableValue
            entry.cgst_amount_paise = computedGst.cgst_amount_paise
            entry.sgst_amount_paise = computedGst.sgst_amount_paise
            entry.igst_amount_paise = computedGst.igst_amount_paise
            entry.utgst_amount_paise = computedGst.utgst_amount_paise
            entry.cess_amount_paise = computedGst.cess_amount_paise
            entry.supply_type = 'taxable'
        }
    }
}

export async function removeVoucher(id: string, userId: string) {
    return await repoDeleteVoucher(id, userId)
}

export async function getDayBook(filters?: { dateFrom?: string, dateTo?: string, type?: string }) {
    return await getVouchers(filters)
}

export async function getLedgerStatement(ledgerId: string, dateFrom?: string, dateTo?: string) {
    const db = getDb()

    // 1. Get Opening Balance for this ledger
    const ledger = await db.selectFrom('ledger_accounts').selectAll().where('id', '=', ledgerId).executeTakeFirst()
    if (!ledger) throw new Error('Ledger not found')

    let runningBalance = ledger.opening_balance
    let runningType = ledger.opening_type

    // We build the opening balance dynamically if there is a 'dateFrom'
    const entriesQuery = db.selectFrom('voucher_entries as ve')
        .innerJoin('vouchers as v', 've.voucher_id', 'v.id')
        .select(['ve.id', 've.type', 've.amount', 'v.date', 'v.voucher_no', 'v.narration'])
        .where('ve.ledger_id', '=', ledgerId)
        .where('v.is_posted', '=', 1)
        .orderBy('v.date', 'asc')
        .orderBy('v.created_at', 'asc')

    const allEntries = await entriesQuery.execute()

    const rows: LedgerStatementRow[] = []

    // Add opening row
    rows.push({
        id: 'opening',
        date: dateFrom || '',
        voucher_no: 'Opening Balance',
        narration: null,
        type: ledger.opening_type as 'dr' | 'cr',
        amount: ledger.opening_balance,
        balance: runningBalance,
        balance_type: runningType as 'dr' | 'cr'
    })

    for (const entry of allEntries) {
        // Only include in statement if Date >= dateFrom and Date <= dateTo
        const inRange = (!dateFrom || entry.date >= dateFrom) && (!dateTo || entry.date <= dateTo)

        if (entry.type === 'dr') {
            if (runningType === 'dr') runningBalance += entry.amount
            else {
                runningBalance -= entry.amount
                if (runningBalance < 0) {
                    runningBalance = Math.abs(runningBalance)
                    runningType = 'dr'
                }
            }
        } else {
            if (runningType === 'cr') runningBalance += entry.amount
            else {
                runningBalance -= entry.amount
                if (runningBalance < 0) {
                    runningBalance = Math.abs(runningBalance)
                    runningType = 'cr'
                }
            }
        }

        if (inRange) {
            rows.push({
                id: entry.id,
                date: entry.date,
                voucher_no: entry.voucher_no,
                narration: entry.narration,
                type: entry.type as 'dr' | 'cr',
                amount: entry.amount,
                balance: runningBalance,
                balance_type: runningType as 'dr' | 'cr'
            })
        }
    }

    return rows
}

export async function getTrialBalance(dateTo?: string): Promise<TrialBalanceRow[]> {
    const db = getDb()

    const ledgers = await db.selectFrom('ledger_accounts as l')
        .innerJoin('ledger_groups as g', 'l.group_id', 'g.id')
        .select(['l.id as ledger_id', 'l.name as account_name', 'l.opening_balance', 'l.opening_type', 'g.name as group_name'])
        .where('l.is_active', '=', 1)
        .execute()

    let query = db.selectFrom('voucher_entries as ve')
        .innerJoin('vouchers as v', 've.voucher_id', 'v.id')
        .select(['ve.ledger_id', 've.type', 've.amount'])
        .where('v.is_posted', '=', 1)

    if (dateTo) {
        query = query.where('v.date', '<=', dateTo)
    }

    const entries = await query.execute()

    const results: TrialBalanceRow[] = []

    for (const ledger of ledgers) {
        let debitTotal = ledger.opening_type === 'dr' ? ledger.opening_balance : 0
        let creditTotal = ledger.opening_type === 'cr' ? ledger.opening_balance : 0

        const ledgerEntries = entries.filter(e => e.ledger_id === ledger.ledger_id)
        for (const e of ledgerEntries) {
            if (e.type === 'dr') debitTotal += e.amount
            else creditTotal += e.amount
        }

        let closingBalance = 0
        let closingType: 'dr' | 'cr' = 'dr'

        if (debitTotal > creditTotal) {
            closingBalance = debitTotal - creditTotal
            closingType = 'dr'
        } else if (creditTotal > debitTotal) {
            closingBalance = creditTotal - debitTotal
            closingType = 'cr'
        } else {
            closingBalance = 0
        }

        // Only include accounts with non-zero balances (unless opening forces it)
        if (debitTotal > 0 || creditTotal > 0) {
            results.push({
                ledger_id: ledger.ledger_id,
                account_name: ledger.account_name,
                group_name: ledger.group_name,
                debit_total: debitTotal,
                credit_total: creditTotal,
                closing_balance: closingBalance,
                closing_type: closingType
            })
        }
    }

    return results
}

export async function buildProfitAndLoss(dateFrom?: string, dateTo?: string): Promise<any> {
    const trialBalance = await getTrialBalance(dateTo)
    // Basic logic mapping nature to P&L
    const incomeGroups = trialBalance.filter(r => ['Income'].includes(r.group_name)) // Would need actual nature mapping if groups are custom
    const expenseGroups = trialBalance.filter(r => ['Expense'].includes(r.group_name))

    // Sum them up
    const totalIncome = incomeGroups.reduce((acc, r) => acc + (r.closing_type === 'cr' ? r.closing_balance : -r.closing_balance), 0)
    const totalExpense = expenseGroups.reduce((acc, r) => acc + (r.closing_type === 'dr' ? r.closing_balance : -r.closing_balance), 0)

    return {
        incomeGroups,
        expenseGroups,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense
    }
}

export async function buildBalanceSheet(dateTo?: string): Promise<any> {
    const trialBalance = await getTrialBalance(dateTo)
    const assetGroups = trialBalance.filter(r => ['Assets'].includes(r.group_name))
    const liabilityGroups = trialBalance.filter(r => ['Liabilities', 'Equity'].includes(r.group_name))

    const totalAssets = assetGroups.reduce((acc, r) => acc + (r.closing_type === 'dr' ? r.closing_balance : -r.closing_balance), 0)
    const totalLiabilities = liabilityGroups.reduce((acc, r) => acc + (r.closing_type === 'cr' ? r.closing_balance : -r.closing_balance), 0)

    const pnl = await buildProfitAndLoss(undefined, dateTo)

    return {
        assetGroups,
        liabilityGroups,
        totalAssets,
        totalLiabilities,
        pnlBalancing: pnl.netProfit
    }
}
