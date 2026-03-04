# Product Requirements Document
## Retirement Planning Tool

**Version:** 1.0
**Date:** 2026-03-04
**Status:** Draft

---

## 1. Overview

A year-by-year retirement planning simulator that helps users answer: *"Will I have enough money to retire comfortably?"*

The tool models income, expenses, investments, CPF, mortgages, and one-off events across a multi-decade planning horizon. It produces a projected portfolio trajectory — with optimistic, base, and pessimistic scenarios — so users can stress-test their plans and make informed decisions.

---

## 2. Planning Philosophy

- **Granularity:** Year is the base unit of simulation. All inputs are expressed (or converted to) annual values.
- **Time-bounded rules:** Every income source, expense, contribution, or liability is attached to an optional `[start_year, end_year]` window. Outside that window, the rule is inactive.
- **Scenario ranges:** Key rates (income growth, investment return, inflation) support three variants — optimistic, base, pessimistic — to produce a band of outcomes rather than a single line.
- **Modularity:** The system is composed of independent, stackable rules. A mortgage is just a set of expense/asset rules. CPF is a set of contribution and growth rules. This makes the model extensible.

---

## 3. Features

Features are listed by implementation layer (lowest dependency first).

---

### Layer 0 — Foundation

#### F1 · Timeline Configuration
Define the planning horizon.

- Current age or year
- Retirement age (when active income stops)
- End-of-plan age (e.g. age 90, used as the simulation termination point)
- All other features express their `start`/`end` relative to this timeline (as age or as offset years)

#### F2 · Starting Balances
Declare the user's current financial state.

- Cash / savings balance
- Investment portfolio value
- CPF-OA, CPF-SA, CPF-MA balances (individually)
- Outstanding mortgage principal (if any)

#### F3 · Year-level Simulation Engine
The core loop that drives the entire model.

- Steps through each year from current age to end-of-plan age
- For each year: collects all active rules, applies income, expenses, growth, contributions, and liabilities in a defined order
- Records a snapshot of all account balances at year-end
- Produces a structured result set consumed by the output and visualisation layers

---

### Layer 1 — Core Financial Mechanics

#### F4 · Investment Growth Rate Configuration
Configure how the investment portfolio grows.

- Set a direct annual return rate (e.g. 6.5%)
- Or set an equity/bond split and the tool derives a blended return (e.g. 80% equity at 8% + 20% bonds at 3% = 6.6%)
- Growth is applied to the portfolio balance at year-end

#### F5 · Asset Allocation Over Time *(depends on F4)*
Allow the equity/bond split to change across life stages.

- Define multiple allocation periods, each with a start age/year and a target split
- The tool interpolates (or steps) between allocations and recomputes the blended return rate per year
- Example: 80/20 from age 25–50, shift to 50/50 from age 50–65, shift to 30/70 post-retirement

#### F6 · Inflation Rate with Optimistic/Pessimistic Bounds
Model the erosion of purchasing power over time.

- Set a base inflation rate (e.g. 2.5%)
- Set an optimistic lower bound (e.g. 1.5%) and a pessimistic upper bound (e.g. 4%)
- Applied to all expense streams that are flagged as inflation-linked
- Produces three expense trajectories aligned with the three scenarios

#### F20 · Year-by-year Output Table *(depends on F3)*
A structured data output produced at the end of each simulation run.

Columns per year:
- Year / Age
- Gross income
- Total expenses (itemised or summarised)
- Net cash flow (income − expenses)
- Net cash flow after CPF contributions
- Investment portfolio value
- CPF balances (OA / SA / MA)
- Net worth (portfolio + CPF − mortgage balance)

---

### Layer 2 — Asset Dynamics

#### F18 · Safe Withdrawal Rate *(depends on F4)*
Model portfolio drawdown in retirement as a percentage rather than a fixed amount.

- Set a withdrawal rate (e.g. 4%)
- Each year in retirement, the withdrawal amount = rate × current portfolio value
- Acts as an automatic expense during the retirement phase
- Can be combined with annuity income to reduce required drawdown

---

### Layer 3 — Income & Expense Primitives

#### F7 · Income Modeling with Career Phases *(depends on F3, F6)*
Define income as a sequence of named phases, each with its own growth model.

Supported phase types:
- **Growth:** income increases at a fixed annual % (e.g. 5%/year early career)
- **Plateau:** income is flat (e.g. senior role, peak salary)
- **Taper:** income declines (e.g. part-time, semi-retirement)
- **Retirement:** income from active work is zero

Each phase has a `start_age` and `end_age`. Phases must be contiguous and non-overlapping.
Income can be expressed as gross or net; tax treatment is handled by F17.

#### F9 · Time-bounded Expense Periods *(depends on F3, F6)*
The atomic building block for all recurring outflows.

- Define an expense by: name, amount (monthly or annual), start year/age, end year/age
- Flag whether the amount is inflation-linked (grows with inflation each year)
- Examples: childcare $1,500/month from age 32 to 38; utilities $200/month always

#### F14 · One-time External Events *(depends on F3)*
Model lump-sum inflows or outflows at a specific year.

- Define: name, amount (positive = inflow, negative = outflow), year/age of occurrence
- Examples: inheritance at age 45, car purchase at age 35, property sale proceeds at age 60

#### F15 · Recurring External Contributions *(depends on F9)*
Define periodic contributions or withdrawals with an optional end date.

- Extends F9 with explicit "contribution" framing
- Can target a specific account (e.g. top up CPF-SA, invest into portfolio)
- Examples: rental income $1,800/month for 10 years; voluntary CPF top-up $7,000/year

---

### Layer 4 — Income & Expense Extensions

