import cron, { ScheduledTask } from 'node-cron'
import { BackupService } from '../services/backup.service'
import { logger } from './logger'

let activeTask: ScheduledTask | null = null

export async function startBackupScheduler(companyName: string) {
    stopBackupScheduler() // Stop any existing

    try {
        const backupService = new BackupService()
        const settings = await backupService.getSettings()

        if (settings.backup_auto_enabled !== '1') {
            return
        }

        const timeStr = settings.backup_auto_time || '23:00'
        const [hours, minutes] = timeStr.split(':')

        const cronExpr = `${minutes} ${hours} * * *`

        logger.info(`Starting auto-backup scheduler: ${cronExpr} for ${companyName}`)

        activeTask = cron.schedule(cronExpr, async () => {
            logger.info('Running scheduled auto-backup...')
            try {
                await backupService.createLocalBackup(companyName)
                logger.info('Scheduled auto-backup completed.')
            } catch (e: any) {
                logger.error('Scheduled auto-backup failed: ' + e.message)
            }
        })
    } catch (e: any) {
        logger.error('Failed to start backup scheduler: ' + e.message)
    }
}

export function stopBackupScheduler() {
    if (activeTask) {
        activeTask.stop()
        activeTask = null
        logger.info('Stopped auto-backup scheduler.')
    }
}
