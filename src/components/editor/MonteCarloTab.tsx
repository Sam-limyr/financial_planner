import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { NumberInput } from '../ui/NumberInput'
import { Toggle } from '../ui/Toggle'
import { createDefaultPlan } from '../../store/defaultPlan'

const DEFAULT_MC = createDefaultPlan().monteCarlo!

const ALL_PERCENTILES = [1, 5, 10, 25, 50, 75, 90, 95, 99]

const PRESETS = [
  { label: 'Global Stocks', mean: 0.10, stdDev: 0.15,
    hint: '~10% nominal return, 15% annual volatility (MSCI World historical)' },
  { label: 'Global Bonds', mean: 0.04, stdDev: 0.06,
    hint: '~4% nominal return, 6% annual volatility (global aggregate bond index)' },
  { label: '60/40 Blend', mean: 0.076, stdDev: 0.10,
    hint: '~7.6% nominal return, 10% volatility (60% stocks / 40% bonds)' },
  { label: 'Conservative', mean: 0.05, stdDev: 0.08,
    hint: '~5% nominal return, 8% volatility (40% stocks / 60% bonds)' },
]

export function MonteCarloTab() {
  const { plan, updateMonteCarlo } = usePlanStore()
  const mc = plan.monteCarlo ?? DEFAULT_MC

  const togglePercentile = (p: number) => {
    const next = mc.percentiles.includes(p)
      ? mc.percentiles.filter(x => x !== p)
      : [...mc.percentiles, p].sort((a, b) => a - b)
    if (next.length > 0) updateMonteCarlo({ percentiles: next })
  }

  return (
    <>
      <SectionCard title="Monte Carlo Simulation">
        <div className="space-y-3">
          <Toggle
            label="Enable Monte Carlo mode"
            checked={mc.enabled}
            onChange={v => updateMonteCarlo({ enabled: v })}
            hint="Runs many iterations with randomly sampled annual returns to show the full range of possible portfolio outcomes."
          />

          {mc.enabled && (
            <>
              {/* ── Presets ────────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => updateMonteCarlo({ annualReturnMean: preset.mean, annualReturnStdDev: preset.stdDev })}
                      title={preset.hint}
                      className={`text-xs px-2 py-1.5 rounded text-left transition-colors ${
                        Math.abs(mc.annualReturnMean - preset.mean) < 0.001 &&
                        Math.abs(mc.annualReturnStdDev - preset.stdDev) < 0.001
                          ? 'bg-fire-700 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                      }`}
                    >
                      <span className="block font-medium">{preset.label}</span>
                      <span className="text-[10px] opacity-70">{(preset.mean * 100).toFixed(1)}% / σ{(preset.stdDev * 100).toFixed(0)}%</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Returns shown as nominal (not inflation-adjusted). Hover a preset for details.
                </p>
              </div>

              {/* ── Return distribution ────────────────────────────────── */}
              <div className="space-y-2 pt-1 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Return Distribution</p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Mean Return %"
                    value={+(mc.annualReturnMean * 100).toFixed(2)}
                    onChange={v => updateMonteCarlo({ annualReturnMean: v / 100 })}
                  />
                  <NumberInput
                    label="Volatility % (σ)"
                    value={+(mc.annualReturnStdDev * 100).toFixed(2)}
                    onChange={v => updateMonteCarlo({ annualReturnStdDev: v / 100 })}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Each year, portfolio return is sampled from Normal(mean, σ). Income, expenses, and CPF follow base scenario values.
                </p>
              </div>

              {/* ── Iterations ─────────────────────────────────────────── */}
              <div className="space-y-2 pt-1 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Simulation</p>
                <NumberInput
                  label="Iterations"
                  value={mc.iterations}
                  min={100}
                  max={5000}
                  hint="More iterations → smoother bands. 500–1000 is a good balance of accuracy and speed."
                  onChange={v => updateMonteCarlo({ iterations: Math.round(Math.max(100, Math.min(5000, v))) })}
                />
              </div>

              {/* ── Failure mode ───────────────────────────────────────── */}
              <div className="space-y-2 pt-1 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Failure Mode</p>
                <Toggle
                  label="Zero out failures"
                  checked={mc.zeroOutFailures ?? true}
                  onChange={v => updateMonteCarlo({ zeroOutFailures: v })}
                  hint="When enabled, any run that hits $0 is permanently stuck at $0 and cannot recover. Reflects realistic ruin. Enabled by default."
                />
              </div>

              {/* ── Percentile lines ───────────────────────────────────── */}
              <div className="space-y-1.5 pt-1 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Percentile Lines</p>
                <div className="flex gap-1 flex-wrap">
                  {ALL_PERCENTILES.map(p => (
                    <button
                      key={p}
                      onClick={() => togglePercentile(p)}
                      className={`text-xs px-2 py-0.5 rounded font-mono transition-colors ${
                        mc.percentiles.includes(p)
                          ? 'bg-fire-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      p{p}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  p50 = median outcome. p5/p95 = extreme tails. Click to toggle individual lines.
                </p>
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </>
  )
}
