// The platform session lives only in sessionStorage — not localStorage — so
// an internal admin tool loses its session when the browser/tab closes
// rather than staying signed in indefinitely on a shared machine.
const TOKEN_KEY = 'platformToken'
const ADMIN_KEY = 'platformAdmin'

export type PlatformAdmin = { id: string; email: string; name: string }

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getAdmin(): PlatformAdmin | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_KEY)
    return raw ? (JSON.parse(raw) as PlatformAdmin) : null
  } catch {
    return null
  }
}

export function setSession(token: string, admin: PlatformAdmin): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
  } catch {
    // Storage unavailable (private mode, etc.) — the caller's subsequent
    // API calls will just 401 and bounce back to /login, no crash either way.
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(ADMIN_KEY)
  } catch {
    // no-op — see setSession
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}
