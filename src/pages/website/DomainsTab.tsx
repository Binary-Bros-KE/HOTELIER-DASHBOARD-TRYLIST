import { useState } from 'react'
import type { FormEvent } from 'react'
import { LuCopy, LuGlobe, LuPlus, LuRefreshCw, LuStar, LuTrash2 } from 'react-icons/lu'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Domain, Overview } from './types'
import { Btn, errorMessage, Field, Notice, Panel, TextInput } from './ui'

const STATUS_LABEL: Record<Domain['status'], string> = { PENDING_DNS: 'Waiting for DNS', VERIFYING: 'Verifying', ACTIVE: 'Active', FAILED: 'Not verified' }

function Copyable({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { void navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="group inline-flex max-w-full items-center gap-1.5 border bg-background px-2 py-1 text-left text-xs hover:border-accent"
    >
      <span className="truncate">{value}</span>
      <LuCopy className="size-3 shrink-0 text-muted-foreground group-hover:text-accent" />
      {copied && <span className="text-success">copied</span>}
    </button>
  )
}

export function DomainsTab({ tenantId, overview, slug, onChanged }: { tenantId: string; overview: Overview; slug: string; onChanged: () => Promise<void> }) {
  const base = `/platform/tenants/${tenantId}/website/domains`
  const [hostname, setHostname] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const platformHost = overview.siteDomain ? `${slug}.${overview.siteDomain}` : null

  async function run(key: string, action: () => Promise<string | void>) {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      const message = await action()
      if (message) setNotice(message)
      await onChanged()
    } catch (cause) {
      setError(errorMessage(cause, 'Something went wrong'))
    } finally {
      setBusy(null)
    }
  }

  const add = (e: FormEvent) => {
    e.preventDefault()
    void run('add', async () => {
      await api(base, { method: 'POST', body: JSON.stringify({ hostname }) })
      setHostname('')
      return 'Domain added — send the client the DNS records below.'
    })
  }

  return (
    <div className="space-y-6">
      <Panel title="Platform address">
        {platformHost ? (
          <p className="flex items-center gap-2 text-sm"><LuGlobe className="size-4 text-accent" /> <a href={`https://${platformHost}`} target="_blank" rel="noreferrer" className="font-semibold underline-offset-2 hover:underline">{platformHost}</a> <span className="text-xs text-muted-foreground">— always on, no setup needed</span></p>
        ) : (
          <Notice kind="warning">SITE_DOMAIN isn't set on the server, so sites have no platform address yet (local dev uses {slug}.localhost:3000).</Notice>
        )}
      </Panel>

      <Panel title="Custom domains">
        {overview.domains.length === 0 ? (
          <p className="mb-5 text-sm text-muted-foreground">No custom domain yet. Add the client's own domain, e.g. www.omegagardens.com.</p>
        ) : (
          <ul className="mb-6 space-y-4">
            {overview.domains.map((domain) => (
              <li key={domain.id} className="border bg-background">
                <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                  <span className="text-sm font-semibold">{domain.hostname}</span>
                  {domain.isPrimary && <span className="inline-flex items-center gap-1 border border-accent/50 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-accent"><LuStar className="size-3" /> Primary</span>}
                  <span className={cn('border px-1.5 py-0.5 text-[11px] font-semibold uppercase', domain.status === 'ACTIVE' ? 'border-success/40 text-success' : domain.status === 'FAILED' ? 'border-destructive/40 text-destructive' : 'text-muted-foreground')}>
                    {STATUS_LABEL[domain.status]}
                  </span>
                  <span className="ml-auto flex gap-2">
                    <Btn onClick={() => void run(`verify-${domain.id}`, async () => {
                      const r = await api<{ verified: boolean }>(`${base}/${domain.id}/verify`, { method: 'POST' })
                      return r.verified ? `${domain.hostname} is verified and active.` : undefined
                    })} busy={busy === `verify-${domain.id}`}><LuRefreshCw className="size-3.5" /> Check DNS</Btn>
                    {domain.status === 'ACTIVE' && !domain.isPrimary && (
                      <Btn onClick={() => void run(`primary-${domain.id}`, async () => { await api(`${base}/${domain.id}/primary`, { method: 'POST' }); return 'Primary domain updated.' })} busy={busy === `primary-${domain.id}`}>Make primary</Btn>
                    )}
                    <Btn variant="danger" onClick={() => window.confirm(`Remove ${domain.hostname}? The site stops answering on it.`) && void run(`del-${domain.id}`, async () => { await api(`${base}/${domain.id}`, { method: 'DELETE' }) })} busy={busy === `del-${domain.id}`}>
                      <LuTrash2 className="size-3.5" />
                    </Btn>
                  </span>
                </div>
                {domain.status !== 'ACTIVE' && (
                  <div className="space-y-3 px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">Ask the client (or their domain provider) to add these two DNS records, then press “Check DNS”:</p>
                    <div className="grid gap-2 text-xs sm:grid-cols-[6rem_1fr_1fr]">
                      <span className="font-semibold">TXT</span>
                      <Copyable value={`_hotelier-verify.${domain.hostname}`} />
                      <Copyable value={domain.verificationToken} />
                      <span className="font-semibold">CNAME</span>
                      <Copyable value={domain.hostname} />
                      <Copyable value={platformHost ?? `${slug}.<SITE_DOMAIN>`} />
                    </div>
                    <p className="text-xs text-muted-foreground">A bare domain (no www) can't use CNAME at most providers — point its A record at the server's IP address instead.</p>
                    {domain.lastError && <p className="text-xs text-destructive">Last check: {domain.lastError}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <Field label="Add a domain" className="min-w-64 flex-1">
            <TextInput value={hostname} placeholder="www.example.com" onChange={setHostname} />
          </Field>
          <Btn variant="primary" size="md" type="submit" busy={busy === 'add'} disabled={!hostname.trim()}><LuPlus className="size-4" /> Add</Btn>
        </form>
        <div className="mt-4 space-y-3">
          {error && <Notice kind="error">{error}</Notice>}
          {notice && <Notice kind="success">{notice}</Notice>}
        </div>
      </Panel>
    </div>
  )
}
