import { getDb } from '../db/connection'

export class GstService {
    private get db() {
        return getDb()
    }

    // --- HSN/SAC Master ---

    async getHsnList() {
        return await this.db.selectFrom('hsn_master').selectAll().execute()
    }

    async getHsn(code: string) {
        return await this.db.selectFrom('hsn_master')
            .selectAll()
            .where('code', '=', code)
            .executeTakeFirst()
    }

    async createHsn(data: { code: string, description: string, gst_rate: number, cess_rate: number, type: 'goods' | 'service' }) {
        return await this.db.insertInto('hsn_master')
            .values(data)
            .returningAll()
            .executeTakeFirstOrThrow()
    }

    async updateHsn(code: string, data: { description: string, gst_rate: number, cess_rate: number, type: 'goods' | 'service' }) {
        return await this.db.updateTable('hsn_master')
            .set(data)
            .where('code', '=', code)
            .returningAll()
            .executeTakeFirstOrThrow()
    }

    async deleteHsn(code: string) {
        return await this.db.deleteFrom('hsn_master')
            .where('code', '=', code)
            .execute()
    }

    // --- GST Reports (GSTR-1, 3B, ITC) ---
    // These will be fully built out in subsequent phases. 
    // Outlining the endpoints corresponding to the IPC channels for now.

    async buildGstr1(period: { from: string, to: string }) {
        const salesVouchers = await this.db.selectFrom('vouchers')
            .selectAll()
            .where('voucher_type', '=', 'sales')
            .where('date', '>=', period.from)
            .where('date', '<=', period.to)
            .where('is_posted', '=', 1)
            .execute()

        const voucherIds = salesVouchers.map(v => v.id)

        let allEntries: any[] = []
        if (voucherIds.length > 0) {
            allEntries = await this.db.selectFrom('voucher_entries as ve')
                .innerJoin('ledger_accounts as la', 've.ledger_id', 'la.id')
                .select([
                    've.voucher_id', 've.type', 've.amount', 've.taxable_value_paise',
                    've.cgst_amount_paise', 've.sgst_amount_paise', 've.igst_amount_paise',
                    've.cess_amount_paise', 've.gst_rate', 've.supply_type',
                    'la.gstin', 'la.state_code', 'la.name as party_name'
                ])
                .where('ve.voucher_id', 'in', voucherIds)
                .execute()
        }

        const b2b: any[] = []
        const b2cs: any[] = []

        for (const v of salesVouchers) {
            const vEntries = allEntries.filter(e => e.voucher_id === v.id)
            const partyEntry = vEntries.find(e => e.type === 'dr') // In sales, debtor is debited
            const taxEntries = vEntries.filter(e => e.gst_rate && e.gst_rate > 0)

            if (!partyEntry || taxEntries.length === 0) continue;

            const isB2B = !!partyEntry.gstin

            taxEntries.forEach(item => {
                const row = {
                    voucher_no: v.voucher_no,
                    date: v.date,
                    party_name: partyEntry.party_name,
                    gstin: partyEntry.gstin || '',
                    state_code: partyEntry.state_code || '',
                    gst_rate: item.gst_rate,
                    taxable_value: item.taxable_value_paise / 100,
                    cgst: item.cgst_amount_paise / 100,
                    sgst: item.sgst_amount_paise / 100,
                    igst: item.igst_amount_paise / 100,
                    cess: item.cess_amount_paise / 100
                }

                if (isB2B) b2b.push(row)
                else b2cs.push(row)
            })
        }

        return { b2b, b2cs, cdnr: [], hsn: [], nil: [] }
    }

