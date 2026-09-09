import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'

export default function Layout() {
  return (
    <div className="flex h-svh bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
