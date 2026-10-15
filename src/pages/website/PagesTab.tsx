import { useState } from 'react'
import type { FormEvent } from 'react'
import { LuChevronRight, LuFileText, LuHouse, LuPlus } from 'react-icons/lu'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PageEditor } from './PageEditor'
import type { Overview, Page } from './types'
import { Btn, errorMessage, Field, Notice, Panel, TextInput } from './ui'

const slugify = (v: string) => v.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

const SYSTEM_TITLES: Record<string, string> = { rooms: 'Rooms & Suites', dining: 'Dining', services: 'Wellness', memberships: 'Memberships', contact: 'Contact' }

export function PagesTab({ tenantId, overview, onChanged }: { tenantId: string; overview: Overview; onChanged: () => Promise<void> }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  if (!overview.website) return <Notice kind="info">Create the website in Settings first.</Notice>

  if (openId) {
    return (
      <PageEditor
        tenantId={tenantId}
        pageId={openId}
        overview={overview}
        onBack={() => { setOpenId(null); void onChanged() }}
        onDeleted={() => { setOpenId(null); void onChanged() }}
      />
    )
  }

  async function create(pageTitle: string, pageSlug: string) {
    setCreating(true)
    setError('')
    try {
      const result = await api<{ page: Page }>(`/platform/tenants/${tenantId}/website/pages`, {
        method: 'POST',
        body: JSON.stringify({ title: pageTitle, slug: pageSlug, showInNav: pageSlug !== 'home', sortOrder: overview.pages.length * 10 }),
      })
      setTitle('')
      setSlug('')
      setSlugTouched(false)
      await onChanged()
      setOpenId(result.page.id)
    } catch (cause) {
      setError(errorMessage(cause, 'Could not create the page'))
    } finally {
      setCreating(false)
    }
  }

  const existing = new Set(overview.pages.map((p) => p.slug))
  const missingSystem = overview.systemSlugs.filter((s) => !existing.has(s))

  return (
    <div className="space-y-6">
      <Panel title="Pages">
        {overview.pages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No pages yet — the site shows a starter home page built from its features until you create one.</p>
        ) : (
          <ul className="divide-y border">
            {overview.pages.map((page) => (
              <li key={page.id}>
                <button type="button" onClick={() => setOpenId(page.id)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/50">
                  {page.kind === 'HOME' ? <LuHouse className="size-4 shrink-0 text-accent" /> : <LuFileText className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{page.title}</span>
                    <span className="block text-xs text-muted-foreground">/{page.kind === 'HOME' ? '' : page.slug}{page.kind === 'SYSTEM' ? ' · built-in page' : ''}{page.showInNav ? ' · in menu' : ''}</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                      page.isPublished ? 'border-success/40 text-success' : 'text-muted-foreground',
                    )}
                  >
                    {page.isPublished ? (page.hasDraft ? 'Unpublished changes' : 'Live') : 'Not published'}
                  </span>
                  <LuChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Add a page">
        <div className="space-y-4">
          {(!existing.has('home') || missingSystem.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {!existing.has('home') && <Btn busy={creating} onClick={() => void create('Home', 'home')}><LuPlus className="size-3.5" /> Home page</Btn>}
              {missingSystem.map((s) => (
                <Btn key={s} busy={creating} onClick={() => void create(SYSTEM_TITLES[s] ?? s, s)}><LuPlus className="size-3.5" /> {SYSTEM_TITLES[s] ?? s}</Btn>
              ))}
            </div>
          )}
          <form
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e: FormEvent) => { e.preventDefault(); if (title.trim() && slug) void create(title.trim(), slug) }}
          >
            <Field label="Title">
              <TextInput value={title} placeholder="Weddings & Events" onChange={(v) => { setTitle(v); if (!slugTouched) setSlug(slugify(v)) }} />
            </Field>
            <Field label="Address">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">/</span>
                <TextInput value={slug} placeholder="events" onChange={(v) => { setSlug(slugify(v)); setSlugTouched(true) }} />
              </div>
            </Field>
            <Btn variant="primary" size="md" type="submit" busy={creating} disabled={!title.trim() || !slug}><LuPlus className="size-4" /> Create page</Btn>
          </form>
          <p className="text-xs text-muted-foreground">Built-in pages (rooms, dining, wellness, memberships, contact) list live data automatically — their page here only adds extra sections around it.</p>
          {error && <Notice kind="error">{error}</Notice>}
        </div>
      </Panel>
    </div>
  )
}