#### F8 · Optimistic/Pessimistic Income Scenarios *(depends on F7)*
Layer uncertainty bounds onto income projections.

- For each career phase, set an optimistic and pessimistic growth rate in addition to the base rate
- Produces three income trajectories
- Combined with F6 (inflation bounds) and F19 (scenario runner) to generate full scenario bands

#### F10 · Expense Escalation *(depends on F9, F6)*
Allow individual expenses to grow at a rate different from general inflation.

- Per-expense escalation rate (e.g. healthcare costs at 5%/year regardless of CPI)
- Overrides the general inflation rate for that specific expense line
- Example: "Medical expenses: $300/month from age 50, escalating at 5%/year"

#### F17 · Percentage-based Liabilities *(depends on F7, F9)*
Express a liability as a fraction of income or portfolio value.

- **Income-linked:** e.g. income tax at 15% of gross income each year
- **Portfolio-linked:** e.g. fund management fees at 0.5% of portfolio value per year
- Active only within a defined year range (defaults to always-active if no range set)

---

### Layer 5 — Structured Financial Products

#### F11 · Mortgage Modeling *(depends on F9, F3)*
Model a home loan across its full lifecycle.

- Inputs: loan principal, annual interest rate, tenure (years), start year
- Automatically computes annual amortization schedule (principal + interest split per year)
- Cash flow impact: reduces net cash flow during the loan period
- Asset impact: reduces outstanding liability each year; property value can be tracked separately
- Three implicit phases are handled automatically:
  - **Pre-loan:** no mortgage payments
  - **During loan:** amortized payments reduce both cash flow and outstanding principal
  - **Post-loan:** payments cease; cash flow improves

#### F12 · CPF Contribution Modeling *(depends on F7, F3)*
Model Singapore CPF contributions and interest accrual.

- Employee and employer contribution rates by age bracket (auto-applied or user-overridable)
- Contributions allocated to OA / SA / MA per CPF rules
- Separate interest accrual for each account (OA: 2.5%, SA: 4%, MA: 4% — user-configurable)
- CPF balances grow independently from the investment portfolio

#### F16 · Annuity / Pension Income Streams *(depends on F7, F9)*
Define fixed income streams that begin at a specific year.

- Inputs: name, start age, annual payout amount, duration (years or "lifetime")
- Flag whether payout is inflation-adjusted
- Can model: CPF Life payouts, defined-benefit pension, purchased annuities
- Income is added to the year's cash flow and can offset portfolio drawdown

---

### Layer 6 — Inter-product Integration

#### F13 · CPF-to-Mortgage Offset *(depends on F11, F12)*
Route CPF-OA balance to service mortgage payments.

- Each year, CPF-OA is drawn down to cover some or all of the mortgage payment before cash is used
- Reduces cash outflow from the investment portfolio during the loan period
- Tracks CPF-OA balance reduction separately from normal CPF contributions

---

### Layer 7 — Scenario & Output

#### F19 · Scenario Comparison — Optimistic / Base / Pessimistic *(depends on F6, F7, F8, F4)*
Run the full simulation three times under different assumption sets.

- **Optimistic:** high income growth, low inflation, high investment return
- **Base:** expected values for all rates
- **Pessimistic:** low income growth, high inflation, low investment return
- All three runs share the same structural rules (expenses, mortgage, CPF); only the rates differ
- Output includes all three trajectories side-by-side

#### F21 · Trajectory Visualization *(depends on F20, F19)*
A chart showing portfolio/net worth over the planning horizon.

- X-axis: age or year
- Y-axis: net worth (or portfolio value; selectable)
- Three lines: optimistic, base, pessimistic
- Shaded band between optimistic and pessimistic
- Key markers: retirement age, mortgage payoff year, CPF Life start age
- Optional: break down stacked area chart by account (cash, portfolio, CPF)

---

## 4. Feature Summary Table

| ID  | Feature                             | Layer | Key Dependencies     |
|-----|-------------------------------------|-------|----------------------|
| F1  | Timeline Configuration              | 0     | —                    |
| F2  | Starting Balances                   | 0     | —                    |
| F3  | Year-level Simulation Engine        | 0     | F1, F2               |
| F4  | Investment Growth Rate              | 1     | F3                   |
| F6  | Inflation Rate with Bounds          | 1     | F3                   |
| F20 | Year-by-year Output Table           | 1     | F3                   |
| F5  | Asset Allocation Over Time          | 2     | F4                   |
| F18 | Safe Withdrawal Rate                | 2     | F4                   |
| F7  | Income Modeling — Career Phases     | 3     | F3, F6               |
| F9  | Time-bounded Expense Periods        | 3     | F3, F6               |
| F14 | One-time External Events            | 3     | F3                   |
| F15 | Recurring External Contributions    | 3     | F9                   |
| F8  | Optimistic/Pessimistic Income       | 4     | F7                   |
| F10 | Expense Escalation                  | 4     | F9, F6               |
| F17 | Percentage-based Liabilities        | 4     | F7, F9               |
| F11 | Mortgage Modeling                   | 5     | F9, F3               |
| F12 | CPF Contribution Modeling           | 5     | F7, F3               |
| F16 | Annuity / Pension Income Streams    | 5     | F7, F9               |
| F13 | CPF-to-Mortgage Offset              | 6     | F11, F12             |
| F19 | Scenario Comparison                 | 7     | F6, F7, F8, F4       |
| F21 | Trajectory Visualization            | 7     | F20, F19             |

---

## 5. Out of Scope (v1.0)

- Tax optimisation advice
- Real-time market data or live feeds
- Multi-currency portfolios
- Estate planning / inheritance modelling
- Insurance (life, critical illness) modelling
- Stochastic / Monte Carlo simulation (scenario bounds are deterministic)
