import { NavLink, useNavigate } from 'react-router-dom'
import { LuLogOut } from 'react-icons/lu'
import { api } from '@/lib/api'
import { clearSession, getAdmin } from '@/lib/auth'
import { navigation } from '@/config/navigation'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const navigate = useNavigate()
  const admin = getAdmin()

  async function logout() {
    try {
      await api('/platform/auth/logout', { method: 'POST' })
    } catch {
      // Best effort — the local session is cleared regardless.
    }
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-svh w-60 shrink-0 flex-col bg-primary text-primary-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
        <img
          src="/TANZ-primary-logo.jpeg"
          alt="TANZ"
          className="size-9 shrink-0 rounded-[50%] border border-white/20 object-cover"
        />
        <div className="leading-tight">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em]">HOTELIER</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/50">Platform Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul>
          {navigation.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 border-l-2 px-5 py-2.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'border-l-white bg-white/10 text-white'
                      : 'border-l-transparent text-white/65 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <item.icon className="size-[17px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {!item.ready && (
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/50">
                    Soon
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer / signed-in admin */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {admin && (
          <div className="px-2 pb-2.5 pt-1 leading-tight">
            <p className="truncate text-[13px] font-bold text-white">{admin.name}</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
              Super Admin
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LuLogOut className="size-3.5" /> Log out
        </button>
      </div>
    </aside>
  )
}
