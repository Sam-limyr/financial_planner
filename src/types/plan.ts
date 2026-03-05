// ── Scenario rate: three variants for optimistic / base / pessimistic projections ──
export interface ScenarioRate {
  optimistic: number
  base: number
  pessimistic: number
}

export type Scenario = 'optimistic' | 'base' | 'pessimistic'

// ── F1: Timeline ──────────────────────────────────────────────────────────────────
export interface Timeline {
  currentAge: number
  retirementAge: number
  endAge: number
}

// ── F2: Starting Balances ─────────────────────────────────────────────────────────
export interface StartingBalances {
  cash: number
  portfolio: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  cpfIA?: number           // CPF Investment Account (CPFIS); optional for backward compat
  mortgagePrincipal: number
}

// ── F4 + F5: Investment Growth ────────────────────────────────────────────────────
export type GrowthMode = 'direct' | 'allocation'

export interface AllocationPeriod {
  id: string
  startAge: number
  equityFraction: number  // 0–1; bond fraction = 1 – equityFraction
}

export interface GrowthConfig {
  mode: GrowthMode
  directRate: ScenarioRate          // used when mode === 'direct'
  equityRate: ScenarioRate          // used when mode === 'allocation'
  bondRate: ScenarioRate            // used when mode === 'allocation'
  allocationPeriods: AllocationPeriod[]
}

// ── F7 + F8: Income phases ────────────────────────────────────────────────────────
export type IncomePhaseType = 'growth' | 'plateau' | 'taper' | 'retirement'

export interface IncomePhase {
  id: string
  name: string
  startAge: number
  endAge: number
  type: IncomePhaseType
  // Annual gross income at the START of this phase (nominal dollars)
  baseAnnualIncome: number
  // Annual growth rate applied each year within the phase.
  // Plateau → all zeros. Taper → negative values. Retirement → unused.
  growthRate: ScenarioRate
}

// ── F9 + F10: Expense periods ─────────────────────────────────────────────────────
export type ExpenseFrequency = 'monthly' | 'annual'

export interface ExpensePeriod {
  id: string
  name: string
  amount: number
  frequency: ExpenseFrequency
  startAge: number | null   // null = plan start
  endAge: number | null     // null = plan end
  inflationLinked: boolean
  // F10: overrides general inflation for this expense when set
  customEscalationRate: number | null
}

// ── F11 + F13: Mortgage ───────────────────────────────────────────────────────────
export interface MortgageConfig {
  enabled: boolean
  principal: number
  annualInterestRate: number
  tenureYears: number
  startAge: number
  cpfOAFraction: number   // 0–1: fraction of each payment drawn from CPF-OA
}

// ── F12: CPF ──────────────────────────────────────────────────────────────────────
export interface CPFInterestRates {
  OA: number
  SA: number
  MA: number
}

export interface CPFContributionRates {
  employeeRate: number
  employerRate: number
  oaAllocation: number
  saAllocation: number
  // maAllocation is always (1 - oaAllocation - saAllocation)
}

export interface CPFIAConfig {
  enabled: boolean
  growthRate: ScenarioRate  // annual return on invested CPF IA assets
}

export interface CPFLifeConfig {
  enabled: boolean
  raCreationAge: number      // typically 55; SA then OA are drawn into RA up to specified amounts
  raFromSA: number           // amount drawn from SA at raCreationAge (SGD)
  raFromOA: number           // amount drawn from OA at raCreationAge (SGD, used if SA insufficient)
  payoutStartAge: number     // 65–70; when monthly LIFE payouts begin
  monthlyPayout: number      // expected monthly payout (SGD)
  inflationAdjusted: boolean
}

export interface CPFConfig {
  enabled: boolean
  interestRates: CPFInterestRates
  useStatutoryRates: boolean   // if false, use customRates below
  customRates: CPFContributionRates
  cpfIA?: CPFIAConfig          // optional for backward compat
  cpfLife?: CPFLifeConfig      // optional for backward compat
}

// ── F14: One-time events ──────────────────────────────────────────────────────────
export type AccountTarget = 'portfolio' | 'cash' | 'cpfSA' | 'cpfOA'

export interface OneTimeEvent {
  id: string
  name: string
  amount: number    // positive = inflow, negative = outflow
  age: number
  targetAccount: AccountTarget
}

// ── F15: Recurring contributions ─────────────────────────────────────────────────
export interface RecurringContribution {
  id: string
  name: string
  annualAmount: number    // positive = contribution, negative = withdrawal
  startAge: number
  endAge: number | null
  targetAccount: AccountTarget
}

// ── F16: Annuities ────────────────────────────────────────────────────────────────
export interface AnnuityStream {
  id: string
  name: string
  startAge: number
  annualAmount: number
  durationYears: number | 'lifetime'
  inflationAdjusted: boolean
}

// ── F17: Percentage liabilities ───────────────────────────────────────────────────
export type LiabilityBase = 'gross_income' | 'portfolio'

export interface PercentageLiability {
  id: string
  name: string
  rate: number     // e.g. 0.15 for 15%
  base: LiabilityBase
  startAge: number | null
  endAge: number | null
}

// ── F18: Safe withdrawal ──────────────────────────────────────────────────────────
export interface WithdrawalConfig {
  enabled: boolean
  rate: number      // e.g. 0.04 for 4%
  startAge: number  // usually = retirementAge
}

// ── Root Plan ─────────────────────────────────────────────────────────────────────
export interface Plan {
  id: string
  name: string
  timeline: Timeline
  startingBalances: StartingBalances
  inflation: ScenarioRate
  growthConfig: GrowthConfig
  withdrawalConfig: WithdrawalConfig
  incomePhases: IncomePhase[]
  expenses: ExpensePeriod[]
  percentageLiabilities: PercentageLiability[]
  mortgage: MortgageConfig
  cpf: CPFConfig
  oneTimeEvents: OneTimeEvent[]
  recurringContributions: RecurringContribution[]
  annuities: AnnuityStream[]
}
