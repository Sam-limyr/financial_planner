import { useState } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { usePlanStore } from '../../store/planStore'
import type { YearSnapshot } from '../../types/simulation'

type Metric = 'netWorth' | 'portfolio' | 'totalCPF'

const METRIC_LABELS: Record<Metric, string> = {
  netWorth: 'Net Worth',
  portfolio: 'Portfolio',
  totalCPF: 'CPF Total',
}

function fmtK(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000)    return `$${Math.round(v / 1_000)}k`
  return `$${v.toFixed(0)}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded p-2.5 text-xs shadow-xl">
      <p className="text-slate-300 mb-1.5 font-medium">Age {label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-medium">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const clamp = (v: number) => Math.max(1, v)

export function TrajectoryChart() {
  const { result, plan } = usePlanStore()
  const [metric, setMetric] = useState<Metric>('netWorth')
  const [logScale, setLogScale] = useState(false)

  // Merge three scenarios into one data array keyed by age
  const data = result.base.snapshots.map((snap, i) => {
    const opt = result.optimistic.snapshots[i]
    const pess = result.pessimistic.snapshots[i]
    const row = {
      age: snap.age,
      Optimistic: opt?.[metric] ?? 0,
      Base: snap[metric] as number,
      Pessimistic: pess?.[metric] ?? 0,
    }
    return logScale
      ? { ...row, Optimistic: clamp(row.Optimistic), Base: clamp(row.Base), Pessimistic: clamp(row.Pessimistic) }
      : row
  })

  const hasNonPositive = logScale && result.base.snapshots.some(s => (s[metric] as number) <= 0)

  const mortgagePayoffAge = plan.mortgage.enabled
    ? plan.mortgage.startAge + plan.mortgage.tenureYears
    : null

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-200">Portfolio Trajectory</h2>
        <div className="flex items-center gap-1">
          {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                metric === m ? 'bg-fire-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-600 mx-1" />
          <button
            onClick={() => setLogScale(v => !v)}
            className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
              logScale ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {logScale ? 'Log' : 'Lin'}
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="age"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            scale={logScale ? 'log' : 'linear'}
            domain={logScale ? [1, 'auto'] : ['auto', 'auto']}
            allowDataOverflow
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtK}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area type="monotone" dataKey="Optimistic" stroke="#10b981" strokeWidth={1.5}
            strokeDasharray="4 2" fill="url(#gradOpt)" dot={false} />
          <Area type="monotone" dataKey="Base" stroke="#f97316" strokeWidth={2}
            fill="url(#gradBase)" dot={false} />
          <Area type="monotone" dataKey="Pessimistic" stroke="#ef4444" strokeWidth={1.5}
            strokeDasharray="4 2" fill="url(#gradPess)" dot={false} />

          <ReferenceLine x={plan.timeline.retirementAge} stroke="#64748b" strokeDasharray="3 3"
            label={{ value: 'Retirement', position: 'top', fill: '#64748b', fontSize: 10 }} />
          {mortgagePayoffAge && mortgagePayoffAge <= plan.timeline.endAge && (
            <ReferenceLine x={mortgagePayoffAge} stroke="#3b82f6" strokeDasharray="3 3"
              label={{ value: 'Mortgage off', position: 'top', fill: '#3b82f6', fontSize: 10 }} />
          )}
          <ReferenceLine y={0} stroke="#ef4444" strokeOpacity={0.4} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-2 text-xs text-slate-500 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 inline-block" />Optimistic</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-fire-500 inline-block" />Base</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-red-500 inline-block" />Pessimistic</span>
      </div>
      {hasNonPositive && (
        <p className="text-[10px] text-amber-500 text-center mt-1">
          Values ≤ 0 are clamped to 1 in log view.
        </p>
      )}
    </div>
  )
}
