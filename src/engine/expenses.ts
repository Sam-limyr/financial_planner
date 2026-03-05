import type { ExpensePeriod, Plan, Scenario } from '../types/plan'

export function resolveExpense(
  age: number,
  expense: ExpensePeriod,
  cumulativeInflationFactor: number,
  planStartAge: number,
): number {
  const start = expense.startAge ?? planStartAge
  const end = expense.endAge ?? Infinity

  if (age < start || age >= end) return 0

  const baseAnnual = expense.frequency === 'monthly'
    ? expense.amount * 12
    : expense.amount

  if (expense.customEscalationRate !== null) {
    const yearsActive = age - start
    return baseAnnual * Math.pow(1 + expense.customEscalationRate, yearsActive)
  }

  return expense.inflationLinked ? baseAnnual * cumulativeInflationFactor : baseAnnual
}

export function resolveAllExpenses(
  age: number,
  plan: Plan,
  cumulativeInflationFactor: number,
): number {
  return plan.expenses.reduce((sum, e) =>
    sum + resolveExpense(age, e, cumulativeInflationFactor, plan.timeline.currentAge),
    0
  )
}

export function resolvePercentageLiabilitiesOnIncome(
  age: number,
  grossIncome: number,
  plan: Plan,
): number {
  return plan.percentageLiabilities
    .filter(l => l.base === 'gross_income')
    .filter(l => age >= (l.startAge ?? 0) && age < (l.endAge ?? Infinity))
    .reduce((sum, l) => sum + grossIncome * l.rate, 0)
}

export function resolvePercentageLiabilitiesOnPortfolio(
  age: number,
  portfolioValue: number,
  plan: Plan,
): number {
  return plan.percentageLiabilities
    .filter(l => l.base === 'portfolio')
    .filter(l => age >= (l.startAge ?? 0) && age < (l.endAge ?? Infinity))
    .reduce((sum, l) => sum + portfolioValue * l.rate, 0)
}

export function resolveRecurringContributions(
  age: number,
  plan: Plan,
  targetAccount: import('../types/plan').AccountTarget,
  cumulativeInflation = 1.0,
): number {
  return plan.recurringContributions
    .filter(c => c.targetAccount === targetAccount)
    .filter(c => age >= c.startAge && age < (c.endAge ?? Infinity))
    .reduce((sum, c) => {
      const amount = c.inflationAdjusted ? c.annualAmount * cumulativeInflation : c.annualAmount
      return sum + amount
    }, 0)
}

export function resolveOneTimeEvent(
  age: number,
  plan: Plan,
  targetAccount: import('../types/plan').AccountTarget,
): number {
  return plan.oneTimeEvents
    .filter(e => e.targetAccount === targetAccount && e.age === age)
    .reduce((sum, e) => sum + e.amount, 0)
}
