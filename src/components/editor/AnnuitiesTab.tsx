import { useState } from 'react'
import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { ItemList } from '../ui/ItemList'
import { NumberInput } from '../ui/NumberInput'
import { CurrencyInput } from '../ui/CurrencyInput'
import { Toggle } from '../ui/Toggle'
import type { AnnuityStream } from '../../types/plan'

function AnnuityForm({ annuity, onUpdate }: { annuity: AnnuityStream; onUpdate: (a: Partial<AnnuityStream>) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Name</label>
        <input type="text" value={annuity.name} onChange={e => onUpdate({ name: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Start Age" value={annuity.startAge} onChange={v => onUpdate({ startAge: v })} min={0} />
        <CurrencyInput label="Annual Payout" value={annuity.annualAmount} onChange={v => onUpdate({ annualAmount: v })} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">Duration</label>
          <button
            onClick={() => onUpdate({ durationYears: annuity.durationYears === 'lifetime' ? 20 : 'lifetime' })}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              annuity.durationYears === 'lifetime'
                ? 'bg-fire-700 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Lifetime
          </button>
        </div>
        {annuity.durationYears !== 'lifetime' && (
          <NumberInput label="Years" value={annuity.durationYears} onChange={v => onUpdate({ durationYears: v })} min={1} />
        )}
      </div>
      <Toggle
        label="Inflation-adjusted"
        checked={annuity.inflationAdjusted}
        onChange={v => onUpdate({ inflationAdjusted: v })}
        hint="Payout grows with inflation each year."
      />
    </div>
  )
}

export function AnnuitiesTab() {
  const { plan, addAnnuity, updateAnnuity, removeAnnuity } = usePlanStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const addNew = () => {
    const a: AnnuityStream = {
      id: crypto.randomUUID(),
      name: 'New Annuity',
      startAge: plan.timeline.retirementAge,
      annualAmount: 12000,
      durationYears: 'lifetime',
      inflationAdjusted: false,
    }
    addAnnuity(a)
    setEditingId(a.id)
  }

  const items = [...plan.annuities].sort((a, b) => a.startAge - b.startAge).map(a => ({
    id: a.id,
    label: a.name,
    sublabel: `$${a.annualAmount.toLocaleString()}/yr from age ${a.startAge} · ${
      a.durationYears === 'lifetime' ? 'lifetime' : `${a.durationYears} yrs`
    }`,
    badge: a.durationYears === 'lifetime' ? 'Lifetime' : undefined,
    badgeColor: 'bg-purple-900/50 text-purple-300',
  }))

  return (
    <SectionCard title="Annuities & Pension Streams">
      <p className="text-xs text-slate-500 mb-2">
        Fixed income streams beginning at a set age — CPF Life payouts, pensions, purchased annuities.
      </p>
      <ItemList
        items={items}
        editingId={editingId}
        onEdit={setEditingId}
        onDelete={removeAnnuity}
        onAdd={addNew}
        addLabel="Add Annuity / Pension"
        emptyText="No annuities or pension streams added."
        renderForm={(id) => {
          const annuity = plan.annuities.find(a => a.id === id)!
          return <AnnuityForm annuity={annuity} onUpdate={u => updateAnnuity(id, u)} />
        }}
      />
    </SectionCard>
  )
}
