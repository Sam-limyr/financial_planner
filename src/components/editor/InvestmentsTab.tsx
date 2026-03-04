import { useState } from 'react'
import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { ScenarioRateInput } from '../ui/ScenarioRateInput'
import { NumberInput } from '../ui/NumberInput'
import { Toggle } from '../ui/Toggle'
import { ItemList } from '../ui/ItemList'
import type { AllocationPeriod } from '../../types/plan'

export function InvestmentsTab() {
  const { plan, updateGrowthConfig, updateWithdrawalConfig, addAllocationPeriod, updateAllocationPeriod, removeAllocationPeriod } = usePlanStore()
  const { growthConfig, withdrawalConfig } = plan
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null)

  const addPeriod = () => {
    const lastAge = growthConfig.allocationPeriods.length > 0
      ? Math.max(...growthConfig.allocationPeriods.map(p => p.startAge)) + 10
      : plan.timeline.currentAge
    const p: AllocationPeriod = {
      id: crypto.randomUUID(),
      startAge: lastAge,
      equityFraction: 0.6,
    }
    addAllocationPeriod(p)
    setEditingPeriod(p.id)
  }

  const periodItems = [...growthConfig.allocationPeriods]
    .sort((a, b) => a.startAge - b.startAge)
    .map(p => ({
      id: p.id,
      label: `From age ${p.startAge}`,
      sublabel: `${Math.round(p.equityFraction * 100)}% equity / ${Math.round((1 - p.equityFraction) * 100)}% bonds`,
    }))

  return (
    <>
      <SectionCard title="Portfolio Growth">
        <div className="flex gap-2 mb-3">
          {(['direct', 'allocation'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => updateGrowthConfig({ mode })}
              className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                growthConfig.mode === mode
                  ? 'bg-fire-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'direct' ? 'Direct Rate' : 'Equity/Bond Split'}
            </button>
          ))}
        </div>

        {growthConfig.mode === 'direct' ? (
          <ScenarioRateInput
            label="Annual Portfolio Return"
            value={growthConfig.directRate}
            onChange={v => updateGrowthConfig({ directRate: v })}
            hint="Simple annual return on the full portfolio."
          />
        ) : (
          <>
            <div className="space-y-2">
              <ScenarioRateInput
                label="Equity Return Rate"
                value={growthConfig.equityRate}
                onChange={v => updateGrowthConfig({ equityRate: v })}
              />
              <ScenarioRateInput
                label="Bond Return Rate"
                value={growthConfig.bondRate}
                onChange={v => updateGrowthConfig({ bondRate: v })}
              />
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Blended rate = equity% × equity rate + bond% × bond rate</p>
            </div>
          </>
        )}
      </SectionCard>

      {growthConfig.mode === 'allocation' && (
        <SectionCard title="Allocation Periods">
          <p className="text-xs text-slate-500 mb-2">Define how equity/bond split changes over your life.</p>
          <ItemList
            items={periodItems}
            editingId={editingPeriod}
            onEdit={setEditingPeriod}
            onDelete={removeAllocationPeriod}
            onAdd={addPeriod}
            addLabel="Add Allocation Period"
            emptyText="No allocation periods. Add one to define the split."
            renderForm={(id) => {
              const p = growthConfig.allocationPeriods.find(x => x.id === id)!
              return (
                <div className="space-y-2">
                  <NumberInput label="From Age" value={p.startAge}
                    onChange={v => updateAllocationPeriod(id, { startAge: v })} min={0} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Equity % — <span className="text-white">{Math.round(p.equityFraction * 100)}% equity / {Math.round((1 - p.equityFraction) * 100)}% bonds</span></label>
                    <input
                      type="range" min={0} max={100} step={5}
                      value={Math.round(p.equityFraction * 100)}
                      onChange={e => updateAllocationPeriod(id, { equityFraction: Number(e.target.value) / 100 })}
                      className="accent-fire-500"
                    />
                  </div>
                </div>
              )
            }}
          />
        </SectionCard>
      )}

      <SectionCard title="Safe Withdrawal Rate">
        <div className="space-y-3">
          <Toggle
            label="Enable safe withdrawal in retirement"
            checked={withdrawalConfig.enabled}
            onChange={v => updateWithdrawalConfig({ enabled: v })}
            hint="Withdraws a fixed % of portfolio value each year in retirement."
          />
          {withdrawalConfig.enabled && (
            <>
              <NumberInput
                label="Annual Withdrawal Rate %"
                value={+(withdrawalConfig.rate * 100).toFixed(2)}
                step={0.1}
                onChange={v => updateWithdrawalConfig({ rate: v / 100 })}
                hint="e.g. 4% is the classic 'safe withdrawal rate'"
              />
              <NumberInput
                label="Start Age"
                value={withdrawalConfig.startAge}
                onChange={v => updateWithdrawalConfig({ startAge: v })}
                hint="Usually your retirement age"
              />
            </>
          )}
        </div>
      </SectionCard>
    </>
  )
}
