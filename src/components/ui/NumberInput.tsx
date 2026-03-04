interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  step?: number
  min?: number
  max?: number
  hint?: string
  className?: string
}

export function NumberInput({ label, value, onChange, suffix, step = 1, min, max, hint, className = '' }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center bg-slate-700 rounded border border-slate-600 focus-within:border-fire-500 transition-colors">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent text-white text-sm py-1.5 px-2 outline-none min-w-0"
        />
        {suffix && <span className="px-2 text-slate-400 text-sm select-none">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
