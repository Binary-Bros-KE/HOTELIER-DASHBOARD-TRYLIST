import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { LuCircleAlert, LuLoaderCircle } from 'react-icons/lu'
import { api } from '@/lib/api'
import Modal from '@/components/Modal'
import { type Plan, planPriceSummary } from '@/lib/plans'

const BUSINESS_TYPES = ['HOTEL', 'MOTEL', 'RESTAURANT', 'CAFE', 'CLUB'] as const
const CURRENCIES = ['KES', 'UGX', 'TZS', 'USD'] as const

export type CreatedTenant = {
  tenant: { id: string; name: string; slug: string; licenseKey: string }
  bootstrapLogin: { employeeCode: string; pin: string }
  loginUrl: string | null
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// The subdomain is a SHORT label, not the whole business name — "Trylist
// Solutions Ltd" → "trylist", not "trylist-solutions-ltd". Suggest the
// first meaningful word; the operator edits it freely.
function suggestSubdomain(name: string) {
  const first = slugify(name.trim().split(/\s+/)[0] ?? '')
  return first.length >= 3 ? first : slugify(name)
}

export default function NewTenantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (result: CreatedTenant) => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [businessType, setBusinessType] = useState<(typeof BUSINESS_TYPES)[number]>('HOTEL')
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>('KES')
  const [contactEmail, setContactEmail] = useState('')
  const [trialDays, setTrialDays] = useState('30')
  const [plans, setPlans] = useState<Plan[]>([])
  const [planId, setPlanId] = useState('')
  const [rooms, setRooms] = useState(false)
  const [sales, setSales] = useState(false)
  const [services, setServices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ plans: Plan[] }>('/platform/plans?active=true')
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans([]))
  }, [])

  const selectedPlan = plans.find((p) => p.id === planId) ?? null
  const canSubmit = name.trim().length >= 2 && slug.length >= 3 && contactEmail.trim() && planId && (rooms || sales || services)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await api<CreatedTenant>('/platform/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          slug,
          businessType,
          currency,
          contactEmail: contactEmail.trim(),
          planId,
          trialDays: Number(trialDays) || undefined,
          modules: { rooms, sales, services },
        }),
      })
      onCreated(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create this tenant')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="New Tenant"
      subtitle="Name, subdomain, contact email, and a plan are required — everything else can be filled in later on the tenant page."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-sm border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            form="new-tenant-form"
            disabled={submitting || !canSubmit}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting && <LuLoaderCircle className="animate-spin" />} Create tenant
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          <LuCircleAlert /> {error}
        </div>
      )}

      <form id="new-tenant-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Business name" required>
          <input
            required
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(suggestSubdomain(e.target.value))
            }}
          />
        </Field>
        <Field
          label="Subdomain"
          required
          hint={slug ? `${slug}.yourdomain.com — this is what they type to reach the workspace` : 'Short label, e.g. "trylist" — not the full business name'}
        >
          <input
            required
            className="input"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value))
              setSlugTouched(true)
            }}
          />
        </Field>

        <Field label="Business type">
          <select className="input" value={businessType} onChange={(e) => setBusinessType(e.target.value as typeof businessType)}>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0] + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Currency">
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Contact email" required>
          <input required type="email" className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </Field>
        <Field label="Trial length (days)" hint="Sets the first due date — blank to schedule it manually later">
          <input type="number" min="1" className="input" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
        </Field>

        <div className="sm:col-span-2">
          <div className="mb-3 mt-1 border-t pt-4 text-xs font-semibold uppercase tracking-wide text-accent">
            Subscription setup
          </div>
          <Field
            label="Plan"
            required
            hint={
              plans.length === 0
                ? 'No active plans yet — create one under Plans first.'
                : selectedPlan
                  ? `${planPriceSummary(selectedPlan)} · ${selectedPlan.maxBranches} branch · ${selectedPlan.maxUsers} users · ${selectedPlan.maxDevices} devices`
                  : undefined
            }
          >
            <select required className="input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Select a plan…</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {planPriceSummary(plan)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <div className="mb-3 mt-1 border-t pt-4 text-xs font-semibold uppercase tracking-wide text-accent">
            Modules
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            Pick at least one — everything else (Team, Finance, Reports, Inventory) is available to every tenant regardless.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <ModuleToggle label="Room Management" hint="Reception, check-in, housekeeping" checked={rooms} onChange={setRooms} />
            <ModuleToggle label="Sales" hint="Menu items, kitchen, products POS" checked={sales} onChange={setSales} />
            <ModuleToggle label="Services" hint="Spa/gym bookings, memberships" checked={services} onChange={setServices} />
          </div>
          {!rooms && !sales && !services && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive"><LuCircleAlert className="size-3.5" /> Enable at least one module</p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export function ModuleToggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-sm border bg-background px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-accent" />
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm font-medium">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  )
}
