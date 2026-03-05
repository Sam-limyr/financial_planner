import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Plan, Timeline, StartingBalances, ScenarioRate, GrowthConfig,
  WithdrawalConfig, IncomePhase, ExpensePeriod, PercentageLiability,
  MortgageConfig, CPFConfig, OneTimeEvent, RecurringContribution,
  AllocationPeriod, MonteCarloConfig,
} from '../types/plan'
import type { SimulationResult, MonteCarloResult } from '../types/simulation'
import { runAllScenarios } from '../engine/simulate'
import { runMonteCarlo } from '../engine/monteCarlo'
import { createDefaultPlan } from './defaultPlan'

const STORAGE_KEY = 'retire-if-fire-plan'
const SAVES_KEY = 'retire-if-fire-saves'

// ── SavedProfile ──────────────────────────────────────────────────────────────

export interface SavedProfile {
  id: string
  name: string
  savedAt: string  // ISO timestamp
  plan: Plan
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadFromStorage(): Plan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Plan
  } catch {
    return null
  }
}

function saveToStorage(plan: Plan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {
    // ignore
  }
}

function loadSavesFromStorage(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY)
    return raw ? JSON.parse(raw) as SavedProfile[] : []
  } catch {
    return []
  }
}

function saveSavesToStorage(profiles: SavedProfile[]) {
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(profiles))
  } catch {
    // ignore quota errors
  }
}

// ── Store interface ───────────────────────────────────────────────────────────

interface PlanStore {
  plan: Plan
  result: SimulationResult

  // ── Monte Carlo ───────────────────────────────────────────────────────────
  monteCarloResult: MonteCarloResult | null
  updateMonteCarlo: (m: Partial<MonteCarloConfig>) => void
  triggerMonteCarlo: () => void

  // ── Save/Load profiles ────────────────────────────────────────────────────
  savedProfiles: SavedProfile[]
  lastSavedSnapshot: string  // JSON.stringify of plan at last save/load event

  savePlan: (name: string) => void
  loadProfile: (plan: Plan) => void
  deleteProfile: (id: string) => void

  // ── Mutations ──────────────────────────────────────────────────────────────
  updateTimeline: (t: Partial<Timeline>) => void
  updateStartingBalances: (b: Partial<StartingBalances>) => void
  updateInflation: (r: ScenarioRate) => void
  updateGrowthConfig: (g: Partial<GrowthConfig>) => void
  updateWithdrawalConfig: (w: Partial<WithdrawalConfig>) => void
  setPlanName: (name: string) => void

  // Income phases
  addIncomePhase: (p: IncomePhase) => void
  updateIncomePhase: (id: string, p: Partial<IncomePhase>) => void
  removeIncomePhase: (id: string) => void

  // Expenses
  addExpense: (e: ExpensePeriod) => void
  updateExpense: (id: string, e: Partial<ExpensePeriod>) => void
  removeExpense: (id: string) => void

  // % liabilities
  addPercentageLiability: (l: PercentageLiability) => void
  updatePercentageLiability: (id: string, l: Partial<PercentageLiability>) => void
  removePercentageLiability: (id: string) => void

  // Mortgage
  updateMortgage: (m: Partial<MortgageConfig>) => void

  // CPF
  updateCPF: (c: Partial<CPFConfig>) => void

  // One-time events
  addOneTimeEvent: (e: OneTimeEvent) => void
  updateOneTimeEvent: (id: string, e: Partial<OneTimeEvent>) => void
  removeOneTimeEvent: (id: string) => void

  // Recurring contributions
  addRecurringContribution: (c: RecurringContribution) => void
  updateRecurringContribution: (id: string, c: Partial<RecurringContribution>) => void
  removeRecurringContribution: (id: string) => void

  // Allocation periods
  addAllocationPeriod: (p: AllocationPeriod) => void
  updateAllocationPeriod: (id: string, p: Partial<AllocationPeriod>) => void
  removeAllocationPeriod: (id: string) => void

  // Persistence
  exportPlan: () => void
  importPlan: (json: string) => void
  resetPlan: () => void
}

function withResult(plan: Plan): { plan: Plan; result: SimulationResult } {
  saveToStorage(plan)
  return { plan, result: runAllScenarios(plan) }
}

