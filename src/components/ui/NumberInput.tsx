import { useState, useEffect } from 'react'

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

export function NumberInput({ label, value, onChange, suffix, min, max, hint, className = '' }: Props) {
  const [localValue, setLocalValue] = useState(String(value))

  useEffect(() => {
    const parsed = parseFloat(localValue)
    if (isNaN(parsed) || parsed !== value) setLocalValue(String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value
    setLocalValue(str)
    const parsed = parseFloat(str)
    if (!isNaN(parsed)) {
      onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed)))
    }
  }

  const handleBlur = () => {
    const parsed = parseFloat(localValue)
    const norm = isNaN(parsed)
      ? (min ?? 0)
      : Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed))
    onChange(norm)
    setLocalValue(String(norm))
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center bg-slate-700 rounded border border-slate-600 focus-within:border-fire-500 transition-colors">
        <input
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="flex-1 bg-transparent text-white text-sm py-1.5 px-2 outline-none min-w-0"
        />
        {suffix && <span className="px-2 text-slate-400 text-sm select-none">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
