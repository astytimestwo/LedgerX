import { ipcMain } from 'electron'
import log from 'electron-log'

export function registerCrashIpc() {
    ipcMain.handle('app:logError', (_, stackDesc: string) => {
        log.error('Renderer Crash:', stackDesc)
    })
}
