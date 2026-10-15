import { useCallback, useEffect, useRef, useState } from 'react'
import { LuCheck, LuImage, LuTrash2, LuUpload } from 'react-icons/lu'
import Modal from '@/components/Modal'
import { api, assetUrl, upload } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Media } from './types'
import { Btn, errorMessage, Notice } from './ui'

/** The tenant's uploaded images: upload, label, delete — and pick, when `onPick` is given. */
export function MediaLibrary({ tenantId, onPick }: { tenantId: string; onPick?: (media: Media) => void }) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const base = `/platform/tenants/${tenantId}/website/media`

  const load = useCallback(async () => {
    try {
      setMedia((await api<{ media: Media[] }>(base)).media)
    } catch (cause) {
      setError(errorMessage(cause, 'Could not load images'))
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => { void load() }, [load])

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      Array.from(files).forEach((f) => form.append('files', f))
      const result = await upload<{ media: Media[] }>(base, form)
      setMedia((current) => [...result.media, ...current])
    } catch (cause) {
      setError(errorMessage(cause, 'Upload failed'))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function remove(item: Media) {
    if (!window.confirm(`Delete ${item.fileName}? Pages still using it will show an empty space.`)) return
    try {
      await api(`${base}/${item.id}`, { method: 'DELETE' })
      setMedia((current) => current.filter((m) => m.id !== item.id))
    } catch (cause) {
      setError(errorMessage(cause, 'Could not delete'))
    }
  }

  async function saveAlt(item: Media, altText: string) {
    if ((item.altText ?? '') === altText) return
    try {
      const result = await api<{ media: Media }>(`${base}/${item.id}`, { method: 'PATCH', body: JSON.stringify({ altText }) })
      setMedia((current) => current.map((m) => (m.id === item.id ? result.media : m)))
    } catch (cause) {
      setError(errorMessage(cause, 'Could not save the description'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or AVIF · up to 8 MB each · landscape photos at least 2000px wide look best.</p>
        <Btn variant="primary" busy={uploading} onClick={() => fileInput.current?.click()}>
          <LuUpload className="size-3.5" /> Upload images
        </Btn>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" multiple hidden onChange={(e) => void onFiles(e.target.files)} />
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed py-12 text-sm text-muted-foreground">
          <LuImage className="size-6" /> No images yet
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <li key={item.id} className="group border bg-background">
              <button
                type="button"
                disabled={!onPick}
                onClick={() => onPick?.(item)}
                className={cn('relative block aspect-[4/3] w-full overflow-hidden bg-muted', onPick && 'cursor-pointer hover:outline hover:outline-2 hover:outline-accent')}
              >
                <img src={assetUrl(item.url)} alt={item.altText ?? ''} loading="lazy" className="size-full object-cover" />
                {onPick && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white opacity-0 group-hover:opacity-100">
                    <LuCheck className="mr-1 size-4" /> Use this image
                  </span>
                )}
              </button>
              <div className="flex items-center gap-1 p-2">
                <input
                  className="input !py-1 text-xs"
                  defaultValue={item.altText ?? ''}
                  placeholder="Describe the image"
                  onBlur={(e) => void saveAlt(item, e.target.value)}
                />
                <button type="button" onClick={() => void remove(item)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete image">
                  <LuTrash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function MediaPickerModal({ tenantId, onPick, onClose }: { tenantId: string; onPick: (media: Media) => void; onClose: () => void }) {
  return (
    <Modal title="Choose an image" subtitle="Upload new images or pick one from the library." onClose={onClose}>
      <MediaLibrary tenantId={tenantId} onPick={(m) => { onPick(m); onClose() }} />
    </Modal>
  )
}
