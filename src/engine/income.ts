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
