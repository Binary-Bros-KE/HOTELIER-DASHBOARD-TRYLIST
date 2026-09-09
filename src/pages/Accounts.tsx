import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { LuCircleAlert, LuLoaderCircle, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import { api } from '@/lib/api'
import { getAdmin } from '@/lib/auth'
import Modal from '@/components/Modal'
import { cn } from '@/lib/utils'

type Account = {
  id: string
  name: string
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : 'Never')

export default function Accounts() {
  const me = getAdmin()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api<{ admins: Account[] }>('/platform/admins')
      setAccounts(res.admins)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function remove(account: Account) {
    if (!window.confirm(`Delete ${account.name}'s account? They lose access immediately.`)) return
    try {
      await api(`/platform/admins/${account.id}`, { method: 'DELETE' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete this account')
    }
  }

  async function toggleActive(account: Account) {
    try {
      await api(`/platform/admins/${account.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !account.isActive }),
      })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this account')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-accent">Team</p>
          <h1 className="mt-1 text-2xl font-bold">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone who can sign into the platform admin app. Each signs in with their own email and password.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <LuPlus /> New Account
        </button>
      </header>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          <LuCircleAlert /> {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-sm border bg-card">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <LuLoaderCircle className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-primary text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last sign-in</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const isSelf = account.id === me?.id
                return (
                  <tr key={account.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {account.name}
                      {isSelf && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{account.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          account.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(account.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => void toggleActive(account)}
                          disabled={isSelf}
                          className="rounded-sm border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                        >
                          {account.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setEditing(account)}
                          className="rounded-sm border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Edit account"
                        >
                          <LuPencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => void remove(account)}
                          disabled={isSelf}
                          className="rounded-sm border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                          aria-label="Delete account"
                        >
                          <LuTrash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {(creating || editing) && (
        <AccountFormModal
          account={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            void load()
          }}
        />
      )}
    </div>
  )
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function AccountFormModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(account?.name ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (account) {
        await api(`/platform/admins/${account.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: name.trim(), email: email.trim(), ...(password ? { password } : {}) }),
        })
      } else {
        await api('/platform/admins', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        })
      }
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this account')
    } finally {
      setSubmitting(false)
    }
  }

  const passwordTooShort = password.length > 0 && password.length < 8
  const canSubmit = name.trim() && email.trim() && !passwordTooShort && (account || password.length >= 8)

  return (
    <Modal
      title={account ? 'Edit Account' : 'New Account'}
      subtitle={
        account
          ? 'Update their details, or set a new password to reset it (their other sessions end).'
          : 'They sign in at the platform admin app with this email and password.'
      }
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-sm border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            form="account-form"
            disabled={submitting || !canSubmit}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting && <LuLoaderCircle className="animate-spin" />} {account ? 'Save changes' : 'Create account'}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          <LuCircleAlert /> {error}
        </div>
      )}

      <form id="account-form" onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" required>
          <input required type="email" autoComplete="off" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={account ? 'New password' : 'Password'} required={!account}>
          <div className="flex gap-2">
            <input
              type="text"
              autoComplete="new-password"
              className="input font-mono"
              placeholder={account ? 'Leave blank to keep current' : 'At least 8 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setPassword(randomPassword())}
              className="shrink-0 rounded-sm border px-3 text-sm font-semibold hover:bg-muted"
            >
              Generate
            </button>
          </div>
          {passwordTooShort && <span className="mt-1 block text-xs text-destructive">Must be at least 8 characters.</span>}
          {!account && (
            <span className="mt-1 block text-xs text-muted-foreground">
              Shown in clear text so you can copy it — hand it to them directly.
            </span>
          )}
        </Field>
      </form>
    </Modal>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  )
}
