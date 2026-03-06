import { useState } from 'react'

// ── Layout constants (matches the fixed app structure) ─────────────────────
const EDITOR_W = 380   // EditorPanel fixed width
const HEADER_H = 44    // Header bar height (py-2.5 + content)
// Tab bar has 2 rows of buttons (8px padding top/bottom, ~28px per row, 1px gap)
const TAB_BAR_H = 76   // approximate: 8 + 28 + 1 + 28 + 8 + border = ~76px
const CONTENT_TOP = HEADER_H + TAB_BAR_H  // y where editor content begins

interface Step {
  title: string
  body: string
  // Fixed-position box to spotlight
  spot: { left: number | string; top: number | string; width: number | string; height: number | string }
  // Fixed-position top-left of the tooltip box
  tip: { left?: number | string; top?: number | string; right?: number | string; bottom?: number | string }
  // Which side of the tooltip box the CSS arrow is attached to (pointing toward spotlight)
  arrow: 'left' | 'right' | 'top' | 'bottom' | 'none'
}

const STEPS: Step[] = [
  {
    title: 'Plan editor',
    body: 'Everything on the left is your plan editor. Work through the tabs to build your full financial model — income, expenses, investments, CPF, mortgage, and life events.',
    spot: { left: 0, top: HEADER_H, width: EDITOR_W, height: `calc(100vh - ${HEADER_H}px)` },
    tip: { left: EDITOR_W + 20, top: `calc(50vh - 80px)` },
    arrow: 'left',
  },
  {
    title: 'Setup: timeline & starting balances',
    body: 'Start in the Setup tab. Set your current age, retirement age, and plan end age, then enter starting balances for cash, portfolio, and CPF accounts. The total assets figure updates as you type.',
    spot: { left: 0, top: HEADER_H, width: EDITOR_W, height: TAB_BAR_H },
    tip: { left: EDITOR_W + 20, top: HEADER_H },
    arrow: 'left',
  },
  {
    title: 'Income, expenses & investments',
    body: 'Fill in the Income tab to model your career phases (growth, plateau, taper). Add recurring expenses in Expenses, configure portfolio growth rates in Investments, and set up CPF contributions in CPF.',
    spot: { left: 0, top: HEADER_H, width: EDITOR_W, height: TAB_BAR_H },
    tip: { left: EDITOR_W + 20, top: HEADER_H },
    arrow: 'left',
  },
  {
    title: 'Events & recurring contributions',
    body: 'The Events tab handles one-time lump sums — inheritance, property sale, large purchases — and recurring contributions such as rental income, a side business, or structured drawdowns. Negative amounts are outflows.',
    spot: { left: 0, top: HEADER_H, width: EDITOR_W, height: TAB_BAR_H },
    tip: { left: EDITOR_W + 20, top: HEADER_H },
    arrow: 'left',
  },
  {
    title: 'Monte Carlo simulation',
    body: 'The Monte Carlo tab lets you model market volatility. Pick a return distribution preset (e.g. Global Stocks) and run thousands of randomly sampled scenarios to reveal the full range of possible futures.',
    spot: { left: 0, top: HEADER_H, width: EDITOR_W, height: TAB_BAR_H },
    tip: { left: EDITOR_W + 20, top: HEADER_H },
    arrow: 'left',
  },
  {
    title: 'Summary cards',
    body: 'Live results appear on the right. The summary cards show your key milestones: retirement balance, peak net worth, final balance, and depletion age — each with optimistic and pessimistic variants.',
    spot: { left: EDITOR_W + 4, top: HEADER_H, width: `calc(100vw - ${EDITOR_W + 4}px)`, height: 130 },
    tip: { right: 20, top: HEADER_H + 140 },
    arrow: 'top',
  },
  {
    title: 'Trajectory chart',
    body: 'The trajectory chart plots net worth over time across all three scenarios. Switch between Net Worth, Portfolio, CPF, and Cash using the metric buttons. Toggle Lin / Log scale for better early-growth visibility.',
    spot: { left: EDITOR_W + 4, top: HEADER_H + 134, width: `calc(100vw - ${EDITOR_W + 4}px)`, height: 320 },
    tip: { right: 20, top: HEADER_H + 464 },
    arrow: 'top',
  },
  {
    title: 'Monte Carlo fan chart',
    body: 'Click Run Simulation to generate the fan chart. Bands span p1 → p99 (not all shown by default). The yellow p50 line is the median outcome. The success rate badge shows the fraction of runs where net worth never hit zero. Click the expand icon for a fullscreen view.',
    spot: { left: EDITOR_W + 4, top: HEADER_H + 458, width: `calc(100vw - ${EDITOR_W + 4}px)`, height: 340 },
    tip: { right: 20, bottom: 20 },
    arrow: 'bottom',
  },
  {
    title: 'Import & export',
    body: 'Saves manages storage of named plans in the browser — useful for quick comparisons, but lost if you clear browser data. For long-term storage, use Export to save a JSON file to your computer and Import to restore it. Your active plan auto-saves to the browser on every change.',
    spot: { left: `calc(100vw - 300px)`, top: 0, width: 300, height: HEADER_H },
    tip: { right: 20, top: HEADER_H + 10 },
    arrow: 'top',
  },
]

