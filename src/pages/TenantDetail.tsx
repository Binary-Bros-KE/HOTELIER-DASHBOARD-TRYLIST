import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { LuArrowLeft, LuCheck, LuCircleAlert, LuCopy, LuLoaderCircle, LuPencil, LuTriangleAlert, LuX } from 'react-icons/lu'
import { api } from '@/lib/api'
import { type Plan, type PlanRef, planPriceSummary } from '@/lib/plans'
import { ModuleToggle, type CreatedTenant } from '@/components/NewTenantModal'
import StatusBadge, { type LicenseStatus } from '@/components/StatusBadge'

type BusinessProfile = {
  businessName: string
  businessType: string
  currency: string
  email: string | null
  primaryPhone: string | null
  alternativePhone: string | null
  website: string | null
  registrationNumber: string | null
  kraPin: string | null
  ownerName: string | null
  ownerPhone: string | null
  ownerEmail: string | null
  country: string | null
  county: string | null
  city: string | null
  address: string | null
}

type TenantDetail = {
  id: string
  name: string
  slug: string
  isActive: boolean
  licenseKey: string
  licenseStatus: LicenseStatus
  planId: string | null
  plan: PlanRef | null
  subscriptionPlan: string
  subscriptionStart: string
  nextDueDate: string | null
  maxBranches: number
  maxUsers: number
  maxDevices: number
  lastLicenseCheck: string | null
  moduleKeys: string[]
  moduleGroups: { rooms: boolean; sales: boolean; services: boolean; website: boolean }
  employeeCount: number
  locationCount: number
  roleCount: number
  loginUrl: string | null
  businessProfile: BusinessProfile | null
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '—')
const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : 'Never')
const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : '')
const dash = (value: string | null | undefined) => (value && value.trim() ? value : '—')

