import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { usePlanStore } from '../../store/planStore'
import { createDefaultPlan } from '../../store/defaultPlan'

const DEFAULT_MC = createDefaultPlan().monteCarlo!

function fmtK(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000)    return `$${Math.round(v / 1_000)}k`
  return `$${v.toFixed(0)}`
}

// p50: heavy yellow (median hero). p25/p75: solid orange/green.
// p10/p90: thin orange/green, slightly dotted. p1/p5/p95/p99: slate, fading out.
const PERCENTILE_COLOR: Record<number, string> = {
  1:  '#475569',  // slate-600
  5:  '#64748b',  // slate-500
  10: '#f97316',  // orange-500 (thin)
  25: '#f97316',  // orange-500 (solid)
  50: '#eab308',  // yellow-500 — median hero line
  75: '#22c55e',  // green-500  (solid)
  90: '#22c55e',  // green-500  (thin)
  95: '#64748b',  // slate-500
  99: '#475569',  // slate-600
}

const PERCENTILE_WIDTH: Record<number, number> = {
  1: 1, 5: 1, 10: 1, 25: 1.5, 50: 2.5, 75: 1.5, 90: 1, 95: 1, 99: 1,
}

const PERCENTILE_DASH: Record<number, string | undefined> = {
  1:  '3 5',       // dotted
  5:  '4 4',       // slightly dotted
  10: '4 3',       // light dotted
  25: undefined,   // solid
  50: undefined,   // solid
  75: undefined,   // solid
  90: '4 3',
  95: '4 4',
  99: '3 5',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  // Show highest percentile first (most optimistic at top)
  const sorted = [...payload].sort((a, b) => {
    const pa = parseInt(a.dataKey.slice(1))
    const pb = parseInt(b.dataKey.slice(1))
    return pb - pa
  })
  return (
    <div className="bg-slate-800 border border-slate-600 rounded p-2.5 text-xs shadow-xl">
      <p className="text-slate-300 mb-1.5 font-medium">Age {label}</p>
      {sorted.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.dataKey}</span>
          <span className="font-medium">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function SuccessRateBadge({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100)
  const color = pct >= 90 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400'
  return (
    <span className={`font-medium ${color}`}>{pct}% success rate</span>
  )
}

export function MonteCarloChart() {
  const { plan, monteCarloResult, triggerMonteCarlo } = usePlanStore()
  const mc = plan.monteCarlo ?? DEFAULT_MC

  if (!mc.enabled) return null

  const data = monteCarloResult?.years.map(year => ({
    age: year.age,
    ...Object.fromEntries(
      Object.entries(year.percentileValues).map(([p, v]) => [`p${p}`, v])
    ),
  })) ?? []

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Monte Carlo</h2>
          {monteCarloResult ? (
            <p className="text-xs text-slate-400 mt-0.5">
              {mc.iterations.toLocaleString()} iterations ·{' '}
              Normal({(mc.annualReturnMean * 100).toFixed(1)}%, σ={( mc.annualReturnStdDev * 100).toFixed(1)}%) ·{' '}
              <SuccessRateBadge rate={monteCarloResult.successRate} />
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">
              {mc.iterations.toLocaleString()} iterations ·{' '}
              Normal({(mc.annualReturnMean * 100).toFixed(1)}%, σ={( mc.annualReturnStdDev * 100).toFixed(1)}%)
            </p>
          )}
        </div>
        <button
          onClick={triggerMonteCarlo}
          className="text-xs px-3 py-1.5 rounded bg-fire-600 text-white hover:bg-fire-500 transition-colors font-medium shrink-0"
        >
          {monteCarloResult ? 'Re-run' : 'Run Simulation'}
        </button>
      </div>

      {!monteCarloResult ? (
        <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-slate-500">
          <p className="text-sm">No simulation data yet.</p>
          <p className="text-xs">
            Click <span className="text-white">Run Simulation</span> to generate {mc.iterations.toLocaleString()} iterations.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="age"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtK}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={plan.timeline.retirementAge}
                stroke="#64748b"
                strokeDasharray="3 3"
                label={{ value: 'Retirement', position: 'top', fill: '#64748b', fontSize: 10 }}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeOpacity={0.4} />
              {monteCarloResult.percentiles.map(p => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={`p${p}`}
                  name={`p${p}`}
                  stroke={PERCENTILE_COLOR[p] ?? '#94a3b8'}
                  strokeWidth={PERCENTILE_WIDTH[p] ?? 1}
                  strokeDasharray={PERCENTILE_DASH[p]}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="flex gap-3 mt-2 text-[10px] text-slate-500 flex-wrap justify-center">
            {[...monteCarloResult.percentiles].reverse().map(p => (
              <span key={p} className="flex items-center gap-1">
                <span
                  className="w-5 inline-block rounded-sm"
                  style={{
                    height: PERCENTILE_WIDTH[p] >= 2 ? '3px' : '2px',
                    backgroundColor: PERCENTILE_COLOR[p] ?? '#94a3b8',
                  }}
                />
                <span style={{ color: PERCENTILE_COLOR[p] ?? '#94a3b8' }}>p{p}</span>
              </span>
            ))}
          </div>

          <p className="text-[10px] text-slate-600 text-center mt-1">
            Success = net worth stays positive throughout. Re-run after changing plan inputs.
          </p>
        </>
      )}
    </div>
  )
}
