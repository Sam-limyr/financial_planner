import type { MortgageConfig } from '../types/plan'

export interface AnnualMortgagePayment {
  year: number        // 0-indexed from loan start
  payment: number     // total annual payment
  principal: number
  interest: number
  balance: number     // remaining balance after this payment
}

export function buildAmortizationTable(config: MortgageConfig): AnnualMortgagePayment[] {
  if (!config.enabled || config.principal <= 0 || config.tenureYears <= 0) return []

  const monthlyRate = config.annualInterestRate / 12
  const n = config.tenureYears * 12
  let monthlyPayment: number

  if (monthlyRate === 0) {
    monthlyPayment = config.principal / n
  } else {
    monthlyPayment = config.principal * (monthlyRate * Math.pow(1 + monthlyRate, n))
      / (Math.pow(1 + monthlyRate, n) - 1)
  }

  const table: AnnualMortgagePayment[] = []
  let balance = config.principal

  for (let year = 0; year < config.tenureYears; year++) {
    let annualPayment = 0
    let annualPrincipal = 0
    let annualInterest = 0

    for (let m = 0; m < 12; m++) {
      const interestPortion = balance * monthlyRate
      const principalPortion = monthlyPayment - interestPortion
      annualInterest += interestPortion
      annualPrincipal += principalPortion
      annualPayment += monthlyPayment
      balance = Math.max(0, balance - principalPortion)
    }

    table.push({
      year,
      payment: annualPayment,
      principal: annualPrincipal,
      interest: annualInterest,
      balance,
    })
  }

  return table
}

export function getMortgagePayment(
  age: number,
  config: MortgageConfig,
  table: AnnualMortgagePayment[],
): { total: number; cpf: number; cash: number; balance: number } {
  if (!config.enabled) return { total: 0, cpf: 0, cash: 0, balance: 0 }

  const yearOffset = age - config.startAge
  if (yearOffset < 0 || yearOffset >= table.length) {
    return { total: 0, cpf: 0, cash: 0, balance: table[table.length - 1]?.balance ?? 0 }
  }

  const row = table[yearOffset]
  const cpf = row.payment * config.cpfOAFraction
  const cash = row.payment - cpf

  return { total: row.payment, cpf, cash, balance: row.balance }
}
