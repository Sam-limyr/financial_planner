import type { Plan, Scenario } from '../types/plan'
import type { YearSnapshot, ScenarioResult, SimulationResult } from '../types/simulation'
import { computeCPFFlow } from './cpf'
import { resolveGrowthRate } from './growth'
import { resolveIncome, resolveAnnuityIncome } from './income'
import {
  resolveAllExpenses,
  resolvePercentageLiabilitiesOnIncome,
  resolvePercentageLiabilitiesOnPortfolio,
  resolveRecurringContributions,
  resolveOneTimeEvent,
} from './expenses'
import { buildAmortizationTable, getMortgagePayment } from './mortgage'

interface SimState {
  portfolio: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  cpfIA: number
}

function simulate(plan: Plan, scenario: Scenario): ScenarioResult {
  const { timeline, startingBalances, inflation, cpf } = plan
  const mortgageTable = buildAmortizationTable(plan.mortgage)

  // Combined investable assets (cash + portfolio are treated as one pool)
  let state: SimState = {
    portfolio: startingBalances.cash + startingBalances.portfolio,
    cpfOA: startingBalances.cpfOA,
    cpfSA: startingBalances.cpfSA,
    cpfMA: startingBalances.cpfMA,
    cpfIA: startingBalances.cpfIA ?? 0,
  }

  const snapshots: YearSnapshot[] = []
  let cumulativeInflation = 1.0  // grows each year

  for (let age = timeline.currentAge; age <= timeline.endAge; age++) {
    // ── 1. INCOME ──────────────────────────────────────────────────────────
    const grossIncome = resolveIncome(age, plan.incomePhases, scenario)
    const annuityIncome = resolveAnnuityIncome(age, plan.annuities, cumulativeInflation)

    // ── 1b. CPF LIFE ───────────────────────────────────────────────────────
    const cpfLifeConfig = cpf.cpfLife
    let cpfLifeIncome = 0
    if (cpfLifeConfig?.enabled) {
      // At RA creation age (typically 55): draw SA then OA into the RA
      if (age === cpfLifeConfig.raCreationAge) {
        const saDrawn = Math.min(cpfLifeConfig.raFromSA, state.cpfSA)
        state.cpfSA -= saDrawn
        const oaDrawn = Math.min(cpfLifeConfig.raFromOA, state.cpfOA)
        state.cpfOA -= oaDrawn
      }
      // From payout start age onwards, add the annual payout to income
      if (age >= cpfLifeConfig.payoutStartAge) {
        const basePayout = cpfLifeConfig.monthlyPayout * 12
        cpfLifeIncome = cpfLifeConfig.inflationAdjusted
          ? basePayout * cumulativeInflation
          : basePayout
      }
    }

    // ── 2. CPF CONTRIBUTIONS ───────────────────────────────────────────────
    const cpfFlow = computeCPFFlow(age, grossIncome, cpf)
    const takeHome = grossIncome - cpfFlow.employeeContribution

    state.cpfOA += cpfFlow.oaAdded
    state.cpfSA += cpfFlow.saAdded
    state.cpfMA += cpfFlow.maAdded

    // ── 3. INCOME-LINKED PERCENTAGE LIABILITIES (tax etc.) ─────────────────
    const incomeTax = resolvePercentageLiabilitiesOnIncome(age, grossIncome, plan)

    // ── 4. FIXED EXPENSES ──────────────────────────────────────────────────
    const fixedExpenses = resolveAllExpenses(age, plan, cumulativeInflation)

    // ── 5. MORTGAGE ────────────────────────────────────────────────────────
    const mort = getMortgagePayment(age, plan.mortgage, mortgageTable)
    // Draw CPF portion from CPF-OA (but not more than available)
    const cpfForMortgage = Math.min(mort.cpf, state.cpfOA)
    state.cpfOA -= cpfForMortgage
    const cashForMortgage = mort.total - cpfForMortgage

    // ── 6. ONE-TIME EVENTS ─────────────────────────────────────────────────
    const portfolioEvents = resolveOneTimeEvent(age, plan, 'portfolio')
      + resolveOneTimeEvent(age, plan, 'cash')
    const cpfOAEvents = resolveOneTimeEvent(age, plan, 'cpfOA')
    const cpfSAEvents = resolveOneTimeEvent(age, plan, 'cpfSA')
    state.cpfOA += cpfOAEvents
    state.cpfSA += cpfSAEvents

    // ── 7. RECURRING CONTRIBUTIONS ─────────────────────────────────────────
    const portfolioContrib = resolveRecurringContributions(age, plan, 'portfolio')
      + resolveRecurringContributions(age, plan, 'cash')
    const cpfOAContrib = resolveRecurringContributions(age, plan, 'cpfOA')
    const cpfSAContrib = resolveRecurringContributions(age, plan, 'cpfSA')
    state.cpfOA += cpfOAContrib
    state.cpfSA += cpfSAContrib

    // ── 8. NET CASH FLOW ───────────────────────────────────────────────────
    const netCashFlow =
      takeHome
      + annuityIncome
      + cpfLifeIncome
      - incomeTax
      - fixedExpenses
      - cashForMortgage
      + portfolioEvents
      + portfolioContrib

    state.portfolio += netCashFlow

    // ── 9. PORTFOLIO GROWTH ────────────────────────────────────────────────
    const growthRate = resolveGrowthRate(age, plan.growthConfig, scenario)
    const portfolioFees = resolvePercentageLiabilitiesOnPortfolio(age, state.portfolio, plan)
    state.portfolio = (state.portfolio - portfolioFees) * (1 + growthRate)

    // ── 9b. CPF IA GROWTH ──────────────────────────────────────────────────
    // CPF IA earns market returns (not the standard 2.5% OA interest rate)
    if (cpf.cpfIA?.enabled && state.cpfIA > 0) {
      state.cpfIA *= (1 + cpf.cpfIA.growthRate[scenario])
    }

    // ── 10. SAFE WITHDRAWAL ────────────────────────────────────────────────
    let safeWithdrawal = 0
    if (
      plan.withdrawalConfig.enabled &&
      age >= plan.withdrawalConfig.startAge &&
      state.portfolio > 0
    ) {
      safeWithdrawal = state.portfolio * plan.withdrawalConfig.rate
      state.portfolio -= safeWithdrawal
    }

    // ── 11. CPF INTEREST ───────────────────────────────────────────────────
    state.cpfOA += state.cpfOA * cpf.interestRates.OA
    state.cpfSA += state.cpfSA * cpf.interestRates.SA
    state.cpfMA += state.cpfMA * cpf.interestRates.MA
    // cpfIA earns market returns (step 9b), not standard OA interest

    // ── 12. INFLATION COMPOUND ─────────────────────────────────────────────
    cumulativeInflation *= (1 + inflation[scenario])

    // ── 13. SNAPSHOT ───────────────────────────────────────────────────────
    const mortgageBalance = mort.balance
    const totalCPF = state.cpfOA + state.cpfSA + state.cpfMA + state.cpfIA
    const netWorth = state.portfolio + totalCPF - mortgageBalance

    snapshots.push({
      age,
      grossIncome,
      annuityIncome,
      cpfLifeIncome,
      cpfEmployeeContribution: cpfFlow.employeeContribution,
      cpfEmployerContribution: cpfFlow.employerContribution,
      cpfOAAdded: cpfFlow.oaAdded,
      cpfSAAdded: cpfFlow.saAdded,
      cpfMAAdded: cpfFlow.maAdded,
      incomeTax,
      fixedExpenses,
      mortgageTotal: mort.total,
      mortgageCPF: cpfForMortgage,
      mortgageCash: cashForMortgage,
      portfolioFees,
      safeWithdrawal,
      netCashFlow,
      portfolio: state.portfolio,
      cpfOA: state.cpfOA,
      cpfSA: state.cpfSA,
      cpfMA: state.cpfMA,
      cpfIA: state.cpfIA,
      mortgageBalance,
      totalCPF,
      netWorth,
    })
  }

  // Derive summary stats
  const retirementSnap = snapshots.find(s => s.age === timeline.retirementAge)
  const retirementBalance = retirementSnap?.netWorth ?? snapshots[snapshots.length - 1]?.netWorth ?? 0

  const depletionSnap = snapshots.find(s => s.portfolio <= 0)
  const depletionAge = depletionSnap?.age ?? null

  const finalNetWorth = snapshots[snapshots.length - 1]?.netWorth ?? 0
  const peakNetWorth = Math.max(...snapshots.map(s => s.netWorth))

  return { scenario, snapshots, retirementBalance, depletionAge, finalNetWorth, peakNetWorth }
}

export function runAllScenarios(plan: Plan): SimulationResult {
  return {
    optimistic: simulate(plan, 'optimistic'),
    base:       simulate(plan, 'base'),
    pessimistic: simulate(plan, 'pessimistic'),
  }
}