    async buildGstr3B(period: { from: string, to: string }) {
        const gstr1 = await this.buildGstr1(period)

        let outwardTaxable = 0
        let outwardIgst = 0
        let outwardCgst = 0
        let outwardSgst = 0
        let outwardCess = 0

            ;[...gstr1.b2b, ...gstr1.b2cs].forEach(r => {
                outwardTaxable += r.taxable_value
                outwardIgst += r.igst
                outwardCgst += r.cgst
                outwardSgst += r.sgst
                outwardCess += r.cess
            })

        const table3_1 = [{
            nature: 'Outward taxable supplies (other than zero rated, nil rated and exempted)',
            taxable_value: outwardTaxable,
            igst: outwardIgst,
            cgst: outwardCgst,
            sgst: outwardSgst,
            cess: outwardCess
        }]

        // Fetch ITC (Purchases)
        const purchaseVouchers = await this.db.selectFrom('vouchers')
            .selectAll()
            .where('voucher_type', '=', 'purchase')
            .where('date', '>=', period.from)
            .where('date', '<=', period.to)
            .where('is_posted', '=', 1)
            .execute()

        let itcIgst = 0
        let itcCgst = 0
        let itcSgst = 0
        let itcCess = 0

        if (purchaseVouchers.length > 0) {
            const pIds = purchaseVouchers.map(v => v.id)
            const pEntries = await this.db.selectFrom('voucher_entries')
                .select(['igst_amount_paise', 'cgst_amount_paise', 'sgst_amount_paise', 'cess_amount_paise'])
                .where('voucher_id', 'in', pIds)
                .where('gst_rate', '>', 0)
                .execute()

            pEntries.forEach(e => {
                itcIgst += (e.igst_amount_paise || 0) / 100
                itcCgst += (e.cgst_amount_paise || 0) / 100
                itcSgst += (e.sgst_amount_paise || 0) / 100
                itcCess += (e.cess_amount_paise || 0) / 100
            })
        }

        const table4 = [{
            nature: 'All other ITC',
            igst: itcIgst,
            cgst: itcCgst,
            sgst: itcSgst,
            cess: itcCess
        }]

        return {
            table3_1,
            table3_2: [],
            table4,
            table5: [],
            table6_1: []
        }
    }

    async buildGstr2aReconciliation(data: { period: { from: string, to: string }, portalData: any }) {
        // Fetch all local purchase vouchers in the period
        const purchaseVouchers = await this.db.selectFrom('vouchers')
            .selectAll()
            .where('voucher_type', '=', 'purchase')
            .where('date', '>=', data.period.from)
            .where('date', '<=', data.period.to)
            .where('is_posted', '=', 1)
            .execute()

        let localEntries: any[] = []
        if (purchaseVouchers.length > 0) {
            const vIds = purchaseVouchers.map(v => v.id)
            localEntries = await this.db.selectFrom('voucher_entries as ve')
                .innerJoin('ledger_accounts as la', 've.ledger_id', 'la.id')
                .select([
                    've.voucher_id', 've.type', 'la.gstin', 've.taxable_value_paise',
                    've.cgst_amount_paise', 've.sgst_amount_paise', 've.igst_amount_paise', 've.cess_amount_paise'
                ])
                .where('ve.voucher_id', 'in', vIds)
                .where('ve.type', '=', 'cr') // The party is credited in a purchase
                .execute()
        }

        const localBooks = purchaseVouchers.map(v => {
            const party = localEntries.find(e => e.voucher_id === v.id)
            return {
                id: v.id,
                voucher_no: v.voucher_no,
                date: v.date,
                gstin: party?.gstin || '',
                total_amount: party ? ((party.taxable_value_paise || 0) + (party.cgst_amount_paise || 0) + (party.sgst_amount_paise || 0) + (party.igst_amount_paise || 0) + (party.cess_amount_paise || 0)) / 100 : 0,
                matched: false
            }
        }).filter(v => v.gstin) // Only B2B

        const portalInvoices: any[] = []
        if (data.portalData?.b2b) {
            data.portalData.b2b.forEach((supplier: any) => {
                const gstin = supplier.ctin
                if (supplier.inv) {
                    supplier.inv.forEach((inv: any) => {
                        portalInvoices.push({
                            gstin,
                            voucher_no: String(inv.inum),
                            date: inv.idt, // usually DD-MM-YYYY in GST JSON
                            val: Number(inv.val),
                            matched: false
                        })
                    })
                }
            })
        }

        const exactMatches: any[] = []
        const partialMatches: any[] = []
        const missingInBooks: any[] = []

        // Match portal data against local books
        portalInvoices.forEach(pInv => {
            // Very naive fuzzy match on invoice number by stripping non-alphanumeric
            const pNumClean = pInv.voucher_no.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

            const localMatch = localBooks.find(l => {
                const lNumClean = l.voucher_no.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
                return l.gstin === pInv.gstin && lNumClean === pNumClean
            })

            if (localMatch) {
                localMatch.matched = true
                pInv.matched = true

                // Compare values
                const lVal = localMatch.total_amount / 100
                if (Math.abs(lVal - pInv.val) < 1) { // 1 rupee tolerance
                    exactMatches.push({ portal: pInv, local: localMatch })
                } else {
                    partialMatches.push({ portal: pInv, local: localMatch, diff: lVal - pInv.val })
                }
            } else {
                missingInBooks.push(pInv)
            }
        })

        const missingInPortal = localBooks.filter(l => !l.matched)

        return {
            exactMatches,
            partialMatches,
            missingInBooks,
            missingInPortal,
            summary: {
                totalPortal: portalInvoices.length,
                totalLocal: localBooks.length,
                matchedCount: exactMatches.length + partialMatches.length
            }
        }
    }

