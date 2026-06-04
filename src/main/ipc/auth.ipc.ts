import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { createCompany, login, setupTotp, verifyTotp, checkFirstRun, getCompanies, unlockCompany } from '../services/auth.service'
import { createCompanySchema, loginSchema, totpSchema, unlockCompanySchema } from '../../shared/types'
import { getSession } from '../lib/session'
import { logger } from '../lib/logger'
import { getDb } from '../db/connection'

export function registerAuthIpcHandlers() {
    ipcMain.handle(IPC.AUTH.CHECK_FIRST_RUN, async () => {
        return checkFirstRun()
    })

    ipcMain.handle(IPC.AUTH.GET_COMPANIES, async () => {
        return getCompanies()
    })

    ipcMain.handle(IPC.AUTH.UNLOCK_COMPANY, async (_, args) => {
        try {
            const parsed = unlockCompanySchema.parse(args)
            const success = await unlockCompany(parsed.companyName, parsed.masterPassword)
            return { success }
        } catch (error: any) {
            logger.error('Failed to unlock company', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.AUTH.CREATE_COMPANY, async (_, args) => {
        try {
            const parsed = createCompanySchema.parse(args)
            await createCompany(parsed)
            return { success: true }
        } catch (error: any) {
            logger.error('Failed to create company', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.AUTH.LOGIN, async (_, args) => {
        try {
            const parsed = loginSchema.parse(args)
            return await login(parsed)
        } catch (error: any) {
            logger.error('Login failed', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC.AUTH.SETUP_TOTP, async (_, args) => {
        // Require a valid session — setupTotp should not be callable without auth
        if (!args?.sessionToken) throw new Error('Unauthorized')
        const session = getSession(args.sessionToken)
        if (!session) throw new Error('Unauthorized')
        // Only allow user to setup their own TOTP, or admin to set up any
        if (session.id !== args.userId && session.role !== 'admin') {
            throw new Error('Forbidden')
        }
        return setupTotp(args.userId)
    })

    ipcMain.handle(IPC.AUTH.VERIFY_TOTP, async (_, args) => {
        if (!args?.sessionToken) throw new Error('Unauthorized')
        const session = getSession(args.sessionToken)
        if (!session) throw new Error('Unauthorized')

        const db = getDb()
        const user = await db.selectFrom('users').selectAll().where('id', '=', session.id).executeTakeFirst()
        if (!user) throw new Error('User not found')
        if (!user.totp_secret) throw new Error('TOTP not configured')

        // The secret was stored encrypted; decrypt it server-side rather than trusting the client
        const { decrypt } = await import('../lib/crypto')
        const { getSystemKey } = await import('../lib/crypto')
        const systemKey = getSystemKey(args.companyName)
        const secret = decrypt(user.totp_secret, systemKey)

        const parsed = totpSchema.parse({ token: args.token })
        return verifyTotp(args.companyName, session.id, parsed.token, secret)
    })
}
