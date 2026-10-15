import { useEffect, useMemo, useState } from 'react'
import { LuArrowDown, LuArrowLeft, LuArrowUp, LuChevronDown, LuChevronRight, LuExternalLink, LuPlus, LuSave, LuSend, LuTrash2, LuUndo2 } from 'react-icons/lu'
import { api } from '@/lib/api'
import { FieldList, type RefOptions } from './FieldEditor'
import { cleanProps, initialProps, SECTION_DEFS } from './sectionDefs'
import type { Catalog, Overview, Page, SectionBlock } from './types'
import { Btn, errorMessage, Field, Notice, Panel, TextInput } from './ui'

const newId = (type: string) => `${type}-${Math.random().toString(36).slice(2, 8)}`

function refOptionsFrom(catalog: Catalog | null): RefOptions {
  if (!catalog) return { roomTypes: [], menuCategories: [], serviceCategories: [] }
  const serviceCategories = [...new Set(catalog.services.filter((s) => s.showOnWebsite).map((s) => s.category.name))]
  return {
    roomTypes: catalog.roomTypes.filter((r) => r.showOnWebsite).map((r) => ({ value: r.id, label: r.name })),
    menuCategories: catalog.menuCategories.filter((c) => c.showOnWebsite).map((c) => ({ value: c.name, label: c.name })),
    serviceCategories: serviceCategories.map((name) => ({ value: name, label: name })),
  }
}

/** One-line summary shown on a collapsed block. */
function blockSummary(block: SectionBlock): string {
  const p = block.props
  return String(p.title || p.eyebrow || p.body || '').slice(0, 80)
}

