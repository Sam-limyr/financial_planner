interface Props {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}

export function Toggle({ label, checked, onChange, hint }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm text-slate-300">{label}</span>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-fire-500' : 'bg-slate-600'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}
