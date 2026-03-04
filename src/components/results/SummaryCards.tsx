import { usePlanStore } from '../../store/planStore'

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)    return `$${Math.round(n / 1_000)}k`
  return `$${Math.round(n)}`
}

interface CardProps {
  label: string
  base: string
  optimistic: string
  pessimistic: string
  baseColor?: string
}

function Card({ label, base, optimistic, pessimistic, baseColor = 'text-white' }: CardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-3 flex-1 min-w-0">
      <div className="text-xs text-slate-400 mb-1.5">{label}</div>
      <div className={`text-lg font-bold ${baseColor} leading-none mb-1`}>{base}</div>
      <div className="flex gap-2 text-xs">
        <span className="text-emerald-400">{optimistic}</span>
        <span className="text-slate-600">·</span>
        <span className="text-red-400">{pessimistic}</span>
      </div>
    </div>
  )
}

export function SummaryCards() {
  const { result, plan } = usePlanStore()
  const { optimistic, base, pessimistic } = result

  const depletionText = (age: number | null) =>
    age === null ? 'Never' : `Age ${age}`

  const balanceColor = base.retirementBalance >= 0 ? 'text-white' : 'text-red-400'
  const finalColor = base.finalNetWorth >= 0 ? 'text-white' : 'text-red-400'

  return (
    <div className="flex gap-2 flex-wrap">
      <Card
        label={`Retirement Balance (age ${plan.timeline.retirementAge})`}
        base={fmt(base.retirementBalance)}
        optimistic={fmt(optimistic.retirementBalance)}
        pessimistic={fmt(pessimistic.retirementBalance)}
        baseColor={balanceColor}
      />
      <Card
        label={`Final Net Worth (age ${plan.timeline.endAge})`}
        base={fmt(base.finalNetWorth)}
        optimistic={fmt(optimistic.finalNetWorth)}
        pessimistic={fmt(pessimistic.finalNetWorth)}
        baseColor={finalColor}
      />
      <Card
        label="Portfolio Depletion Age"
        base={depletionText(base.depletionAge)}
        optimistic={optimistic.depletionAge === null ? 'Never' : `Age ${optimistic.depletionAge}`}
        pessimistic={pessimistic.depletionAge === null ? 'Never' : `Age ${pessimistic.depletionAge}`}
        baseColor={base.depletionAge === null ? 'text-emerald-400' : 'text-red-400'}
      />
      <Card
        label="Peak Net Worth"
        base={fmt(base.peakNetWorth)}
        optimistic={fmt(optimistic.peakNetWorth)}
        pessimistic={fmt(pessimistic.peakNetWorth)}
      />
    </div>
  )
}