// Merge any saved plan with current defaults to fill in new optional fields.
// Also migrates deprecated annuities → recurringContributions.
function migratePlan(saved: Plan): Plan {
  const defaults = createDefaultPlan()
  const plan: Plan = {
    ...saved,
    monteCarlo: { ...defaults.monteCarlo!, ...(saved.monteCarlo ?? {}) },
  }

  // Migrate old annuities (deprecated field) to recurringContributions
  const oldAnnuities = (saved as any).annuities ?? []
  if (oldAnnuities.length > 0) {
    const converted: RecurringContribution[] = oldAnnuities.map((a: any) => ({
      id: a.id,
      name: a.name,
      annualAmount: a.annualAmount,
      startAge: a.startAge,
      endAge: a.durationYears === 'lifetime' ? null : a.startAge + a.durationYears,
      targetAccount: 'portfolio' as const,
      inflationAdjusted: a.inflationAdjusted ?? false,
    }))
    const existingIds = new Set(plan.recurringContributions.map(c => c.id))
    plan.recurringContributions = [
      ...plan.recurringContributions,
      ...converted.filter(c => !existingIds.has(c.id)),
    ]
  }

  return plan
}

const initialPlan = migratePlan(loadFromStorage() ?? createDefaultPlan())

export const usePlanStore = create<PlanStore>()(
  subscribeWithSelector((set, get) => ({
    plan: initialPlan,
    result: runAllScenarios(initialPlan),
    monteCarloResult: null,
    savedProfiles: loadSavesFromStorage(),
    lastSavedSnapshot: JSON.stringify(initialPlan),

    // ── Monte Carlo ─────────────────────────────────────────────────────────

    updateMonteCarlo: (m) => set(s => ({
      ...withResult({
        ...s.plan,
        monteCarlo: { ...(s.plan.monteCarlo ?? createDefaultPlan().monteCarlo!), ...m },
      }),
      monteCarloResult: null,  // invalidate stale result when config changes
    })),

    triggerMonteCarlo: () => {
      const mcResult = runMonteCarlo(get().plan)
      set({ monteCarloResult: mcResult })
    },

    // ── Save/Load profiles ──────────────────────────────────────────────────

    savePlan: (name) => {
      const { plan, savedProfiles } = get()
      const snapshot = JSON.stringify(plan)
      const existingIdx = savedProfiles.findIndex(p => p.name === name)
      let updated: SavedProfile[]
      if (existingIdx >= 0) {
        updated = savedProfiles.map((p, i) =>
          i === existingIdx ? { ...p, savedAt: new Date().toISOString(), plan } : p)
      } else {
        updated = [
          { id: crypto.randomUUID(), name, savedAt: new Date().toISOString(), plan },
          ...savedProfiles,
        ]
      }
      saveSavesToStorage(updated)
      set({ savedProfiles: updated, lastSavedSnapshot: snapshot })
    },

    loadProfile: (plan) => {
      const migrated = migratePlan(plan)
      set({ ...withResult(migrated), lastSavedSnapshot: JSON.stringify(migrated), monteCarloResult: null })
    },

    deleteProfile: (id) => {
      const updated = get().savedProfiles.filter(p => p.id !== id)
      saveSavesToStorage(updated)
      set({ savedProfiles: updated })
    },

    // ── Plan mutations ──────────────────────────────────────────────────────

    setPlanName: (name) => set(s => withResult({ ...s.plan, name })),

    updateTimeline: (t) => set(s => withResult({ ...s.plan, timeline: { ...s.plan.timeline, ...t } })),
    updateStartingBalances: (b) => set(s => withResult({ ...s.plan, startingBalances: { ...s.plan.startingBalances, ...b } })),
    updateInflation: (r) => set(s => withResult({ ...s.plan, inflation: r })),
    updateGrowthConfig: (g) => set(s => withResult({ ...s.plan, growthConfig: { ...s.plan.growthConfig, ...g } })),
    updateWithdrawalConfig: (w) => set(s => withResult({ ...s.plan, withdrawalConfig: { ...s.plan.withdrawalConfig, ...w } })),

    addIncomePhase: (p) => set(s => withResult({ ...s.plan, incomePhases: [...s.plan.incomePhases, p] })),
    updateIncomePhase: (id, p) => set(s => withResult({
      ...s.plan,
      incomePhases: s.plan.incomePhases.map(x => x.id === id ? { ...x, ...p } : x),
    })),
    removeIncomePhase: (id) => set(s => withResult({ ...s.plan, incomePhases: s.plan.incomePhases.filter(x => x.id !== id) })),

    addExpense: (e) => set(s => withResult({ ...s.plan, expenses: [...s.plan.expenses, e] })),
    updateExpense: (id, e) => set(s => withResult({
      ...s.plan,
      expenses: s.plan.expenses.map(x => x.id === id ? { ...x, ...e } : x),
    })),
    removeExpense: (id) => set(s => withResult({ ...s.plan, expenses: s.plan.expenses.filter(x => x.id !== id) })),

    addPercentageLiability: (l) => set(s => withResult({ ...s.plan, percentageLiabilities: [...s.plan.percentageLiabilities, l] })),
    updatePercentageLiability: (id, l) => set(s => withResult({
      ...s.plan,
      percentageLiabilities: s.plan.percentageLiabilities.map(x => x.id === id ? { ...x, ...l } : x),
    })),
    removePercentageLiability: (id) => set(s => withResult({ ...s.plan, percentageLiabilities: s.plan.percentageLiabilities.filter(x => x.id !== id) })),

    updateMortgage: (m) => set(s => withResult({ ...s.plan, mortgage: { ...s.plan.mortgage, ...m } })),
    updateCPF: (c) => set(s => withResult({ ...s.plan, cpf: { ...s.plan.cpf, ...c } })),

    addOneTimeEvent: (e) => set(s => withResult({ ...s.plan, oneTimeEvents: [...s.plan.oneTimeEvents, e] })),
    updateOneTimeEvent: (id, e) => set(s => withResult({
      ...s.plan,
      oneTimeEvents: s.plan.oneTimeEvents.map(x => x.id === id ? { ...x, ...e } : x),
    })),
    removeOneTimeEvent: (id) => set(s => withResult({ ...s.plan, oneTimeEvents: s.plan.oneTimeEvents.filter(x => x.id !== id) })),

    addRecurringContribution: (c) => set(s => withResult({ ...s.plan, recurringContributions: [...s.plan.recurringContributions, c] })),
    updateRecurringContribution: (id, c) => set(s => withResult({
      ...s.plan,
      recurringContributions: s.plan.recurringContributions.map(x => x.id === id ? { ...x, ...c } : x),
    })),
    removeRecurringContribution: (id) => set(s => withResult({ ...s.plan, recurringContributions: s.plan.recurringContributions.filter(x => x.id !== id) })),

    addAllocationPeriod: (p) => set(s => withResult({
      ...s.plan,
      growthConfig: {
        ...s.plan.growthConfig,
        allocationPeriods: [...s.plan.growthConfig.allocationPeriods, p].sort((a, b) => a.startAge - b.startAge),
      },
    })),
    updateAllocationPeriod: (id, p) => set(s => withResult({
      ...s.plan,
      growthConfig: {
        ...s.plan.growthConfig,
        allocationPeriods: s.plan.growthConfig.allocationPeriods
          .map(x => x.id === id ? { ...x, ...p } : x)
          .sort((a, b) => a.startAge - b.startAge),
      },
    })),
    removeAllocationPeriod: (id) => set(s => withResult({
      ...s.plan,
      growthConfig: {
        ...s.plan.growthConfig,
        allocationPeriods: s.plan.growthConfig.allocationPeriods.filter(x => x.id !== id),
      },
    })),

    exportPlan: () => {
      const { plan } = get()
      const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${plan.name.replace(/\s+/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
    },

    importPlan: (json) => {
      try {
        const parsed = JSON.parse(json) as Plan
        if (!parsed.timeline || !parsed.startingBalances) throw new Error('Invalid plan')
        const migrated = migratePlan(parsed)
        set({ ...withResult(migrated), lastSavedSnapshot: JSON.stringify(migrated), monteCarloResult: null })
      } catch {
        alert('Failed to import plan — invalid file format.')
      }
    },

    resetPlan: () => {
      const fresh = createDefaultPlan()
      set(withResult(fresh))
    },
  }))
)
