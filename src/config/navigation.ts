import type { IconType } from 'react-icons'
import {
  LuLayoutDashboard,
  LuBuilding2,
  LuLayers,
  LuStore,
  LuUsers,
  LuCreditCard,
  LuActivity,
  LuLifeBuoy,
  LuSettings,
} from 'react-icons/lu'

export type NavItem = {
  label: string
  to: string
  icon: IconType
  /** Marks a route that has a real page today vs. a "coming soon" stub. */
  ready?: boolean
}

// Mirrors the Blue Ledger admin dash layout. `ready: true` items have a
// built page; the rest render the shared ComingSoon placeholder so the nav
// matches the reference without dead links.
export const navigation: NavItem[] = [
  { label: 'Overview', to: '/overview', icon: LuLayoutDashboard },
  { label: 'Tenants', to: '/tenants', icon: LuBuilding2, ready: true },
  { label: 'Plans', to: '/plans', icon: LuLayers, ready: true },
  { label: 'Outlets', to: '/outlets', icon: LuStore },
  { label: 'Accounts', to: '/accounts', icon: LuUsers, ready: true },
  { label: 'Billing', to: '/billing', icon: LuCreditCard },
  { label: 'Activity', to: '/activity', icon: LuActivity },
  { label: 'Support', to: '/support', icon: LuLifeBuoy },
  { label: 'Settings', to: '/settings', icon: LuSettings },
]
