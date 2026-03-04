# Product Implementation Design
## Retirement Planning Tool

**Version:** 1.0
**Date:** 2026-03-04
**Status:** Draft

---

## 1. Tech Stack

| Concern            | Choice                  | Rationale                                                                 |
|--------------------|-------------------------|---------------------------------------------------------------------------|
| Framework          | React + TypeScript      | Component model suits the editor/results split; TS prevents numeric bugs  |
| Build tool         | Vite                    | Fast HMR, minimal config                                                  |
| State management   | Zustand                 | Simple global store without Redux boilerplate; serialisable for save/load |
| Charting           | Recharts                | Declarative, React-native, supports area/line/reference lines             |
| Styling            | Tailwind CSS            | Utility-first; fast for layout-heavy data UIs                             |
| Unique IDs         | `crypto.randomUUID()`   | Browser-native, no library needed                                         |
| Persistence        | `localStorage`          | Single-user tool; no backend needed for v1                                |

No backend. All computation is pure client-side JavaScript. The simulation engine is a set of pure functions — no side effects, no async — making it trivially testable.

---

## 2. Project Structure

```
src/
├── types/
│   ├── plan.ts            # All input data types (the "Plan" shape)
│   └── simulation.ts      # Output types (YearSnapshot, SimulationResult)
│
├── engine/
│   ├── simulate.ts        # Top-level runner: simulate(plan, scenario) → ScenarioResult
│   ├── income.ts          # resolveIncome(age, phases, scenario) → number
│   ├── expenses.ts        # resolveExpenses(age, expenses, inflationFactor) → number
│   ├── mortgage.ts        # buildAmortizationTable(config) → AnnualPayment[]
│   ├── cpf.ts             # resolveCPFContributions(age, grossIncome, config) → CPFFlow
│   └── growth.ts          # resolveGrowthRate(age, config, scenario) → number
│
├── store/
│   └── planStore.ts       # Zustand store: plan state + derived simulation results
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         # Two-panel shell
│   │   ├── EditorPanel.tsx       # Left: tabbed plan editor
│   │   └── ResultsPanel.tsx      # Right: chart + table
│   │
│   ├── editor/
│   │   ├── SetupTab.tsx          # F1, F2, F6 — timeline, balances, inflation
│   │   ├── IncomeTab.tsx         # F7, F8 — career phases + scenario rates
│   │   ├── ExpensesTab.tsx       # F9, F10, F17 — expense periods + % liabilities
│   │   ├── InvestmentsTab.tsx    # F4, F5, F18 — growth rate, allocation, withdrawal
│   │   ├── CPFTab.tsx            # F12 — CPF contributions + interest rates
│   │   ├── MortgageTab.tsx       # F11, F13 — mortgage config + CPF offset
│   │   ├── EventsTab.tsx         # F14, F15 — one-time events + recurring contributions
│   │   └── AnnuitiesTab.tsx      # F16 — annuity/pension streams
│   │
│   ├── results/
│   │   ├── TrajectoryChart.tsx   # F21 — line/area chart with scenario bands
│   │   ├── ResultsTable.tsx      # F20 — scrollable year-by-year table
│   │   └── SummaryCards.tsx      # Key metrics: retirement balance, depletion age, etc.
│   │
│   └── ui/
│       ├── ScenarioRateInput.tsx # Three-field input: optimistic / base / pessimistic
│       ├── AgeRangeInput.tsx     # start age / end age pair with validation
│       ├── CurrencyInput.tsx     # Formatted number input with $ prefix
│       ├── ItemList.tsx          # Generic add/edit/delete list used across tabs
│       └── SectionCard.tsx      # Labelled card wrapper for form sections
│
├── App.tsx
└── main.tsx
```

---

## 3. Data Model (`src/types/plan.ts`)

The `Plan` object is the single source of truth for all user inputs. The simulation engine is a pure function of `Plan`.

