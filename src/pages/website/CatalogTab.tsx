import { useCallback, useEffect, useState } from 'react'
import { LuChevronDown, LuChevronRight } from 'react-icons/lu'
import { api } from '@/lib/api'
import { ImageInput } from './FieldEditor'
import type { Catalog } from './types'
import { Btn, errorMessage, Field, Notice, Panel, TextInput } from './ui'

// "Show online": which of the tenant's live rooms, menu, services and plans
// appear on the website, plus the website-only copy and photos for each.

const money = (v: string | number) => `KSh ${Math.round(Number(v)).toLocaleString()}`

export function CatalogTab({ tenantId }: { tenantId: string }) {
  const base = `/platform/tenants/${tenantId}/website/catalog`
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState('')
  const [openRoom, setOpenRoom] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setCatalog(await api<Catalog>(base))
    } catch (cause) {
      setError(errorMessage(cause, 'Could not load'))
    }
  }, [base])

  useEffect(() => { void load() }, [load])

  /** Saves one change and applies it locally; reloads on failure. */
  async function patch(path: string, body: Record<string, unknown>, apply: (c: Catalog) => Catalog) {
    setError('')
    setCatalog((c) => (c ? apply(c) : c))
    try {
      await api(`${base}/${path}`, { method: 'PATCH', body: JSON.stringify(body) })
    } catch (cause) {
      setError(errorMessage(cause, 'Could not save'))
      void load()
    }
  }

  if (!catalog) return error ? <Notice kind="error">{error}</Notice> : <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>

  const shownItems = (c: Catalog['menuCategories'][number]) => c.menuItems.filter((i) => !i.hideFromWebsite).length

  return (
    <div className="space-y-6">
      {error && <Notice kind="error">{error}</Notice>}
      <Notice kind="info">Changes here save instantly and reach the live site within a minute. Prices always come from the tenant's own records.</Notice>

      <Panel title={`Rooms · ${catalog.roomTypes.filter((r) => r.showOnWebsite).length} of ${catalog.roomTypes.length} shown`}>
        {catalog.roomTypes.length === 0 ? <p className="text-sm text-muted-foreground">No active room types.</p> : (
          <ul className="divide-y border">
            {catalog.roomTypes.map((room) => (
              <li key={room.id}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={room.showOnWebsite}
                    onChange={(e) => void patch(`room-types/${room.id}`, { showOnWebsite: e.target.checked }, (c) => ({ ...c, roomTypes: c.roomTypes.map((r) => (r.id === room.id ? { ...r, showOnWebsite: e.target.checked } : r)) }))}
                    aria-label={`Show ${room.name} online`}
                  />
                  <button type="button" onClick={() => setOpenRoom(openRoom === room.id ? null : room.id)} className="flex flex-1 items-center gap-2 text-left text-sm">
                    {openRoom === room.id ? <LuChevronDown className="size-4" /> : <LuChevronRight className="size-4" />}
                    <span className="font-semibold">{room.name}</span>
                    <span className="text-xs text-muted-foreground">sleeps {room.capacity} · {room.imageUrls.length} photo{room.imageUrls.length === 1 ? '' : 's'}</span>
                  </button>
                </div>
                {openRoom === room.id && <RoomDetails tenantId={tenantId} room={room} onSave={(body) => patch(`room-types/${room.id}`, body, (c) => ({ ...c, roomTypes: c.roomTypes.map((r) => (r.id === room.id ? { ...r, ...body } : r)) }))} />}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Menu · ${catalog.menuCategories.filter((c) => c.showOnWebsite).length} of ${catalog.menuCategories.length} categories shown`}>
        {catalog.menuCategories.length === 0 ? <p className="text-sm text-muted-foreground">No active menu categories.</p> : (
          <ul className="divide-y border">
            {catalog.menuCategories.map((category) => (
              <li key={category.id}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={category.showOnWebsite}
                    onChange={(e) => void patch(`menu-categories/${category.id}`, { showOnWebsite: e.target.checked }, (c) => ({ ...c, menuCategories: c.menuCategories.map((m) => (m.id === category.id ? { ...m, showOnWebsite: e.target.checked } : m)) }))}
                    aria-label={`Show ${category.name} online`}
                  />
                  <button type="button" onClick={() => setOpenMenu(openMenu === category.id ? null : category.id)} className="flex flex-1 items-center gap-2 text-left text-sm">
                    {openMenu === category.id ? <LuChevronDown className="size-4" /> : <LuChevronRight className="size-4" />}
                    <span className="font-semibold">{category.name}</span>
                    <span className="text-xs text-muted-foreground">{shownItems(category)} of {category.menuItems.length} dishes</span>
                  </button>
                </div>
                {openMenu === category.id && (
                  <ul className="grid gap-1 border-t bg-muted/30 px-10 py-3 sm:grid-cols-2">
                    {category.menuItems.map((item) => (
                      <li key={item.id}>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-3.5 accent-accent"
                            checked={!item.hideFromWebsite}
                            onChange={(e) => void patch(`menu-items/${item.id}`, { hideFromWebsite: !e.target.checked }, (c) => ({
                              ...c,
                              menuCategories: c.menuCategories.map((m) => (m.id === category.id ? { ...m, menuItems: m.menuItems.map((i) => (i.id === item.id ? { ...i, hideFromWebsite: !e.target.checked } : i)) } : m)),
                            }))}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{money(item.price)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Services · ${catalog.services.filter((s) => s.showOnWebsite).length} of ${catalog.services.length} shown`}>
        {catalog.services.length === 0 ? <p className="text-sm text-muted-foreground">No active services.</p> : (
          <ul className="divide-y border">
            {catalog.services.map((service) => (
              <li key={service.id} className="flex flex-wrap items-center gap-4 px-3 py-2.5 text-sm">
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={service.showOnWebsite}
                    onChange={(e) => void patch(`services/${service.id}`, { showOnWebsite: e.target.checked }, (c) => ({ ...c, services: c.services.map((s) => (s.id === service.id ? { ...s, showOnWebsite: e.target.checked } : s)) }))}
                  />
                  <span className="font-semibold">{service.name}</span>
                  <span className="text-xs text-muted-foreground">{service.category.name}</span>
                </label>
                <label className="flex items-center gap-2 text-xs" title={service.durationMinutes ? '' : 'Needs a duration before it can be booked'}>
                  <input
                    type="checkbox"
                    className="size-3.5 accent-accent"
                    disabled={!service.showOnWebsite}
                    checked={service.bookableOnline}
                    onChange={(e) => void patch(`services/${service.id}`, { bookableOnline: e.target.checked }, (c) => ({ ...c, services: c.services.map((s) => (s.id === service.id ? { ...s, bookableOnline: e.target.checked } : s)) }))}
                  />
                  Bookable online
                </label>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Membership plans · ${catalog.membershipPlans.filter((p) => p.showOnWebsite).length} of ${catalog.membershipPlans.length} shown`}>
        {catalog.membershipPlans.length === 0 ? <p className="text-sm text-muted-foreground">No active membership plans.</p> : (
          <ul className="divide-y border">
            {catalog.membershipPlans.map((plan) => (
              <li key={plan.id} className="space-y-2 px-3 py-2.5 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={plan.showOnWebsite}
                    onChange={(e) => void patch(`membership-plans/${plan.id}`, { showOnWebsite: e.target.checked }, (c) => ({ ...c, membershipPlans: c.membershipPlans.map((p) => (p.id === plan.id ? { ...p, showOnWebsite: e.target.checked } : p)) }))}
                  />
                  <span className="font-semibold">{plan.name}</span>
                  <span className="text-xs text-muted-foreground">{money(plan.price)}</span>
                </label>
                {plan.showOnWebsite && (
                  <HighlightsInput
                    value={plan.highlights}
                    onSave={(highlights) => patch(`membership-plans/${plan.id}`, { highlights }, (c) => ({ ...c, membershipPlans: c.membershipPlans.map((p) => (p.id === plan.id ? { ...p, highlights } : p)) }))}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function RoomDetails({ tenantId, room, onSave }: { tenantId: string; room: Catalog['roomTypes'][number]; onSave: (body: { websiteDescription?: string | null; imageUrls?: string[] }) => Promise<void> }) {
  const [description, setDescription] = useState(room.websiteDescription ?? '')
  const [images, setImages] = useState(room.imageUrls)
  const [saving, setSaving] = useState(false)
  const dirty = description !== (room.websiteDescription ?? '') || JSON.stringify(images) !== JSON.stringify(room.imageUrls)
  return (
    <div className="grid gap-4 border-t bg-muted/30 p-4">
      <Field label="Website description" hint={room.description ? `Defaults to: “${room.description.slice(0, 90)}”` : 'A sentence or two about the room'}>
        <TextInput multiline value={description} onChange={setDescription} />
      </Field>
      <Field label="Photos" hint="The first photo is the cover">
        <div className="space-y-2">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="flex items-center gap-2">
              <div className="flex-1"><ImageInput withAlt={false} ctx={{ tenantId }} value={{ url }} onChange={(v) => setImages(v ? images.map((x, j) => (j === i ? v.url : x)) : images.filter((_, j) => j !== i))} /></div>
              <Btn variant="ghost" onClick={() => setImages(images.filter((_, j) => j !== i))}>Remove</Btn>
            </div>
          ))}
          <ImageInput withAlt={false} ctx={{ tenantId }} value={undefined} onChange={(v) => v?.url && setImages([...images, v.url])} />
        </div>
      </Field>
      <div>
        <Btn variant="primary" disabled={!dirty} busy={saving} onClick={async () => { setSaving(true); await onSave({ websiteDescription: description || null, imageUrls: images }); setSaving(false) }}>
          Save room
        </Btn>
      </div>
    </div>
  )
}

function HighlightsInput({ value, onSave }: { value: string[]; onSave: (v: string[]) => Promise<void> }) {
  const [text, setText] = useState(value.join('\n'))
  const next = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return (
    <div className="ml-6 space-y-2">
      <TextInput multiline rows={3} value={text} placeholder={'One highlight per line\nUnlimited gym access\nTwo spa treatments a month'} onChange={setText} />
      {JSON.stringify(next) !== JSON.stringify(value) && <Btn onClick={() => void onSave(next)}>Save highlights</Btn>}
    </div>
  )
}
