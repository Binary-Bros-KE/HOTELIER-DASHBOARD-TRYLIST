// Editor forms for each section block type. Mirrors the prop schemas in
// WEBSITE/src/engine/sections.ts — when a section gains a prop there, add its
// field here. The website validates (and defaults) every prop itself, so an
// omitted field is always safe.

export type RefSource = 'roomTypes' | 'menuCategories' | 'serviceCategories'

export type FieldDef =
  | { key: string; label: string; kind: 'text' | 'textarea'; hint?: string; placeholder?: string }
  | { key: string; label: string; kind: 'image' | 'link' | 'boolean'; hint?: string }
  | { key: string; label: string; kind: 'number'; min: number; max: number; hint?: string }
  | { key: string; label: string; kind: 'select'; options: { value: string; label: string }[]; hint?: string }
  | { key: string; label: string; kind: 'tags'; hint?: string; placeholder?: string }
  | { key: string; label: string; kind: 'images'; withCaption?: boolean; hint?: string }
  | { key: string; label: string; kind: 'refs'; source: RefSource; hint?: string }
  | { key: string; label: string; kind: 'list'; itemLabel: string; fields: FieldDef[]; hint?: string }

export type SectionDef = { label: string; description: string; fields: FieldDef[] }

const heading: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', kind: 'text', hint: 'Small capitals above the title, e.g. “Stay”' },
  { key: 'title', label: 'Title', kind: 'text' },
  { key: 'intro', label: 'Intro', kind: 'textarea' },
]

export const AMENITY_ICONS = [
  'pool', 'spa', 'gym', 'conference', 'bar', 'kids', 'grooming', 'events',
  'dining', 'wifi', 'parking', 'concierge', 'garden', 'breakfast', 'star',
] as const