```typescript
// A rate that varies by scenario
interface ScenarioRate {
  optimistic: number;  // e.g. 0.08
  base: number;        // e.g. 0.065
  pessimistic: number; // e.g. 0.04
}

// ── F1: Timeline ──────────────────────────────────────────────────────────
interface Timeline {
  currentAge: number;
  retirementAge: number;
  endAge: number;          // simulation terminates here (e.g. 90)
}

// ── F2: Starting Balances ─────────────────────────────────────────────────
interface StartingBalances {
  cash: number;
  portfolio: number;
  cpfOA: number;
  cpfSA: number;
  cpfMA: number;
  mortgagePrincipal: number;  // 0 if no existing mortgage
}

// ── F4 + F5: Investment Growth ────────────────────────────────────────────
type GrowthMode = 'direct' | 'allocation';

interface GrowthConfig {
  mode: GrowthMode;
  // Used when mode === 'direct'
  directRate?: ScenarioRate;
  // Used when mode === 'allocation'
  equityRate?: ScenarioRate;
  bondRate?: ScenarioRate;
  // Allocation periods (sorted by startAge asc). Each entry takes effect
  // from its startAge until the next entry's startAge.
  allocationPeriods: AllocationPeriod[];  // F5
}

interface AllocationPeriod {
  startAge: number;
  equityFraction: number;  // 0–1; bond fraction = 1 - equityFraction
}

// ── F6: Inflation ─────────────────────────────────────────────────────────
// Stored directly on Plan as a ScenarioRate.

// ── F7 + F8: Income ───────────────────────────────────────────────────────
type IncomePhaseType = 'growth' | 'plateau' | 'taper' | 'retirement';

interface IncomePhase {
  id: string;
  name: string;
  startAge: number;
  endAge: number;
  type: IncomePhaseType;
  // Annual income at the START of this phase (in today's dollars)
  baseAnnualIncome: number;
  // Annual growth rate applied to income each year within this phase.
  // For 'plateau', growthRate = { optimistic: 0, base: 0, pessimistic: 0 }.
  // For 'taper', growthRate values should be negative.
  // For 'retirement', baseAnnualIncome and growthRate are unused.
  growthRate: ScenarioRate;  // F8 adds opt/pess; base alone = F7
}

// ── F9 + F10: Expenses ────────────────────────────────────────────────────
type ExpenseFrequency = 'monthly' | 'annual';

interface ExpensePeriod {
  id: string;
  name: string;
  amount: number;
  frequency: ExpenseFrequency;
  startAge: number | null;  // null = from current age
  endAge: number | null;    // null = until endAge
  inflationLinked: boolean;
  // F10: if set, overrides general inflation rate for this expense
  customEscalationRate?: number;
}

// ── F11: Mortgage ─────────────────────────────────────────────────────────
interface MortgageConfig {
  enabled: boolean;
  principal: number;
  annualInterestRate: number;
  tenureYears: number;
  startAge: number;
  // F13: fraction of each annual payment drawn from CPF-OA (0–1)
  cpfOAFraction: number;
}

// ── F12: CPF ──────────────────────────────────────────────────────────────
interface CPFConfig {
  enabled: boolean;
  interestRates: {
    OA: number;  // default 0.025
    SA: number;  // default 0.04
    MA: number;  // default 0.04
  };
  // If null, use Singapore statutory rates by age bracket.
  // If set, overrides for all ages.
  customContributionRates?: CPFContributionRates;
}

interface CPFContributionRates {
  employeeRate: number;  // fraction of gross income
  employerRate: number;  // fraction of gross income
  oaAllocation: number;  // fraction of total CPF contribution
  saAllocation: number;
  maAllocation: number;  // oaAllocation + saAllocation + maAllocation = 1
}

// ── F14: One-time Events ──────────────────────────────────────────────────
type AccountTarget = 'portfolio' | 'cash' | 'cpfSA' | 'cpfOA';

interface OneTimeEvent {
  id: string;
  name: string;
  amount: number;       // positive = inflow, negative = outflow
  age: number;
  targetAccount: AccountTarget;
}

// ── F15: Recurring Contributions ──────────────────────────────────────────
interface RecurringContribution {
  id: string;
  name: string;
  annualAmount: number;  // positive = contribution, negative = withdrawal
  startAge: number;
  endAge: number | null;
  targetAccount: AccountTarget;
}

// ── F16: Annuities ────────────────────────────────────────────────────────
interface AnnuityStream {
  id: string;
  name: string;
  startAge: number;
  annualAmount: number;
  durationYears: number | 'lifetime';
  inflationAdjusted: boolean;
}

// ── F17: Percentage Liabilities ───────────────────────────────────────────
type LiabilityBase = 'gross_income' | 'portfolio';

interface PercentageLiability {
  id: string;
  name: string;
  rate: number;          // e.g. 0.15 for 15%
  base: LiabilityBase;
  startAge: number | null;
  endAge: number | null;
}

// ── F18: Safe Withdrawal ──────────────────────────────────────────────────
interface WithdrawalConfig {
  enabled: boolean;
  rate: number;         // e.g. 0.04 for 4%
  startAge: number;     // usually = retirementAge
}

// ── Root Plan ─────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  timeline: Timeline;                         // F1
  startingBalances: StartingBalances;         // F2
  inflation: ScenarioRate;                    // F6
  growthConfig: GrowthConfig;                 // F4 + F5
  withdrawalConfig: WithdrawalConfig;         // F18
  incomePhases: IncomePhase[];               // F7 + F8
  expenses: ExpensePeriod[];                 // F9 + F10
  percentageLiabilities: PercentageLiability[]; // F17
  mortgage: MortgageConfig;                  // F11 + F13
  cpf: CPFConfig;                            // F12
  oneTimeEvents: OneTimeEvent[];             // F14
  recurringContributions: RecurringContribution[]; // F15
  annuities: AnnuityStream[];                // F16
}
```

