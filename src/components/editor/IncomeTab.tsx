import { useState } from 'react'
import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { ItemList } from '../ui/ItemList'
import { NumberInput } from '../ui/NumberInput'
import { CurrencyInput } from '../ui/CurrencyInput'
import { ScenarioRateInput } from '../ui/ScenarioRateInput'
import { Select } from '../ui/Select'
import type { IncomePhase, IncomePhaseType } from '../../types/plan'

const PHASE_TYPE_OPTIONS: { value: IncomePhaseType; label: string }[] = [
  { value: 'growth', label: 'Growth (income rises)' },
  { value: 'plateau', label: 'Plateau (income stable)' },
  { value: 'taper', label: 'Taper (income falls)' },
  { value: 'retirement', label: 'Retirement (no income)' },
]

function PhaseForm({ phase, onUpdate }: { phase: IncomePhase; onUpdate: (p: Partial<IncomePhase>) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Phase Name</label>
          <input
            type="text"
            value={phase.name}
            onChange={e => onUpdate({ name: e.target.value })}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500"
          />
        </div>
        <Select label="Phase Type" value={phase.type} options={PHASE_TYPE_OPTIONS}
          onChange={v => onUpdate({ type: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Start Age" value={phase.startAge} onChange={v => onUpdate({ startAge: v })} min={0} />
        <NumberInput label="End Age" value={phase.endAge} onChange={v => onUpdate({ endAge: v })} min={0} />
      </div>
      {phase.type !== 'retirement' && (
        <>
          <CurrencyInput
            label="Annual Income at Phase Start"
            value={phase.baseAnnualIncome}
            onChange={v => onUpdate({ baseAnnualIncome: v })}
          />
          <ScenarioRateInput
            label="Annual Growth Rate"
            value={phase.growthRate}
            onChange={v => onUpdate({ growthRate: v })}
            hint={phase.type === 'taper' ? 'Use negative values for declining income.' : undefined}
          />
        </>
      )}
    </div>
  )
}

export function IncomeTab() {
  const { plan, addIncomePhase, updateIncomePhase, removeIncomePhase } = usePlanStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const sortedPhases = [...plan.incomePhases].sort((a, b) => a.startAge - b.startAge)

  const items = sortedPhases.map(p => ({
    id: p.id,
    label: p.name,
    sublabel: `Age ${p.startAge}–${p.endAge} · ${p.type}`,
    badge: p.type === 'retirement' ? 'Retired' : `$${(p.baseAnnualIncome / 1000).toFixed(0)}k/yr`,
    badgeColor: p.type === 'retirement'
      ? 'bg-slate-600 text-slate-300'
      : 'bg-fire-900/50 text-fire-300',
  }))

  const addPhase = () => {
    const lastPhase = sortedPhases[sortedPhases.length - 1]
    const startAge = lastPhase ? lastPhase.endAge : plan.timeline.currentAge
    const newPhase: IncomePhase = {
      id: crypto.randomUUID(),
      name: 'New Phase',
      startAge,
      endAge: startAge + 10,
      type: 'growth',
      baseAnnualIncome: 60000,
      growthRate: { optimistic: 0.05, base: 0.03, pessimistic: 0.01 },
    }
    addIncomePhase(newPhase)
    setEditingId(newPhase.id)
  }

  // Timeline visualization
  const minAge = plan.timeline.currentAge
  const maxAge = plan.timeline.endAge
  const span = maxAge - minAge

  return (
    <>
      {sortedPhases.length > 0 && (
        <SectionCard title="Income Timeline">
          <div className="relative h-8 bg-slate-700 rounded overflow-hidden">
            {sortedPhases.map((phase, i) => {
              const left = ((phase.startAge - minAge) / span) * 100
              const width = ((phase.endAge - phase.startAge) / span) * 100
              const colors = ['bg-fire-600', 'bg-fire-500', 'bg-fire-400', 'bg-amber-500', 'bg-amber-400']
              return (
                <div
                  key={phase.id}
                  className={`absolute top-0 h-full ${colors[i % colors.length]} opacity-80 flex items-center justify-center`}
                  style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
                  title={`${phase.name}: Age ${phase.startAge}–${phase.endAge}`}
                >
                  {width > 8 && <span className="text-[9px] text-white font-medium truncate px-1">{phase.name}</span>}
                </div>
              )
            })}
            {/* Retirement marker */}
            <div
              className="absolute top-0 h-full border-l-2 border-white/40 border-dashed"
              style={{ left: `${((plan.timeline.retirementAge - minAge) / span) * 100}%` }}
              title={`Retirement age ${plan.timeline.retirementAge}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>Age {minAge}</span>
            <span>Age {plan.timeline.retirementAge} (retirement)</span>
            <span>Age {maxAge}</span>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Income Phases">
        <ItemList
          items={items}
          editingId={editingId}
          onEdit={setEditingId}
          onDelete={removeIncomePhase}
          onAdd={addPhase}
          addLabel="Add Income Phase"
          emptyText="No income phases defined. Add one to start."
          renderForm={(id) => {
            const phase = plan.incomePhases.find(p => p.id === id)!
            return <PhaseForm phase={phase} onUpdate={p => updateIncomePhase(id, p)} />
          }}
        />
      </SectionCard>
    </>
  )
}
