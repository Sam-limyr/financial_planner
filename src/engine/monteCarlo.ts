import type { Plan } from '../types/plan'
import type { MonteCarloResult } from '../types/simulation'
import { simulateForMC } from './simulate'

// Box-Muller transform: samples from Normal(mean, stdDev)
function sampleNormal(mean: number, stdDev: number): number {
  let u1 = 0, u2 = 0
  while (u1 === 0) u1 = Math.random()
  while (u2 === 0) u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z * stdDev
}

// Linear interpolation percentile on a pre-sorted array
function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export function runMonteCarlo(plan: Plan): MonteCarloResult {
  const mc = plan.monteCarlo
  if (!mc?.enabled) {
    return { years: [], percentiles: [], successRate: 0 }
  }

  const { iterations, annualReturnMean, annualReturnStdDev, percentiles } = mc
  const { timeline } = plan
  const nYears = timeline.endAge - timeline.currentAge + 1

  // Collect netWorth values at each year index across all iterations
  const netWorthByYear: number[][] = Array.from({ length: nYears }, () => [])
  let successCount = 0

  for (let i = 0; i < iterations; i++) {
    const yearData = simulateForMC(
      plan,
      () => sampleNormal(annualReturnMean, annualReturnStdDev),
    )
    let depleted = false
    yearData.forEach(({ netWorth }, j) => {
      netWorthByYear[j].push(netWorth)
      if (netWorth <= 0) depleted = true
    })
    if (!depleted) successCount++
  }

  // Sort each year's values ascending for percentile computation
  netWorthByYear.forEach(arr => arr.sort((a, b) => a - b))

  const years = netWorthByYear.map((sorted, j) => ({
    age: timeline.currentAge + j,
    percentileValues: Object.fromEntries(
      percentiles.map(p => [p, computePercentile(sorted, p)])
    ) as Record<number, number>,
  }))

  return {
    years,
    percentiles,
    successRate: successCount / iterations,
  }
}
