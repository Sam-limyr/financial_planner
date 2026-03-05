import { useState } from 'react'
import { SetupTab } from '../editor/SetupTab'
import { IncomeTab } from '../editor/IncomeTab'
import { ExpensesTab } from '../editor/ExpensesTab'
import { InvestmentsTab } from '../editor/InvestmentsTab'
import { CPFTab } from '../editor/CPFTab'
import { MortgageTab } from '../editor/MortgageTab'
import { EventsTab } from '../editor/EventsTab'
import { AnnuitiesTab } from '../editor/AnnuitiesTab'
import { MonteCarloTab } from '../editor/MonteCarloTab'

const TABS = [
  { id: 'setup',       label: 'Setup' },
  { id: 'income',      label: 'Income' },
  { id: 'expenses',    label: 'Expenses' },
  { id: 'investments', label: 'Invest' },
  { id: 'cpf',         label: 'CPF' },
  { id: 'mortgage',    label: 'Mortgage' },
  { id: 'events',      label: 'Events' },
  { id: 'annuities',   label: 'Annuities' },
  { id: 'montecarlo',  label: 'Monte Carlo' },
] as const

type TabId = typeof TABS[number]['id']

export function EditorPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('setup')

  return (
    <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-slate-700/50 bg-slate-900">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-px p-2 border-b border-slate-700/50 bg-slate-950">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-fire-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'setup'       && <SetupTab />}
        {activeTab === 'income'      && <IncomeTab />}
        {activeTab === 'expenses'    && <ExpensesTab />}
        {activeTab === 'investments' && <InvestmentsTab />}
        {activeTab === 'cpf'         && <CPFTab />}
        {activeTab === 'mortgage'    && <MortgageTab />}
        {activeTab === 'events'      && <EventsTab />}
        {activeTab === 'annuities'   && <AnnuitiesTab />}
        {activeTab === 'montecarlo'  && <MonteCarloTab />}
      </div>
    </div>
  )
}
