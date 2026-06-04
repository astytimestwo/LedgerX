import { getDb } from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

export class FyService {
    private get db() {
        return getDb()
    }

    async getFinancialYears() {
        return await this.db.selectFrom('financial_years')
            .selectAll()
            .orderBy('start_date', 'desc')
            .execute()
    }

    async createFinancialYear(data: { name: string, start_date: string, end_date: string }) {
        return await this.db.insertInto('financial_years')
            .values({
                id: uuidv4(),
                name: data.name,
                start_date: data.start_date,
                end_date: data.end_date,
                is_locked: 0
            })
            .returningAll()
            .executeTakeFirstOrThrow()
    }

    async updateFinancialYear(id: string, data: { name: string, start_date: string, end_date: string }) {
        return await this.db.updateTable('financial_years')
            .set(data)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow()
    }

    async toggleLock(id: string, is_locked: number) {
        return await this.db.updateTable('financial_years')
            .set({ is_locked })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow()
    }
}