---

## 4. Simulation Output (`src/types/simulation.ts`)

```typescript
type Scenario = 'optimistic' | 'base' | 'pessimistic';

interface YearSnapshot {
  age: number;
  // Income flows
  grossIncome: number;
  annuityIncome: number;
  totalIncome: number;
  // Expense flows
  cpfEmployeeContribution: number;
  cpfEmployerContribution: number;
  percentageLiabilities: number;   // tax, fees, etc.
  fixedExpenses: number;            // sum of all ExpensePeriods
  mortgagePayment: number;          // total annual payment
  mortgageCPFPortion: number;       // how much came from CPF-OA
  mortgageCashPortion: number;      // how much came from cash/portfolio
  safeWithdrawal: number;           // retirement drawdown from portfolio
  // Net
  netCashFlow: number;              // income - all cash expenses
  // Account balances (end of year, after all flows and growth)
  portfolio: number;
  cash: number;
  cpfOA: number;
  cpfSA: number;
  cpfMA: number;
  mortgageBalance: number;          // 0 after payoff
  netWorth: number;                 // portfolio + cash + cpf - mortgageBalance
}

interface ScenarioResult {
  scenario: Scenario;
  snapshots: YearSnapshot[];
  // Derived summary stats
  retirementBalance: number;        // net worth at retirementAge
  depletionAge: number | null;      // age at which portfolio hits 0 (null if never)
  finalNetWorth: number;
}

interface SimulationResult {
  optimistic: ScenarioResult;
  base: ScenarioResult;
  pessimistic: ScenarioResult;
}
```

---

## 5. Simulation Engine (`src/engine/`)

### 5.1 Year-loop Order

Within each simulated year, operations execute in this fixed sequence to avoid circular dependencies:

```
1. INCOME
   a. Resolve gross income from active IncomePhase
   b. Resolve annuity income from active AnnuityStreams

2. CPF CONTRIBUTIONS (F12)
   a. Compute employee contribution (% of gross income) → deducted from gross
   b. Compute employer contribution (% of gross income) → added on top, not from gross
   c. Allocate to OA / SA / MA per configured fractions
   d. Net take-home = gross income − employee CPF contribution

3. PERCENTAGE LIABILITIES (F17)
   a. Compute income-linked liabilities (e.g. tax on gross income)
   b. Compute portfolio-linked liabilities (e.g. fund fees — applied at end after growth)

4. FIXED EXPENSES (F9, F10)
   a. For each active ExpensePeriod: apply inflation / custom escalation to get year's amount
   b. Sum all active expenses

5. MORTGAGE PAYMENT (F11, F13)
   a. Look up this year's payment from pre-computed amortization table
   b. Draw cpfOAFraction from CPF-OA balance (reduce cpfOA)
   c. Remainder is cash/portfolio outflow

6. ONE-TIME EVENTS (F14)
   a. If event.age === currentAge: apply to targetAccount

7. RECURRING CONTRIBUTIONS (F15)
   a. For each active RecurringContribution: apply to targetAccount

8. CASH FLOW RESOLUTION
   a. netCashFlow = takeHome − incomeTax − fixedExpenses − mortgageCashPortion
                    + annuityIncome + recurringContributions(portfolio)
   b. If netCashFlow > 0: add surplus to portfolio
   c. If netCashFlow < 0: draw from portfolio (portfolio can go negative — shown as debt)

9. PORTFOLIO GROWTH (F4, F5)
   a. Resolve this year's growth rate from GrowthConfig + AllocationPeriods
   b. Compute portfolio-linked liability fees (% of pre-growth portfolio)
   c. portfolio = (portfolio − fees) × (1 + growthRate)

10. SAFE WITHDRAWAL (F18)
    a. If age >= withdrawalConfig.startAge and withdrawalConfig.enabled:
       withdrawal = portfolio × rate
       portfolio -= withdrawal
       (This models the "spending" in retirement beyond fixed expenses)

11. CPF INTEREST ACCRUAL (F12)
    a. cpfOA += cpfOA × OA_rate
    b. cpfSA += cpfSA × SA_rate
    c. cpfMA += cpfMA × MA_rate

12. SNAPSHOT
    a. Record all balances and flows into YearSnapshot
```

