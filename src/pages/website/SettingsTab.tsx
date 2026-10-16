import { useState } from 'react'
import type { FormEvent } from 'react'
import { LuCheck } from 'react-icons/lu'
import { api } from '@/lib/api'
import { ImageInput } from './FieldEditor'
import type { Overview, Website } from './types'
import { Btn, errorMessage, Field, Notice, Panel, TextInput, Toggle } from './ui'

const SOCIALS = [
  ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['x', 'X (Twitter)'],
  ['youtube', 'YouTube'], ['tripadvisor', 'Tripadvisor'], ['google', 'Google reviews link'], ['linkedin', 'LinkedIn'],
] as const

type Draft = Omit<Website, 'id' | 'tenantId' | 'status' | 'publishedAt'>

const EMPTY: Draft = {
  themeKey: 'aurora', primaryColor: null, accentColor: null, fontFamily: null, logoUrl: null, faviconUrl: null,
  siteTitle: null, tagline: null, seoTitle: null, seoDescription: null, ogImageUrl: null, analyticsId: null,
  whatsappNumber: null, mapEmbedUrl: null, latitude: null, longitude: null, socialLinks: {},
  featureRoomBooking: false, featureMenu: false, featureAppointments: false, featureMemberships: false, featureInquiries: true,
  bookingConfirmation: 'MANUAL', requirePayment: false, depositPercent: '100', depositMinimum: '0', holdMinutes: 30, bookingLocationId: null,
  redirects: [],
}

function toDraft(website: Website | null): Draft {
  if (!website) return EMPTY
  const { id: _id, tenantId: _t, status: _s, publishedAt: _p, ...rest } = website
  return { ...rest, socialLinks: rest.socialLinks ?? {} }
}

function ColorInput({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex gap-2">
      <input type="color" className="h-10 w-12 shrink-0 cursor-pointer border bg-background p-1" value={value ?? '#2f4a3e'} onChange={(e) => onChange(e.target.value)} />
      <TextInput value={value} placeholder="Inherit from the tenant's theme" onChange={(v) => onChange(v || null)} />
    </div>
  )
}

