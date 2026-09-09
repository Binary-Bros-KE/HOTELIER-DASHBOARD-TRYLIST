import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { LuX } from 'react-icons/lu'

type ModalProps = {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  /** Rendered in a sticky footer — typically the submit / cancel buttons. */
  footer?: ReactNode
}

export default function Modal({ title, subtitle, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onMouseDown={onClose}
    >
      <div
        className="my-auto w-full max-w-2xl rounded-md border bg-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <LuX className="size-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}
