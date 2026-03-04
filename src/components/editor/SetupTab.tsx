import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { NumberInput } from '../ui/NumberInput'
import { CurrencyInput } from '../ui/CurrencyInput'
import { ScenarioRateInput } from '../ui/ScenarioRateInput'

export function SetupTab() {
  const { plan, updateTimeline, updateStartingBalances, updateInflation } = usePlanStore()
  const { timeline, startingBalances, inflation } = plan

  const totalAssets = startingBalances.cash + startingBalances.portfolio
    + startingBalances.cpfOA + startingBalances.cpfSA + startingBalances.cpfMA

  return (
    <>
      <SectionCard title="Planning Horizon">
        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label="Current Age"
            value={timeline.currentAge}
            onChange={v => updateTimeline({ currentAge: v })}
            min={18} max={80}
          />
          <NumberInput
            label="Retirement Age"
            value={timeline.retirementAge}
            onChange={v => updateTimeline({ retirementAge: v })}
            min={timeline.currentAge + 1} max={85}
          />
          <NumberInput
            label="Plan Until Age"
            value={timeline.endAge}
            onChange={v => updateTimeline({ endAge: v })}
            min={timeline.retirementAge + 1} max={120}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500 flex gap-4">
          <span>Working years: <span className="text-slate-300">{timeline.retirementAge - timeline.currentAge}</span></span>
          <span>Retirement years: <span className="text-slate-300">{timeline.endAge - timeline.retirementAge}</span></span>
          <span>Total horizon: <span className="text-slate-300">{timeline.endAge - timeline.currentAge}</span></span>
        </div>
      </SectionCard>

      <SectionCard title="Starting Balances">
        <div className="grid grid-cols-2 gap-2">
          <CurrencyInput label="Cash / Savings" value={startingBalances.cash}
            onChange={v => updateStartingBalances({ cash: v })} />
          <CurrencyInput label="Investment Portfolio" value={startingBalances.portfolio}
            onChange={v => updateStartingBalances({ portfolio: v })} />
          <CurrencyInput label="CPF Ordinary Account" value={startingBalances.cpfOA}
            onChange={v => updateStartingBalances({ cpfOA: v })} />
          <CurrencyInput label="CPF Special Account" value={startingBalances.cpfSA}
            onChange={v => updateStartingBalances({ cpfSA: v })} />
          <CurrencyInput label="CPF Medisave Account" value={startingBalances.cpfMA}
            onChange={v => updateStartingBalances({ cpfMA: v })} />
          <CurrencyInput label="Outstanding Mortgage" value={startingBalances.mortgagePrincipal}
            onChange={v => updateStartingBalances({ mortgagePrincipal: v })} />
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between text-xs">
          <span className="text-slate-500">Total starting assets</span>
          <span className="text-white font-medium">${totalAssets.toLocaleString()}</span>
        </div>
      </SectionCard>

      <SectionCard title="Inflation Rate">
        <ScenarioRateInput
          label="Annual inflation rate"
          value={inflation}
          onChange={updateInflation}
          isInflationStyle
          hint="Pessimistic = high inflation. Optimistic = low inflation."
        />
      </SectionCard>
    </>
  )
}
