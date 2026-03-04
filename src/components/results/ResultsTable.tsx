import { useState } from 'react'
import { usePlanStore } from '../../store/planStore'
import type { Scenario } from '../../types/plan'
import type { YearSnapshot } from '../../types/simulation'

interface Props {
  scenario: Scenario
}

function fmt(n: number) {
  if (n === 0) return '—'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)    return `$${Math.round(n / 1_000)}k`
  return `$${Math.round(n)}`
}

type ColKey = 'grossIncome' | 'fixedExpenses' | 'netCashFlow' | 'portfolio' | 'totalCPF' | 'mortgageBalance' | 'netWorth'

const COLUMNS: { key: ColKey; label: string; color?: string }[] = [
  { key: 'grossIncome',     label: 'Income',    color: 'text-emerald-300' },
  { key: 'fixedExpenses',   label: 'Expenses',  color: 'text-red-300' },
  { key: 'netCashFlow',     label: 'Net Flow' },
  { key: 'portfolio',       label: 'Portfolio', color: 'text-fire-300' },
  { key: 'totalCPF',        label: 'CPF',       color: 'text-blue-300' },
  { key: 'mortgageBalance', label: 'Mortgage',  color: 'text-slate-400' },
  { key: 'netWorth',        label: 'Net Worth', color: 'text-white' },
]

function cellColor(key: ColKey, value: number, isRetirement: boolean): string {
  if (key === 'netWorth' || key === 'portfolio') {
    return value < 0 ? 'text-red-400 font-medium' : ''
  }
  if (key === 'netCashFlow') {
    return value < 0 ? 'text-red-400' : 'text-emerald-400'
  }
  return ''
}

export function ResultsTable({ scenario }: Props) {
  const { result, plan } = usePlanStore()
  const snapshots = result[scenario].snapshots
  const [expandedAge, setExpandedAge] = useState<number | null>(null)

  const exportCSV = () => {
    const header = ['Age', ...COLUMNS.map(c => c.label)].join(',')
    const rows = snapshots.map(s =>
      [s.age, ...COLUMNS.map(c => Math.round(s[c.key as keyof YearSnapshot] as number))].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${plan.name}-${scenario}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <span className="text-xs text-slate-400">Year-by-year breakdown</span>
        <button onClick={exportCSV} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700 sticky top-0 bg-slate-800">
              <th className="text-left py-2 pl-3 pr-2 font-medium">Age</th>
              {COLUMNS.map(c => (
                <th key={c.key} className={`text-right py-2 px-2 font-medium ${c.color ?? 'text-slate-400'}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshots.map(snap => {
              const isRetirement = snap.age === plan.timeline.retirementAge
              const isDepleted = snap.portfolio <= 0
              const isExpanded = expandedAge === snap.age

              return (
                <>
                  <tr
                    key={snap.age}
                    onClick={() => setExpandedAge(isExpanded ? null : snap.age)}
                    className={`border-b border-slate-700/40 cursor-pointer transition-colors ${
                      isRetirement ? 'bg-fire-900/20 hover:bg-fire-900/30' :
                      isDepleted   ? 'bg-red-900/20 hover:bg-red-900/30' :
                                     'hover:bg-slate-700/40'
                    }`}
                  >
                    <td className="py-1.5 pl-3 pr-2 font-medium text-slate-300">
                      {snap.age}
                      {isRetirement && <span className="ml-1 text-fire-400">★</span>}
                    </td>
                    {COLUMNS.map(col => {
                      const val = snap[col.key as keyof YearSnapshot] as number
                      return (
                        <td key={col.key} className={`text-right py-1.5 px-2 ${col.color ?? ''} ${cellColor(col.key, val, isRetirement)}`}>
                          {fmt(val)}
                        </td>
                      )
                    })}
                  </tr>

                  {isExpanded && (
                    <tr key={`${snap.age}-detail`} className="bg-slate-900/60">
                      <td colSpan={COLUMNS.length + 1} className="px-3 py-2">
                        <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-[10px] text-slate-400">
                          <span>Gross income: <span className="text-slate-200">{fmt(snap.grossIncome)}</span></span>
                          <span>Annuity income: <span className="text-slate-200">{fmt(snap.annuityIncome)}</span></span>
                          <span>Income tax: <span className="text-red-300">{fmt(snap.incomeTax)}</span></span>
                          <span>CPF employee: <span className="text-slate-200">{fmt(snap.cpfEmployeeContribution)}</span></span>
                          <span>CPF employer: <span className="text-slate-200">{fmt(snap.cpfEmployerContribution)}</span></span>
                          <span>Portfolio fees: <span className="text-red-300">{fmt(snap.portfolioFees)}</span></span>
                          <span>Mortgage total: <span className="text-slate-200">{fmt(snap.mortgageTotal)}</span></span>
                          <span>Mortgage (CPF): <span className="text-slate-200">{fmt(snap.mortgageCPF)}</span></span>
                          <span>Safe withdrawal: <span className="text-slate-200">{fmt(snap.safeWithdrawal)}</span></span>
                          <span>CPF OA: <span className="text-blue-300">{fmt(snap.cpfOA)}</span></span>
                          <span>CPF SA: <span className="text-blue-300">{fmt(snap.cpfSA)}</span></span>
                          <span>CPF MA: <span className="text-blue-300">{fmt(snap.cpfMA)}</span></span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
