import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useSessionStore } from '../../stores/session.store'
import { Cloud, HardDrive, Save, RefreshCw, LogOut, CheckCircle, Clock } from 'lucide-react'

export const BackupSettings: React.FC = () => {
    const { companyName } = useSessionStore()
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [backups, setBackups] = useState<any[]>([])
    const [driveBackups, setDriveBackups] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [gdriveLoading, setGdriveLoading] = useState(false)

    useEffect(() => {
        if (!companyName) return
        loadData()
    }, [companyName])

    const loadData = async () => {
        setLoading(true)
        try {
            const s = await api.backup.getSettings()
            setSettings(s)

            const local = await api.backup.listLocal(companyName!)
            setBackups(local)

            if (s.gdrive_enabled === '1') {
                const cloud = await api.backup.gdrive.list(companyName!)
                setDriveBackups(cloud)
            }
        } catch (e: any) {
            console.error('Failed to load backup data:', e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const saveSettings = async () => {
        setSaving(true)
        try {
            for (const [key, value] of Object.entries(settings)) {
                await api.backup.updateSetting(key, value, companyName!)
            }
            alert('Settings saved successfully.')
        } catch (e: any) {
            alert('Failed to save settings: ' + e.message)
        } finally {
            setSaving(false)
        }
    }

    const createLocalBackup = async () => {
        if (!confirm('Create a new local backup now?')) return
        try {
            await api.backup.createLocal(companyName!)
            await loadData()
            alert('Local backup created.')
        } catch (e: any) {
            alert('Failed to create backup: ' + e.message)
        }
    }

    const uploadToDrive = async (localPath: string) => {
        setGdriveLoading(true)
        try {
            await api.backup.gdrive.upload(localPath, companyName!)
            await loadData()
            alert('Uploaded to Google Drive successfully.')
        } catch (e: any) {
            alert('Upload failed: ' + e.message)
        } finally {
            setGdriveLoading(false)
        }
    }

    const authorizeDrive = async () => {
        try {
            const url = await api.backup.gdrive.getAuthUrl()
            // In a real app we'd open the external browser here and intercept the callback.
            // For now, prompt the user to paste the code.
            window.open(url, '_blank')
            const code = prompt('Please paste the authorization code here:')
            if (code) {
                setGdriveLoading(true)
                await api.backup.gdrive.exchangeCode(code, companyName!)
                await loadData()
                alert('Google Drive authorized.')
            }
        } catch (e: any) {
            alert('Authorization failed: ' + e.message)
        } finally {
            setGdriveLoading(false)
        }
    }

    const revokeDrive = async () => {
        if (!confirm('Are you sure you want to disconnect Google Drive?')) return
        setGdriveLoading(true)
        try {
            await api.backup.gdrive.revoke(companyName!)
            setDriveBackups([])
            await loadData()
        } catch (e: any) {
            alert('Revoke failed: ' + e.message)
        } finally {
            setGdriveLoading(false)
        }
    }

    const restoreLocal = async (path: string) => {
        if (!confirm('WARNING: Restoring will overwrite the current database. The app will need to be restarted. Are you absolutely sure?')) return
        try {
            await api.backup.restoreLocal(path, companyName!)
            alert('Restore complete. Please restart the application for changes to take effect.')
            window.close() // Close the current window to force restart
        } catch (e: any) {
            alert('Restore failed: ' + e.message)
        }
    }

    if (loading) return <div className="p-8 text-center text-white/50">Loading settings...</div>

    return (
        <div className="p-4 h-full flex flex-col gap-6 overflow-auto">
            <div className="flex justify-between items-center bg-white/5 dark:bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Backup & Sync Settings</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Manage local backups and cloud synchronization.</p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Local Backup Section */}
                <div className="bg-white/5 dark:bg-black/20 rounded-xl p-6 border border-white/10 backdrop-blur-md flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <HardDrive className="text-[var(--color-accent)]" size={24} />
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Local Backup</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Backup Retention (Days)</label>
                            <input
                                type="number"
                                value={settings.backup_retention_days || '30'}
                                onChange={(e) => handleChange('backup_retention_days', e.target.value)}
                                className="bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] outline-none w-32"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Auto-Backup Enabled</label>
                            <select
                                value={settings.backup_auto_enabled || '0'}
                                onChange={(e) => handleChange('backup_auto_enabled', e.target.value)}
                                className="bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-32"
                            >
                                <option value="0">Disabled</option>
                                <option value="1">Enabled</option>
                            </select>
                        </div>

                        {settings.backup_auto_enabled === '1' && (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Auto-Backup Time</label>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-white/50" />
                                    <input
                                        type="time"
                                        value={settings.backup_auto_time || '23:00'}
                                        onChange={(e) => handleChange('backup_auto_time', e.target.value)}
                                        className="bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-[var(--color-text-primary)]">Recent Local Backups</h4>
                            <button onClick={createLocalBackup} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-white transition-colors">
                                Create Backup Now
                            </button>
                        </div>
                        {backups.length === 0 ? (
                            <p className="text-sm text-white/40 italic">No local backups found.</p>
                        ) : (
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {backups.map((b) => (
                                    <li key={b.name} className="flex items-center justify-between text-sm bg-white/10 dark:bg-black/20 p-2 rounded-md border border-white/5">
                                        <div>
                                            <p className="font-medium text-[var(--color-text-primary)] truncate max-w-[200px]" title={b.name}>{b.name}</p>
                                            <p className="text-xs text-white/50">{new Date(b.createdAt).toLocaleString()} • {(b.sizeBytes / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {settings.gdrive_enabled === '1' && (
                                                <button onClick={() => uploadToDrive(b.path)} disabled={gdriveLoading} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-400/10 rounded transition-colors" title="Upload to Drive">
                                                    <Cloud size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => restoreLocal(b.path)} className="text-amber-400 hover:text-amber-300 text-xs px-2 py-1 bg-amber-400/10 rounded transition-colors" title="Restore this backup">
                                                Restore
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Cloud Sync Section */}
                <div className="bg-white/5 dark:bg-black/20 rounded-xl p-6 border border-white/10 backdrop-blur-md flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Cloud className="text-green-400" size={24} />
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Google Drive Sync</h3>
                    </div>

                    {settings.gdrive_enabled === '1' ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                                <CheckCircle size={18} />
                                <span className="text-sm font-medium">Connected to Google Drive</span>
                                <button onClick={revokeDrive} disabled={gdriveLoading} className="ml-auto flex items-center gap-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 rounded transition-colors">
                                    <LogOut size={14} /> Disconnect
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">Auto-Sync Backups</label>
                                    <select
                                        value={settings.gdrive_auto_sync || '0'}
                                        onChange={(e) => handleChange('gdrive_auto_sync', e.target.value)}
                                        className="bg-black/5 dark:bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-32"
                                    >
                                        <option value="0">Disabled</option>
                                        <option value="1">Enabled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-[var(--color-text-primary)]">Cloud Backups</h4>
                                    <button onClick={loadData} disabled={gdriveLoading} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-md text-white transition-colors flex items-center gap-1">
                                        <RefreshCw size={12} className={gdriveLoading ? 'animate-spin' : ''} /> Refresh
                                    </button>
                                </div>
                                {driveBackups.length === 0 ? (
                                    <p className="text-sm text-white/40 italic">No cloud backups found.</p>
                                ) : (
                                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {driveBackups.map((db) => (
                                            <li key={db.id} className="flex items-center justify-between text-sm bg-white/10 dark:bg-black/20 p-2 rounded-md border border-white/5">
                                                <div>
                                                    <p className="font-medium text-[var(--color-text-primary)] truncate max-w-[200px]" title={db.name}>{db.name}</p>
                                                    <p className="text-xs text-white/50">{new Date(db.createdAt).toLocaleString()} • {(db.sizeBytes / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-400/10 rounded transition-colors" title="Download from Drive">
                                                    Download
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-white/10 dark:bg-black/20 rounded-lg border border-white/5 text-center gap-4">
                            <Cloud className="text-white/20" size={48} />
                            <div>
                                <h4 className="font-bold text-[var(--color-text-primary)]">Not Connected</h4>
                                <p className="text-xs text-white/50 max-w-xs mx-auto mt-2">Connect your Google Drive account to securely store encrypted backups in the cloud.</p>
                            </div>
                            <button onClick={authorizeDrive} disabled={gdriveLoading} className="mt-2 bg-white text-blue-600 font-bold px-6 py-2 rounded-lg hover:bg-white/90 transition-colors shadow-lg">
                                {gdriveLoading ? 'Connecting...' : 'Connect Google Drive'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
