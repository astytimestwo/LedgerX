import { z } from 'zod'

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required').max(64, 'Username must be 64 characters or fewer'),
    // bcrypt silently truncates at 72 bytes; cap at 72 chars to avoid confusion
    password: z.string().min(1, 'Password is required').max(72, 'Password must be 72 characters or fewer')
})
export type LoginInput = z.infer<typeof loginSchema>

export const totpSchema = z.object({
    token: z.string().length(6)
})
export type TotpInput = z.infer<typeof totpSchema>

export const createCompanySchema = z.object({
    companyName: z.string().min(1).max(100).regex(/^[a-zA-Z0-9 _-]+$/, 'Company name may only contain letters, numbers, spaces, hyphens, underscores'),
    gstin: z.string().optional(),
    state: z.string().min(1).max(50),
    financialYearStart: z.string(),
    masterPassword: z.string().min(8).max(72)
})
export type CreateCompanyInput = z.infer<typeof createCompanySchema>

export const unlockCompanySchema = z.object({
    companyName: z.string().min(1, 'Company is required').max(100, 'Company name must be 100 characters or fewer'),
    masterPassword: z.string().min(1, 'Master password is required').max(72, 'Master password must be 72 characters or fewer')
})
export type UnlockCompanyInput = z.infer<typeof unlockCompanySchema>

export const createLedgerGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required'),
    parent_id: z.string().nullable(),
    nature: z.enum(['Assets', 'Liabilities', 'Income', 'Expense'])
})
export type CreateLedgerGroupInput = z.infer<typeof createLedgerGroupSchema>

export const createLedgerAccountSchema = z.object({
    code: z.string().min(1, 'Account code is required'),
    group_id: z.string().min(1, 'Ledger group is required'),
    name: z.string().min(1, 'Account name is required'),
    opening_balance: z.number().nonnegative().optional().default(0),
    opening_type: z.enum(['dr', 'cr']),
    notes: z.string().optional(),
    gst_applicable: z.boolean().default(false),
    // GST
    gstin: z.string().optional(),
    gst_treatment: z.string().optional(),
    state_code: z.string().optional(),
    hsn_code: z.string().optional(),
    gst_rate: z.number().optional()
})
export type CreateLedgerAccountInput = z.infer<typeof createLedgerAccountSchema>

export const updateLedgerGroupSchema = createLedgerGroupSchema.extend({
    id: z.string().min(1)
})
export type UpdateLedgerGroupInput = z.infer<typeof updateLedgerGroupSchema>

export const deleteLedgerGroupSchema = z.object({
    id: z.string().min(1)
})
export type DeleteLedgerGroupInput = z.infer<typeof deleteLedgerGroupSchema>

export const updateLedgerAccountSchema = createLedgerAccountSchema.extend({
    id: z.string().min(1)
})
export type UpdateLedgerAccountInput = z.infer<typeof updateLedgerAccountSchema>

export const deleteLedgerAccountSchema = z.object({
    id: z.string().min(1)
})
export type DeleteLedgerAccountInput = z.infer<typeof deleteLedgerAccountSchema>

// User Model
export interface User {
    id: string
    username: string
    role: 'admin' | 'accountant' | 'viewer' | 'custom'
}

// Voucher Types
export const VoucherEntrySchema = z.object({
    ledger_id: z.string().min(1, 'Ledger is required'),
    type: z.enum(['dr', 'cr']),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    // Optional GST fields
    gst_rate: z.number().optional(),
    taxable_value_paise: z.number().optional(),
    cgst_amount_paise: z.number().optional(),
    sgst_amount_paise: z.number().optional(),
    igst_amount_paise: z.number().optional(),
    utgst_amount_paise: z.number().optional(),
    cess_amount_paise: z.number().optional(),
    supply_type: z.string().optional(),
    is_reverse_charge: z.number().optional(),
    place_of_supply: z.string().optional(),
    // Optional Inventory Fields
    item_id: z.string().optional(),
    qty: z.number().optional(),
    rate: z.number().optional()
})
export type VoucherEntryInput = z.infer<typeof VoucherEntrySchema>

export const createVoucherSchema = z.object({
    voucher_type: z.enum(['payment', 'receipt', 'journal', 'contra', 'sales', 'purchase', 'debit_note', 'credit_note']),
    date: z.string().min(1, 'Date is required'), // YYYY-MM-DD
    narration: z.string().optional(),
    is_posted: z.number().int().min(0).max(1).optional(),
    entries: z.array(VoucherEntrySchema).min(2, 'At least 2 entries required')
})
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>

export const updateVoucherSchema = createVoucherSchema.extend({
    id: z.string().min(1)
})
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>

// Report Types
export interface TrialBalanceRow {
    ledger_id: string
    account_name: string
    group_name: string
    debit_total: number
    credit_total: number
    closing_balance: number
    closing_type: 'dr' | 'cr'
}

export interface LedgerStatementRow {
    id: string
    date: string
    voucher_no: string
    narration: string | null
    type: 'dr' | 'cr'
    amount: number
    balance: number
    balance_type: 'dr' | 'cr'
}

export type ProfitAndLossReport = {
    incomeGroups: TrialBalanceRow[]
    expenseGroups: TrialBalanceRow[]
    totalIncome: number
    totalExpense: number
    netProfit: number
}

export type BalanceSheetReport = {
    assetGroups: TrialBalanceRow[]
    liabilityGroups: TrialBalanceRow[]
    totalAssets: number
    totalLiabilities: number
    pnlBalancing: number
    equityTotal: number
}

// --- Inventory ---

export const createItemGroupSchema = z.object({
    name: z.string().min(1, 'Item group name is required'),
    parent_id: z.string().optional()
})
export type CreateItemGroupInput = z.infer<typeof createItemGroupSchema>

export const updateItemGroupSchema = createItemGroupSchema.extend({
    id: z.string().min(1)
})
export type UpdateItemGroupInput = z.infer<typeof updateItemGroupSchema>

export const createItemSchema = z.object({
    code: z.string().min(1, 'Item code is required'),
    name: z.string().min(1, 'Item name is required'),
    group_id: z.string().min(1, 'Item group is required'),
    hsn_code: z.string().optional(),
    default_gst_rate: z.number().optional(),
    unit_of_measure: z.string().default('NOS'),
    opening_qty: z.number().optional().default(0),
    opening_rate: z.number().optional().default(0) // in paise
})
export type CreateItemInput = z.infer<typeof createItemSchema>

export const updateItemSchema = createItemSchema.extend({
    id: z.string().min(1)
})
export type UpdateItemInput = z.infer<typeof updateItemSchema>
