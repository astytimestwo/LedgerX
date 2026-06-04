# LedgerX

LedgerX is a desktop accounting app experiment built with Electron, React, SQLite, and a lot of stubborn iteration.

This project started as a personal attempt to see how far I could push modern AI coding tools while still steering the product like a real app: testing flows, filing findings, fixing rough edges, and keeping the codebase moving toward something usable. It is not a polished commercial product. It is a working record of learning, building, breaking things, and tightening them back up.

## What It Does

LedgerX focuses on small-business accounting workflows:

- Company setup and unlock flow
- User login and role-aware navigation
- Voucher entry and day book views
- Ledger groups and chart of accounts
- Trial balance, ledger statement, profit and loss, and balance sheet screens
- GST report screens and HSN/SAC management
- Inventory item groups, items, stock summary, and stock ledger views
- Backup, audit, and session-management screens

## Tech Stack

- Electron
- React
- TypeScript
- SQLite through `better-sqlite3-multiple-ciphers`
- Kysely
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Vitest
- ESLint

## Running Locally

Install dependencies:

```bash
npm install
```

Start the app in development:

```bash
npm run dev
```

Run the main checks:

```bash
npm run lint
npm run type-check
npm test
```

Build the app:

```bash
npm run build
```

## Project Notes

The app is still evolving. Some screens are functional, some are placeholders for future workflows, and some areas were shaped by manual user-flow testing notes in `findings.md` and planning notes in `mindmap.md`.

This repo is also intentionally a learning artifact. The goal was not just to generate code, but to keep asking whether the app behaved like something a normal person could use.

## License

LedgerX is free for personal use. Commercial use, resale, redistribution, or hosted service use requires permission. See [LICENSE](LICENSE) for details.
