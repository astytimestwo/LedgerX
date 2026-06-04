# LedgerX — Codebase Mind Map

> Generated: 2026-05-31
> Stack: Electron 40 + React 18 + TypeScript 5 + better-sqlite3 + Kysely + Zustand + Tailwind CSS 4

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ELECTRON MAIN PROCESS (Node.js)                   │
│  index.ts ──► Services ──► Repositories ──► Kysely ──► SQLite           │
│    │         (business      (data access       (type-safe         │
│    │          logic)         layer)              SQL)                │
│    │                                                             │
│    └──► IPC Handlers (auth, ledger, voucher, gst, inventory,          │
│          backup, user-management, audit, fy, search, dialog, crash      │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                      PRELOAD (contextBridge)                        │
│  window.api ──► ipcRenderer.invoke() ──► string channels            │
├───────────────────────────────────────────────────────────────────┤
│                    ELECTRON RENDERER (Chromium/React)              │
│  App.tsx (state machine routing)                                     │
│    ├── Zustand stores (session, ui, toast)                          │
│    ├── React Query (server state, caching, invalidation)             │
│    ├── api.ts wrapper (session injection + toast error handling)       │
│    └── Features (auth, ledger, voucher, reports, gst, inventory, admin,  │
│                audit, settings, dashboard                           │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # Entry: app.whenReady → registers IPC → createWindow
│   ├── db/
│   │   ├── connection.ts          # initDb() / getDb() / getRawDb() / closeDb()
│   │   ├── schema.ts              # Kysely table interfaces (14 tables
│   │   ├── migrations/0001-0008   # Schema migrations (creates tables)
│   │   └── repositories/          # Data access layer (all writes go through transactions + audit.log)
│   │       ├── user.repo.ts       # User CRUD + audit logging
│   │       ├── ledger.repo.ts     # Ledger groups/accounts + FK checks + audit
│   │       ├── voucher.repo.ts    # Vouchers + entries + inventory movements + audit
│   │       ├── inventory.repo.ts   # Items/groups + stock reports + audit
│   │       └── audit.repo.ts      # insertAuditLog() (centralized, masks password_hash/totp_secret)
│   ├── ipc/                      # IPC handlers (one file per domain)
│   │   ├── auth.ipc.ts           # login, createCompany, unlockCompany, setup/verifyTotp
│   │   ├── ledger.ipc.ts         # Ledger group/account CRUD
│   │   ├── voucher.ipc.ts        # Voucher CRUD + reports
│   │   ├── gst.ipc.ts           # HSN master + GSTR-1/3B/2A/ITC/tax reports
│   │   ├── inventory.ipc.ts      # Item/group CRUD + stock reports
│   │   ├── user-management.ipc.ts # User CRUD + forceLogout + sessionLog
│   │   ├── audit.ipc.ts          # Audit log list/export
│   │   ├── backup.ipc.ts         # Local + Google Drive backup/restore
│   │   ├── fy.ipc.ts            # Financial year CRUD + lock
│   │   ├── search.ipc.ts         # Global search
│   │   ├── dialog.ipc.ts         # Native file dialogs
│   │   └── crash.ipc.ts          # Renderer error logging
│   ├── lib/                      # Pure/shared utilities
│   │   ├── crypto.ts             # PBKDF2 key derivation, AES-256-GCM encrypt/decrypt
│   │   ├── gst-calc.ts           # GST type determination + amount computation
│   │   ├── session.ts            # In-memory session Map, 10-min TTL, cleanup interval
│   │   ├── rbac.ts              # Permission enum, ROLE_DEFAULTS, hasPermission()
│   │   ├── ipc-auth.ts          # requirePermission() / requireAdmin() middleware
│   │   ├── scheduler.ts          # node-cron backup scheduler
│   │   └── logger.ts             # electron-log wrapper (info/warn/error)
│   └── services/                  # Business logic
│       ├── auth.service.ts        # checkFirstRun, login, setup/verifyTotp, createCompany
│       ├── voucher.service.ts     # validateDoubleEntry, processGstEntries, report builders
│       ├── gst.service.ts        # GSTR-1/3B/2A reconciliation + tax liability + ITC ledger
│       ├── backup.service.ts      # Local backup, prune, restore, Google Drive sync
│       ├── sync.service.ts       # Google OAuth + Drive upload/download
│       ├── user-management.service.ts
│       ├── audit.service.ts
│       ├── fy.service.ts
│       └── search.service.ts
│
├── preload/
│   └── index.ts                  # contextBridge: window.api = { auth, ledger, voucher, ... }
│
├── renderer/                      # React frontend
│   ├── main.tsx                  # ReactDOM.createRoot + QueryClientProvider + i18n
│   ├── App.tsx                   # State-machine routing (NOT React Router)
│   │                              # Flags: checking, hasSeenWelcome, isFirstRun, isUnlocked,
│   │                              #   isCreatingNew, totpUserId, currentView, totpSessionToken
│   ├── components/
│   │   ├── Button/, Input/, Modal/, Toast/
│   │   ├── Layout/AppShell.tsx   # Sidebar + topbar + footer + routing
│   │   ├── GlobalSearch/         # Debounced search overlay with keyboard nav
│   │   ├── ShortcutHelp/         # F1 overlay listing all shortcuts
│   │   └── ErrorBoundary/        # Catches render errors → Go Back + Reload
│   ├── features/
│   │   ├── auth/                 # Welcome, SelectCompany, Login, CreateCompany, TotpSetup
│   │   ├── dashboard/            # KPI cards + recent vouchers
│   │   ├── ledger/              # ChartOfAccounts, LedgerGroupList, LedgerAccountList,
│   │   │                          # LedgerAccountFormModal
│   │   ├── voucher/             # VoucherList, VoucherFormModal, VoucherEntryRow,
│   │   │                          # VoucherTypeSelector, useVouchers hook
│   │   ├── reports/             # LedgerStatement, TrialBalance, ProfitAndLoss,
│   │   │                          # BalanceSheet
│   │   ├── gst/                # HsnMaster, Gstr1Report, Gstr3bReport,
│   │   │                          # Gstr2aReconcile, TaxLiabilityReport, ItcLedgerReport
│   │   ├── inventory/          # ItemMaster, ItemGroupMaster, StockSummary, StockLedger
│   │   ├── admin/              # UserList, UserFormModal, SessionLogView
│   │   ├── audit/              # AuditTrailViewer, DiffViewer
│   │   └── settings/           # FinancialYearSettings, BackupSettings
│   ├── stores/
│   │   ├── session.store.ts     # user, sessionToken, companyName, activeYear
│   │   ├── ui.store.ts         # sidebar, theme, language, modal states
│   │   └── toast.store.ts       # toasts[] + toast.success/error/info (4s auto-dismiss)
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts  # Global keydown (Ctrl+F/N/L/D/B/P/E/Y, F1)
│   │   └── useSessionTimeout.ts     # 15-min inactivity → logout
│   └── lib/
│       ├── api.ts               # Wraps window.api with session injection + toast.catch()
│       ├── format.ts            # formatPaise, formatDate, parsePaise, parseDate
│       └── i18n.ts             # i18next setup (en, hi locales)
│
├── shared/
│   ├── ipc-channels.ts        # IPC channel constants (partially used — many hardcoded strings)
│   └── types.ts                # Zod schemas + TypeScript interfaces (all inputs/outputs)
│
└── constants/
    └── gst-state-codes.ts     # 37 Indian state codes + isUnionTerritory()
```

---

## 3. Database Schema (14 tables)

```
USERS(id PK, username UNIQUE, password_hash, totp_secret, role, permissions_json, is_active, created_at, updated_at)
  │ 1──N→ vouchers(created_by FK)
  │ 1──N→ audit_log(user_id FK)
  │ 1──N→ session_log(user_id FK)

SESSION_LOG(id PK, user_id FK, login_at, logout_at, duration_sec, ip_address)

FINANCIAL_YEARS(id PK, name, start_date, end_date, is_locked)

LEDGER_GROUPS(id PK, name, parent_id FK(self), nature, created_at, updated_at)
  │ 1──N→ ledger_accounts(group_id FK)

LEDGER_ACCOUNTS(id PK, code UNIQUE, name, group_id FK, opening_balance/Type, GST fields, hsn_code, is_active, created_at, updated_at)
  │ 1──N→ voucher_entries(ledger_id FK)

VOUCHERS(id PK, voucher_no UNIQUE, voucher_type, date, narration, is_posted, created_by FK, timestamps)
  │ 1──N→ voucher_entries(voucher_id FK)
  │ 1──N→ inventory_entries(voucher_id FK)

VOUCHER_ENTRIES(id PK, voucher_id FK, ledger_id FK, type(dr/cr), amount(paise), GST fields(paise), item_id FK, qty, rate, supply_type, reverse_charge, place_of_supply)
  │ 1──N→ inventory_entries(voucher_entry_id FK)
  │ 1──N→ voucher_sequences(voucher_type PK → used for sequence gen)

VOUCHER_SEQUENCES(voucher_type PK, prefix, last_seq)

HSN_MASTER(code PK, description, gst_rate, cess_rate, type)

ITEM_GROUPS(id PK, name, parent_id FK(self), timestamps)
  │ 1──N→ items(group_id FK)

ITEMS(id PK, code UNIQUE, name, group_id FK, hsn_code, default_gst_rate, uom, opening_qty/rate/value, is_active, timestamps)
  │ 1──N→ inventory_entries(item_id FK)

INVENTORY_ENTRIES(id PK, voucher_id FK, voucher_entry_id FK NULL, item_id FK, type(in/out), qty, rate, amount)

AUDIT_LOG(id PK, user_id FK, action, table_name, record_id, old_value(JSON), new_value(JSON), ip_address, timestamp)
  · Masks password_hash and totp_secret before storing

APP_SETTINGS(key PK, value)
  · Stores: backup_local_path, backup_retention_days, backup_auto_enabled/time,
    gdrive_enabled, gdrive_token_encrypted, gdrive_folder_id, gdrive_auto_sync,
    company_state_code
```

**All writes (INSERT/UPDATE/DELETE) go through db.transaction() + insertAuditLog().**

---

## 4. Encryption & Security

```
MASTER PASSWORD FLOW:
  User enters master password
      ↓
  Read {companyName}.meta (per-company salt, 16 bytes random, generated on first unlock)
      ↓
  PBKDF2-SHA256(masterPassword, salt, 310,000 iters, 32 bytes) → SQLite key
      ↓
  SQLite pragma: key = "x'HEX'"  (SQLCipher)
      ↓
  Database decrypted/encrypted at storage level

SYSTEM KEY FLOW (for encrypting sensitive DB fields like totp_secret, gdrive tokens):
  Company name → read {companyName}.meta (same salt)
      ↓
  PBKDF2-SHA256('ledgerx-internal-system-v1' OR env.SYSTEM_KEY_PASSPHRASE, salt, 310,000 iters, 32 bytes)
      ↓
  AES-256-GCM encrypt/decrypt for TOTP secrets and Google tokens

SESSION:
  In-memory Map<token, SessionData>
  10-minute TTL on all sessions
  Cleanup interval runs every 10 minutes
  Token rotation on TOTP verify
```

**All mutations logged to audit_log with sensitive fields masked.**

---

## 5. IPC Channels

```
CHANNEL                           │ HANDLER FILE
─────────────────────────────────┼─────────────────────────────
auth:login                        │ auth.ipc.ts
auth:setupTotp                    │ auth.ipc.ts
auth:verifyTotp                   │ auth.ipc.ts
auth:createCompany                │ auth.ipc.ts
auth:checkFirstRun                │ auth.ipc.ts
auth:getCompanies                 │ auth.ipc.ts
auth:unlockCompany                │ auth.ipc.ts
ledger:createGroup                │ ledger.ipc.ts
ledger:updateGroup                │ ledger.ipc.ts
ledger:deleteGroup                │ ledger.ipc.ts
ledger:createAccount             │ ledger.ipc.ts
ledger:updateAccount              │ ledger.ipc.ts
ledger:deleteAccount              │ ledger.ipc.ts
ledger:getGroups                  │ ledger.ipc.ts
ledger:getAccounts                │ ledger.ipc.ts
voucher:create                    │ voucher.ipc.ts
voucher:update                    │ voucher.ipc.ts
voucher:delete                   │ voucher.ipc.ts
voucher:getDayBook               │ voucher.ipc.ts
voucher:getLedgerStatement       │ voucher.ipc.ts
voucher:getTrialBalance          │ voucher.ipc.ts
voucher:getProfitAndLoss         │ voucher.ipc.ts
voucher:getBalanceSheet           │ voucher.ipc.ts
gst:hsn:list/get/create/update/  │ gst.ipc.ts
  delete
gst:report:gstr1/gstr3b/gstr2a │ gst.ipc.ts
gst:report:tax-liability/itc-ledger│ gst.ipc.ts
inventory:group:list/create/      │ inventory.ipc.ts
  update/delete
inventory:item:list/create/       │ inventory.ipc.ts
  update/delete
inventory:reports:summary/ledger │ inventory.ipc.ts
users:list/create/update/deactivate│ user-management.ipc.ts
users:resetPassword/sessionLog/   │ user-management.ipc.ts
  forceLogout
audit:list/export                │ audit.ipc.ts
backup:getSettings/updateSetting  │ backup.ipc.ts
backup:listLocal/createLocal/     │ backup.ipc.ts
  restoreLocal
backup:gdrive:getAuthUrl/         │ backup.ipc.ts
  exchangeCode/revoke/list/upload/ download
dialog:openFile/readJsonFile     │ dialog.ipc.ts
fy:list/create/update/toggleLock │ fy.ipc.ts
search:global                    │ search.ipc.ts
app:logError                     │ crash.ipc.ts
```

Every mutation requires session + permission check via `requirePermission()`.

---

## 6. Permission Model

```
ADMIN    → all permissions
ACCOUNTANT → CREATE/EDIT/DELETE_VOUCHER, VIEW_REPORTS, MANAGE_MASTERS, EXPORT_REPORTS, VIEW_AUDIT
VIEWER   → VIEW_REPORTS, EXPORT_REPORTS
CUSTOM   → loaded from permissions_json field in users table
```

---

## 7. Critical Flows

### Company Creation
```
WelcomeScreen → CreateCompanyScreen → api.createCompany
  → preload:createCompany() → auth.ipc → authService.createCompany()
    → initDb() → runs 8 migrations → bcrypt.hash(password) → createUser('admin')
      → insertAuditLog(INSERT, users)
```

### Login
```
SelectCompany (unlock master password)
  → api.unlockCompany() → initDb() + sqlite SELECT count(*) — throws if wrong key
      ↓
LoginScreen → api.login(username, password)
  → bcrypt.compare(password, hash) — constant-time even on missing user
    → createSession() — 32-byte token, 10-min TTL
    → if totp_secret exists: return { requiresTotp: true, sessionToken }
    → else: return { sessionToken, user } → setUser() → AppShell
      ↓
TotpSetupScreen (if TOTP enabled)
  → api.verifyTotp(token) → decrypt(totp_secret) → authenticator.verify()
    → createSession(token, previousToken) → setUser() → AppShell
```

### Voucher Creation
```
VoucherFormModal → api.createVoucher(input)
  → requirePermission(CREATE_VOUCHER) → validateDoubleEntry()
    → processGstEntries() → determineGstType() → computeGstAmounts()
    → generateVoucherNumber() → getNextSequence() [INSERT ON CONFLICT DO UPDATE]
      → createVoucher() [transaction]
        → INSERT vouchers + voucher_entries + inventory_entries + audit_log
      ← returns voucherId
  → React Query invalidates ['vouchers'] + ['reports']
```

### GST Calculation
```
processGstEntries() reads company_state_code from app_settings
  → determineGstType(companyState, partyStateCode)
      same state + UT → cgst_utgst
      same state → cgst_sgst
      different state → igst
    ↓
  computeGstAmounts(taxableValue, rate, gstType)
    totalGst = round(taxable * rate / 100)
    igst = totalGst
    cgst = round(total / 2)
    sgst = totalGst - cgst  ← avoids rounding drift
    cess = round(taxable * cessRate / 100)
    returns { cgst, sgst, igst, cess, total } in paise
```

### Session Cleanup
```
app.whenReady() → startSessionCleanup() [called once]
  → setInterval(cleanupExpiredSessions, 10 min)
    → iterates Map, deletes any expiresAt < Date.now()
    → immediate first run on startup
```

### Backup
```
Settings → BackupSettings → api.backup.createLocal()
  → BackupService.createLocalBackup()
    → getRawDb().backup(destPath) [SQLite online backup API, WAL-safe]
    → pruneOldBackups() [deletes files older than retention_days]
      ↓
Settings → api.backup.restoreLocal()
  → closeDb() → fs.copyFileSync() → app.relaunch() + app.quit()
      ↓
Google Drive: getAuthUrl() → OAuth2 → exchangeCode() → encrypt(token) → app_settings
  → uploadBackup() / downloadBackup() via Drive API
```

---

## 8. Renderer State Machine (App.tsx)

```
[checking=true] ────────────────────────── Loading...
       │
       ▼
[hasSeenWelcome=false] ─────────────── WelcomeScreen
       │
       ▼ [clicked Get Started]
[isFirstRun=true] ────────────────── CreateCompanyScreen
       │                                        (no companies exist)
       │ [companies exist]
       ▼
[isUnlocked=false] ────────────────── SelectCompanyScreen
       │                                        (master password entered)
       ▼
[!user] ───────────────────────────────── LoginScreen
       │                                        (credentials verified)
       │ [requiresTotp=true]
       ▼
[totpUserId set] ──────────────────────── TotpSetupScreen (verify mode)
       │                                        (TOTP verified)
       ▼
[user set, totpUserId=null] ──────────── AppShell (main app)
       │                                        views:
       │  dashboard | ledger | ledger_groups | daybook
       │  ledger_statement | trial_balance | pnl | balance_sheet
       │  hsn_master | gstr1 | gstr3b | gstr2a | tax_liability | itc_ledger
       │  item_master | item_groups | stock_summary | stock_ledger
       │  users | session_logs | audit_trail | settings
```

---

## 9. React Query Keys

```
['dashboard-data']       ← Dashboard KPIs + recent vouchers (5 min stale)
['ledger-groups']        ← Ledger groups list (invalidate on CRUD)
['ledger-accounts']       ← Accounts list (invalidate on CRUD)
['items']               ← Inventory items (invalidate on CRUD)
['vouchers', filters]   ← Daybook / VoucherList (invalidate on CRUD)
['ledger-statement', ledgerId, dateFrom, dateTo]
['trial-balance', dateTo]
['profit-and-loss', dateFrom, dateTo]
['balance-sheet', dateTo]
['hsn-master']
['gstr1/gstr3b/gstr2a/tax-liability/itc-ledger', period]
['stock-summary', dateFrom, dateTo]
['stock-ledger', itemId, dateFrom, dateTo]
['users']               ← User list
['audit-list', filters]
['search', debouncedQuery]  (global search, 300ms debounce)
```

---

## 10. Keyboard Shortcuts

| Key | Mod | Action |
|-----|-----|--------|
| F1 | — | ShortcutHelp overlay |
| Ctrl+F | yes | Global search |
| Ctrl+N | yes | New voucher modal |
| Ctrl+L | yes | Open ledger view |
| Ctrl+D | yes | Daybook view |
| Ctrl+B | yes | Toggle sidebar |
| Ctrl+P | yes | Export PDF |
| Ctrl+E | yes | Export Excel |
| Ctrl+Y | yes | Switch FY (→ settings view) |
| Ctrl+S | yes | Save (in forms) |
| Escape | — | Close modal / cancel |

---

## 11. Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 40 |
| Bundler | electron-vite 5 + Vite 7 |
| UI | React 18 + Tailwind CSS 4 |
| State | Zustand 4 (renderer) |
| Server state | TanStack Query 5 |
| Validation | Zod 3 + react-hook-form 7 |
| Database | better-sqlite3-multiple-ciphers + Kysely 0.27 |
| Auth | bcrypt 6 + otplib 12 (TOTP) |
| PDF | pdfmake 0.2 |
| Excel | ExcelJS 4.4 |
| Drive | googleapis 171 |
| Scheduling | node-cron 4 |
| Icons | Lucide React |
| Logging | electron-log 5 |
| Testing | Vitest 4 + Playwright |
| Packaging | electron-builder 26 |
| Types | TypeScript 5.3 strict |
| i18n | i18next 23 + react-i18next 14 |

---

## 12. Known Architectural Issues

1. **Hardcoded system passphrase** — `crypto.ts` uses `'ledgerx-internal-system-v1'` as fallback
2. **IPC channel constants partially hardcoded** — `IPC` object in shared/ipc-channels.ts incomplete; many channels use string literals
3. **No test coverage** — tests/e2e/ is empty
4. **No .env file** — env vars used only for dev server URL
5. **Session in-memory only** — sessions lost on restart; session_log DB table exists but sessions not persisted
6. **No rate limiting** — authentication endpoints unprotected
7. **No request signing** — internal API relies solely on session token in memory
