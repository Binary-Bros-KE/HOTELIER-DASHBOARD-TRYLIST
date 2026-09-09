export type PlanBillingType = 'MONTHLY' | 'ONE_TIME'

export type Plan = {
  id: string
  name: string
  billingType: PlanBillingType
  currency: string
  monthlyPrice: number
  oneTimePrice: number
  annualMaintenanceFee: number
  supportLevel: string | null
  maxBranches: number
  maxUsers: number
  maxDevices: number
  description: string | null
  isActive: boolean
  tenantCount?: number
}

/** The trimmed shape the tenant endpoints embed. */
export type PlanRef = Pick<
  Plan,
  'id' | 'name' | 'billingType' | 'currency' | 'monthlyPrice' | 'oneTimePrice' | 'annualMaintenanceFee' | 'supportLevel'
>

export function formatMoney(amount: number, currency = 'KES'): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** One-liner pricing summary, e.g. "KES 2,000.00 / mo" or
 *  "KES 80,000.00 once + KES 10,000.00 / yr". */
export function planPriceSummary(plan: PlanRef): string {
  if (plan.billingType === 'MONTHLY') {
    return `${formatMoney(plan.monthlyPrice, plan.currency)} / mo`
  }
  const once = `${formatMoney(plan.oneTimePrice, plan.currency)} once`
  return plan.annualMaintenanceFee > 0
    ? `${once} + ${formatMoney(plan.annualMaintenanceFee, plan.currency)} / yr`
    : once
}

export const billingTypeLabel: Record<PlanBillingType, string> = {
  MONTHLY: 'Monthly',
  ONE_TIME: 'One-time + maintenance',
}
