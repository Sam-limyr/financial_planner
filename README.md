# 🔥 Retire If FIRE

A year-by-year retirement planning simulator. Model your income, expenses, investments, CPF, mortgage, and one-off events across a multi-decade horizon — with optimistic, base, and pessimistic projections.

---

## Quickstart

**Requirements:** Node.js 18+ (tested on 24 LTS)

A launch script is provided for PowerShell. From the project directory:

```powershell
.\launch_app.ps1
```

Then open **http://localhost:5173** in your browser.

> If PowerShell blocks the script with an execution policy error, run once:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

### Other environments

**macOS / Linux**

pnpm via corepack installs into a directory already on `PATH`, so no path manipulation is needed:
```bash
corepack enable
pnpm install
pnpm dev
```

**Command Prompt (cmd.exe)**
```cmd
set PATH=%USERPROFILE%\.corepack\bin;C:\Program Files\nodejs;%PATH%
pnpm dev
```

**PowerShell (manual, without the script)**
```powershell
$env:PATH = "$env:USERPROFILE\.corepack\bin;C:\Program Files\nodejs;" + $env:PATH
pnpm dev
```

---

## What it does

The tool answers: *"Will I have enough money to retire comfortably?"*

It runs a **year-by-year simulation** from your current age to your plan end age, tracking:

| Feature | Details |
|---|---|
| **Income phases** | Growth, plateau, taper, and retirement phases with per-scenario growth rates |
| **Expenses** | Time-bounded recurring expenses, optional inflation linking, custom escalation rates |
| **Portfolio growth** | Direct rate or equity/bond split with allocation periods that shift over time |
| **CPF** | Full Singapore CPF statutory rates (OA/SA/MA), interest accrual, with CPF-to-mortgage offset |
| **Mortgage** | Amortization schedule auto-computed from principal, rate, and tenure |
| **One-time events** | Lump-sum inflows/outflows at a specific age (inheritance, property purchase…) |
| **Recurring contributions** | Periodic inflows or withdrawals over a date range (rental income, side income…) |
| **Annuities / pensions** | Fixed income streams starting at a set age, with optional inflation adjustment |
| **Percentage liabilities** | Tax, fund fees, etc. as % of gross income or portfolio value |
| **Safe withdrawal rate** | Classic 4%-rule-style drawdown in retirement |
| **Three scenarios** | Optimistic / Base / Pessimistic — all modelled simultaneously |

---

## Project structure

```
src/
├── types/
│   ├── plan.ts          # All input data types
│   └── simulation.ts    # Output types (YearSnapshot, SimulationResult)
├── engine/
│   ├── simulate.ts      # Main year-by-year simulation loop
│   ├── income.ts        # Income phase resolution
│   ├── expenses.ts      # Expense / liability resolution
│   ├── mortgage.ts      # Amortization table builder
│   ├── cpf.ts           # CPF statutory rates + contribution logic
│   └── growth.ts        # Portfolio growth rate resolver
├── store/
│   ├── planStore.ts     # Zustand store — mutations + auto-save
│   └── defaultPlan.ts   # Sample plan pre-loaded on first launch
└── components/
    ├── layout/          # AppLayout, EditorPanel, ResultsPanel
    ├── editor/          # One tab component per section
    ├── results/         # TrajectoryChart, ResultsTable, SummaryCards
    └── ui/              # Reusable form primitives
docs/
├── product_requirements_document.md
└── product_implementation_design.md
```

---

## Simulation model

Each year executes in a fixed order:

1. **Income** — resolve active career phase income
2. **CPF contributions** — employee deduction + employer addition, split across OA/SA/MA
3. **Income tax / % liabilities** — applied to gross income
4. **Fixed expenses** — all active expense periods (inflated or escalated)
5. **Mortgage payment** — CPF-OA portion drawn first, remainder from portfolio
6. **One-time events** — lump sums applied to target accounts
7. **Recurring contributions** — periodic inflows/withdrawals
8. **Net cash flow** — settled into portfolio
9. **Portfolio growth** — blended equity/bond return applied
10. **Safe withdrawal** — drawdown in retirement
11. **CPF interest** — OA/SA/MA accrue separately
12. Snapshot recorded

All monetary values are **nominal** (not inflation-adjusted). Expenses grow with inflation; the inflation rate itself is scenario-dependent.

---

## Persistence

- The plan auto-saves to `localStorage` after every change.
- Use **Export** to download a `.json` file and **Import** to load it back.
- **Reset** returns to the default sample plan.

---

## Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| State | Zustand |
| Charts | Recharts |
| Styling | Tailwind CSS 3 |
| Package manager | pnpm (via corepack) |
