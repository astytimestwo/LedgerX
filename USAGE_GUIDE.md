# LedgerX Usage Guide

Welcome to **LedgerX**, your premium desktop accounting solution. This guide will help you navigate the application and make the most of its powerful features.

---

## 1. Getting Started

### Installation & Launch

- Run the application using the provided desktop shortcut or by executing `launch.bat` in the root folder.
- **Login**: Use your administrative credentials provided during setup. (If testing, use the "Skip to Dashboard" button if available).

### Interface Basics

- **Sidebar**: Access all major modules (Dashboard, Vouchers, Inventory, reports, etc.) from the left navigation bar.
- **Header**: Use the Global Search (`Ctrl + F`) and Dark Mode toggle from the top right.
- **Footer**: Monitor your Sync Status and system time.

---

## 2. Dashboard

The Dashboard provides a real-time snapshot of your business health:

- **KPI Cards**: View your current **Bank & Cash** balance, **Total Receivables**, and **Total Payables**.
- **Recent Activity**: A chronological list of recently created vouchers for quick reference.

---

## 3. Accounting & Vouchers

### Ledgers (Chart of Accounts)

- Navigate to **Ledgers** to manage your accounts.
- **GST Profile**: When creating a ledger (e.g., a Customer or Supplier), ensure you fill in the GSTIN and State Code to enable accurate GST reporting.

### Managing Vouchers

- Click **New Voucher** or use `Ctrl + N`.
- **Supported Types**:
  - **Sales/Purchase**: For trading transactions (includes GST computation).
  - **Receipt/Payment**: For cash/bank movements.
  - **Contra**: For bank-to-bank or cash-to-bank transfers.
  - **Journal**: For adjustment entries.
- **GST Auto-Calc**: In Sales/Purchase vouchers, enter the GST% for each item; the system will automatically compute CGST/SGST or IGST based on the party's location.

---

## 4. GST Compliance

### HSN/SAC Master

- Manage your HSN codes and their corresponding tax rates under the **GST > HSN Master** section.

### GST Reports

- **GSTR-1**: Summary of outward supplies.
- **GSTR-3B**: Monthly summary return.
- **Tax Liability**: View tax categorized by rate.
- **ITC Ledger**: Track your input tax credits.
- **Export**: All reports can be exported to **PDF** or **Excel**.

### GSTR-2A Reconciliation

- Import the JSON file downloaded from the GST Portal to automatically match your purchase register against portal data. The system will highlight missing entries or value mismatches.

---

## 5. Inventory Management

### Stock Items & Groups

- Organize products into **Stock Groups**.
- Define **Units of Measure** (e.g., Pcs, Kgs, Box).
- Inventory levels are automatically updated whenever a Sales or Purchase voucher is saved.

### Stock Reports

- **Stock Summary**: View real-time closing stock for all items.
- **Stock Ledger**: Track the movement (In/Out) history for a specific item.

---

## 6. Admin & Security

### User Roles & Permissions

- Administrators can create users and assign roles (**Admin**, **Accountant**, **Viewer**).
- Permissions are strictly enforced; Viewers cannot modify data, and Accountants may be restricted from admin settings.

### Audit Trail

- Every change is logged. Use the **Audit Trail** to see who changed what and when.
- **Diff Viewer**: Click on any log entry to see a side-by-side comparison of old vs. new values.

### Backup & Sync

- **Local Backups**: Configure automatic daily backups under **Settings > Backup**.
- **Google Drive Sync**: Authorize your Google account to automatically mirror backups to the cloud for disaster recovery.

---

## 7. Productivity Tips

### Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `F1` | Show Shortcut Help Overlay |
| `Ctrl + N` | Create New Voucher |
| `Ctrl + F` | Global Search |
| `Ctrl + P` | Export current report to PDF |

### Dark Mode

- Toggle between Light and Dark modes using the moon/sun icon in the header. The system remembers your preference.

### Global Search

- Type anywhere in the search bar to find Ledgers, Vouchers (by number), or HSN codes instantly.

---

*For technical support, please contact the LedgerX Administrator.*
