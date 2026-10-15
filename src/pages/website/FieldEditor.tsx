import { useState } from 'react'
import { LuArrowDown, LuArrowUp, LuImagePlus, LuPlus, LuX } from 'react-icons/lu'
import { assetUrl } from '@/lib/api'
import { MediaPickerModal } from './MediaLibrary'
import type { FieldDef } from './sectionDefs'
import { Btn, Field, TextInput } from './ui'

// Renders any section's form from its FieldDef list (see sectionDefs.ts).

export type RefOptions = Record<'roomTypes' | 'menuCategories' | 'serviceCategories', { value: string; label: string }[]>

type Ctx = { tenantId: string; refs: RefOptions }
type Image = { url: string; alt?: string; caption?: string }
type Link = { label?: string; href?: string }

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function MoveButtons({ index, length, onMove, onRemove }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <span className="flex shrink-0 gap-0.5">
      <button type="button" disabled={index === 0} onClick={() => onMove(index - 1)} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move up"><LuArrowUp className="size-3.5" /></button>
      <button type="button" disabled={index === length - 1} onClick={() => onMove(index + 1)} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move down"><LuArrowDown className="size-3.5" /></button>
      <button type="button" onClick={onRemove} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove"><LuX className="size-3.5" /></button>
    </span>
  )
}

export function ImageInput({ value, onChange, ctx, withAlt = true }: { value: Image | undefined; onChange: (v: Image | undefined) => void; ctx: Pick<Ctx, 'tenantId'>; withAlt?: boolean }) {
  const [picking, setPicking] = useState(false)
  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => setPicking(true)} className="flex aspect-[4/3] w-28 shrink-0 items-center justify-center overflow-hidden border bg-muted text-muted-foreground hover:border-accent">
        {value?.url ? <img src={assetUrl(value.url)} alt="" className="size-full object-cover" /> : <LuImagePlus className="size-5" />}
      </button>
      <div className="flex-1 space-y-2">
        <TextInput value={value?.url} placeholder="Choose from the library, or paste https://…" onChange={(url) => onChange(url ? { ...value, url } : undefined)} />
        {withAlt && <TextInput value={value?.alt} placeholder="Describe the image (for screen readers & Google)" onChange={(alt) => value && onChange({ ...value, alt })} />}
      </div>
      {picking && <MediaPickerModal tenantId={ctx.tenantId} onClose={() => setPicking(false)} onPick={(m) => onChange({ url: m.url, alt: value?.alt || m.altText || '' })} />}
    </div>
  )
}

function ImagesInput({ value, onChange, withCaption, ctx }: { value: Image[]; onChange: (v: Image[]) => void; withCaption?: boolean; ctx: Ctx }) {
  const [picking, setPicking] = useState(false)
  return (
    <div className="space-y-2">
      {value.map((image, i) => (
        <div key={`${image.url}-${i}`} className="flex items-center gap-3 border bg-background p-2">
          <img src={assetUrl(image.url)} alt="" className="aspect-[4/3] w-20 shrink-0 object-cover" />
          <div className="flex-1 space-y-1.5">
            <TextInput value={image.alt} placeholder="Description" onChange={(alt) => onChange(value.map((x, j) => (j === i ? { ...x, alt } : x)))} />
            {withCaption && <TextInput value={image.caption} placeholder="Caption (shown on hover)" onChange={(caption) => onChange(value.map((x, j) => (j === i ? { ...x, caption } : x)))} />}
          </div>
          <MoveButtons index={i} length={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Btn type="button" onClick={() => setPicking(true)}><LuImagePlus className="size-3.5" /> Add photograph</Btn>
      {picking && <MediaPickerModal tenantId={ctx.tenantId} onClose={() => setPicking(false)} onPick={(m) => onChange([...value, { url: m.url, alt: m.altText ?? '' }])} />}
    </div>
  )
}

function LinkInput({ value, onChange }: { value: Link | undefined; onChange: (v: Link) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[0.8fr_1.2fr]">
      <TextInput value={value?.label} placeholder="Button text" onChange={(label) => onChange({ ...value, label })} />
      <TextInput value={value?.href} placeholder="/rooms · tel:+254… · https://…" onChange={(href) => onChange({ ...value, href })} />
    </div>
  )
}

function TagsInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setDraft('')
  }
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 border bg-muted px-2 py-1 text-xs">
              {tag}
              <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}><LuX className="size-3" /></button>
            </span>
          ))}
        </div>
      )}
      <input
        className="input"
        value={draft}
        placeholder={placeholder ?? 'Type and press Enter'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        onBlur={add}
      />
    </div>
  )
}

