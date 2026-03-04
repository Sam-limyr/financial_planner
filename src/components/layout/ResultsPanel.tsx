import { useState } from 'react'
import { SummaryCards } from '../results/SummaryCards'
import { TrajectoryChart } from '../results/TrajectoryChart'
import { ResultsTable } from '../results/ResultsTable'
import type { Scenario } from '../../types/plan'

export function ResultsPanel() {
  const [tableScenario, setTableScenario] = useState<Scenario>('base')

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <SummaryCards />
        <TrajectoryChart />
        <div>
          <div className="flex items-center gap-1 mb-2">
            {(['optimistic', 'base', 'pessimistic'] as Scenario[]).map(s => (
              <button
                key={s}
                onClick={() => setTableScenario(s)}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  tableScenario === s
                    ? s === 'optimistic' ? 'bg-emerald-700 text-white'
                      : s === 'pessimistic' ? 'bg-red-800 text-white'
                      : 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <ResultsTable scenario={tableScenario} />
        </div>
      </div>
    </div>
  )
}
