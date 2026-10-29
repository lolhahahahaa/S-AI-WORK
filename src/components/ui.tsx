import { useLayoutEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { AlertCircle, ChevronRight, Lightbulb, Star, FlaskConical } from 'lucide-react'
import { useReducedMotion } from '../lib/motion'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header" data-reveal>
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function StatCard({ label, value, unit, foot, icon, tint, to }: { label: string; value: ReactNode; unit?: string; foot?: ReactNode; icon: ReactNode; tint: string; to?: string }) {
  const inner = (
    <>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon" style={{ background: tint }} aria-hidden>
          {icon}
        </span>
      </div>
      <div className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {foot && <div className="stat-foot">{foot}</div>}
    </>
  )
  return to ? (
    <Link to={to} className="stat">
      {inner}
    </Link>
  ) : (
    <div className="stat">{inner}</div>
  )
}

/** Progress bar whose fill eases to its new value when data changes. */
export function ProgressBar({ value, max = 100, label, color, size }: { value: number; max?: number; label: string; color?: string; size?: 'lg' }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const ratio = Math.max(0, Math.min(1, value / max))
  useGSAP(
    () => {
      if (!ref.current) return
      if (reduced) gsap.set(ref.current, { scaleX: ratio })
      else gsap.to(ref.current, { scaleX: ratio, duration: 0.6, ease: 'power3.out' })
    },
    { dependencies: [ratio, reduced] },
  )
  return (
    <div className={`progress ${size === 'lg' ? 'progress-lg' : ''}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <span ref={ref} style={{ transform: 'scaleX(0)', background: color }} />
    </div>
  )
}

/** Accessible tabs with a sliding indicator. Arrow keys move between tabs. */
export function Tabs<T extends string>({ tabs, value, onChange, label, idBase }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; label: string; idBase: string }) {
  const listRef = useRef<HTMLDivElement>(null)
  const [ind, setInd] = useState({ x: 0, w: 0 })
  useLayoutEffect(() => {
    const measure = () => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-tab="${value}"]`)
      if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [value, tabs.length])
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === value)
    let n = -1
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length
    if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length
    if (e.key === 'Home') n = 0
    if (e.key === 'End') n = tabs.length - 1
    if (n >= 0) {
      e.preventDefault()
      onChange(tabs[n].id)
      listRef.current?.querySelector<HTMLElement>(`[data-tab="${tabs[n].id}"]`)?.focus()
    }
  }
  return (
    <div ref={listRef} className="tabs" role="tablist" aria-label={label} onKeyDown={onKey}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" id={`${idBase}-tab-${t.id}`} aria-controls={`${idBase}-panel`} aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} data-tab={t.id} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
      <span className="tabs-indicator" style={{ width: ind.w, transform: `translateX(${ind.x}px)` }} aria-hidden />
    </div>
  )
}

/** Pill segmented control (single choice). */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ x: 0, w: 0 })
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-seg="${value}"]`)
    if (el) setThumb({ x: el.offsetLeft - 3, w: el.offsetWidth })
  }, [value, options.length])
  return (
    <div ref={ref} className="segmented" role="group" aria-label={label}>
      <span className="segmented-thumb" style={{ width: thumb.w, transform: `translateX(${thumb.x}px)`, left: 3 }} aria-hidden />
      {options.map((o) => (
        <button key={o.id} data-seg={o.id} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" className="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />
}

export function Stars({ value, onChange, label }: { value: number; onChange?: (v: number) => void; label: string }) {
  return (
    <div className="stars" role={onChange ? 'radiogroup' : 'img'} aria-label={onChange ? label : `${label}: ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} data-on={n <= value} onClick={() => onChange(n)}>
            <Star size={20} fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ) : (
          <span key={n} style={{ color: n <= value ? '#e0a526' : 'var(--border-strong)' }}>
            <Star size={16} fill={n <= value ? 'currentColor' : 'none'} />
          </span>
        ),
      )}
    </div>
  )
}

export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <div className="state-icon" aria-hidden>
        {icon}
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

export function Insight({ children }: { children: ReactNode }) {
  return (
    <p className="insight">
      <Lightbulb size={16} aria-hidden />
      <span>{children}</span>
    </p>
  )
}

export function Field({ label, hint, error, children, id, className }: { label: string; hint?: string; error?: string; children: ReactNode; id: string; className?: string }) {
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <span className="hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="error" id={`${id}-err`} role="alert">
          <AlertCircle size={13} /> {error}
        </span>
      )}
    </div>
  )
}

export function PrototypeTag({ children = 'Sample data' }: { children?: ReactNode }) {
  return (
    <span className="prototype-tag">
      <FlaskConical size={11} aria-hidden /> {children}
    </span>
  )
}

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="disclose">
      <summary>
        <ChevronRight size={14} aria-hidden /> {summary}
      </summary>
      <div>{children}</div>
    </details>
  )
}

/** Subject swatch: initials on a tint so subjects are identifiable without colour alone. */
export function SubjectBadge({ short, tint, size = 36 }: { short: string; tint: string; size?: number }) {
  return (
    <span className="subject-swatch" style={{ background: tint, width: size, height: size }} aria-hidden>
      {short}
    </span>
  )
}
