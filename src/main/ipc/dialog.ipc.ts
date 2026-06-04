import { ipcMain, dialog } from 'electron'
import fs from 'fs'

export function registerDialogIpc() {
    ipcMain.handle('dialog:openFile', async (_, options: Electron.OpenDialogOptions) => {
        const result = await dialog.showOpenDialog(options)
        return result
    })

    ipcMain.handle('dialog:readJsonFile', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'JSON Files', extensions: ['json'] }]
        })
        if (result.canceled || result.filePaths.length === 0) return null
        const content = fs.readFileSync(result.filePaths[0], 'utf-8')
        return JSON.parse(content)
    })
}
