import type { IncomePhase, Scenario } from '../types/plan'

export function resolveIncome(
  age: number,
  phases: IncomePhase[],
  scenario: Scenario,
): number {
  const phase = phases.find(p => age >= p.startAge && age < p.endAge)
  if (!phase || phase.type === 'retirement') return 0

  const yearsIntoPhase = age - phase.startAge
  const rate = phase.growthRate[scenario]
  return phase.baseAnnualIncome * Math.pow(1 + rate, yearsIntoPhase)
}

export function resolveAnnuityIncome(
  age: number,
  annuities: import('../types/plan').AnnuityStream[],
  cumulativeInflation: number,
): number {
  let total = 0
  for (const a of annuities) {
    if (age < a.startAge) continue
    if (a.durationYears !== 'lifetime') {
      if (age >= a.startAge + a.durationYears) continue
    }
    if (a.inflationAdjusted) {
      // Inflate relative to when the annuity started
      // We use the overall cumulative inflation factor as an approximation
      total += a.annualAmount * cumulativeInflation
    } else {
      total += a.annualAmount
    }
  }
  return total
}
