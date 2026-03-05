import type { Scenario } from './plan'

export interface YearSnapshot {
  age: number
  // Income
  grossIncome: number
  annuityIncome: number
  cpfLifeIncome: number      // CPF LIFE annual payout (0 before startAge)
  // CPF flows
  cpfEmployeeContribution: number
  cpfEmployerContribution: number
  cpfOAAdded: number
  cpfSAAdded: number
  cpfMAAdded: number
  // Expenses
  incomeTax: number          // from percentage liabilities on gross_income
  fixedExpenses: number      // sum of all active ExpensePeriods
  mortgageTotal: number      // full annual mortgage payment
  mortgageCPF: number        // portion drawn from CPF-OA
  mortgageCash: number       // portion drawn from portfolio
  portfolioFees: number      // from percentage liabilities on portfolio
  safeWithdrawal: number     // retirement drawdown
  // Net
  netCashFlow: number
  // Balances at end of year (after all flows + growth + interest)
  portfolio: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  cpfIA: number              // CPF Investment Account balance
  mortgageBalance: number
  // Summary
  totalCPF: number           // cpfOA + cpfSA + cpfMA + cpfIA
  netWorth: number           // portfolio + totalCPF − mortgageBalance
}

export interface ScenarioResult {
  scenario: Scenario
  snapshots: YearSnapshot[]
  retirementBalance: number
  depletionAge: number | null
  finalNetWorth: number
  peakNetWorth: number
}

export interface SimulationResult {
  optimistic: ScenarioResult
  base: ScenarioResult
  pessimistic: ScenarioResult
}
