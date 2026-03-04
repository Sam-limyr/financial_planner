interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  className?: string
}

export function Select<T extends string>({ label, value, options, onChange, className = '' }: Props<T>) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-slate-400">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="bg-slate-700 border border-slate-600 rounded text-white text-sm py-1.5 px-2 outline-none focus:border-fire-500 transition-colors"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
