import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Keeps an overlay mounted through its exit transition. */
function usePresence(open: boolean, ms = 320) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (open) {
      setMounted(true)
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(r)
    }
    setShown(false)
    const t = setTimeout(() => setMounted(false), ms)
    return () => clearTimeout(t)
  }, [open, ms])
  return { mounted, state: shown ? 'open' : 'closed' }
}

/** Focus trap + Escape + scroll lock + focus return. */
function useDialogBehaviour(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      const el = ref.current
      const target = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE)
      target?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key === 'Tab' && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prev?.focus?.()
    }
  }, [open, ref])
}

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, description, children, footer }: OverlayProps) {
  const { mounted, state } = usePresence(open, 220)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useDialogBehaviour(open, onClose, ref)
  if (!mounted) return null
  return createPortal(
    <>
      <div className="overlay" data-state={state} onClick={onClose} />
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={description ? `${id}-d` : undefined} data-state={state}>
        <div className="modal-head">
          <div>
            <h2 id={`${id}-t`}>{title}</h2>
            {description && (
              <p id={`${id}-d`} className="muted" style={{ marginTop: 4, fontSize: 'var(--fs-sm)' }}>
                {description}
              </p>
            )}
          </div>
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>,
    document.body,
  )
}

export function Drawer({ open, onClose, title, description, children, footer }: OverlayProps) {
  const { mounted, state } = usePresence(open, 340)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useDialogBehaviour(open, onClose, ref)
  if (!mounted) return null
  return createPortal(
    <>
      <div className="overlay" data-state={state} onClick={onClose} />
      <div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} data-state={state}>
        <div className="drawer-head">
          <div style={{ minWidth: 0 }}>
            <h2 id={`${id}-t`}>{title}</h2>
            {description && <div className="muted" style={{ marginTop: 4, fontSize: 'var(--fs-sm)' }}>{description}</div>}
          </div>
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div style={{ padding: 'var(--s-4) var(--s-6)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </>,
    document.body,
  )
}

export function Sheet({ open, onClose, title, children }: Omit<OverlayProps, 'description' | 'footer'>) {
  const { mounted, state } = usePresence(open, 340)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useDialogBehaviour(open, onClose, ref)
  if (!mounted) return null
  return createPortal(
    <>
      <div className="overlay" data-state={state} onClick={onClose} />
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} data-state={state}>
        <div className="sheet-handle" aria-hidden />
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 id={`${id}-t`}>{title}</h2>
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </>,
    document.body,
  )
}

/** Small anchored menu with outside-click + Escape dismissal and arrow-key navigation. */
export function useMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        wrapRef.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = [...(wrapRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])]
        if (!items.length) return
        e.preventDefault()
        const i = items.indexOf(document.activeElement as HTMLElement)
        const n = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
        items[n].focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, wrapRef }
}
