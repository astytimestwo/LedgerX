import log from 'electron-log'
import { app } from 'electron'

const isProduction = app.isPackaged
log.transports.file.level = 'info';
// In production, suppress debug-level console output to prevent sensitive data leaking
log.transports.console.level = isProduction ? 'warn' : 'debug';

export const logger = {
    info: (message: string, ...args: any[]) => log.info(message, ...args),
    error: (message: string, ...args: any[]) => log.error(message, ...args),
    warn: (message: string, ...args: any[]) => log.warn(message, ...args),
    debug: (message: string, ...args: any[]) => log.debug(message, ...args)
}