**Why this order?**
- CPF contributions come out of gross income before anything else, matching real payroll behaviour.
- Expenses and mortgage use take-home income.
- Portfolio growth is applied on the end-of-year balance, after all cash flows settle.
- CPF interest is compounded after contributions land, consistent with CPF's annual interest schedule.
- Safe withdrawal is applied after growth so it reflects the true end-of-year portfolio.

### 5.2 `simulate.ts` — Top-level Runner

```typescript
// Pseudocode
function simulate(plan: Plan, scenario: Scenario): ScenarioResult {
  const mortgageTable = buildAmortizationTable(plan.mortgage);
  let state = initialState(plan.startingBalances);
  const snapshots: YearSnapshot[] = [];

  for (let age = plan.timeline.currentAge; age <= plan.timeline.endAge; age++) {
    const snap = simulateYear(age, state, plan, scenario, mortgageTable);
    snapshots.push(snap);
    state = nextState(snap);  // carry balances forward
  }

  return {
    scenario,
    snapshots,
    retirementBalance: ...,
    depletionAge: ...,
    finalNetWorth: ...,
  };
}

function runAllScenarios(plan: Plan): SimulationResult {
  return {
    optimistic: simulate(plan, 'optimistic'),
    base:       simulate(plan, 'base'),
    pessimistic: simulate(plan, 'pessimistic'),
  };
}
```

### 5.3 `mortgage.ts` — Amortization Table (F11)

Pre-compute the full amortization schedule once, not per year:

```typescript
// Standard monthly amortization formula, then aggregate to annual
function buildAmortizationTable(config: MortgageConfig): AnnualPayment[] {
  // monthlyRate = annualRate / 12
  // monthlyPayment = P × r(1+r)^n / ((1+r)^n − 1)
  // Aggregate 12 monthly payments → annual principal, interest, balance
  // Return array indexed by year offset from startAge
}
```

### 5.4 `cpf.ts` — CPF Statutory Rates (F12)

Singapore CPF contribution rates by age bracket (as of 2024; user can override):

| Age      | Employee | Employer | OA    | SA    | MA    |
|----------|----------|----------|-------|-------|-------|
| ≤35      | 20%      | 17%      | 62.2% | 16.2% | 21.6% |
| 36–45    | 20%      | 17%      | 56.1% | 21.7% | 22.2% |
| 46–50    | 20%      | 17%      | 51.5% | 26.0% | 22.5% |
| 51–55    | 20%      | 15%      | 31.5% | 41.5% | 27.0% |
| 56–60    | 13%      | 11.5%    | 35.5% | 30.5% | 34.0% |
| 61–65    | 7.5%     | 9%       | 23.0% | 18.0% | 59.0% |
| >65      | 5%       | 7.5%     | 20.0% | 10.5% | 69.5% |

These are the default lookup table. If `cpf.customContributionRates` is set, it overrides.

### 5.5 `income.ts` — Career Phase Resolution (F7, F8)

```typescript
function resolveIncome(age: number, phases: IncomePhase[], scenario: Scenario): number {
  const phase = phases.find(p => age >= p.startAge && age < p.endAge);
  if (!phase || phase.type === 'retirement') return 0;

  const yearsIntoPhase = age - phase.startAge;
  const rate = phase.growthRate[scenario];
  return phase.baseAnnualIncome * Math.pow(1 + rate, yearsIntoPhase);
}
```

### 5.6 `expenses.ts` — Inflation Compounding (F9, F10)

```typescript
function resolveExpense(
  age: number,
  expense: ExpensePeriod,
  cumulativeInflationFactor: number,  // product of (1 + inflationRate) for each year since start
  scenario: Scenario
): number {
  const active = isActive(age, expense.startAge, expense.endAge);
  if (!active) return 0;

  const annual = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;

  if (expense.customEscalationRate !== undefined) {
    const yearsActive = age - (expense.startAge ?? plan.timeline.currentAge);
    return annual * Math.pow(1 + expense.customEscalationRate, yearsActive);
  }

  return expense.inflationLinked ? annual * cumulativeInflationFactor : annual;
}
```

