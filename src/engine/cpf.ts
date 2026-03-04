import type { CPFConfig, CPFContributionRates } from '../types/plan'

// Singapore CPF statutory contribution rates by age bracket (2024 rules)
// [maxAge, employeeRate, employerRate, oaAlloc, saAlloc]
// maAlloc = 1 - oaAlloc - saAlloc
const STATUTORY_RATES: Array<{
  maxAge: number
  employee: number
  employer: number
  oaAlloc: number
  saAlloc: number
}> = [
  { maxAge: 35,  employee: 0.20, employer: 0.17, oaAlloc: 0.6217, saAlloc: 0.1621 },
  { maxAge: 45,  employee: 0.20, employer: 0.17, oaAlloc: 0.5609, saAlloc: 0.2174 },
  { maxAge: 50,  employee: 0.20, employer: 0.17, oaAlloc: 0.5150, saAlloc: 0.2600 },
  { maxAge: 55,  employee: 0.20, employer: 0.15, oaAlloc: 0.3150, saAlloc: 0.4150 },
  { maxAge: 60,  employee: 0.13, employer: 0.115,oaAlloc: 0.3542, saAlloc: 0.3058 },
  { maxAge: 65,  employee: 0.075,employer: 0.09, oaAlloc: 0.2267, saAlloc: 0.1867 },
  { maxAge: 999, employee: 0.05, employer: 0.075,oaAlloc: 0.2000, saAlloc: 0.1050 },
]

export function getCPFRates(age: number, config: CPFConfig): CPFContributionRates {
  if (!config.useStatutoryRates) return config.customRates

  const bracket = STATUTORY_RATES.find(b => age <= b.maxAge)!
  return {
    employeeRate: bracket.employee,
    employerRate: bracket.employer,
    oaAllocation: bracket.oaAlloc,
    saAllocation: bracket.saAlloc,
  }
}

export interface CPFFlow {
  employeeContribution: number
  employerContribution: number
  oaAdded: number
  saAdded: number
  maAdded: number
}

export function computeCPFFlow(
  age: number,
  grossIncome: number,
  config: CPFConfig,
): CPFFlow {
  if (!config.enabled || grossIncome <= 0) {
    return { employeeContribution: 0, employerContribution: 0, oaAdded: 0, saAdded: 0, maAdded: 0 }
  }

  const rates = getCPFRates(age, config)
  const employee = grossIncome * rates.employeeRate
  const employer = grossIncome * rates.employerRate
  const total = employee + employer
  const maAlloc = Math.max(0, 1 - rates.oaAllocation - rates.saAllocation)

  return {
    employeeContribution: employee,
    employerContribution: employer,
    oaAdded: total * rates.oaAllocation,
    saAdded: total * rates.saAllocation,
    maAdded: total * maAlloc,
  }
}