    async buildTaxLiabilityReport(period: { from: string, to: string }) {
        const salesVouchers = await this.db.selectFrom('vouchers')
            .selectAll()
            .where('voucher_type', '=', 'sales')
            .where('date', '>=', period.from)
            .where('date', '<=', period.to)
            .where('is_posted', '=', 1)
            .execute()

        if (salesVouchers.length === 0) return []

        const vIds = salesVouchers.map(v => v.id)
        const entries = await this.db.selectFrom('voucher_entries as ve')
            .select(['ve.gst_rate', 've.taxable_value_paise', 've.cgst_amount_paise', 've.sgst_amount_paise', 've.igst_amount_paise', 've.cess_amount_paise'])
            .where('ve.voucher_id', 'in', vIds)
            .where('ve.gst_rate', '>', 0)
            .execute()

        const rateMap = new Map<number, any>()

        entries.forEach(e => {
            const rate = e.gst_rate!
            if (!rateMap.has(rate)) {
                rateMap.set(rate, {
                    tax_rate: rate,
                    taxable_value: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    cess: 0,
                    total_tax: 0
                })
            }

            const row = rateMap.get(rate)
            row.taxable_value += (e.taxable_value_paise || 0) / 100
            row.cgst += (e.cgst_amount_paise || 0) / 100
            row.sgst += (e.sgst_amount_paise || 0) / 100
            row.igst += (e.igst_amount_paise || 0) / 100
            row.cess += (e.cess_amount_paise || 0) / 100

            row.total_tax = row.cgst + row.sgst + row.igst + row.cess
        })

        return Array.from(rateMap.values()).sort((a, b) => a.tax_rate - b.tax_rate)
    }

    async buildItcLedger(period: { from: string, to: string }) {
        const purchaseVouchers = await this.db.selectFrom('vouchers')
            .selectAll()
            .where('voucher_type', '=', 'purchase')
            .where('date', '>=', period.from)
            .where('date', '<=', period.to)
            .where('is_posted', '=', 1)
            .execute()

        if (purchaseVouchers.length === 0) return []

        const vIds = purchaseVouchers.map(v => v.id)
        const entries = await this.db.selectFrom('voucher_entries as ve')
            .innerJoin('ledger_accounts as la', 've.ledger_id', 'la.id')
            .select([
                've.voucher_id', 've.type', 'la.name as ledger_name', 'la.id as ledger_id',
                've.cgst_amount_paise', 've.sgst_amount_paise', 've.igst_amount_paise', 've.cess_amount_paise'
            ])
            .where('ve.voucher_id', 'in', vIds)
            .where('ve.type', '=', 'dr') // Tax amounts fall on the expense/purchase debit legs usually, or the separate tax ledgers?
            // Actually, in our schema, GST amounts are recorded on the item/expense row itself.
            .execute()

        // Map voucher ID to its date/month
        const vDateMap = new Map()
        purchaseVouchers.forEach(v => {
            const dateObj = new Date(v.date)
            const month = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' })
            vDateMap.set(v.id, { date: v.date, month })
        })

        // Group by month -> ledger
        const groupMap = new Map<string, any>()

        entries.forEach(e => {
            // Only aggregate rows that have tax content
            const cgst = (e.cgst_amount_paise || 0)
            const sgst = (e.sgst_amount_paise || 0)
            const igst = (e.igst_amount_paise || 0)
            const cess = (e.cess_amount_paise || 0)

            if (cgst === 0 && sgst === 0 && igst === 0 && cess === 0) return

            const { month } = vDateMap.get(e.voucher_id)
            const key = `${month}_${e.ledger_id}`

            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    month,
                    ledger: e.ledger_name,
                    igst: 0,
                    cgst: 0,
                    sgst: 0,
                    total_itc: 0
                })
            }

            const row = groupMap.get(key)
            row.igst += igst / 100
            row.cgst += cgst / 100
            row.sgst += sgst / 100
            row.total_itc += (igst + cgst + sgst) / 100
        })

        return Array.from(groupMap.values())
    }
}