### 5.7 `growth.ts` — Portfolio Growth Rate (F4, F5)

```typescript
function resolveGrowthRate(age: number, config: GrowthConfig, scenario: Scenario): number {
  if (config.mode === 'direct') {
    return config.directRate![scenario];
  }
  // Find applicable allocation period
  const period = [...config.allocationPeriods]
    .reverse()
    .find(p => age >= p.startAge) ?? config.allocationPeriods[0];

  const eq = period.equityFraction;
  const bd = 1 - eq;
  return eq * config.equityRate![scenario] + bd * config.bondRate![scenario];
}
```

---

## 6. State Management (`src/store/planStore.ts`)

Zustand store holds two things: the current `Plan`, and the derived `SimulationResult`. The result is recomputed reactively whenever the plan changes.

```typescript
interface PlanStore {
  plan: Plan;
  result: SimulationResult | null;

  // Plan mutations — one per data type
  updateTimeline: (t: Partial<Timeline>) => void;
  updateStartingBalances: (b: Partial<StartingBalances>) => void;
  updateInflation: (r: ScenarioRate) => void;
  updateGrowthConfig: (g: Partial<GrowthConfig>) => void;
  updateWithdrawal: (w: Partial<WithdrawalConfig>) => void;
  addIncomePhase: (p: IncomePhase) => void;
  updateIncomePhase: (id: string, p: Partial<IncomePhase>) => void;
  removeIncomePhase: (id: string) => void;
  // ... similar add/update/remove for expenses, events, annuities, etc.

  // Persistence
  savePlan: () => void;    // JSON → localStorage
  loadPlan: () => void;    // localStorage → state
  exportPlan: () => void;  // JSON download
  importPlan: (json: string) => void;
}
```

Simulation is triggered inside the store via a `subscribe` or `computed` that calls `runAllScenarios(plan)` after any mutation. Since simulation is synchronous and fast (< 5ms for a 60-year horizon), there is no need for debouncing or web workers in v1.

---

