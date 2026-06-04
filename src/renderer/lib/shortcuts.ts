export interface ShortcutDef {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    description: string;
}

export const SHORTCUTS: Record<string, ShortcutDef> = {
    GLOBAL_SEARCH: { key: 'F', ctrl: true, description: 'Global search' },
    NEW_VOUCHER: { key: 'N', ctrl: true, description: 'New voucher' },
    SAVE_SUBMIT: { key: 'S', ctrl: true, description: 'Save / Submit' },
    DELETE_SELECTED: { key: 'Delete', ctrl: true, description: 'Delete selected' },
    EDIT_SELECTED: { key: 'Enter', description: 'Edit selected' },
    CLOSE_CANCEL: { key: 'Escape', description: 'Close / Cancel' },
    NAV_ROWS: { key: 'Arrow Up/Down', description: 'Navigate table rows' },
    NEXT_FIELD: { key: 'Tab', description: 'Jump to next field' },
    PREV_FIELD: { key: 'Tab', shift: true, description: 'Jump to prev field' },
    OPEN_LEDGER: { key: 'L', ctrl: true, description: 'Open ledger master' },
    DAY_BOOK: { key: 'D', ctrl: true, description: 'Day book' },
    TOGGLE_SIDEBAR: { key: 'B', ctrl: true, description: 'Toggle sidebar' },
    EXPORT_PDF: { key: 'P', ctrl: true, description: 'Export current view (PDF)' },
    EXPORT_XLS: { key: 'E', ctrl: true, description: 'Export current view (XLS)' },
    SWITCH_FY: { key: 'Y', ctrl: true, description: 'Switch financial year' },
    HELP_OVERLAY: { key: 'F1', description: 'Help / Shortcut overlay' },
}
