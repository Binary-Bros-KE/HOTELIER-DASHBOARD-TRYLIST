import { cn } from '@/lib/utils'

export type LicenseStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'

// Same palette mapping as REACT/src/pages/CafeSettings.tsx's
// licenseStatusStyles — keep these two in sync if either changes.
const styles: Record<LicenseStatus, string> = {
  TRIAL: 'bg-warning/10 text-warning',
  ACTIVE: 'bg-success/10 text-success',
  EXPIRED: 'bg-destructive/10 text-destructive',
  SUSPENDED: 'bg-destructive/10 text-destructive',
}

export default function StatusBadge({ status }: { status: LicenseStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', styles[status])}>
      {status[0] + status.slice(1).toLowerCase()}
    </span>
  )
}