const PROFILE_FIELDS = [
  'businessName', 'email', 'primaryPhone', 'alternativePhone', 'website',
  'registrationNumber', 'kraPin', 'ownerName', 'ownerPhone', 'ownerEmail',
  'country', 'county', 'city', 'address',
] as const
type ProfileField = (typeof PROFILE_FIELDS)[number]

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const locationState = useLocation()
  const justCreated = (locationState.state as { created?: CreatedTenant } | null)?.created ?? null
  const [showCreated, setShowCreated] = useState(true)

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const [plan, setPlan] = useState({ planId: '', subscriptionPlan: '', maxBranches: '', maxUsers: '', maxDevices: '', nextDueDate: '' })
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>('TRIAL')
  const [plans, setPlans] = useState<Plan[]>([])
  const [modules, setModules] = useState({ rooms: false, sales: false, services: false, website: false })

  const [editingProfile, setEditingProfile] = useState(false)
  const [draft, setDraft] = useState<Record<'tenantName' | 'slug' | 'businessType' | 'currency' | ProfileField, string>>(() => blankDraft())

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await api<{ tenant: TenantDetail }>(`/platform/tenants/${id}`)
      setTenant(response.tenant)
      setPlan({
        planId: response.tenant.planId ?? '',
        subscriptionPlan: response.tenant.subscriptionPlan,
        maxBranches: String(response.tenant.maxBranches),
        maxUsers: String(response.tenant.maxUsers),
        maxDevices: String(response.tenant.maxDevices),
        nextDueDate: toDateInput(response.tenant.nextDueDate),
      })
      setLicenseStatus(response.tenant.licenseStatus)
      setModules(response.tenant.moduleGroups)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this tenant')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  useEffect(() => {
    api<{ plans: Plan[] }>('/platform/plans?active=true')
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans([]))
  }, [])

  function beginEdit() {
    if (!tenant) return
    const p = tenant.businessProfile
    setDraft({
      tenantName: tenant.name,
      slug: tenant.slug,
      businessType: p?.businessType ?? 'HOTEL',
      currency: p?.currency ?? 'KES',
      businessName: p?.businessName ?? '',
      email: p?.email ?? '',
      primaryPhone: p?.primaryPhone ?? '',
      alternativePhone: p?.alternativePhone ?? '',
      website: p?.website ?? '',
      registrationNumber: p?.registrationNumber ?? '',
      kraPin: p?.kraPin ?? '',
      ownerName: p?.ownerName ?? '',
      ownerPhone: p?.ownerPhone ?? '',
      ownerEmail: p?.ownerEmail ?? '',
      country: p?.country ?? '',
      county: p?.county ?? '',
      city: p?.city ?? '',
      address: p?.address ?? '',
    })
    setEditingProfile(true)
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await api(`/platform/tenants/${id}/profile`, { method: 'PATCH', body: JSON.stringify(draft) })
      setEditingProfile(false)
      setNotice('Profile saved.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the profile')
    } finally {
      setSaving(false)
    }
  }

  function onPlanChange(planId: string) {
    const picked = plans.find((p) => p.id === planId)
    setPlan((prev) => ({
      ...prev,
      planId,
      ...(picked && {
        maxBranches: String(picked.maxBranches),
        maxUsers: String(picked.maxUsers),
        maxDevices: String(picked.maxDevices),
      }),
    }))
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await api(`/platform/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          planId: plan.planId || null,
          ...(plan.planId ? {} : { subscriptionPlan: plan.subscriptionPlan }),
          maxBranches: Number(plan.maxBranches),
          maxUsers: Number(plan.maxUsers),
          maxDevices: Number(plan.maxDevices),
          nextDueDate: plan.nextDueDate || null,
        }),
      })
      setNotice('Plan & limits saved.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  async function saveLicenseStatus() {
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await api(`/platform/tenants/${id}`, { method: 'PATCH', body: JSON.stringify({ licenseStatus }) })
      setNotice('License status updated.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update license status')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive() {
    if (!tenant) return
    const next = !tenant.isActive
    if (next === false && !window.confirm(`Deactivate "${tenant.name}"? Its workspace stops loading immediately — this is not the same as suspending for non-payment.`)) return
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await api(`/platform/tenants/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: next }) })
      setNotice(next ? 'Workspace reactivated.' : 'Workspace deactivated.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change activation')
    } finally {
      setSaving(false)
    }
  }

  async function saveModules() {
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await api(`/platform/tenants/${id}/modules`, { method: 'PATCH', body: JSON.stringify(modules) })
      setNotice('Modules updated.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update modules')
    } finally {
      setSaving(false)
    }
  }

  const planLabel = useMemo(() => {
    if (!tenant) return '—'
    return tenant.plan ? `${tenant.plan.name} · ${planPriceSummary(tenant.plan)}` : tenant.subscriptionPlan
  }, [tenant])

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
        <LuLoaderCircle className="animate-spin" /> Loading…
      </div>
    )
  }
  if (!tenant) return <p className="p-10 text-center text-sm text-destructive">{error || 'Tenant not found.'}</p>

  const p = tenant.businessProfile

  return (
    <div className="px-6 py-6 lg:px-10 xl:px-14">
      <Link to="/tenants" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
        <LuArrowLeft className="size-4" /> Back to tenants
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Tenant</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight">{tenant.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant.slug}{p?.email ? ` · ${p.email}` : ''}
          </p>
        </div>
        <StatusBadge status={tenant.licenseStatus} />
      </header>

      {justCreated && showCreated && (
        <CreatedBanner created={justCreated} onDismiss={() => setShowCreated(false)} />
      )}

      {notice && <p className="mt-5 border border-success/30 bg-success/10 p-3 text-sm text-success">{notice}</p>}
      {error && (
        <div className="mt-5 flex items-center gap-2 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <LuCircleAlert /> {error}
        </div>
      )}

      {/* ---- Profile ---------------------------------------------------- */}
      <section className="mt-6 border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">Profile</h2>
          {editingProfile ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(false)}
                className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <LuX className="size-3.5" /> Cancel
              </button>
              <button
                form="profile-form"
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? <LuLoaderCircle className="size-3.5 animate-spin" /> : <LuCheck className="size-3.5" />} Save
              </button>
            </div>
          ) : (
            <button
              onClick={beginEdit}
              className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              <LuPencil className="size-3.5" /> Edit
            </button>
          )}
        </div>

        {editingProfile ? (
          <form id="profile-form" onSubmit={saveProfile} className="p-5">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldInput label="Tenant name" value={draft.tenantName} onChange={(v) => setDraft({ ...draft, tenantName: v })} required />
              <FieldInput
                label="Subdomain"
                value={draft.slug}
                onChange={(v) => setDraft({ ...draft, slug: v.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                hint={`${draft.slug || '…'}.yourdomain.com — changing this changes their login URL`}
                required
              />
              <FieldInput label="Business name" value={draft.businessName} onChange={(v) => setDraft({ ...draft, businessName: v })} />
              <FieldSelect label="Business type" value={draft.businessType} onChange={(v) => setDraft({ ...draft, businessType: v })} options={['HOTEL', 'MOTEL', 'RESTAURANT', 'CAFE', 'CLUB']} />
              <FieldSelect label="Currency" value={draft.currency} onChange={(v) => setDraft({ ...draft, currency: v })} options={['KES', 'UGX', 'TZS', 'USD']} />
              <FieldInput label="Contact email" type="email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
              <FieldInput label="Contact phone" value={draft.primaryPhone} onChange={(v) => setDraft({ ...draft, primaryPhone: v })} />
            </div>

            <p className="eyebrow mt-7">Extended business profile</p>
            <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldInput label="Business reg. no." value={draft.registrationNumber} onChange={(v) => setDraft({ ...draft, registrationNumber: v })} />
              <FieldInput label="KRA PIN" value={draft.kraPin} onChange={(v) => setDraft({ ...draft, kraPin: v })} />
              <FieldInput label="Alternative phone" value={draft.alternativePhone} onChange={(v) => setDraft({ ...draft, alternativePhone: v })} />
              <FieldInput label="Website" value={draft.website} onChange={(v) => setDraft({ ...draft, website: v })} />
              <FieldInput label="Owner name" value={draft.ownerName} onChange={(v) => setDraft({ ...draft, ownerName: v })} />
              <FieldInput label="Owner phone" value={draft.ownerPhone} onChange={(v) => setDraft({ ...draft, ownerPhone: v })} />
              <FieldInput label="Owner email" type="email" value={draft.ownerEmail} onChange={(v) => setDraft({ ...draft, ownerEmail: v })} />
              <FieldInput label="Country" value={draft.country} onChange={(v) => setDraft({ ...draft, country: v })} />
              <FieldInput label="County / state" value={draft.county} onChange={(v) => setDraft({ ...draft, county: v })} />
              <FieldInput label="City / town" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
              <div className="sm:col-span-2 lg:col-span-3">
                <FieldInput label="Address" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
              </div>
            </div>
          </form>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <DataTile label="Tenant ID" value={tenant.id} break />
              <DataTile label="Business type" value={dash(p?.businessType)} />
              <DataTile label="Currency" value={dash(p?.currency)} />
              <DataTile label="Contact email" value={dash(p?.email)} />
              <DataTile label="Contact phone" value={dash(p?.primaryPhone)} />
              <DataTile label="Storefronts" value={String(tenant.locationCount)} />
              <DataTile label="Employees" value={String(tenant.employeeCount)} />
              <DataTile label="Subscription start" value={formatDate(tenant.subscriptionStart)} />
              <DataTile label="Last license check" value={formatDateTime(tenant.lastLicenseCheck)} />
              <DataTile
                label="Modules enabled"
                value={[tenant.moduleGroups.rooms && 'Room Management', tenant.moduleGroups.sales && 'Sales', tenant.moduleGroups.services && 'Services', tenant.moduleGroups.website && 'Website'].filter(Boolean).join(', ') || 'None'}
                className="col-span-2"
              />
            </div>

            <p className="eyebrow mt-7">Extended business profile</p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <DataTile label="Business reg. no." value={dash(p?.registrationNumber)} />
              <DataTile label="KRA PIN" value={dash(p?.kraPin)} />
              <DataTile label="Business email" value={dash(p?.email)} />
              <DataTile label="Alternative phone" value={dash(p?.alternativePhone)} />
              <DataTile label="Website" value={dash(p?.website)} />
              <DataTile label="Owner" value={dash(p?.ownerName)} />
              <DataTile label="Owner phone" value={dash(p?.ownerPhone)} />
              <DataTile label="Owner email" value={dash(p?.ownerEmail)} />
              <DataTile label="Country" value={dash(p?.country)} />
              <DataTile label="County / state" value={dash(p?.county)} />
              <DataTile label="City / town" value={dash(p?.city)} />
              <DataTile label="Address" value={dash(p?.address)} className="col-span-2" />
            </div>
          </div>
        )}
      </section>

      {/* ---- Management ----------------------------------------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="border bg-card">
          <h2 className="border-b px-5 py-3 text-sm font-bold uppercase tracking-wide">Plan &amp; limits</h2>
          <form onSubmit={savePlan} className="space-y-4 p-5">
            <label className="block text-sm font-medium">
              <span className="eyebrow">Plan</span>
              <select className="input mt-1.5" value={plan.planId} onChange={(e) => onPlanChange(e.target.value)}>
                <option value="">— No plan (set limits manually) —</option>
                {plans.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name} · {planPriceSummary(pl)}</option>
                ))}
                {tenant.plan && !plans.some((pl) => pl.id === tenant.plan?.id) && (
                  <option value={tenant.plan.id}>{tenant.plan.name} (inactive) · {planPriceSummary(tenant.plan)}</option>
                )}
              </select>
            </label>
            {!plan.planId && (
              <label className="block text-sm font-medium">
                <span className="eyebrow">Subscription label</span>
                <input className="input mt-1.5" value={plan.subscriptionPlan} onChange={(e) => setPlan({ ...plan, subscriptionPlan: e.target.value })} />
              </label>
            )}
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm font-medium">
                <span className="eyebrow">Max branches</span>
                <input type="number" min="1" className="input mt-1.5" value={plan.maxBranches} onChange={(e) => setPlan({ ...plan, maxBranches: e.target.value })} />
              </label>
              <label className="block text-sm font-medium">
                <span className="eyebrow">Max users</span>
                <input type="number" min="1" className="input mt-1.5" value={plan.maxUsers} onChange={(e) => setPlan({ ...plan, maxUsers: e.target.value })} />
              </label>
              <label className="block text-sm font-medium">
                <span className="eyebrow">Max devices</span>
                <input type="number" min="1" className="input mt-1.5" value={plan.maxDevices} onChange={(e) => setPlan({ ...plan, maxDevices: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm font-medium">
              <span className="eyebrow">Next due date</span>
              <input type="date" className="input mt-1.5" value={plan.nextDueDate} onChange={(e) => setPlan({ ...plan, nextDueDate: e.target.value })} />
            </label>
            <button disabled={saving} className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {saving && <LuLoaderCircle className="animate-spin" />} Save plan &amp; limits
            </button>
            <p className="text-xs text-muted-foreground">Current: {planLabel}</p>
          </form>
        </section>

        <section className="border bg-card">
          <h2 className="border-b px-5 py-3 text-sm font-bold uppercase tracking-wide">License status</h2>
          <div className="p-5">
            <p className="text-xs text-muted-foreground">
              Soft signal only — drives a warning banner inside the tenant's app, it never blocks access.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select className="input w-40" value={licenseStatus} onChange={(e) => setLicenseStatus(e.target.value as LicenseStatus)}>
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <button
                onClick={() => void saveLicenseStatus()}
                disabled={saving || licenseStatus === tenant.licenseStatus}
                className="bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
              >
                Update status
              </button>
            </div>
          </div>
        </section>

        <section className="border bg-card">
          <h2 className="border-b px-5 py-3 text-sm font-bold uppercase tracking-wide">Modules</h2>
          <div className="p-5">
            <p className="text-xs text-muted-foreground">
              What this tenant's sidebar shows. Everything else (Team, Finance, Reports, Inventory) is available regardless.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ModuleToggle label="Room Management" hint="Reception, check-in, housekeeping" checked={modules.rooms} onChange={(v) => setModules({ ...modules, rooms: v })} />
              <ModuleToggle label="Sales" hint="Menu items, kitchen, products POS" checked={modules.sales} onChange={(v) => setModules({ ...modules, sales: v })} />
              <ModuleToggle label="Services" hint="Spa/gym bookings, memberships" checked={modules.services} onChange={(v) => setModules({ ...modules, services: v })} />
              <ModuleToggle label="Website" hint="Public site, online bookings" checked={modules.website} onChange={(v) => setModules({ ...modules, website: v })} />
            </div>
            {!modules.rooms && !modules.sales && !modules.services && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive"><LuCircleAlert className="size-3.5" /> At least one module must stay enabled</p>
            )}
            <button
              onClick={() => void saveModules()}
              disabled={saving || (!modules.rooms && !modules.sales && !modules.services) || (modules.rooms === tenant.moduleGroups.rooms && modules.sales === tenant.moduleGroups.sales && modules.services === tenant.moduleGroups.services && modules.website === tenant.moduleGroups.website)}
              className="mt-4 inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving && <LuLoaderCircle className="animate-spin" />} Save modules
            </button>
          </div>
        </section>

        <section className="border bg-card">
          <h2 className="border-b px-5 py-3 text-sm font-bold uppercase tracking-wide">Workspace &amp; access</h2>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DataTile label="Subdomain" value={tenant.slug} />
              <DataTile label="Login URL" value={tenant.loginUrl ?? '— set APP_DOMAIN in production —'} break />
              <DataTile label="License key" value={tenant.licenseKey} break />
              <DataTile label="Workspace status" value={tenant.isActive ? 'Active' : 'Deactivated'} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Navigating to <span className="font-medium text-foreground">{tenant.slug}.&lt;your domain&gt;</span> auto-resolves this workspace. The subdomain can be changed under Profile → Edit; the license key is issued once at creation and never changes.
            </p>
          </div>
        </section>

        <section className="border border-destructive/40 bg-destructive/5">
          <h2 className="flex items-center gap-2 border-b border-destructive/40 px-5 py-3 text-sm font-bold uppercase tracking-wide text-destructive">
            <LuTriangleAlert className="size-4" /> Danger zone
          </h2>
          <div className="p-5">
            <p className="text-xs text-muted-foreground">
              Deactivating is immediate and hard — the subdomain stops resolving and nobody can log in, unlike a license status change. Use it for closing an account, not a billing hiccup.
            </p>
            <button
              onClick={() => void toggleActive()}
              disabled={saving}
              className="mt-3 border border-destructive/50 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              {tenant.isActive ? 'Deactivate workspace' : 'Reactivate workspace'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function blankDraft(): Record<'tenantName' | 'slug' | 'businessType' | 'currency' | ProfileField, string> {
  return {
    tenantName: '', slug: '', businessType: 'HOTEL', currency: 'KES',
    businessName: '', email: '', primaryPhone: '', alternativePhone: '', website: '',
    registrationNumber: '', kraPin: '', ownerName: '', ownerPhone: '', ownerEmail: '',
    country: '', county: '', city: '', address: '',
  }
}

function DataTile({ label, value, break: breakAll, className }: { label: string; value: string; break?: boolean; className?: string }) {
  return (
    <div className={`border border-border bg-muted/40 px-3.5 py-2.5 ${className ?? ''}`}>
      <p className="eyebrow">{label}</p>
      <p className={`mt-1 text-[13px] font-medium ${breakAll ? 'break-all' : 'break-words'}`}>{value}</p>
    </div>
  )
}

function FieldInput({
  label, value, onChange, type = 'text', required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; hint?: string
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input type={type} required={required} className="input mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

function FieldSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <select className="input mt-1.5" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function CreatedBanner({ created, onDismiss }: { created: CreatedTenant; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const text = [
      `Workspace: ${created.loginUrl ?? created.tenant.slug}`,
      `Employee code: ${created.bootstrapLogin.employeeCode}`,
      `PIN: ${created.bootstrapLogin.pin}`,
      `License key: ${created.tenant.licenseKey}`,
    ].join('\n')
    void navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-5 border border-success/40 bg-success/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-success">Tenant created</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This is the only time the bootstrap PIN is shown — copy it now and hand it to the client so they can sign in and set up their staff.
          </p>
        </div>
        <button onClick={onDismiss} className="shrink-0 border px-2 py-1 text-xs font-semibold hover:bg-muted">Dismiss</button>
      </div>

      <div className="mt-4 space-y-2 border bg-card p-4 text-sm">
        <BannerRow label="Login URL" value={created.loginUrl ?? '— set APP_DOMAIN in production —'} />
        <BannerRow label="Employee code" value={created.bootstrapLogin.employeeCode} />
        <BannerRow label="PIN" value={created.bootstrapLogin.pin} />
        <BannerRow label="License key" value={created.tenant.licenseKey} />
      </div>

      <button onClick={copy} className="mt-3 inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold hover:bg-muted">
        {copied ? <LuCheck className="text-success" /> : <LuCopy />} {copied ? 'Copied' : 'Copy credentials'}
      </button>
    </div>
  )
}

function BannerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="eyebrow">{label}</span>
      <span className="break-all text-right text-xs font-medium">{value}</span>
    </div>
  )
}
