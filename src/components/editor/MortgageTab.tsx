import { useMemo } from 'react'
import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { CurrencyInput } from '../ui/CurrencyInput'
import { NumberInput } from '../ui/NumberInput'
import { Toggle } from '../ui/Toggle'
import { buildAmortizationTable } from '../../engine/mortgage'

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString()
}

export function MortgageTab() {
  const { plan, updateMortgage } = usePlanStore()
  const { mortgage, cpf } = plan

  const table = useMemo(() => buildAmortizationTable(mortgage), [mortgage])

  const totalInterest = table.reduce((s, r) => s + r.interest, 0)
  const totalPayments = table.reduce((s, r) => s + r.payment, 0)

  return (
    <>
      <SectionCard title="Mortgage">
        <div className="space-y-3">
          <Toggle
            label="Enable mortgage"
            checked={mortgage.enabled}
            onChange={v => updateMortgage({ enabled: v })}
          />

          {mortgage.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <CurrencyInput label="Loan Principal" value={mortgage.principal}
                  onChange={v => updateMortgage({ principal: v })} />
                <NumberInput label="Start Age" value={mortgage.startAge}
                  onChange={v => updateMortgage({ startAge: v })} />
                <NumberInput label="Annual Interest Rate %" value={+(mortgage.annualInterestRate * 100).toFixed(2)}
                  step={0.05} onChange={v => updateMortgage({ annualInterestRate: v / 100 })} />
                <NumberInput label="Tenure (years)" value={mortgage.tenureYears}
                  onChange={v => updateMortgage({ tenureYears: v })} min={1} />
              </div>

              {table.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-700/50 rounded p-2">
                    <div className="text-slate-400">Annual Payment</div>
                    <div className="text-white font-medium">{fmt(table[0]?.payment ?? 0)}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <div className="text-slate-400">Total Interest</div>
                    <div className="text-red-400 font-medium">{fmt(totalInterest)}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <div className="text-slate-400">Total Cost</div>
                    <div className="text-white font-medium">{fmt(totalPayments)}</div>
                  </div>
                </div>
              )}

              {cpf.enabled && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-400">CPF-OA fraction of payment</label>
                    <span className="text-xs text-fire-400 font-medium">{Math.round(mortgage.cpfOAFraction * 100)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={Math.round(mortgage.cpfOAFraction * 100)}
                    onChange={e => updateMortgage({ cpfOAFraction: Number(e.target.value) / 100 })}
                    className="w-full accent-fire-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {fmt((table[0]?.payment ?? 0) * mortgage.cpfOAFraction)}/yr from CPF-OA,{' '}
                    {fmt((table[0]?.payment ?? 0) * (1 - mortgage.cpfOAFraction))}/yr from portfolio.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {mortgage.enabled && table.length > 0 && (
        <SectionCard title="Amortization Schedule">
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left py-1 pr-2">Yr</th>
                  <th className="text-right py-1 pr-2">Payment</th>
                  <th className="text-right py-1 pr-2">Principal</th>
                  <th className="text-right py-1 pr-2">Interest</th>
                  <th className="text-right py-1">Balance</th>
                </tr>
              </thead>
              <tbody>
                {table.map(row => (
                  <tr key={row.year} className="border-b border-slate-700/30 text-slate-300">
                    <td className="py-0.5 pr-2">{row.year + 1}</td>
                    <td className="text-right pr-2">{fmt(row.payment)}</td>
                    <td className="text-right pr-2 text-emerald-400">{fmt(row.principal)}</td>
                    <td className="text-right pr-2 text-red-400">{fmt(row.interest)}</td>
                    <td className="text-right">{fmt(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  )
}
