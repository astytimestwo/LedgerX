export enum Permission {
    CREATE_VOUCHER = 'create_voucher',
    EDIT_VOUCHER = 'edit_voucher',
    DELETE_VOUCHER = 'delete_voucher',
    VIEW_REPORTS = 'view_reports',
    MANAGE_USERS = 'manage_users',
    MANAGE_MASTERS = 'manage_masters',
    EXPORT_REPORTS = 'export_reports',
    VIEW_AUDIT = 'view_audit',
}

export const ROLE_DEFAULTS: Record<string, Permission[]> = {
    admin: Object.values(Permission),
    accountant: [
        Permission.CREATE_VOUCHER,
        Permission.EDIT_VOUCHER,
        Permission.DELETE_VOUCHER,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_MASTERS,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_AUDIT
    ],
    viewer: [Permission.VIEW_REPORTS, Permission.EXPORT_REPORTS],
    custom: [] // loaded from DB
}

export function hasPermission(user: { role: string, permissions_json: string | null }, perm: Permission): boolean {
    if (!user) return false
    if (user.role === 'admin') return true

    let userPerms: Permission[] = []

    if (user.role === 'custom') {
        if (user.permissions_json) {
            try {
                const decoded = JSON.parse(user.permissions_json)
                if (!Array.isArray(decoded)) return false
                // Validate that each value is a canonical Permission enum value
                const validPerms = new Set(Object.values(Permission))
                userPerms = (decoded as string[])
                    .filter((p): p is Permission => validPerms.has(p as Permission))
            } catch (e) {
                userPerms = []
            }
        }
    } else {
        userPerms = ROLE_DEFAULTS[user.role] || []
    }

    return userPerms.includes(perm)
}
