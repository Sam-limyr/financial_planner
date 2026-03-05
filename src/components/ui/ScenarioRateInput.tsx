import { useState, useEffect } from 'react'
import type { ScenarioRate } from '../../types/plan'

interface Props {
  label: string
  value: ScenarioRate
  onChange: (r: ScenarioRate) => void
  isInflationStyle?: boolean
  hint?: string
}

const SCENARIOS = ['optimistic', 'base', 'pessimistic'] as const

export function ScenarioRateInput({ label, value, onChange, hint }: Props) {
  const toDisplay = (raw: number) => String(+(raw * 100).toFixed(2))

  const [locals, setLocals] = useState<Record<typeof SCENARIOS[number], string>>({
    optimistic: toDisplay(value.optimistic),
    base: toDisplay(value.base),
    pessimistic: toDisplay(value.pessimistic),
  })

  useEffect(() => {
    setLocals({
      optimistic: toDisplay(value.optimistic),
      base: toDisplay(value.base),
      pessimistic: toDisplay(value.pessimistic),
    })
  }, [value.optimistic, value.base, value.pessimistic])

  const handleChange = (scenario: typeof SCENARIOS[number], str: string) => {
    setLocals(prev => ({ ...prev, [scenario]: str }))
    const parsed = parseFloat(str)
    if (!isNaN(parsed)) onChange({ ...value, [scenario]: parsed / 100 })
  }

  const handleBlur = (scenario: typeof SCENARIOS[number]) => {
    const parsed = parseFloat(locals[scenario])
    const norm = isNaN(parsed) ? 0 : parsed
    onChange({ ...value, [scenario]: norm / 100 })
    setLocals(prev => ({ ...prev, [scenario]: String(norm) }))
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="grid grid-cols-3 gap-1.5">
        {SCENARIOS.map((scenario) => (
          <div key={scenario}>
            <div className={`text-[10px] mb-0.5 font-medium ${
              scenario === 'optimistic' ? 'text-emerald-400' :
              scenario === 'pessimistic' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
            </div>
            <div className="flex items-center bg-slate-700 rounded border border-slate-600 focus-within:border-fire-500 transition-colors">
              <input
                type="text"
                inputMode="decimal"
                value={locals[scenario]}
                onChange={e => handleChange(scenario, e.target.value)}
                onBlur={() => handleBlur(scenario)}
                className="w-full bg-transparent text-white text-sm py-1 px-2 outline-none"
              />
              <span className="pr-1.5 text-slate-400 text-xs">%</span>
            </div>
          </div>
        ))}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
