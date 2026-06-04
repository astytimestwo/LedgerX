export interface Users {
    id: string
    username: string
    password_hash: string
    totp_secret: string
    role: string
    permissions: string | null
    permissions_json: string | null
    is_active: number
    created_at: string
    updated_at: string
}

export interface SessionLog {
    id: string
    user_id: string
    login_at: string
    logout_at: string | null
    duration_sec: number | null
    ip_address: string | null
}

export interface FinancialYears {
    id: string
    name: string
    start_date: string
    end_date: string
    is_locked: number
}

export interface LedgerGroups {
    id: string
    name: string
    parent_id: string | null
    nature: string // 'Assets' | 'Liabilities' | 'Income' | 'Expense'
    created_at: string
    updated_at: string
}

export interface LedgerAccounts {
    id: string
    code: string
    name: string
    name_hi: string | null
    group_id: string
    opening_balance: number
    opening_type: string // 'dr' | 'cr'
    gst_applicable: number
    gstin: string | null
    gst_treatment: string | null
    state_code: string | null
    hsn_code: string | null
    gst_rate: number | null
    is_active: number
    created_at: string
    updated_at: string
}

export interface AuditLog {
    id: string
    user_id: string
    action: string
    table_name: string | null
    record_id: string | null
    old_value: string | null
    new_value: string | null
    ip_address: string | null
    timestamp: string
}

export interface Vouchers {
    id: string
    voucher_no: string
    voucher_type: string
    date: string
    narration: string | null
    is_posted: number
    created_by: string
    created_at: string
    updated_at: string
}

export interface VoucherEntries {
    id: string
    voucher_id: string
    ledger_id: string
    type: 'dr' | 'cr'
    amount: number // stored in paise
    // Inventory Link
    item_id?: string
    qty?: number
    rate?: number
    // GST Data
    taxable_value_paise?: number
    cgst_amount_paise?: number
    sgst_amount_paise?: number
    igst_amount_paise?: number
    utgst_amount_paise?: number
    cess_amount_paise?: number
    gst_rate?: number
    supply_type?: string
    is_reverse_charge?: number
    place_of_supply?: string
}

export interface HsnMaster {
    code: string
    description: string
    gst_rate: number
    cess_rate: number
    type: 'goods' | 'service'
}

export interface VoucherSequences {
    voucher_type: string
    prefix: string
    last_seq: number
}

export interface ItemGroups {
    id: string
    name: string
    parent_id: string | null
    created_at: string
    updated_at: string
}

export interface Items {
    id: string
    code: string
    name: string
    name_hi: string | null
    group_id: string
    hsn_code: string | null
    default_gst_rate: number | null
    unit_of_measure: string
    opening_qty: number
    opening_rate: number
    opening_value: number
    is_active: number
    created_at: string
    updated_at: string
}

export interface InventoryEntries {
    id: string
    voucher_id: string
    voucher_entry_id: string | null
    item_id: string
    type: string // 'in' | 'out'
    qty: number
    rate: number
    amount: number
}

export interface AppSettings {
    key: string
    value: string
}

export interface Database {
    users: Users
    ledger_groups: LedgerGroups
    ledger_accounts: LedgerAccounts
    audit_log: AuditLog
    vouchers: Vouchers
    voucher_entries: VoucherEntries
    voucher_sequences: VoucherSequences
    hsn_master: HsnMaster
    item_groups: ItemGroups
    items: Items
    inventory_entries: InventoryEntries
    session_log: SessionLog
    app_settings: AppSettings
    financial_years: FinancialYears
}