function RefsInput({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[] }) {
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? `${v} (no longer shown)`
  const remaining = options.filter((o) => !value.includes(o.value))
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={v} className="flex items-center justify-between gap-2 border bg-background px-3 py-1.5 text-sm">
          <span>{labelOf(v)}</span>
          <MoveButtons index={i} length={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((x) => x !== v))} />
        </div>
      ))}
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing is switched on under “Show online” yet.</p>
      ) : remaining.length > 0 && (
        <select className="input" value="" onChange={(e) => e.target.value && onChange([...value, e.target.value])}>
          <option value="">Add…</option>
          {remaining.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  )
}

function ListInput({ field, value, onChange, ctx }: { field: Extract<FieldDef, { kind: 'list' }>; value: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void; ctx: Ctx }) {
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="border bg-background">
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <span className="text-xs font-semibold capitalize text-muted-foreground">{field.itemLabel} {i + 1}</span>
            <MoveButtons index={i} length={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
          <div className="grid gap-3 p-3">
            <FieldList fields={field.fields} values={item} onChange={(next) => onChange(value.map((x, j) => (j === i ? next : x)))} ctx={ctx} />
          </div>
        </div>
      ))}
      <Btn type="button" onClick={() => onChange([...value, {}])}><LuPlus className="size-3.5" /> Add {field.itemLabel}</Btn>
    </div>
  )
}

function FieldInput({ field, value, onChange, ctx }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; ctx: Ctx }) {
  switch (field.kind) {
    case 'text':
      return <TextInput value={value as string} placeholder={field.placeholder} onChange={onChange} />
    case 'textarea':
      return <TextInput multiline rows={4} value={value as string} placeholder={field.placeholder} onChange={onChange} />
    case 'number':
      return <input className="input" type="number" min={field.min} max={field.max} value={(value as number | undefined) ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
    case 'boolean':
      return null
    case 'select':
      return (
        <select className="input" value={(value as string) ?? field.options[0]?.value} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    case 'image':
      return <ImageInput value={value as Image | undefined} onChange={onChange} ctx={ctx} />
    case 'images':
      return <ImagesInput value={(value as Image[]) ?? []} onChange={onChange} withCaption={field.withCaption} ctx={ctx} />
    case 'link':
      return <LinkInput value={value as Link | undefined} onChange={onChange} />
    case 'tags':
      return <TagsInput value={(value as string[]) ?? []} onChange={onChange} placeholder={field.placeholder} />
    case 'refs':
      return <RefsInput value={(value as string[]) ?? []} onChange={onChange} options={ctx.refs[field.source]} />
    case 'list':
      return <ListInput field={field} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} ctx={ctx} />
  }
}

export function FieldList({ fields, values, onChange, ctx }: { fields: FieldDef[]; values: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; ctx: Ctx }) {
  return (
    <>
      {fields.map((field) => {
        const set = (v: unknown) => onChange({ ...values, [field.key]: v })
        if (field.kind === 'boolean') {
          return (
            <label key={field.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-accent" checked={Boolean(values[field.key] ?? true)} onChange={(e) => set(e.target.checked)} />
              {field.label}
            </label>
          )
        }
        return (
          <Field key={field.key} label={field.label} hint={field.hint}>
            <FieldInput field={field} value={values[field.key]} onChange={set} ctx={ctx} />
          </Field>
        )
      })}
    </>
  )
}
