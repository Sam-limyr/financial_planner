import type { ScenarioRate } from '../../types/plan'

interface Props {
  label: string
  value: ScenarioRate
  onChange: (r: ScenarioRate) => void
  isInflationStyle?: boolean  // if true: pessimistic is HIGH, optimistic is LOW
  hint?: string
}

export function ScenarioRateInput({ label, value, onChange, hint }: Props) {
  const update = (key: keyof ScenarioRate, raw: number) => {
    onChange({ ...value, [key]: raw / 100 })
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="grid grid-cols-3 gap-1.5">
        {(['optimistic', 'base', 'pessimistic'] as const).map((scenario) => (
          <div key={scenario}>
            <div className={`text-[10px] mb-0.5 font-medium ${
              scenario === 'optimistic' ? 'text-emerald-400' :
              scenario === 'pessimistic' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
            </div>
            <div className="flex items-center bg-slate-700 rounded border border-slate-600 focus-within:border-fire-500 transition-colors">
              <input
                type="number"
                value={+(value[scenario] * 100).toFixed(2)}
                step={0.1}
                onChange={e => update(scenario, Number(e.target.value))}
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
