import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { LuCircleAlert, LuLoaderCircle, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import { api } from '@/lib/api'
import Modal from '@/components/Modal'
import { type Plan, type PlanBillingType, billingTypeLabel, planPriceSummary } from '@/lib/plans'

const CURRENCIES = ['KES', 'UGX', 'TZS', 'USD'] as const
const BILLING_TYPES: PlanBillingType[] = ['MONTHLY', 'ONE_TIME']

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Plan | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api<{ plans: Plan[] }>('/platform/plans')
      setPlans(res.plans)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function remove(plan: Plan) {
    if (!window.confirm(`Delete "${plan.name}"? This can't be undone.`)) return
    try {
      await api(`/platform/plans/${plan.id}`, { method: 'DELETE' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete this plan')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-accent">Catalog</p>
          <h1 className="mt-1 text-2xl font-bold">Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The subscriptions tenants can be put on. A plan is either monthly, or a one-time purchase with a yearly maintenance fee.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <LuPlus /> New Plan
        </button>
      </header>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          <LuCircleAlert /> {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-sm border bg-card">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <LuLoaderCircle className="animate-spin" /> Loading…
          </div>
        ) : plans.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No plans yet — create the first one.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-primary text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Limits</th>
                <th className="px-4 py-3">Tenants</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-medium">{plan.name}</span>
                    {!plan.isActive && (
                      <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Inactive
                      </span>
                    )}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {plan.supportLevel ? `${plan.supportLevel} support` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{billingTypeLabel[plan.billingType]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{planPriceSummary(plan)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {plan.maxBranches} branch · {plan.maxUsers} users · {plan.maxDevices} devices
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{plan.tenantCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(plan)}
                        className="rounded-sm border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Edit plan"
                      >
                        <LuPencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => void remove(plan)}
                        className="rounded-sm border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete plan"
                      >
                        <LuTrash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(creating || editing) && (
        <PlanFormModal
          plan={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            void load()
          }}
        />
      )}
    </div>
  )
}

type Draft = {
  name: string
  billingType: PlanBillingType
  currency: string
  monthlyPrice: string
  oneTimePrice: string
  annualMaintenanceFee: string
  supportLevel: string
  maxBranches: string
  maxUsers: string
  maxDevices: string
  description: string
  isActive: boolean
}

function toDraft(plan: Plan | null): Draft {
  return {
    name: plan?.name ?? '',
    billingType: plan?.billingType ?? 'MONTHLY',
    currency: plan?.currency ?? 'KES',
    monthlyPrice: plan ? String(plan.monthlyPrice) : '',
    oneTimePrice: plan ? String(plan.oneTimePrice) : '',
    annualMaintenanceFee: plan ? String(plan.annualMaintenanceFee) : '',
    supportLevel: plan?.supportLevel ?? '',
    maxBranches: String(plan?.maxBranches ?? 1),
    maxUsers: String(plan?.maxUsers ?? 3),
    maxDevices: String(plan?.maxDevices ?? 1),
    description: plan?.description ?? '',
    isActive: plan?.isActive ?? true,
  }
}

function PlanFormModal({ plan, onClose, onSaved }: { plan: Plan | null; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(plan))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const body = {
      name: draft.name.trim(),
      billingType: draft.billingType,
      currency: draft.currency,
      monthlyPrice: draft.billingType === 'MONTHLY' ? Number(draft.monthlyPrice) || 0 : 0,
      oneTimePrice: draft.billingType === 'ONE_TIME' ? Number(draft.oneTimePrice) || 0 : 0,
      annualMaintenanceFee: draft.billingType === 'ONE_TIME' ? Number(draft.annualMaintenanceFee) || 0 : 0,
      supportLevel: draft.supportLevel.trim() || undefined,
      maxBranches: Number(draft.maxBranches) || 1,
      maxUsers: Number(draft.maxUsers) || 1,
      maxDevices: Number(draft.maxDevices) || 1,
      description: draft.description.trim() || undefined,
      isActive: draft.isActive,
    }
    try {
      if (plan) await api(`/platform/plans/${plan.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      else await api('/platform/plans', { method: 'POST', body: JSON.stringify(body) })
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this plan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={plan ? 'Edit Plan' : 'New Plan'}
      subtitle="Carries every pricing angle (monthly / one-time + maintenance) — a tenant picks whichever one they actually agreed to."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-sm border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            form="plan-form"
            disabled={submitting || !draft.name.trim()}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting && <LuLoaderCircle className="animate-spin" />} {plan ? 'Save changes' : 'Create plan'}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          <LuCircleAlert /> {error}
        </div>
      )}

      <form id="plan-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input required className="input" value={draft.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Billing type">
          <select
            className="input"
            value={draft.billingType}
            onChange={(e) => set('billingType', e.target.value as PlanBillingType)}
          >
            {BILLING_TYPES.map((t) => (
              <option key={t} value={t}>
                {billingTypeLabel[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Currency">
          <select className="input" value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        {draft.billingType === 'MONTHLY' ? (
          <Field label="Monthly price">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={draft.monthlyPrice}
              onChange={(e) => set('monthlyPrice', e.target.value)}
            />
          </Field>
        ) : (
          <Field label="One-time purchase price">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={draft.oneTimePrice}
              onChange={(e) => set('oneTimePrice', e.target.value)}
            />
          </Field>
        )}

        {draft.billingType === 'ONE_TIME' && (
          <Field label="Annual maintenance fee">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={draft.annualMaintenanceFee}
              onChange={(e) => set('annualMaintenanceFee', e.target.value)}
            />
          </Field>
        )}
        <Field label="Support level">
          <input
            className="input"
            placeholder="e.g. Standard, Priority"
            value={draft.supportLevel}
            onChange={(e) => set('supportLevel', e.target.value)}
          />
        </Field>

        <Field label="Max branches">
          <input type="number" min="1" className="input" value={draft.maxBranches} onChange={(e) => set('maxBranches', e.target.value)} />
        </Field>
        <Field label="Max users">
          <input type="number" min="1" className="input" value={draft.maxUsers} onChange={(e) => set('maxUsers', e.target.value)} />
        </Field>

        <Field label="Max devices">
          <input type="number" min="1" className="input" value={draft.maxDevices} onChange={(e) => set('maxDevices', e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active (available to assign)
        </label>

        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea
              rows={3}
              className="input resize-y"
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  )
}