export const SECTION_DEFS: Record<string, SectionDef> = {
  hero: {
    label: 'Hero',
    description: 'Full-width photographs with the page headline. Best as the first block.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'title', label: 'Headline', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea' },
      { key: 'images', label: 'Photographs', kind: 'images', hint: 'Several photos crossfade slowly' },
      { key: 'primaryCta', label: 'Main button', kind: 'link' },
      { key: 'secondaryCta', label: 'Second button', kind: 'link' },
      { key: 'showBookingBar', label: 'Show the check-availability bar (when room booking is on)', kind: 'boolean' },
      { key: 'height', label: 'Height', kind: 'select', options: [{ value: 'full', label: 'Full screen' }, { value: 'tall', label: 'Tall' }] },
    ],
  },
  'rich-text': {
    label: 'Text',
    description: 'A heading and a few paragraphs. Blank lines separate paragraphs.',
    fields: [
      ...heading,
      { key: 'body', label: 'Text', kind: 'textarea' },
      { key: 'align', label: 'Alignment', kind: 'select', options: [{ value: 'center', label: 'Centred' }, { value: 'left', label: 'Left' }] },
      { key: 'signature', label: 'Closing line', kind: 'text', hint: 'Small capitals under the text, e.g. opening hours' },
    ],
  },
  'image-text': {
    label: 'Image & text',
    description: 'A photograph beside a heading, text, bullet points and a link.',
    fields: [
      ...heading,
      { key: 'body', label: 'Text', kind: 'textarea' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'imageSide', label: 'Image side', kind: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
      { key: 'bullets', label: 'Bullet points', kind: 'tags', placeholder: 'Add a point and press Enter' },
      { key: 'cta', label: 'Link', kind: 'link' },
      { key: 'tone', label: 'Background', kind: 'select', options: [{ value: 'light', label: 'Ivory' }, { value: 'sand', label: 'Sand' }] },
    ],
  },
  'rooms-showcase': {
    label: 'Rooms',
    description: 'Room types shown on the website, with photos and “from” prices.',
    fields: [
      ...heading,
      { key: 'roomTypeIds', label: 'Room types', kind: 'refs', source: 'roomTypes', hint: 'Pick and order specific rooms, or leave empty for all shown rooms' },
      { key: 'limit', label: 'How many', kind: 'number', min: 1, max: 24 },
      { key: 'cta', label: 'Button', kind: 'link' },
    ],
  },
  'menu-highlights': {
    label: 'Menu highlights',
    description: 'A classic menu card with a few categories from the live menu.',
    fields: [
      ...heading,
      { key: 'categories', label: 'Categories', kind: 'refs', source: 'menuCategories', hint: 'Leave empty for the first few shown categories' },
      { key: 'itemsPerCategory', label: 'Dishes per category', kind: 'number', min: 1, max: 30 },
      { key: 'cta', label: 'Button', kind: 'link' },
    ],
  },
  'services-showcase': {
    label: 'Services',
    description: 'Spa, gym and other services shown on the website.',
    fields: [
      ...heading,
      { key: 'categories', label: 'Categories', kind: 'refs', source: 'serviceCategories', hint: 'Leave empty for all' },
      { key: 'limit', label: 'How many', kind: 'number', min: 1, max: 24 },
      { key: 'cta', label: 'Button', kind: 'link' },
    ],
  },
  'membership-plans': {
    label: 'Membership plans',
    description: 'Plan cards for every membership shown on the website.',
    fields: [...heading, { key: 'cta', label: 'Link', kind: 'link' }],
  },
  amenities: {
    label: 'Amenities',
    description: 'A grid of facilities, each with an icon and a short line.',
    fields: [
      ...heading,
      {
        key: 'items', label: 'Amenities', kind: 'list', itemLabel: 'amenity',
        fields: [
          { key: 'icon', label: 'Icon', kind: 'select', options: AMENITY_ICONS.map((i) => ({ value: i, label: i })) },
          { key: 'title', label: 'Title', kind: 'text' },
          { key: 'text', label: 'Text', kind: 'textarea' },
        ],
      },
      { key: 'tone', label: 'Background', kind: 'select', options: [{ value: 'sand', label: 'Sand' }, { value: 'light', label: 'Ivory' }, { value: 'dark', label: 'Dark' }] },
    ],
  },
  gallery: {
    label: 'Gallery',
    description: 'A mosaic of photographs. Six at a time fill the grid neatly.',
    fields: [...heading, { key: 'images', label: 'Photographs', kind: 'images', withCaption: true }],
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Guest quotes. Only use real ones.',
    fields: [
      ...heading,
      {
        key: 'items', label: 'Quotes', kind: 'list', itemLabel: 'quote',
        fields: [
          { key: 'quote', label: 'Quote', kind: 'textarea' },
          { key: 'author', label: 'Guest', kind: 'text' },
          { key: 'origin', label: 'From', kind: 'text', placeholder: 'e.g. Nairobi' },
        ],
      },
    ],
  },
  faq: {
    label: 'Questions',
    description: 'Frequently asked questions that open on click.',
    fields: [
      ...heading,
      {
        key: 'items', label: 'Questions', kind: 'list', itemLabel: 'question',
        fields: [
          { key: 'question', label: 'Question', kind: 'text' },
          { key: 'answer', label: 'Answer', kind: 'textarea' },
        ],
      },
    ],
  },
  cta: {
    label: 'Call to action',
    description: 'A dark band over a photograph with one or two buttons.',
    fields: [
      ...heading,
      { key: 'image', label: 'Background photo', kind: 'image' },
      { key: 'primaryCta', label: 'Main button', kind: 'link' },
      { key: 'secondaryCta', label: 'Second button', kind: 'link' },
    ],
  },
  'contact-map': {
    label: 'Contact & map',
    description: 'Address, phone and email from the business profile, beside the map.',
    fields: [
      ...heading,
      { key: 'hours', label: 'Opening hours', kind: 'text', placeholder: 'Monday – Sunday · 6:00 AM – 11:00 PM' },
      { key: 'showMap', label: 'Show the map', kind: 'boolean' },
    ],
  },
}

/** Starting props for a newly added block. */
export function initialProps(type: string): Record<string, unknown> {
  const label = SECTION_DEFS[type]?.label ?? type
  if (type === 'hero') return { title: 'A new headline', showBookingBar: true, height: 'full' }
  if (type === 'contact-map') return { eyebrow: 'Visit', title: 'Find us', showMap: true }
  return { title: label }
}

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)

/** Drops blank values and half-filled links/images so the website's defaults apply. */
export function cleanProps(fields: FieldDef[], props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    const value = props[field.key]
    if (isEmpty(value)) continue
    switch (field.kind) {
      case 'link': {
        const link = value as { label?: string; href?: string }
        if (link.label?.trim() && link.href?.trim()) out[field.key] = { label: link.label.trim(), href: link.href.trim() }
        break
      }
      case 'image': {
        const image = value as { url?: string; alt?: string }
        if (image.url?.trim()) out[field.key] = { url: image.url.trim(), alt: image.alt?.trim() ?? '' }
        break
      }
      case 'images':
        out[field.key] = (value as { url: string; alt?: string; caption?: string }[])
          .filter((i) => i.url?.trim())
          .map((i) => ({ url: i.url.trim(), alt: i.alt?.trim() ?? '', ...(i.caption?.trim() ? { caption: i.caption.trim() } : {}) }))
        break
      case 'list':
        out[field.key] = (value as Record<string, unknown>[])
          .map((item) => cleanProps(field.fields, item))
          .filter((item) => Object.keys(item).length > 0)
        break
      case 'text':
      case 'textarea':
        out[field.key] = (value as string).trim()
        break
      default:
        out[field.key] = value
    }
  }
  return out
}
