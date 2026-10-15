import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { LuArrowLeft, LuEye, LuExternalLink, LuLoaderCircle } from 'react-icons/lu'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CatalogTab } from './CatalogTab'
import { DomainsTab } from './DomainsTab'
import { MediaLibrary } from './MediaLibrary'
import { PagesTab } from './PagesTab'
import { SettingsTab } from './SettingsTab'
import type { Overview, Website, WebsiteStatus } from './types'
import { Btn, errorMessage, Notice, Panel } from './ui'

const TABS = [
  ['settings', 'Settings'],
  ['pages', 'Pages'],
  ['catalog', 'Show online'],
  ['media', 'Media'],
  ['domains', 'Domains'],
] as const
type Tab = (typeof TABS)[number][0]

const STATUS_STYLE: Record<WebsiteStatus, string> = {
  PUBLISHED: 'border-success/40 bg-success/10 text-success',
  DRAFT: 'border-warning/40 bg-warning/10 text-warning',
  SUSPENDED: 'border-destructive/40 bg-destructive/10 text-destructive',
}

/** Platform admin ▸ tenant ▸ Website. */
export default function WebsiteAdmin() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some(([key]) => key === params.get('tab')) ? params.get('tab') : 'settings') as Tab
  const [overview, setOverview] = useState<Overview | null>(null)
  const [tenant, setTenant] = useState<{ name: string; slug: string } | null>(null)
  const [error, setError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [o, t] = await Promise.all([
        api<Overview>(`/platform/tenants/${id}/website`),
        api<{ tenant: { name: string; slug: string } }>(`/platform/tenants/${id}`),
      ])
      setOverview(o)
      setTenant(t.tenant)
    } catch (cause) {
      setError(errorMessage(cause, 'Could not load the website'))
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function setStatus(status: WebsiteStatus) {
    const verb = status === 'PUBLISHED' ? 'Publish' : status === 'SUSPENDED' ? 'Suspend' : 'Unpublish'
    if (status !== 'PUBLISHED' && !window.confirm(`${verb} the website? Visitors will stop seeing it.`)) return
    setStatusBusy(true)
    setError('')
    try {
      await api(`/platform/tenants/${id}/website/status`, { method: 'POST', body: JSON.stringify({ status }) })
      await load()
    } catch (cause) {
      setError(errorMessage(cause, `Could not ${verb.toLowerCase()}`))
    } finally {
      setStatusBusy(false)
    }
  }

  if (!overview || !tenant) {
    return error
      ? <p className="p-10 text-center text-sm text-destructive">{error}</p>
      : <div className="flex min-h-64 items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><LuLoaderCircle className="animate-spin" /> Loading…</div>
  }

  const website = overview.website
  const status = website?.status

  return (
    <div className="px-6 py-6 lg:px-10 xl:px-14">
      <Link to={`/tenants/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
        <LuArrowLeft className="size-4" /> Back to {tenant.name}
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Website</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight">{tenant.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className={cn('border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status ? STATUS_STYLE[status] : '')}>
              {status === 'PUBLISHED' ? 'Live' : status === 'SUSPENDED' ? 'Suspended' : status === 'DRAFT' ? 'Not published' : 'Not set up'}
            </span>
            {overview.siteUrl && <span>{overview.siteUrl.replace(/^https?:\/\//, '')}</span>}
          </p>
        </div>
        {website && (
          <div className="flex flex-wrap gap-2">
            {overview.previewUrl && (
              <a href={overview.previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                <LuEye className="size-4" /> Preview drafts
              </a>
            )}
            {status === 'PUBLISHED' && overview.siteUrl && (
              <a href={overview.siteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                <LuExternalLink className="size-4" /> Open live site
              </a>
            )}
            {status === 'PUBLISHED'
              ? <Btn size="md" variant="danger" busy={statusBusy} onClick={() => void setStatus('DRAFT')}>Unpublish</Btn>
              : <Btn size="md" variant="primary" busy={statusBusy} disabled={!overview.moduleEnabled} onClick={() => void setStatus('PUBLISHED')}>Publish website</Btn>}
          </div>
        )}
      </header>

      <div className="mt-5 space-y-3">
        {!overview.moduleEnabled && (
          <Notice kind="warning">
            The Website module is off for this tenant — you can set everything up, but it can't be previewed or published until it's enabled under{' '}
            <Link to={`/tenants/${id}`} className="font-semibold underline">Modules</Link>.
          </Notice>
        )}
        {error && <Notice kind="error">{error}</Notice>}
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b" aria-label="Website sections">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide',
              tab === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'settings' && (
          <SettingsTab
            key={website?.id ?? 'new'}
            tenantId={id}
            overview={overview}
            onSaved={(w: Website) => setOverview((o) => (o ? { ...o, website: w } : o))}
          />
        )}
        {tab === 'pages' && <PagesTab tenantId={id} overview={overview} onChanged={load} />}
        {tab === 'catalog' && <CatalogTab tenantId={id} />}
        {tab === 'media' && <Panel title="Media library"><MediaLibrary tenantId={id} /></Panel>}
        {tab === 'domains' && <DomainsTab tenantId={id} overview={overview} slug={tenant.slug} onChanged={load} />}
      </div>
    </div>
  )
}