export function SettingsTab({ tenantId, overview, onSaved }: { tenantId: string; overview: Overview; onSaved: (website: Website) => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(overview.website))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  // Edited as text ("/from /to" per line); parsed on save.
  const [redirectText, setRedirectText] = useState(() => (overview.website?.redirects ?? []).map((r) => `${r.from} ${r.to}`).join('\n'))
  const creating = !overview.website

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      // Blank social links are dropped rather than saved as empty strings.
      const socialLinks = Object.fromEntries(Object.entries(draft.socialLinks).filter(([, url]) => url?.trim()))
      const result = await api<{ website: Website }>(`/platform/tenants/${tenantId}/website`, {
        method: 'PUT',
        body: JSON.stringify({
          ...draft,
          socialLinks,
          redirects: redirectText.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
            const [from, to] = l.split(/\s+/)
            return { from, to: to ?? '' }
          }),
        }),
      })
      setDraft(toDraft(result.website))
      onSaved(result.website)
      setNotice(creating ? 'Website created. Add pages next, then publish.' : 'Settings saved.')
    } catch (cause) {
      setError(errorMessage(cause, 'Could not save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {creating && <Notice kind="info">This tenant has no website yet. Choose a theme and save to create it — it stays private until you publish.</Notice>}

      <Panel title="Theme & branding">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Theme">
            <select className="input" value={draft.themeKey} onChange={(e) => set('themeKey', e.target.value)}>
              {overview.themes.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Site name" hint="Defaults to the business name">
            <TextInput value={draft.siteTitle} onChange={(v) => set('siteTitle', v)} />
          </Field>
          <Field label="Tagline" className="sm:col-span-2">
            <TextInput value={draft.tagline} placeholder="A garden retreat on the Karatina–Nairobi Highway" onChange={(v) => set('tagline', v)} />
          </Field>
          <Field label="Brand colour" hint="The theme softens it automatically">
            <ColorInput value={draft.primaryColor} onChange={(v) => set('primaryColor', v)} />
          </Field>
          <Field label="Accent colour" hint="Fine details — rules, small capitals">
            <ColorInput value={draft.accentColor} onChange={(v) => set('accentColor', v)} />
          </Field>
          <Field label="Logo" hint="Defaults to the tenant's logo">
            <ImageInput withAlt={false} ctx={{ tenantId }} value={draft.logoUrl ? { url: draft.logoUrl } : undefined} onChange={(v) => set('logoUrl', v?.url ?? null)} />
          </Field>
          <Field label="Browser icon" hint="Square image; defaults to the logo">
            <ImageInput withAlt={false} ctx={{ tenantId }} value={draft.faviconUrl ? { url: draft.faviconUrl } : undefined} onChange={(v) => set('faviconUrl', v?.url ?? null)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Search & sharing">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Search title" hint="About 60 characters">
            <TextInput value={draft.seoTitle} placeholder="Omega Gardens Hotel & Spa — Karatina" onChange={(v) => set('seoTitle', v)} />
          </Field>
          <Field label="Google Analytics ID" hint="Optional, e.g. G-XXXXXXX">
            <TextInput value={draft.analyticsId} onChange={(v) => set('analyticsId', v)} />
          </Field>
          <Field label="Search description" hint="About 155 characters — shown under the title in Google" className="sm:col-span-2">
            <TextInput multiline value={draft.seoDescription} onChange={(v) => set('seoDescription', v)} />
          </Field>
          <Field label="Sharing image" hint="Shown when the site is shared on WhatsApp, Facebook…" className="sm:col-span-2">
            <ImageInput withAlt={false} ctx={{ tenantId }} value={draft.ogImageUrl ? { url: draft.ogImageUrl } : undefined} onChange={(v) => set('ogImageUrl', v?.url ?? null)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Contact & location">
        <Notice kind="info">Phone, email and address come from the tenant's business profile — edit them on the tenant page.</Notice>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp number" hint="Shows a floating chat button">
            <TextInput value={draft.whatsappNumber} placeholder="+254 7…" onChange={(v) => set('whatsappNumber', v)} />
          </Field>
          <Field label="Google Maps embed link" hint="Google Maps ▸ Share ▸ Embed a map ▸ copy the src=&quot;…&quot; link">
            <TextInput value={draft.mapEmbedUrl} placeholder="https://www.google.com/maps/embed?pb=…" onChange={(v) => set('mapEmbedUrl', v)} />
          </Field>
          <Field label="Latitude"><TextInput value={draft.latitude} onChange={(v) => set('latitude', v)} /></Field>
          <Field label="Longitude"><TextInput value={draft.longitude} onChange={(v) => set('longitude', v)} /></Field>
        </div>
      </Panel>

      <Panel title="Social media">
        <div className="grid gap-5 sm:grid-cols-2">
          {SOCIALS.map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput value={draft.socialLinks[key]} placeholder="https://…" onChange={(v) => set('socialLinks', { ...draft.socialLinks, [key]: v })} />
            </Field>
          ))}
        </div>
      </Panel>

      <Panel title="Features">
        <p className="mb-4 text-xs text-muted-foreground">Each feature also needs its module enabled for the tenant (Room Management, Sales, Services) — a feature whose module is off stays hidden.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Online room booking" hint="Availability search and booking requests" checked={draft.featureRoomBooking} onChange={(v) => set('featureRoomBooking', v)} />
          <Toggle label="Online menu" hint="Shown menu categories, display only" checked={draft.featureMenu} onChange={(v) => set('featureMenu', v)} />
          <Toggle label="Appointment booking" hint="For services marked bookable online" checked={draft.featureAppointments} onChange={(v) => set('featureAppointments', v)} />
          <Toggle label="Membership plans" hint="Gym, spa and club memberships" checked={draft.featureMemberships} onChange={(v) => set('featureMemberships', v)} />
          <Toggle label="Enquiry form" hint="Contact and event enquiries" checked={draft.featureInquiries} onChange={(v) => set('featureInquiries', v)} />
        </div>
      </Panel>

      <Panel title="Online booking rules">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Confirmation">
            <select className="input" value={draft.bookingConfirmation} onChange={(e) => set('bookingConfirmation', e.target.value as Draft['bookingConfirmation'])}>
              <option value="MANUAL">Staff confirm each booking</option>
              <option value="AUTO">Confirm automatically</option>
            </select>
          </Field>
          <Field label="File bookings under" hint="The location web bookings belong to">
            <select className="input" value={draft.bookingLocationId ?? ''} onChange={(e) => set('bookingLocationId', e.target.value || null)}>
              <option value="">No specific location</option>
              {overview.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Toggle label="Require an M-Pesa deposit for room bookings" hint="The guest pays by M-Pesa prompt while booking; the room is held until they do. Needs M-Pesa set up on the booking location." checked={draft.requirePayment} onChange={(v) => set('requirePayment', v)} />
          </div>
          <Field label="Deposit (% of the stay)" hint="100 = pay in full">
            <input className="input" type="number" min={1} max={100} disabled={!draft.requirePayment} value={draft.depositPercent} onChange={(e) => set('depositPercent', e.target.value)} />
          </Field>
          <Field label="Minimum deposit (KSh)" hint="The guest pays whichever is higher — never more than the stay">
            <input className="input" type="number" min={0} step={100} disabled={!draft.requirePayment} value={draft.depositMinimum} onChange={(e) => set('depositMinimum', e.target.value)} />
          </Field>
          <Field label="Hold unpaid bookings for (minutes)" hint="Unpaid bookings are released after this">
            <input className="input" type="number" min={5} max={1440} value={draft.holdMinutes} onChange={(e) => set('holdMinutes', Number(e.target.value))} />
          </Field>
        </div>
      </Panel>

      <Panel title="Redirects from old addresses">
        <p className="mb-3 text-xs text-muted-foreground">
          Send links and search results for a previous website's pages to the right new page (permanent 301). One per line:
          <code className="mx-1">/old-address /new-address</code>. End the old address with <code>/*</code> to cover everything under it.
        </p>
        <TextInput
          multiline
          rows={6}
          value={redirectText}
          placeholder={'/accomodation /rooms\n/restaurant-menu/* /dining'}
          onChange={setRedirectText}
        />
      </Panel>

      {error && <Notice kind="error">{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      <div className="flex justify-end">
        <Btn variant="primary" size="md" busy={saving} type="submit">
          <LuCheck className="size-4" /> {creating ? 'Create website' : 'Save settings'}
        </Btn>
      </div>
    </form>
  )
}
