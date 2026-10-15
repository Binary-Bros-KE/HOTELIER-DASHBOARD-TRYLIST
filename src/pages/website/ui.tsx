import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LuCircleAlert, LuLoaderCircle } from 'react-icons/lu'
import { cn } from '@/lib/utils'

// Small building blocks shared by the Website screens, matching TenantDetail's
// paper-and-ink look.

export function Panel({ title, actions, children, className }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('border bg-card', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

/** A div, not a <label>: fields can hold several inputs and nested lists,
 * and labels must not nest. */
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('block', className)}>
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, type = 'text', multiline, rows = 3 }: {
  value: string | null | undefined; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean; rows?: number
}) {
  return multiline
    ? <textarea className="input min-h-20 resize-y" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    : <input className="input" type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; busy?: boolean; size?: 'sm' | 'md' }

export function Btn({ variant = 'secondary', busy, size = 'sm', className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold disabled:opacity-60',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'border hover:bg-muted',
        variant === 'danger' && 'border border-destructive/40 text-destructive hover:bg-destructive/10',
        variant === 'ghost' && 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {busy && <LuLoaderCircle className="size-3.5 animate-spin" />}
      {children}
    </button>
  )
}

export function Notice({ kind, children }: { kind: 'error' | 'success' | 'warning' | 'info'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 border p-3 text-sm',
        kind === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
        kind === 'success' && 'border-success/30 bg-success/10 text-success',
        kind === 'warning' && 'border-warning/40 bg-warning/10 text-warning',
        kind === 'info' && 'bg-muted/50 text-muted-foreground',
      )}
    >
      {kind === 'error' || kind === 'warning' ? <LuCircleAlert className="mt-0.5 size-4 shrink-0" /> : null}
      <div>{children}</div>
    </div>
  )
}

export function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 border bg-background px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5', disabled && 'cursor-not-allowed opacity-60')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-accent" />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  )
}

export const errorMessage = (cause: unknown, fallback: string) => (cause instanceof Error ? cause.message : fallback)
