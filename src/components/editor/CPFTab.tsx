import { usePlanStore } from '../../store/planStore'
import { SectionCard } from '../ui/SectionCard'
import { NumberInput } from '../ui/NumberInput'
import { Toggle } from '../ui/Toggle'

const CPF_STATUTORY_PREVIEW = [
  { age: '≤35',  employee: '20%', employer: '17%', oa: '62.2%', sa: '16.2%', ma: '21.6%' },
  { age: '36–45', employee: '20%', employer: '17%', oa: '56.1%', sa: '21.7%', ma: '22.2%' },
  { age: '46–50', employee: '20%', employer: '17%', oa: '51.5%', sa: '26.0%', ma: '22.5%' },
  { age: '51–55', employee: '20%', employer: '15%', oa: '31.5%', sa: '41.5%', ma: '27.0%' },
  { age: '56–60', employee: '13%', employer: '11.5%', oa: '35.4%', sa: '30.6%', ma: '34.0%' },
  { age: '61–65', employee: '7.5%', employer: '9%',  oa: '22.7%', sa: '18.7%', ma: '58.6%' },
  { age: '>65',   employee: '5%',   employer: '7.5%', oa: '20.0%', sa: '10.5%', ma: '69.5%' },
]

export function CPFTab() {
  const { plan, updateCPF } = usePlanStore()
  const { cpf } = plan

  return (
    <>
      <SectionCard title="CPF Settings">
        <div className="space-y-3">
          <Toggle
            label="Enable CPF simulation"
            checked={cpf.enabled}
            onChange={v => updateCPF({ enabled: v })}
            hint="Models Singapore CPF contributions and interest accrual."
          />

          {cpf.enabled && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Interest Rates</p>
                <div className="grid grid-cols-3 gap-2">
                  <NumberInput label="OA Rate %" value={+(cpf.interestRates.OA * 100).toFixed(2)} step={0.1}
                    onChange={v => updateCPF({ interestRates: { ...cpf.interestRates, OA: v / 100 } })} />
                  <NumberInput label="SA Rate %" value={+(cpf.interestRates.SA * 100).toFixed(2)} step={0.1}
                    onChange={v => updateCPF({ interestRates: { ...cpf.interestRates, SA: v / 100 } })} />
                  <NumberInput label="MA Rate %" value={+(cpf.interestRates.MA * 100).toFixed(2)} step={0.1}
                    onChange={v => updateCPF({ interestRates: { ...cpf.interestRates, MA: v / 100 } })} />
                </div>
              </div>

              <Toggle
                label="Use Singapore statutory contribution rates"
                checked={cpf.useStatutoryRates}
                onChange={v => updateCPF({ useStatutoryRates: v })}
              />

              {!cpf.useStatutoryRates && (
                <div className="space-y-2 pl-2 border-l-2 border-slate-600">
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput label="Employee Rate %" value={+(cpf.customRates.employeeRate * 100).toFixed(1)} step={0.5}
                      onChange={v => updateCPF({ customRates: { ...cpf.customRates, employeeRate: v / 100 } })} />
                    <NumberInput label="Employer Rate %" value={+(cpf.customRates.employerRate * 100).toFixed(1)} step={0.5}
                      onChange={v => updateCPF({ customRates: { ...cpf.customRates, employerRate: v / 100 } })} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <NumberInput label="OA Alloc %" value={+(cpf.customRates.oaAllocation * 100).toFixed(1)} step={0.5}
                      onChange={v => updateCPF({ customRates: { ...cpf.customRates, oaAllocation: v / 100 } })} />
                    <NumberInput label="SA Alloc %" value={+(cpf.customRates.saAllocation * 100).toFixed(1)} step={0.5}
                      onChange={v => updateCPF({ customRates: { ...cpf.customRates, saAllocation: v / 100 } })} />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">MA Alloc %</label>
                      <div className="bg-slate-700/50 rounded border border-slate-700 px-2 py-1.5 text-sm text-slate-400">
                        {(Math.max(0, 1 - cpf.customRates.oaAllocation - cpf.customRates.saAllocation) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {cpf.enabled && cpf.useStatutoryRates && (
        <SectionCard title="Statutory Rates Reference">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-slate-400">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left py-1 pr-1">Age</th>
                  <th className="text-right py-1 pr-1">Emp.</th>
                  <th className="text-right py-1 pr-1">Empr.</th>
                  <th className="text-right py-1 pr-1">OA</th>
                  <th className="text-right py-1 pr-1">SA</th>
                  <th className="text-right py-1">MA</th>
                </tr>
              </thead>
              <tbody>
                {CPF_STATUTORY_PREVIEW.map(row => (
                  <tr key={row.age} className="border-b border-slate-700/50">
                    <td className="py-1 pr-1 text-slate-300">{row.age}</td>
                    <td className="text-right py-1 pr-1">{row.employee}</td>
                    <td className="text-right py-1 pr-1">{row.employer}</td>
                    <td className="text-right py-1 pr-1">{row.oa}</td>
                    <td className="text-right py-1 pr-1">{row.sa}</td>
                    <td className="text-right py-1">{row.ma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  )
}
