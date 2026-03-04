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
            type="number"
            value={expense.startAge ?? ''}
            placeholder="Always"
            onChange={e => onUpdate({ startAge: e.target.value === '' ? null : Number(e.target.value) })}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">End Age (blank = always)</label>
          <input
            type="number"
            value={expense.endAge ?? ''}
            placeholder="Always"
            onChange={e => onUpdate({ endAge: e.target.value === '' ? null : Number(e.target.value) })}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500"
          />
        </div>
      </div>
      <Toggle label="Inflation-linked" checked={expense.inflationLinked} onChange={v => onUpdate({ inflationLinked: v })} />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Custom escalation rate % (overrides inflation if set)</label>
        <input
          type="number"
          value={expense.customEscalationRate !== null ? expense.customEscalationRate * 100 : ''}
          placeholder="Use general inflation"
          step={0.1}
          onChange={e => onUpdate({ customEscalationRate: e.target.value === '' ? null : Number(e.target.value) / 100 })}
          className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500"
        />
      </div>
    </div>
  )
}

function LiabilityForm({ liability, onUpdate }: { liability: PercentageLiability; onUpdate: (l: Partial<PercentageLiability>) => void }) {
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
          <input type="number" value={liability.startAge ?? ''} placeholder="Always"
            onChange={e => onUpdate({ startAge: e.target.value === '' ? null : Number(e.target.value) })}
            className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">End Age (blank = always)</label>
          <input type="number" value={liability.endAge ?? ''} placeholder="Always"
            onChange={e => onUpdate({ endAge: e.target.value === '' ? null : Number(e.target.value) })}
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