interface ArrowProps {
  side: Step['arrow']
}

function Arrow({ side }: ArrowProps) {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
  }

  if (side === 'left') return (
    <div style={{
      ...base,
      left: -9,
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '9px solid transparent',
      borderBottom: '9px solid transparent',
      borderRight: '9px solid #0f172a',
    }} />
  )

  if (side === 'right') return (
    <div style={{
      ...base,
      right: -9,
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '9px solid transparent',
      borderBottom: '9px solid transparent',
      borderLeft: '9px solid #0f172a',
    }} />
  )

  if (side === 'top') return (
    <div style={{
      ...base,
      top: -9,
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '9px solid transparent',
      borderRight: '9px solid transparent',
      borderBottom: '9px solid #0f172a',
    }} />
  )

  if (side === 'bottom') return (
    <div style={{
      ...base,
      bottom: -9,
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '9px solid transparent',
      borderRight: '9px solid transparent',
      borderTop: '9px solid #0f172a',
    }} />
  )

  return null
}

interface HelpTourProps {
  onClose: () => void
}

export function HelpTour({ onClose }: HelpTourProps) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const advance = () => {
    if (isLast) onClose()
    else setStep(s => s + 1)
  }

  return (
    // Full-screen click catcher
    <div
      className="fixed inset-0 z-50 cursor-pointer select-none"
      onClick={advance}
    >
      {/* Spotlight: box-shadow punches a "hole" in the dark overlay */}
      <div
        className="fixed rounded-lg pointer-events-none"
        style={{
          left: current.spot.left,
          top: current.spot.top,
          width: current.spot.width,
          height: current.spot.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.70)',
          border: '2px solid rgba(251, 191, 36, 0.85)',
          transition: 'all 0.2s ease',
        }}
      />

      {/* Tooltip box */}
      <div
        className="fixed bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl p-4 pointer-events-none"
        style={{
          ...current.tip,
          width: 280,
          transition: 'all 0.2s ease',
        }}
      >
        <Arrow side={current.arrow} />

        <p className="text-[10px] font-medium text-amber-400/70 uppercase tracking-widest mb-1">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="text-sm font-semibold text-amber-400 leading-snug">
          {current.title}
        </h3>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
          {current.body}
        </p>

        {/* Progress dots */}
        <div className="flex gap-1 mt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 16 : 6,
                height: 6,
                background: i === step ? 'rgba(251,191,36,0.9)' : 'rgba(100,116,139,0.5)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Corner hint */}
      <div className="fixed bottom-4 right-4 pointer-events-none">
        <p className="text-xs text-slate-500 bg-slate-900/80 rounded px-3 py-1.5 border border-slate-700/50">
          {isLast ? 'Click anywhere to close' : 'Click anywhere to advance'}
        </p>
      </div>
    </div>
  )
}
