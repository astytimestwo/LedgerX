import { getDb } from '../db/connection'
import { ExpressionBuilder } from 'kysely'

export interface SearchResult {
    type: 'ledger' | 'voucher' | 'hsn'
    id: string
    label: string
    subtitle?: string
}

export class SearchService {
    async globalSearch(query: string): Promise<SearchResult[]> {
        if (!query || query.trim().length < 2) return []

        const q = `%${query.trim()}%`
        const results: SearchResult[] = []

        try {
            const db = getDb()
            // 1. Search Ledger Accounts (name)
            const ledgers = await db.selectFrom('ledger_accounts')
                .select(['id', 'name', 'group_id'])
                .where('name', 'like', q)
                .limit(5)
                .execute()

            for (const l of ledgers) {
                results.push({
                    type: 'ledger',
                    id: l.id,
                    label: l.name,
                    subtitle: `Ledger Account`
                })
            }

            // 2. Search Vouchers (voucher_no or narration)
            const vouchers = await db.selectFrom('vouchers')
                .select(['id', 'voucher_no', 'narration', 'voucher_type'])
                .where((eb: ExpressionBuilder<any, any>) => eb.or([
                    eb('voucher_no', 'like', q),
                    eb('narration', 'like', q)
                ]))
                .limit(5)
                .execute()

            for (const v of vouchers) {
                results.push({
                    type: 'voucher',
                    id: v.id,
                    label: v.voucher_no,
                    subtitle: `${v.voucher_type.replace('_', ' ')} • ${v.narration || ''}`
                })
            }

            // 3. Search HSN Master (description or code)
            const hsns = await db.selectFrom('hsn_master')
                .select(['code', 'description'])
                .where((eb: ExpressionBuilder<any, any>) => eb.or([
                    eb('code', 'like', q),
                    eb('description', 'like', q)
                ]))
                .limit(5)
                .execute()

            for (const h of hsns) {
                results.push({
                    type: 'hsn',
                    id: h.code,
                    label: h.code,
                    subtitle: `HSN • ${h.description}`
                })
            }

            return results
        } catch (error) {
            console.error('Global search error:', error)
            return []
        }
    }
}

export const searchService = new SearchService()
