import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuBuilding2, LuLoaderCircle, LuPlus, LuSearch } from 'react-icons/lu'
import { api } from '@/lib/api'
import { type PlanRef, planPriceSummary } from '@/lib/plans'
import NewTenantModal from '@/components/NewTenantModal'
import StatusBadge, { type LicenseStatus } from '@/components/StatusBadge'

type TenantSummary = {
  id: string
  name: string
  slug: string
  isActive: boolean
  licenseStatus: LicenseStatus
  subscriptionPlan: string
  plan: PlanRef | null
  nextDueDate: string | null
  maxBranches: number
  maxUsers: number
  maxDevices: number
  employeeCount: number
  locationCount: number
  createdAt: string
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '—')

export default function TenantsList() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const query = new URLSearchParams()
      if (q.trim()) query.set('q', q.trim())
      if (status) query.set('status', status)
      const response = await api<{ tenants: TenantSummary[] }>(`/platform/tenants${query.size ? `?${query}` : ''}`)
      setTenants(response.tenants)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-accent">Clients</p>
          <h1 className="mt-1 text-2xl font-bold">Tenants</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every customer workspace and its subscription, in one place.</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <LuPlus /> New Tenant
        </button>
      </header>

      {creating && (
        <NewTenantModal
          onClose={() => setCreating(false)}
          onCreated={(result) => {
            setCreating(false)
            navigate(`/tenants/${result.tenant.id}`, { state: { created: result } })
          }}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        <label className="relative flex-1 sm:max-w-xs">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or slug…" className="input pl-9" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-48">
          <option value="">All statuses</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-5 overflow-x-auto rounded-sm border bg-card">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><LuLoaderCircle className="animate-spin" /> Loading…</div>
        ) : tenants.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No tenants match.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-primary text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              <tr>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Next due</th>
                <th className="px-4 py-3">Limits</th>
                <th className="px-4 py-3">Employees</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to={`/tenants/${tenant.id}`} className="flex items-center gap-2 font-medium">
                      <LuBuilding2 className="size-4 text-muted-foreground" />
                      <span>
                        {tenant.name}
                        <span className="block text-xs font-normal text-muted-foreground">{tenant.slug}{!tenant.isActive && ' · deactivated'}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={tenant.licenseStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tenant.plan?.name ?? tenant.subscriptionPlan}
                    {tenant.plan && (
                      <span className="block text-xs text-muted-foreground/80">{planPriceSummary(tenant.plan)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(tenant.nextDueDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tenant.maxBranches} branch · {tenant.maxUsers} users · {tenant.maxDevices} devices</td>
                  <td className="px-4 py-3 text-muted-foreground">{tenant.employeeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