## 7. UI Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER  [Plan name input]              [Export] [Import] [Save]            │
├──────────────────────────┬─────────────────────────────────────────────────┤
│   EDITOR PANEL (380px)   │   RESULTS PANEL (flex)                          │
│                          │                                                  │
│  [Setup] [Income]        │  ┌──────────────────────────────────────────┐   │
│  [Expenses] [Invest]     │  │  SUMMARY CARDS                           │   │
│  [CPF] [Mortgage]        │  │  Retirement Balance | Depletion Age      │   │
│  [Events] [Annuities]    │  │  Final Net Worth    | Peak Net Worth     │   │
│                          │  └──────────────────────────────────────────┘   │
│  ┌────────────────────┐  │                                                  │
│  │                    │  │  ┌──────────────────────────────────────────┐   │
│  │   Active tab       │  │  │  TRAJECTORY CHART (F21)                  │   │
│  │   form content     │  │  │  [Net Worth ▾]  [Age ▾]                 │   │
│  │                    │  │  │                                          │   │
│  │                    │  │  │  ░░░░ optimistic band                   │   │
│  │                    │  │  │    ── base line                         │   │
│  └────────────────────┘  │  │  ▏retirement  ▏mortgage paid off        │   │
│                          │  └──────────────────────────────────────────┘   │
│                          │                                                  │
│                          │  ┌──────────────────────────────────────────┐   │
│                          │  │  YEAR-BY-YEAR TABLE (F20)                │   │
│                          │  │  [Optimistic] [Base ✓] [Pessimistic]     │   │
│                          │  │  Age | Income | Expenses | Portfolio...  │   │
│                          │  │  (scrollable, 60+ rows)                  │   │
│                          │  └──────────────────────────────────────────┘   │
└──────────────────────────┴─────────────────────────────────────────────────┘
```

The editor panel tabs are fixed-width and the results panel takes remaining width. On narrow screens (< 1024px), the panels stack vertically.

---

## 8. Feature-by-Feature: Logic + UI

---

### F1 · Timeline Configuration

**Logic:** `timeline.currentAge`, `retirementAge`, `endAge` are used as loop bounds and as age-gating predicates throughout the engine. No computation in this feature itself — it's pure configuration.

**UI (`SetupTab.tsx`):**
- Three number inputs in a row: "Current Age", "Retirement Age", "Plan Until Age"
- Inline validation: `currentAge < retirementAge < endAge`
- Show computed values below: "Planning horizon: 35 years | Working years: 30 | Retirement years: 5"

---

### F2 · Starting Balances

**Logic:** These values populate the initial simulation state before year 0 of the loop.

**UI (`SetupTab.tsx`):**
- Two-column grid of `CurrencyInput` fields
- Group 1 — "Assets": Cash / Savings, Investment Portfolio
- Group 2 — "CPF": OA, SA, MA (shown only if CPF is enabled)
- Group 3 — "Liabilities": Outstanding Mortgage Principal (shown only if mortgage is enabled)
- Computed row: "Total starting net worth: $XXX,XXX"

---

### F3 · Year-level Simulation Engine

**Logic:** The simulation runner in `simulate.ts`. Runs automatically when the plan changes.

**UI:** No direct UI. Its output drives the Results Panel entirely.

---

### F4 · Investment Growth Rate

**Logic:** `resolveGrowthRate(age, growthConfig, scenario)` returns a scalar each year. If `mode === 'direct'`, reads `directRate[scenario]`. If `mode === 'allocation'`, blends equity/bond rates using the active `AllocationPeriod`.

**UI (`InvestmentsTab.tsx`):**
- Toggle: "Direct rate" vs "Equity/Bond split"
- If direct: one `ScenarioRateInput` (three fields: Optimistic / Base / Pessimistic)
- If allocation:
  - Two `ScenarioRateInput` rows: Equity Return Rate, Bond Return Rate
  - Allocation periods section (see F5 below)

---

### F5 · Asset Allocation Over Time

**Logic:** A sorted list of `AllocationPeriod` objects. `resolveGrowthRate` finds the last period whose `startAge ≤ currentAge`.

**UI (`InvestmentsTab.tsx`, subsection of F4):**
- Shown only when growth mode is "Equity/Bond split"
- `ItemList` of allocation periods: each row has Age (read-only after first) and an equity % slider (0–100)
- First period's `startAge` is locked to `timeline.currentAge`
- "Add period" button appends a new bracket
- Visual: small horizontal bar chart showing allocation bands across the age range

---

### F6 · Inflation Rate

**Logic:** A `ScenarioRate` stored on `Plan`. The engine tracks a cumulative inflation factor per year: `factor[y] = factor[y-1] × (1 + inflation[scenario])`. This factor is passed into expense resolution.

**UI (`SetupTab.tsx`):**
- `ScenarioRateInput` labelled "Annual Inflation Rate"
- Default values pre-filled: optimistic 1.5%, base 2.5%, pessimistic 4%

---

### F7 + F8 · Income Modeling

**Logic:** `resolveIncome(age, incomePhases, scenario)` finds the active phase and compounds the base income by `growthRate[scenario]^yearsIntoPhase`. Phases are validated to be non-overlapping and must cover `currentAge → retirementAge`.

**UI (`IncomeTab.tsx`):**
- Timeline visualisation: horizontal bar showing each phase as a coloured segment from startAge to endAge
- `ItemList` below: each income phase row shows name, age range, type, base income, growth rate
- Edit modal/drawer for a phase:
  - Name (text)
  - Age range (AgeRangeInput — validated against adjacent phases)
  - Phase type (Growth / Plateau / Taper / Retirement)
  - Base income at phase start (CurrencyInput)
  - Growth rate (`ScenarioRateInput`) — hidden/zeroed for Plateau; negative allowed for Taper
- "Add Phase" button — pre-fills startAge from end of last phase

---

### F9 + F10 · Time-bounded Expenses

**Logic:** For each active `ExpensePeriod`, apply inflation or `customEscalationRate` to get the year's amount. Sum all active expenses.

**UI (`ExpensesTab.tsx`):**
- `ItemList` of expense periods, sortable by start age
- Each row: name, amount, frequency, age range, inflation-linked badge
- Edit drawer:
  - Name, Amount, Frequency (Monthly / Annual)
  - Age range (`AgeRangeInput` — both nullable)
  - "Inflation-linked" checkbox
  - "Custom escalation rate" number field (appears when checkbox is unchecked, or for override)
- Example presets button: "Add childcare", "Add mortgage repayment" — fills in typical values

---

### F11 · Mortgage Modeling

**Logic:** `buildAmortizationTable(config)` pre-computes annual payment, principal, interest, and remaining balance for each year of the loan. During simulation, the engine looks up the payment for `(currentAge - mortgage.startAge)`.

```
monthlyRate = annualRate / 12
monthlyPayment = principal × r(1+r)^n / ((1+r)^n − 1)  where n = tenureYears × 12
annual = monthlyPayment × 12
```

**UI (`MortgageTab.tsx`):**
- Enable/disable toggle
- When enabled: Loan Amount, Annual Interest Rate, Tenure (years), Loan Start Age
- Computed preview table: shows Year, Annual Payment, Principal Portion, Interest Portion, Balance Remaining
- Visual: stacked bar chart showing principal vs interest over the loan term
- CPF offset section (F13): "Pay via CPF-OA" slider (0–100%)

---

### F12 · CPF Contribution Modeling

**Logic:** `resolveCPFContributions(age, grossIncome, cpfConfig)` looks up the statutory rates for `age` (or uses custom rates), computes employee and employer amounts, and returns the flow split across OA/SA/MA. CPF interest is applied at end of year.

**UI (`CPFTab.tsx`):**
- Enable/disable toggle (when off, CPF is excluded from all calculations)
- When enabled:
  - Interest rates section: three fields for OA / SA / MA rates (pre-filled with statutory values)
  - Contribution rates section: toggle "Use Singapore statutory rates" (default on)
  - If custom: four fields — Employee %, Employer %, OA allocation, SA allocation (MA = remainder)
  - Read-only preview table: shows contribution rates by age bracket

---

### F13 · CPF-to-Mortgage Offset

**Logic:** Handled inside the mortgage payment step. `mortgageCPFFraction × annualPayment` is drawn from `cpfOA`. The remainder is a cash outflow.

**UI (`MortgageTab.tsx`):** The CPF offset slider is part of the mortgage config section. Only visible when both mortgage and CPF are enabled.

---

### F14 · One-time Events

**Logic:** Each year, check `oneTimeEvents` for any event with `event.age === currentAge`. If found, apply `amount` to `targetAccount`. Events can be positive (inflow) or negative (outflow).

**UI (`EventsTab.tsx`):**
- `ItemList` of one-time events, sorted by age
- Each row: name, age, amount (coloured green/red), target account
- Edit drawer: Name, Age, Amount (signed), Target Account (dropdown: Portfolio / Cash / CPF-OA / CPF-SA)

---

### F15 · Recurring Contributions

**Logic:** Each year, sum all `RecurringContribution` entries where `age` falls in `[startAge, endAge]`. Apply the annual amount to the target account.

**UI (`EventsTab.tsx`, second section):**
- Separate `ItemList` below the one-time events
- Each row: name, amount/year, age range, target account
- Edit drawer: Name, Annual Amount (signed), Start Age, End Age (nullable), Target Account

---

### F16 · Annuities

**Logic:** Each year, sum annuity payouts from streams where `age >= startAge` and either `durationYears === 'lifetime'` or `age < startAge + durationYears`. Inflation-adjusted payouts compound by inflation factor.

**UI (`AnnuitiesTab.tsx`):**
- `ItemList` of annuity streams
- Each row: name, start age, annual amount, duration, inflation-adjusted badge
- Edit drawer: Name, Start Age, Annual Payout, Duration (Years input or "Lifetime" checkbox), Inflation-adjusted toggle

---

### F17 · Percentage-based Liabilities

**Logic:** Applied in the income step (for `gross_income` base) and in the portfolio growth step (for `portfolio` base). Rate is multiplied by the relevant base value for that year.

**UI (`ExpensesTab.tsx`, second section):**
- Separate `ItemList` below expense periods labelled "Percentage Liabilities"
- Each row: name, rate, base (Income / Portfolio), age range
- Edit drawer: Name, Rate (%), Base type, Age range (both nullable)
- Example: pre-fill "Income Tax" at 15% of gross income

---

### F18 · Safe Withdrawal Rate

**Logic:** After portfolio growth each year in retirement, deduct `portfolio × rate`. The deducted amount is recorded as `safeWithdrawal` in the snapshot.

**UI (`InvestmentsTab.tsx`, bottom section):**
- Enable/disable toggle
- Rate field (default 4%)
- Start age (default = retirementAge from timeline)
- Note: "The safe withdrawal rate operates alongside fixed expenses. Set expenses to $0 in retirement if you prefer the 4% rule to be your only drawdown mechanism."

---

### F19 · Scenario Comparison

**Logic:** `runAllScenarios(plan)` calls `simulate(plan, scenario)` three times with `'optimistic'`, `'base'`, `'pessimistic'`. Each pass uses `scenario`-keyed values from all `ScenarioRate` fields.

**UI:** No dedicated UI tab — the scenario results are displayed in the Results Panel. The chart shows all three simultaneously. The table has a tab switcher to show one scenario at a time.

---

### F20 · Year-by-year Output Table

**Logic:** The `snapshots` array from `ScenarioResult`. Already in the correct format.

**UI (`ResultsTable.tsx`):**
- Scenario tab switcher: [Optimistic] [Base] [Pessimistic]
- Sticky header row with column labels
- Columns: Age | Gross Income | Expenses | Net Cash Flow | Portfolio | CPF Total | Net Worth
- Row highlighting: retirement year (blue), any year portfolio < 0 (red)
- Expandable rows: click a year to see itemised expense breakdown
- Export to CSV button

---

### F21 · Trajectory Visualization

**Logic:** Transforms the three `ScenarioResult.snapshots` arrays into Recharts series data.

**UI (`TrajectoryChart.tsx`):**
- Y-axis metric selector: Net Worth / Portfolio Only / CPF Only / Portfolio + CPF
- X-axis: age (integer ticks)
- Three `<Line>` components: optimistic (dashed), base (solid), pessimistic (dashed)
- `<Area>` between optimistic and pessimistic lines with low opacity fill
- `<ReferenceLine>` at `retirementAge` labelled "Retirement"
- `<ReferenceLine>` at mortgage payoff age (if applicable)
- Tooltip on hover: shows all three scenario values + age
- `<ReferenceLine y={0}` with red colour to clearly show if net worth goes negative

---

## 9. Validation & Error States

| Rule | Where enforced |
|---|---|
| `currentAge < retirementAge < endAge` | SetupTab, validated on input |
| Income phases non-overlapping | IncomeTab, on add/edit |
| Mortgage `startAge >= currentAge` | MortgageTab |
| CPF allocation fractions sum to 1 | CPFTab, auto-normalize MA |
| Expense amounts > 0 | ExpensesTab |
| `ScenarioRate: optimistic >= base >= pessimistic` for return rates | ScenarioRateInput |
| `ScenarioRate: optimistic <= base <= pessimistic` for inflation/expense rates | ScenarioRateInput |

Simulation always runs, even with incomplete data — missing values default to 0. This lets users see a partial result while they fill in the form.

---

## 10. Persistence

- **Auto-save:** Plan is written to `localStorage` after every mutation (debounced 500ms)
- **Manual export:** "Export" button downloads `plan-{name}-{date}.json`
- **Import:** "Import" button opens file picker; parses JSON and validates shape before loading
- **Plan name:** Editable in the header; used as the localStorage key

---

## 11. Implementation Order (Build Sequence)

Following the dependency layers from the PRD:

| Step | Deliverable |
|---|---|
| 1 | Project scaffold: Vite + React + TypeScript + Tailwind + Zustand |
| 2 | Type definitions (`plan.ts`, `simulation.ts`) |
| 3 | Simulation engine shell: `simulate.ts` with F1, F2, F3 (bare loop, no rules yet) |
| 4 | AppLayout + EditorPanel + ResultsPanel shell (tabs navigate, no content) |
| 5 | SetupTab (F1, F2, F6) → engine gets inflation + timeline → basic output table renders |
| 6 | InvestmentsTab (F4) → portfolio grows in simulation → chart renders first trajectory |
| 7 | IncomeTab (F7) → income flows into simulation |
| 8 | ExpensesTab (F9) → expenses reduce portfolio |
| 9 | One-time events + Recurring contributions (F14, F15) → EventsTab |
| 10 | Scenario rates on income (F8) + inflation bounds (F6) → three-line chart |
| 11 | Asset allocation over time (F5) → InvestmentsTab extended |
| 12 | Safe withdrawal rate (F18) → InvestmentsTab extended |
| 13 | Expense escalation (F10) + Percentage liabilities (F17) → ExpensesTab extended |
| 14 | Mortgage amortization (F11) → MortgageTab |
| 15 | CPF contributions + interest (F12) → CPFTab |
| 16 | Annuities (F16) → AnnuitiesTab |
| 17 | CPF-to-mortgage offset (F13) → MortgageTab extended |
| 18 | Summary cards, CSV export, chart reference lines, row highlighting (polish) |
| 19 | Persistence: localStorage auto-save + export/import |
