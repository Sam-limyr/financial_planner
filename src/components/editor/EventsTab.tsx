import { useState } from 'react'
import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { ItemList } from '../ui/ItemList'
import { NumberInput } from '../ui/NumberInput'
import { CurrencyInput } from '../ui/CurrencyInput'
import { Select } from '../ui/Select'
import type { OneTimeEvent, RecurringContribution, AccountTarget } from '../../types/plan'

const ACCOUNT_OPTIONS: { value: AccountTarget; label: string }[] = [
  { value: 'portfolio', label: 'Investment Portfolio' },
  { value: 'cash', label: 'Cash / Savings' },
  { value: 'cpfOA', label: 'CPF Ordinary Account' },
  { value: 'cpfSA', label: 'CPF Special Account' },
]

function EventForm({ event, onUpdate }: { event: OneTimeEvent; onUpdate: (e: Partial<OneTimeEvent>) => void }) {
  const [amountStr, setAmountStr] = useState(String(event.amount))

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Name</label>
        <input type="text" value={event.name} onChange={e => onUpdate({ name: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="At Age" value={event.age} onChange={v => onUpdate({ age: v })} min={0} />
        <Select label="Target Account" value={event.targetAccount} options={ACCOUNT_OPTIONS} onChange={v => onUpdate({ targetAccount: v })} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Amount (negative = outflow)</label>
        <div className="flex items-center bg-slate-700 rounded border border-slate-600 focus-within:border-fire-500">
          <span className="px-2 text-slate-400 text-sm">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={e => {
              const str = e.target.value
              setAmountStr(str)
              const parsed = parseFloat(str)
              if (!isNaN(parsed)) onUpdate({ amount: parsed })
            }}
            onBlur={() => {
              const parsed = parseFloat(amountStr)
              const norm = isNaN(parsed) ? 0 : parsed
              onUpdate({ amount: norm })
              setAmountStr(String(norm))
            }}
            className="flex-1 bg-transparent text-white text-sm py-1.5 pr-2 outline-none" />
        </div>
      </div>
    </div>
  )
}

function ContribForm({ contrib, onUpdate }: { contrib: RecurringContribution; onUpdate: (c: Partial<RecurringContribution>) => void }) {
  const [amountStr, setAmountStr] = useState(String(contrib.annualAmount))
  const [endAgeStr, setEndAgeStr] = useState(contrib.endAge != null ? String(contrib.endAge) : '')

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Name</label>
        <input type="text" value={contrib.name} onChange={e => onUpdate({ name: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Start Age" value={contrib.startAge} onChange={v => onUpdate({ startAge: v })} min={0} />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">End Age (blank = forever)</label>
          <input
            type="text"
            inputMode="numeric"
            value={endAgeStr}
            placeholder="Forever"
            onChange={e => {
              const str = e.target.value
              setEndAgeStr(str)
              if (str === '') onUpdate({ endAge: null })
              else { const p = parseFloat(str); if (!isNaN(p)) onUpdate({ endAge: p }) }
            }}
            onBlur={() => {
              if (endAgeStr === '') { onUpdate({ endAge: null }); return }
              const p = parseFloat(endAgeStr)
              const norm = isNaN(p) ? null : p
              onUpdate({ endAge: norm })
              setEndAgeStr(norm != null ? String(norm) : '')
            }}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
        </div>
      </div>
      <Select label="Target Account" value={contrib.targetAccount} options={ACCOUNT_OPTIONS} onChange={v => onUpdate({ targetAccount: v })} />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Annual Amount (negative = withdrawal)</label>
        <div className="flex items-center bg-slate-700 rounded border border-slate-600 focus-within:border-fire-500">
          <span className="px-2 text-slate-400 text-sm">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={e => {
              const str = e.target.value
              setAmountStr(str)
              const parsed = parseFloat(str)
              if (!isNaN(parsed)) onUpdate({ annualAmount: parsed })
            }}
            onBlur={() => {
              const parsed = parseFloat(amountStr)
              const norm = isNaN(parsed) ? 0 : parsed
              onUpdate({ annualAmount: norm })
              setAmountStr(String(norm))
            }}
            className="flex-1 bg-transparent text-white text-sm py-1.5 pr-2 outline-none" />
        </div>
      </div>
    </div>
  )
}

export function EventsTab() {
  const { plan, addOneTimeEvent, updateOneTimeEvent, removeOneTimeEvent, addRecurringContribution, updateRecurringContribution, removeRecurringContribution } = usePlanStore()
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [editingContrib, setEditingContrib] = useState<string | null>(null)

  const addEvent = () => {
    const e: OneTimeEvent = {
      id: crypto.randomUUID(),
      name: 'New Event',
      amount: 10000,
      age: plan.timeline.currentAge + 5,
      targetAccount: 'portfolio',
    }
    addOneTimeEvent(e)
    setEditingEvent(e.id)
  }

  const addContrib = () => {
    const c: RecurringContribution = {
      id: crypto.randomUUID(),
      name: 'New Contribution',
      annualAmount: 5000,
      startAge: plan.timeline.currentAge,
      endAge: null,
      targetAccount: 'portfolio',
    }
    addRecurringContribution(c)
    setEditingContrib(c.id)
  }

  const eventItems = [...plan.oneTimeEvents].sort((a, b) => a.age - b.age).map(e => ({
    id: e.id,
    label: e.name,
    sublabel: `Age ${e.age} · ${e.amount >= 0 ? '+' : ''}$${Math.abs(e.amount).toLocaleString()} → ${e.targetAccount}`,
    badge: e.amount >= 0 ? 'Inflow' : 'Outflow',
    badgeColor: e.amount >= 0 ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300',
  }))

  const contribItems = [...plan.recurringContributions].sort((a, b) => a.startAge - b.startAge).map(c => ({
    id: c.id,
    label: c.name,
    sublabel: `$${Math.abs(c.annualAmount).toLocaleString()}/yr · Age ${c.startAge}–${c.endAge ?? '∞'} → ${c.targetAccount}`,
    badge: c.annualAmount >= 0 ? 'Contribution' : 'Withdrawal',
    badgeColor: c.annualAmount >= 0 ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300',
  }))

  return (
    <>
      <SectionCard title="One-time Events">
        <p className="text-xs text-slate-500 mb-2">Lump sums at a specific age (inheritance, property sale, car purchase…)</p>
        <ItemList
          items={eventItems}
          editingId={editingEvent}
          onEdit={setEditingEvent}
          onDelete={removeOneTimeEvent}
          onAdd={addEvent}
          addLabel="Add Event"
          emptyText="No one-time events added."
          renderForm={(id) => {
            const event = plan.oneTimeEvents.find(e => e.id === id)!
            return <EventForm event={event} onUpdate={u => updateOneTimeEvent(id, u)} />
          }}
        />
      </SectionCard>

      <SectionCard title="Recurring Contributions">
        <p className="text-xs text-slate-500 mb-2">Periodic inflows or withdrawals over a date range (rental income, side income…)</p>
        <ItemList
          items={contribItems}
          editingId={editingContrib}
          onEdit={setEditingContrib}
          onDelete={removeRecurringContribution}
          onAdd={addContrib}
          addLabel="Add Recurring Contribution"
          emptyText="No recurring contributions added."
          renderForm={(id) => {
            const contrib = plan.recurringContributions.find(c => c.id === id)!
            return <ContribForm contrib={contrib} onUpdate={u => updateRecurringContribution(id, u)} />
          }}
        />
      </SectionCard>
    </>
  )
}
