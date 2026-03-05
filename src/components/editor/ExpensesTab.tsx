import { useState } from 'react'
import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { ItemList } from '../ui/ItemList'
import { NumberInput } from '../ui/NumberInput'
import { CurrencyInput } from '../ui/CurrencyInput'
import { Select } from '../ui/Select'
import { Toggle } from '../ui/Toggle'
import type { ExpensePeriod, ExpenseFrequency, PercentageLiability, LiabilityBase } from '../../types/plan'

function ExpenseForm({ expense, onUpdate }: { expense: ExpensePeriod; onUpdate: (e: Partial<ExpensePeriod>) => void }) {
  const [startAgeStr, setStartAgeStr] = useState(expense.startAge != null ? String(expense.startAge) : '')
  const [endAgeStr, setEndAgeStr] = useState(expense.endAge != null ? String(expense.endAge) : '')
  const [escalStr, setEscalStr] = useState(
    expense.customEscalationRate !== null ? String(+(expense.customEscalationRate * 100).toFixed(4)) : ''
  )

  const handleNullableAge = (
    str: string,
    setStr: (s: string) => void,
    field: 'startAge' | 'endAge',
  ) => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const s = e.target.value
      setStr(s)
      if (s === '') onUpdate({ [field]: null })
      else { const p = parseFloat(s); if (!isNaN(p)) onUpdate({ [field]: p }) }
    },
    onBlur: () => {
      if (str === '') { onUpdate({ [field]: null }); return }
      const p = parseFloat(str)
      const norm = isNaN(p) ? null : p
      onUpdate({ [field]: norm })
      setStr(norm != null ? String(norm) : '')
    },
  })

  const startAgeHandlers = handleNullableAge(startAgeStr, setStartAgeStr, 'startAge')
  const endAgeHandlers = handleNullableAge(endAgeStr, setEndAgeStr, 'endAge')

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Name</label>
        <input type="text" value={expense.name} onChange={e => onUpdate({ name: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CurrencyInput label="Amount" value={expense.amount} onChange={v => onUpdate({ amount: v })} />
        <Select
          label="Frequency"
          value={expense.frequency}
          options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual' }] as { value: ExpenseFrequency; label: string }[]}
          onChange={v => onUpdate({ frequency: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Start Age (blank = always)</label>
          <input
            type="text"
            inputMode="numeric"
            value={startAgeStr}
            placeholder="Always"
            onChange={startAgeHandlers.onChange}
            onBlur={startAgeHandlers.onBlur}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">End Age (blank = always)</label>
          <input
            type="text"
            inputMode="numeric"
            value={endAgeStr}
            placeholder="Always"
            onChange={endAgeHandlers.onChange}
            onBlur={endAgeHandlers.onBlur}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500"
          />
        </div>
      </div>
      <Toggle label="Inflation-linked" checked={expense.inflationLinked} onChange={v => onUpdate({ inflationLinked: v })} />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Custom escalation rate % (overrides inflation if set)</label>
        <input
          type="text"
          inputMode="decimal"
          value={escalStr}
          placeholder="Use general inflation"
          onChange={e => {
            const s = e.target.value
            setEscalStr(s)
            if (s === '') onUpdate({ customEscalationRate: null })
            else { const p = parseFloat(s); if (!isNaN(p)) onUpdate({ customEscalationRate: p / 100 }) }
          }}
          onBlur={() => {
            if (escalStr === '') { onUpdate({ customEscalationRate: null }); return }
            const p = parseFloat(escalStr)
            const norm = isNaN(p) ? null : p
            onUpdate({ customEscalationRate: norm !== null ? norm / 100 : null })
            setEscalStr(norm != null ? String(norm) : '')
          }}
          className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500"
        />
      </div>
    </div>
  )
}

function LiabilityForm({ liability, onUpdate }: { liability: PercentageLiability; onUpdate: (l: Partial<PercentageLiability>) => void }) {
  const [startAgeStr, setStartAgeStr] = useState(liability.startAge != null ? String(liability.startAge) : '')
  const [endAgeStr, setEndAgeStr] = useState(liability.endAge != null ? String(liability.endAge) : '')

  const makeHandler = (
    str: string,
    setStr: (s: string) => void,
    field: 'startAge' | 'endAge',
  ) => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const s = e.target.value
      setStr(s)
      if (s === '') onUpdate({ [field]: null })
      else { const p = parseFloat(s); if (!isNaN(p)) onUpdate({ [field]: p }) }
    },
    onBlur: () => {
      if (str === '') { onUpdate({ [field]: null }); return }
      const p = parseFloat(str)
      const norm = isNaN(p) ? null : p
      onUpdate({ [field]: norm })
      setStr(norm != null ? String(norm) : '')
    },
  })

  const startHandlers = makeHandler(startAgeStr, setStartAgeStr, 'startAge')
  const endHandlers = makeHandler(endAgeStr, setEndAgeStr, 'endAge')

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Name</label>
        <input type="text" value={liability.name} onChange={e => onUpdate({ name: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Rate %" value={+(liability.rate * 100).toFixed(2)} step={0.1}
          onChange={v => onUpdate({ rate: v / 100 })} />
        <Select
          label="Applied to"
          value={liability.base}
          options={[{ value: 'gross_income', label: 'Gross Income' }, { value: 'portfolio', label: 'Portfolio Value' }] as { value: LiabilityBase; label: string }[]}
          onChange={v => onUpdate({ base: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Start Age (blank = always)</label>
          <input
            type="text"
            inputMode="numeric"
            value={startAgeStr}
            placeholder="Always"
            onChange={startHandlers.onChange}
            onBlur={startHandlers.onBlur}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">End Age (blank = always)</label>
          <input
            type="text"
            inputMode="numeric"
            value={endAgeStr}
            placeholder="Always"
            onChange={endHandlers.onChange}
            onBlur={endHandlers.onBlur}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
        </div>
      </div>
    </div>
  )
}

export function ExpensesTab() {
  const { plan, addExpense, updateExpense, removeExpense, addPercentageLiability, updatePercentageLiability, removePercentageLiability } = usePlanStore()
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [editingLiability, setEditingLiability] = useState<string | null>(null)

  const addNewExpense = () => {
    const e: ExpensePeriod = {
      id: crypto.randomUUID(),
      name: 'New Expense',
      amount: 1000,
      frequency: 'monthly',
      startAge: null,
      endAge: null,
      inflationLinked: true,
      customEscalationRate: null,
    }
    addExpense(e)
    setEditingExpense(e.id)
  }

  const addNewLiability = () => {
    const l: PercentageLiability = {
      id: crypto.randomUUID(),
      name: 'New Liability',
      rate: 0.10,
      base: 'gross_income',
      startAge: null,
      endAge: null,
    }
    addPercentageLiability(l)
    setEditingLiability(l.id)
  }

  const expenseItems = plan.expenses.map(e => ({
    id: e.id,
    label: e.name,
    sublabel: `$${e.amount.toLocaleString()}/${e.frequency === 'monthly' ? 'mo' : 'yr'} · ${e.startAge ?? 'always'}–${e.endAge ?? 'always'}`,
    badge: e.inflationLinked ? 'Inflation-linked' : undefined,
    badgeColor: 'bg-blue-900/50 text-blue-300',
  }))

  const liabilityItems = plan.percentageLiabilities.map(l => ({
    id: l.id,
    label: l.name,
    sublabel: `${(l.rate * 100).toFixed(1)}% of ${l.base === 'gross_income' ? 'income' : 'portfolio'}`,
  }))

  return (
    <>
      <SectionCard title="Recurring Expenses">
        <ItemList
          items={expenseItems}
          editingId={editingExpense}
          onEdit={setEditingExpense}
          onDelete={removeExpense}
          onAdd={addNewExpense}
          addLabel="Add Expense"
          emptyText="No expenses added yet."
          renderForm={(id) => {
            const expense = plan.expenses.find(e => e.id === id)!
            return <ExpenseForm expense={expense} onUpdate={u => updateExpense(id, u)} />
          }}
        />
      </SectionCard>

      <SectionCard title="Percentage Liabilities">
        <p className="text-xs text-slate-500 mb-2">e.g. income tax, fund management fees</p>
        <ItemList
          items={liabilityItems}
          editingId={editingLiability}
          onEdit={setEditingLiability}
          onDelete={removePercentageLiability}
          onAdd={addNewLiability}
          addLabel="Add Liability"
          emptyText="No percentage liabilities added."
          renderForm={(id) => {
            const l = plan.percentageLiabilities.find(x => x.id === id)!
            return <LiabilityForm liability={l} onUpdate={u => updatePercentageLiability(id, u)} />
          }}
        />
      </SectionCard>
    </>
  )
}
