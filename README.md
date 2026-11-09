# RR Hospitals

Finance and records for RR Hospitals, moving the hospital from paper registers to a live digital ledger. Chat-first: ask in plain words and get the answer, with charts or lists when you ask for them.

- **Ask** — chat that answers from the ledger: billing, collections, overdue bills, department P&L, payroll, patients, invoices. Changes (new invoice, run payroll, digitise records) are confirmed first and can be undone.
- **Billing periods** — Today, This week, This month, This year (Indian FY, from 1 April), switchable from the top bar.
- **Pages** — Overview, Billing, Payments, Expenses, Payroll, Patients, Departments, Paper records.
- **Desktop and mobile** — one codebase; under 860px it becomes a phone app with a bottom tab bar and sheets. Installable to the home screen.

Plain HTML, CSS and JavaScript. Data is seeded demo data stored in the browser (localStorage); no server or API keys.

## Run locally

```sh
python3 -m http.server 4000
```

Open http://localhost:4000.

## Illustrations

The empty-state illustrations are built with the fun-isometric kit from `stickers-src/`. After editing `stickers-src/icons.ts`:

```sh
bun build stickers-src/entry.ts --outfile iso.js --format iife --minify
```
