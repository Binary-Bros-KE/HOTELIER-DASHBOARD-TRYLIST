import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuCircleAlert, LuLoaderCircle } from 'react-icons/lu'
import { setSession } from '@/lib/auth'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      // Bypasses lib/api.ts on purpose — no token is stored yet, this is the
      // one request that establishes the session.
      const response = await fetch(`${apiUrl}/platform/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await response.json()) as {
        token?: string
        admin?: { id: string; email: string; name: string }
        error?: string
      }
      if (!response.ok || !data.token || !data.admin) {
        throw new Error(data.error ?? 'Could not sign in')
      }
      setSession(data.token, data.admin)
      navigate('/tenants', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-svh items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-sm border bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/TANZ-primary-logo.jpeg"
            alt="TANZ"
            className="size-20 rounded-[50%] border object-cover"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TANZ</p>
            <h1 className="font-semibold">Platform Admin</h1>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
            <LuCircleAlert /> {error}
          </div>
        )}

        <label className="mt-5 block text-sm font-medium">
          Email
          <input
            autoFocus
            type="email"
            autoComplete="username"
            required
            className="input mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            className="input mt-1.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          disabled={submitting || !email || !password}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {submitting && <LuLoaderCircle className="animate-spin" />} Sign in
        </button>
      </form>
    </div>
  )
}
