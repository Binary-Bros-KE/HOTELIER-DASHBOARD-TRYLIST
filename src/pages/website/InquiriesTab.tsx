import { useCallback, useEffect, useState } from 'react'
import { LuInbox, LuMail, LuPhone } from 'react-icons/lu'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Inquiry } from './types'
import { errorMessage, Notice, Panel } from './ui'

const STATUSES: Inquiry['status'][] = ['NEW', 'CONTACTED', 'CLOSED', 'SPAM']
const LABEL: Record<Inquiry['status'], string> = { NEW: 'New', CONTACTED: 'Contacted', CLOSED: 'Closed', SPAM: 'Spam' }

/** Messages from the website's enquiry form, until staff get their own inbox. */
export function InquiriesTab({ tenantId }: { tenantId: string }) {
  const base = `/platform/tenants/${tenantId}/website/inquiries`
  const [filter, setFilter] = useState<Inquiry['status'] | ''>('NEW')
  const [items, setItems] = useState<Inquiry[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setItems((await api<{ inquiries: Inquiry[] }>(`${base}${filter ? `?status=${filter}` : ''}`)).inquiries)
    } catch (cause) {
      setError(errorMessage(cause, 'Could not load enquiries'))
    }
  }, [base, filter])

  useEffect(() => { void load() }, [load])

  async function setStatus(item: Inquiry, status: Inquiry['status']) {
    try {
      await api(`${base}/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setItems((list) => (list ?? []).map((i) => (i.id === item.id ? { ...i, status } : i)).filter((i) => !filter || i.status === filter))
    } catch (cause) {
      setError(errorMessage(cause, 'Could not update'))
    }
  }

  return (
    <Panel
      title="Enquiries"
      actions={
        <select className="input !w-auto !py-1.5 text-xs" value={filter} onChange={(e) => setFilter(e.target.value as Inquiry['status'] | '')}>
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
        </select>
      }
    >
      {error && <div className="mb-4"><Notice kind="error">{error}</Notice></div>}
      {!items ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground"><LuInbox className="size-6" /> Nothing here</div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border bg-background">
              <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2.5">
                <span className="text-sm font-semibold">{item.name}</span>
                <span className="border px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{item.kind.toLowerCase()}</span>
                <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                <select
                  className={cn('input ml-auto !w-auto !py-1 text-xs', item.status === 'NEW' && 'border-accent')}
                  value={item.status}
                  onChange={(e) => void setStatus(item, e.target.value as Inquiry['status'])}
                  aria-label="Status"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                </select>
              </div>
              <div className="space-y-3 px-4 py-3 text-sm">
                {item.subject && <p className="font-semibold">{item.subject}</p>}
                <p className="whitespace-pre-line">{item.message}</p>
                {item.details && Object.keys(item.details).length > 0 && (
                  <p className="text-xs text-muted-foreground">{Object.entries(item.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs">
                  {item.phone && <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1 hover:underline"><LuPhone className="size-3.5" /> {item.phone}</a>}
                  {item.email && <a href={`mailto:${item.email}`} className="inline-flex items-center gap-1 hover:underline"><LuMail className="size-3.5" /> {item.email}</a>}
                  {item.sourcePage && <span className="text-muted-foreground">from {item.sourcePage}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
