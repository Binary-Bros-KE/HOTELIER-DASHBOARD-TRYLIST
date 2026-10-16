// Shapes returned by /api/platform/tenants/:id/website (NODE website.routes.ts).

export type WebsiteStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED'

export type Website = {
  id: string
  tenantId: string
  themeKey: string
  status: WebsiteStatus
  publishedAt: string | null
  primaryColor: string | null
  accentColor: string | null
  fontFamily: string | null
  logoUrl: string | null
  faviconUrl: string | null
  siteTitle: string | null
  tagline: string | null
  seoTitle: string | null
  seoDescription: string | null
  ogImageUrl: string | null
  analyticsId: string | null
  whatsappNumber: string | null
  mapEmbedUrl: string | null
  latitude: string | null
  longitude: string | null
  socialLinks: Record<string, string>
  featureRoomBooking: boolean
  featureMenu: boolean
  featureAppointments: boolean
  featureMemberships: boolean
  featureInquiries: boolean
  bookingConfirmation: 'AUTO' | 'MANUAL'
  requirePayment: boolean
  depositPercent: string
  depositMinimum: string
  holdMinutes: number
  bookingLocationId: string | null
  redirects: { from: string; to: string }[]
}

export type Theme = { key: string; name: string; description: string | null; version: string; sectionTypes: string[] }

export type Domain = {
  id: string
  hostname: string
  isPrimary: boolean
  status: 'PENDING_DNS' | 'VERIFYING' | 'ACTIVE' | 'FAILED'
  verificationToken: string
  verifiedAt: string | null
  lastCheckedAt: string | null
  lastError: string | null
}

export type PageSummary = {
  id: string
  slug: string
  title: string
  kind: 'HOME' | 'STANDARD' | 'SYSTEM'
  isPublished: boolean
  showInNav: boolean
  sortOrder: number
  updatedAt: string
  hasDraft: boolean
}

export type SectionBlock = { id: string; type: string; props: Record<string, unknown> }

export type Page = Omit<PageSummary, 'hasDraft'> & {
  sections: SectionBlock[]
  draftSections: SectionBlock[] | null
  seoTitle: string | null
  seoDescription: string | null
  ogImageUrl: string | null
}

export type Overview = {
  website: Website | null
  moduleEnabled: boolean
  themes: Theme[]
  domains: Domain[]
  pages: PageSummary[]
  locations: { id: string; name: string }[]
  siteUrl: string | null
  previewUrl: string | null
  systemSlugs: string[]
  siteDomain: string | null
  /** Where clients CNAME their own domain (null = custom domains not set up on the server). */
  cnameTarget: string | null
}

export type Inquiry = {
  id: string
  kind: 'GENERAL' | 'EVENT' | 'ROOM' | 'SERVICE' | 'MEMBERSHIP'
  status: 'NEW' | 'CONTACTED' | 'CLOSED' | 'SPAM'
  name: string
  email: string | null
  phone: string | null
  subject: string | null
  message: string
  details: Record<string, string | number> | null
  sourcePage: string | null
  createdAt: string
}

export type Media = { id: string; url: string; fileName: string; mimeType: string; sizeBytes: number; altText: string | null; createdAt: string }

export type Catalog = {
  roomTypes: { id: string; name: string; description: string | null; showOnWebsite: boolean; websiteDescription: string | null; imageUrls: string[]; capacity: number }[]
  menuCategories: { id: string; name: string; showOnWebsite: boolean; menuItems: { id: string; name: string; price: string; hideFromWebsite: boolean }[] }[]
  services: { id: string; name: string; description: string | null; showOnWebsite: boolean; bookableOnline: boolean; websiteDescription: string | null; imageUrl: string | null; durationMinutes: number | null; category: { name: string } }[]
  membershipPlans: { id: string; name: string; price: string; showOnWebsite: boolean; highlights: string[] }[]
}