export function PageEditor({ tenantId, pageId, overview, onBack, onDeleted }: {
  tenantId: string; pageId: string; overview: Overview; onBack: () => void; onDeleted: () => void
}) {
  const base = `/platform/tenants/${tenantId}/website`
  const [page, setPage] = useState<Page | null>(null)
  const [meta, setMeta] = useState({ title: '', slug: '', showInNav: true, sortOrder: 0, seoTitle: '', seoDescription: '' })
  const [blocks, setBlocks] = useState<SectionBlock[]>([])
  const [savedJson, setSavedJson] = useState('[]')
  const [open, setOpen] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const themeTypes = overview.themes.find((t) => t.key === overview.website?.themeKey)?.sectionTypes ?? []
  const refs = useMemo(() => refOptionsFrom(catalog), [catalog])
  const dirty = JSON.stringify(blocks) !== savedJson

  function adopt(next: Page) {
    setPage(next)
    setMeta({ title: next.title, slug: next.slug, showInNav: next.showInNav, sortOrder: next.sortOrder, seoTitle: next.seoTitle ?? '', seoDescription: next.seoDescription ?? '' })
    const working = next.draftSections ?? next.sections ?? []
    setBlocks(working)
    setSavedJson(JSON.stringify(working))
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([api<{ page: Page }>(`${base}/pages/${pageId}`), api<Catalog>(`${base}/catalog`)])
      .then(([p, c]) => { if (!cancelled) { adopt(p.page); setCatalog(c) } })
      .catch((cause) => !cancelled && setError(errorMessage(cause, 'Could not load the page')))
    return () => { cancelled = true }
  }, [base, pageId])

  async function run(label: string, action: () => Promise<void>, success: string) {
    setBusy(label)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(success)
    } catch (cause) {
      setError(errorMessage(cause, 'Something went wrong'))
    } finally {
      setBusy(null)
    }
  }

  const cleaned = () => blocks.map((b) => ({ ...b, props: cleanProps(SECTION_DEFS[b.type]?.fields ?? [], b.props) }))

  const saveDraft = () => run('draft', async () => {
    const result = await api<{ page: Page }>(`${base}/pages/${pageId}/draft`, { method: 'PUT', body: JSON.stringify({ sections: cleaned() }) })
    adopt(result.page)
  }, 'Draft saved — use Preview to see it on the site.')

  const publish = () => run('publish', async () => {
    if (dirty) await api(`${base}/pages/${pageId}/draft`, { method: 'PUT', body: JSON.stringify({ sections: cleaned() }) })
    const result = await api<{ page: Page }>(`${base}/pages/${pageId}/publish`, { method: 'POST' })
    adopt(result.page)
  }, 'Published — the page is live.')

  const discard = () => {
    if (!window.confirm('Throw away the unpublished changes and go back to the live version?')) return
    void run('discard', async () => {
      const result = await api<{ page: Page }>(`${base}/pages/${pageId}/discard-draft`, { method: 'POST' })
      adopt(result.page)
    }, 'Changes discarded.')
  }

  const saveMeta = () => run('meta', async () => {
    const result = await api<{ page: Page }>(`${base}/pages/${pageId}`, {
      method: 'PATCH',
      // Home and built-in pages keep their fixed address.
      body: JSON.stringify({ ...meta, ...(page?.kind !== 'STANDARD' ? { slug: undefined } : {}) }),
    })
    setPage((p) => (p ? { ...p, ...result.page } : p))
  }, 'Page details saved.')

  const togglePublished = () => run('visibility', async () => {
    const result = await api<{ page: Page }>(`${base}/pages/${pageId}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !page?.isPublished }) })
    setPage((p) => (p ? { ...p, isPublished: result.page.isPublished } : p))
  }, page?.isPublished ? 'Page hidden from the site.' : 'Page is live.')

  async function remove() {
    if (!window.confirm(`Delete “${page?.title}”? This can't be undone.`)) return
    await run('delete', async () => {
      await api(`${base}/pages/${pageId}`, { method: 'DELETE' })
      onDeleted()
    }, '')
  }

  function addBlock(type: string) {
    const block = { id: newId(type), type, props: initialProps(type) }
    setBlocks((b) => [...b, block])
    setOpen(block.id)
  }

  function moveBlock(index: number, to: number) {
    if (to < 0 || to >= blocks.length) return
    setBlocks((b) => {
      const next = [...b]
      const [item] = next.splice(index, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  if (!page) {
    return error ? <Notice kind="error">{error}</Notice> : <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
  }

  const path = page.kind === 'HOME' ? '/' : `/${page.slug}`
  const previewHref = overview.previewUrl ? `${overview.previewUrl}&to=${encodeURIComponent(path)}` : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
          <LuArrowLeft className="size-4" /> All pages
        </button>
        <div className="flex flex-wrap gap-2">
          {previewHref && (
            <a href={previewHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
              <LuExternalLink className="size-3.5" /> Preview
            </a>
          )}
          {page.draftSections && <Btn onClick={discard} busy={busy === 'discard'}><LuUndo2 className="size-3.5" /> Discard changes</Btn>}
          <Btn onClick={() => void saveDraft()} busy={busy === 'draft'} disabled={!dirty}><LuSave className="size-3.5" /> Save draft</Btn>
          <Btn variant="primary" onClick={() => void publish()} busy={busy === 'publish'}><LuSend className="size-3.5" /> Publish</Btn>
        </div>
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      {dirty && <Notice kind="warning">You have unsaved changes on this page.</Notice>}

      <Panel
        title={`Sections · ${page.title}`}
        actions={
          <select className="input !w-auto !py-1.5 text-xs" value="" onChange={(e) => e.target.value && addBlock(e.target.value)}>
            <option value="">+ Add section…</option>
            {themeTypes.map((type) => <option key={type} value={type}>{SECTION_DEFS[type]?.label ?? type}</option>)}
          </select>
        }
      >
        {blocks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {page.kind === 'SYSTEM' ? 'Optional — this built-in page already lists its live data. Add sections to put content around it.' : 'Empty page. Add a section to begin — a Hero usually comes first.'}
          </p>
        ) : (
          <ol className="space-y-2">
            {blocks.map((block, index) => {
              const def = SECTION_DEFS[block.type]
              const expanded = open === block.id
              return (
                <li key={block.id} className="border bg-background">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button type="button" onClick={() => setOpen(expanded ? null : block.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      {expanded ? <LuChevronDown className="size-4 shrink-0" /> : <LuChevronRight className="size-4 shrink-0" />}
                      <span className="shrink-0 text-xs font-bold uppercase tracking-wide">{def?.label ?? block.type}</span>
                      <span className="truncate text-xs text-muted-foreground">{blockSummary(block)}</span>
                    </button>
                    <button type="button" disabled={index === 0} onClick={() => moveBlock(index, index - 1)} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move up"><LuArrowUp className="size-4" /></button>
                    <button type="button" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, index + 1)} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move down"><LuArrowDown className="size-4" /></button>
                    <button type="button" onClick={() => setBlocks((b) => b.filter((x) => x.id !== block.id))} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove section"><LuTrash2 className="size-4" /></button>
                  </div>
                  {expanded && (
                    <div className="grid gap-4 border-t p-4">
                      {def ? (
                        <>
                          <p className="text-xs text-muted-foreground">{def.description}</p>
                          <FieldList
                            fields={def.fields}
                            values={block.props}
                            onChange={(props) => setBlocks((b) => b.map((x) => (x.id === block.id ? { ...x, props } : x)))}
                            ctx={{ tenantId, refs }}
                          />
                        </>
                      ) : (
                        <Notice kind="warning">This section type isn't editable here yet.</Notice>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
        <div className="mt-4">
          <Btn onClick={() => addBlock(themeTypes.includes('rich-text') ? 'rich-text' : themeTypes[0])} disabled={themeTypes.length === 0}>
            <LuPlus className="size-3.5" /> Add text section
          </Btn>
        </div>
      </Panel>

      <Panel
        title="Page details"
        actions={
          <>
            <Btn onClick={() => void togglePublished()} busy={busy === 'visibility'}>{page.isPublished ? 'Hide from site' : 'Make live'}</Btn>
            <Btn variant="primary" onClick={() => void saveMeta()} busy={busy === 'meta'}>Save details</Btn>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title"><TextInput value={meta.title} onChange={(v) => setMeta({ ...meta, title: v })} /></Field>
          <Field label="Address" hint={page.kind === 'HOME' ? 'The home page always lives at /' : page.kind === 'SYSTEM' ? 'Built-in page — its address is fixed' : 'Changing this breaks old links'}>
            <TextInput value={page.kind === 'HOME' ? '' : meta.slug} onChange={(v) => setMeta({ ...meta, slug: v })} placeholder={page.kind === 'HOME' ? '/' : ''} />
          </Field>
          <Field label="Search title" hint="Defaults to the page title"><TextInput value={meta.seoTitle} onChange={(v) => setMeta({ ...meta, seoTitle: v })} /></Field>
          <Field label="Menu order" hint="Lower numbers come first"><input className="input" type="number" min={0} value={meta.sortOrder} onChange={(e) => setMeta({ ...meta, sortOrder: Number(e.target.value) })} /></Field>
          <Field label="Search description" className="sm:col-span-2"><TextInput multiline value={meta.seoDescription} onChange={(v) => setMeta({ ...meta, seoDescription: v })} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="size-4 accent-accent" checked={meta.showInNav} onChange={(e) => setMeta({ ...meta, showInNav: e.target.checked })} />
            Show in the site's menu
          </label>
        </div>
        <div className="mt-6 border-t pt-4">
          <Btn variant="danger" onClick={() => void remove()} busy={busy === 'delete'}><LuTrash2 className="size-3.5" /> Delete page</Btn>
        </div>
      </Panel>
    </div>
  )
}
