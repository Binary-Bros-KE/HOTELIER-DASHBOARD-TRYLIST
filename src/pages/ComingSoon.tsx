import { LuHammer } from 'react-icons/lu'
import { useLocation } from 'react-router-dom'
import { navigation } from '@/config/navigation'

export default function ComingSoon() {
  const { pathname } = useLocation()
  const item = navigation.find((n) => n.to === pathname)
  const title = item?.label ?? 'Coming soon'

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header>
        <p className="eyebrow text-accent">Platform</p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
      </header>

      <div className="mt-6 flex min-h-60 flex-col items-center justify-center gap-3 rounded-sm border border-dashed bg-card p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LuHammer className="size-5" />
        </span>
        <p className="text-sm font-medium">{title} isn’t built yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This section is part of the admin layout but has no page yet. Tenant
          management is fully available under <span className="font-medium text-foreground">Tenants</span>.
        </p>
      </div>
    </div>
  )
}
