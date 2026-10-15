import { getToken, clearSession } from './auth'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const apiOrigin = apiUrl.replace(/\/api\/?$/, '')

/** Uploaded files are stored as /uploads/... paths on the API — resolve them
 * for <img> here. Absolute URLs pass through. */
export function assetUrl(url: string | null | undefined): string {
  if (!url) return ''
  return url.startsWith('/uploads/') ? `${apiOrigin}${url}` : url
}

/** Multipart POST (files) — lets the browser set the multipart boundary. */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  return api<T>(path, { method: 'POST', body: form })
}

/** Thin fetch wrapper mirroring REACT/src/lib/api.ts's shape. Carries the
 * platform admin's session token as a bearer header. A 401 here always
 * means the stored session is gone/invalid — clear it and bounce to /login
 * rather than leaving the caller to figure that out. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      // FormData sets its own multipart Content-Type (with boundary).
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (response.status === 401) {
    clearSession()
    window.location.href = '/login'
    throw new Error('Session expired')
  }
  if (response.status === 204) return undefined as T
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'The request failed')
  return data
}
