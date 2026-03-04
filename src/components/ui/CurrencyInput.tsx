interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  hint?: string
  className?: string
}

export function CurrencyInput({ label, value, onChange, prefix = '$', hint, className = '' }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center bg-slate-700 rounded border border-slate-600 focus-within:border-fire-500 transition-colors">
        <span className="px-2 text-slate-400 text-sm select-none">{prefix}</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent text-white text-sm py-1.5 pr-2 outline-none min-w-0"
        />
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
