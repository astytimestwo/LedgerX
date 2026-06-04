import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { registerAuthIpcHandlers } from './ipc/auth.ipc'
import { registerLedgerIpcHandlers } from './ipc/ledger.ipc'
import { registerVoucherIpc } from './ipc/voucher.ipc'
import { registerGstIpc } from './ipc/gst.ipc'
import { registerInventoryIpc } from './ipc/inventory.ipc'
import { registerUserManagementIpc } from './ipc/user-management.ipc'
import { registerAuditIpc } from './ipc/audit.ipc'
import { registerBackupIpc } from './ipc/backup.ipc'
import { registerDialogIpc } from './ipc/dialog.ipc'
import { registerFyIpc } from './ipc/fy.ipc'
import { registerSearchIpc } from './ipc/search.ipc'
import { registerCrashIpc } from './ipc/crash.ipc'
import { startSessionCleanup } from './lib/session'

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        // Only allow http/https external links; block file://, javascript:, etc.
        const allowedProtocols = ['http:', 'https:']
        try {
            const url = new URL(details.url)
            if (allowedProtocols.includes(url.protocol)) {
                shell.openExternal(details.url)
            }
        } catch {
            // Invalid URL — silently deny
        }
        return { action: 'deny' }
    })

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    registerAuthIpcHandlers()
    registerLedgerIpcHandlers()
    registerVoucherIpc()
    registerGstIpc()
    registerInventoryIpc()
    registerUserManagementIpc()
    registerAuditIpc()
    registerBackupIpc()
    registerDialogIpc()
    registerFyIpc()
    registerSearchIpc()
    registerCrashIpc()
    startSessionCleanup()

    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.handle('ping', () => 'pong')
