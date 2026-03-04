import type { GrowthConfig, Scenario, AllocationPeriod } from '../types/plan'

export function resolveGrowthRate(
  age: number,
  config: GrowthConfig,
  scenario: Scenario,
): number {
  if (config.mode === 'direct') {
    return config.directRate[scenario]
  }

  // Find the last allocation period whose startAge <= currentAge
  const sorted = [...config.allocationPeriods].sort((a, b) => a.startAge - b.startAge)
  let period: AllocationPeriod | undefined
  for (const p of sorted) {
    if (age >= p.startAge) period = p
    else break
  }

  if (!period) period = sorted[0]
  if (!period) return config.directRate[scenario] // fallback

  const eq = period.equityFraction
  const bd = 1 - eq
  return eq * config.equityRate[scenario] + bd * config.bondRate[scenario]
}
