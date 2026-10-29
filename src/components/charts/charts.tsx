import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Disclosure, Insight } from '../ui'
import { useReducedMotion } from '../../lib/motion'

/** Width of a container, tracked with ResizeObserver so charts draw in real pixels. */
function useWidth<T extends HTMLElement>(fallback = 480) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(220, Math.floor(e.contentRect.width))))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Fades/grows chart marks in once, and again whenever the data signature changes. */
function useChartReveal(scope: React.RefObject<HTMLElement | null>, sig: string) {
  const reduced = useReducedMotion()
  useGSAP(
    () => {
      if (reduced) return
      gsap.from('[data-grow-x]', { scaleX: 0, transformOrigin: 'left center', duration: 0.6, ease: 'power3.out', stagger: 0.04 })
      gsap.from('[data-grow-y]', { scaleY: 0, transformOrigin: 'center bottom', duration: 0.6, ease: 'power3.out', stagger: 0.03 })
      gsap.from('[data-draw]', { strokeDashoffset: (_i: number, el: SVGPathElement) => el.getTotalLength(), strokeDasharray: (_i: number, el: SVGPathElement) => el.getTotalLength(), duration: 0.9, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' })
      gsap.from('[data-fade]', { opacity: 0, duration: 0.4, delay: 0.2, stagger: 0.02 })
    },
    { scope, dependencies: [sig, reduced], revertOnUpdate: true },
  )
}

export function ChartCard({ title, subtitle, children, insight, table, legend, actions, className }: { title: string; subtitle?: ReactNode; children: ReactNode; insight?: ReactNode; table?: { head: string[]; rows: (string | number)[][] }; legend?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card chart-card ${className ?? ''}`} aria-label={title} data-reveal>
      <div className="chart-title-row">
        <div>
          <h3>{title}</h3>
          {subtitle && <div className="chart-sub">{subtitle}</div>}
        </div>
        {actions}
      </div>
      {legend}
      <figure>{children}</figure>
      {insight && <Insight>{insight}</Insight>}
      {table && (
        <Disclosure summary="View as table">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {table.head.map((h, i) => (
                    <th key={h} className={i > 0 ? 'n' : undefined} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (j === 0 ? <th key={j} scope="row" style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0, color: 'var(--text)', fontSize: 'var(--fs-sm)' }}>{c}</th> : <td key={j} className="n">{c}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>
      )}
    </section>
  )
}

/* ─────────── Horizontal bars ─────────── */
export interface BarDatum {
  label: string
  value: number
  color?: string
  note?: string
  pattern?: boolean
}

export function HBarChart({ data, max = 100, threshold, unit = '%', labelWidth = 150, onSelect, selected }: { data: BarDatum[]; max?: number; threshold?: { value: number; label: string }; unit?: string; labelWidth?: number; onSelect?: (i: number) => void; selected?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const narrow = w < 420
  const lw = narrow ? 0 : labelWidth
  const valueW = 56
  const rowH = narrow ? 52 : 36
  const barH = 14
  const plotW = w - lw - valueW
  const h = data.length * rowH + 22
  const x = (v: number) => lw + (v / max) * plotW
  useChartReveal(ref, data.map((d) => d.value).join(','))
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <svg className="chart-svg" width={w} height={h} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${unit}`).join('; ')}>
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--danger-soft)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--danger)" strokeWidth="2" />
          </pattern>
        </defs>
        {[0, 25, 50, 75, 100].filter((t) => t <= max).map((t) => (
          <g key={t}>
            <line className="grid-line" x1={x(t)} x2={x(t)} y1={0} y2={h - 18} />
            <text x={x(t)} y={h - 4} textAnchor="middle" style={{ fontSize: 11 }}>
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const y = i * rowH + (narrow ? 26 : (rowH - barH) / 2)
          const isSel = selected === i
          return (
            <g key={d.label} data-focusable={onSelect ? '' : undefined} tabIndex={onSelect ? 0 : undefined} role={onSelect ? 'button' : undefined} aria-pressed={onSelect ? isSel : undefined} aria-label={onSelect ? `${d.label}, ${d.value}${unit}${d.note ? `, ${d.note}` : ''}. Show details` : undefined} onClick={() => onSelect?.(i)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect?.(i))} style={{ cursor: onSelect ? 'pointer' : undefined }}>
              <text x={narrow ? 0 : lw - 12} y={narrow ? y - 8 : y + barH - 2} textAnchor={narrow ? 'start' : 'end'} style={{ fill: 'var(--text)', fontWeight: isSel ? 800 : 600, fontSize: 13 }}>
                {d.label}
              </text>
              <rect x={lw} y={y} width={plotW} height={barH} rx={7} fill="var(--bg-sunk)" />
              <rect className="hit" data-grow-x x={lw} y={y} width={Math.max(0, x(d.value) - lw)} height={barH} rx={7} fill={d.pattern ? 'url(#hatch)' : d.color ?? 'var(--primary)'} />
              <text x={w - 4} y={y + barH - 2} textAnchor="end" style={{ fill: 'var(--text)', fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                {d.value}
                {unit}
              </text>
            </g>
          )
        })}
        {threshold && (
          <g data-fade>
            <line className="threshold" x1={x(threshold.value)} x2={x(threshold.value)} y1={0} y2={h - 18} />
          </g>
        )}
      </svg>
      {threshold && (
        <div className="legend" style={{ marginTop: 6 }}>
          <span>
            <svg width="18" height="10" aria-hidden>
              <line x1="0" y1="5" x2="18" y2="5" stroke="var(--danger)" strokeDasharray="4 3" strokeWidth="2" />
            </svg>
            {threshold.label}
          </span>
          {data.some((d) => d.pattern) && (
            <span>
              <i style={{ background: 'repeating-linear-gradient(45deg, var(--danger-soft) 0 3px, var(--danger) 3px 5px)' }} /> Below target
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────── Vertical columns ─────────── */
export function ColumnChart({ data, max, unit = '', height = 180, highlightMin }: { data: { label: string; value: number; color?: string }[]; max: number; unit?: string; height?: number; highlightMin?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const pad = { l: 30, r: 8, t: 22, b: 26 }
  const plotW = w - pad.l - pad.r
  const plotH = height - pad.t - pad.b
  const band = plotW / data.length
  const bw = Math.min(36, band * 0.62)
  const y = (v: number) => pad.t + plotH - (v / max) * plotH
  const min = Math.min(...data.map((d) => d.value))
  useChartReveal(ref, data.map((d) => d.value).join(','))
  const ticks = [0, max / 2, max]
  return (
    <div ref={ref}>
      <svg className="chart-svg" width={w} height={height} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${unit}`).join('; ')}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" style={{ fontSize: 11 }}>
              {Math.round(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.l + band * i + band / 2
          const isMin = highlightMin && d.value === min
          return (
            <g key={d.label}>
              <rect data-grow-y x={cx - bw / 2} y={y(d.value)} width={bw} height={pad.t + plotH - y(d.value)} rx={6} fill={d.color ?? (isMin ? 'var(--chart-3)' : 'var(--primary)')} />
              <text x={cx} y={y(d.value) - 6} textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 700, fontSize: 11 }} data-fade>
                {d.value}
                {unit}
              </text>
              <text x={cx} y={height - 8} textAnchor="middle" style={{ fontSize: 11, fontWeight: isMin ? 800 : 500 }}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ─────────── Line chart (multi-series, gaps for missing data) ─────────── */
export interface Series {
  name: string
  color: string
  values: (number | null)[]
  dashed?: boolean
  marker?: 'circle' | 'square' | 'diamond' | 'triangle'
}

function Marker({ kind = 'circle', x, y, color }: { kind?: Series['marker']; x: number; y: number; color: string }) {
  const s = 5
  if (kind === 'square') return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} rx={2} fill="var(--surface)" stroke={color} strokeWidth={2.5} />
  if (kind === 'diamond') return <path d={`M${x} ${y - s - 1}L${x + s + 1} ${y}L${x} ${y + s + 1}L${x - s - 1} ${y}Z`} fill="var(--surface)" stroke={color} strokeWidth={2.5} />
  if (kind === 'triangle') return <path d={`M${x} ${y - s - 1}L${x + s + 1} ${y + s}L${x - s - 1} ${y + s}Z`} fill="var(--surface)" stroke={color} strokeWidth={2.5} />
  return <circle cx={x} cy={y} r={s} fill="var(--surface)" stroke={color} strokeWidth={2.5} />
}

export function LineChart({ labels, series, min = 0, max = 100, unit = '', height = 220, threshold, area }: { labels: string[]; series: Series[]; min?: number; max?: number; unit?: string; height?: number; threshold?: { value: number; label: string }; area?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const pad = { l: 36, r: 16, t: 16, b: 28 }
  const plotW = w - pad.l - pad.r
  const plotH = height - pad.t - pad.b
  const x = (i: number) => pad.l + (labels.length === 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW)
  const y = (v: number) => pad.t + plotH - ((v - min) / (max - min)) * plotH
  const ticks = [min, min + (max - min) / 2, max]
  useChartReveal(ref, series.map((s) => s.values.join(',')).join('|'))

  const pathFor = (vals: (number | null)[]) => {
    let d = ''
    let pen = false
    vals.forEach((v, i) => {
      if (v === null) {
        pen = false
        return
      }
      d += `${pen ? 'L' : 'M'}${x(i)} ${y(v)}`
      pen = true
    })
    return d
  }
  const step = Math.max(1, Math.ceil(labels.length / Math.floor(plotW / 48)))
  return (
    <div ref={ref} style={{ position: 'relative' }} onMouseLeave={() => setActive(null)}>
      <svg className="chart-svg" width={w} height={height} role="img" aria-label={series.map((s) => `${s.name}: ${s.values.map((v, i) => `${labels[i]} ${v ?? 'no data'}${v !== null ? unit : ''}`).join(', ')}`).join('. ')}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" style={{ fontSize: 11 }}>
              {Math.round(t)}
            </text>
          </g>
        ))}
        {threshold && <line className="threshold" x1={pad.l} x2={w - pad.r} y1={y(threshold.value)} y2={y(threshold.value)} />}
        {labels.map((l, i) =>
          i % step === 0 || i === labels.length - 1 ? (
            <text key={l + i} x={x(i)} y={height - 8} textAnchor="middle" style={{ fontSize: 11, fontWeight: active === i ? 800 : 500 }}>
              {l}
            </text>
          ) : null,
        )}
        {active !== null && <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + plotH} stroke="var(--border-strong)" />}
        {series.map((s) => (
          <g key={s.name}>
            {area && <path d={`${pathFor(s.values)}L${x(s.values.length - 1)} ${pad.t + plotH}L${x(0)} ${pad.t + plotH}Z`} fill={s.color} opacity={0.1} data-fade />}
            <path data-draw d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? '6 5' : undefined} />
            {s.values.map((v, i) => (v === null ? null : <g key={i} data-fade><Marker kind={s.marker} x={x(i)} y={y(v)} color={s.color} /></g>))}
          </g>
        ))}
        {/* Hit targets: one focusable column per label for keyboard + touch */}
        {labels.map((l, i) => (
          <rect key={`hit-${i}`} x={x(i) - plotW / labels.length / 2} y={pad.t} width={plotW / labels.length} height={plotH} fill="transparent" tabIndex={0} aria-label={`${l}: ${series.map((s) => `${s.name} ${s.values[i] ?? 'no data'}${s.values[i] !== null ? unit : ''}`).join(', ')}`} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} onClick={() => setActive(i)} style={{ outline: 'none' }} />
        ))}
      </svg>
      {active !== null && (
        <div className="chart-tip" style={{ left: Math.min(Math.max(x(active), 70), w - 70), top: Math.min(...series.map((s) => (s.values[active] === null ? pad.t + plotH : y(s.values[active] as number)))) }}>
          <strong>{labels[active]}</strong>
          {series.map((s) => (
            <div key={s.name}>
              {series.length > 1 ? `${s.name}: ` : ''}
              {s.values[active] ?? 'No data yet'}
              {s.values[active] !== null ? unit : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SeriesLegend({ series }: { series: Series[] }) {
  return (
    <div className="legend" aria-hidden>
      {series.map((s) => (
        <span key={s.name}>
          <svg width="22" height="12">
            <line x1="0" y1="6" x2="22" y2="6" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dashed ? '4 3' : undefined} />
            <Marker kind={s.marker} x={11} y={6} color={s.color} />
          </svg>
          {s.name}
        </span>
      ))}
    </div>
  )
}

/* ─────────── Radar ─────────── */
export function Radar({ axes, max = 5 }: { axes: { label: string; value: number }[]; max?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const size = Math.min(w, 360)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 64
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2
    return [cx + Math.cos(a) * r * (v / max), cy + Math.sin(a) * r * (v / max)]
  }
  const poly = axes.map((a, i) => pt(i, a.value).join(',')).join(' ')
  const reduced = useReducedMotion()
  useGSAP(
    () => {
      if (reduced) return
      gsap.from('[data-radar]', { scale: 0.6, opacity: 0, transformOrigin: `${cx}px ${cy}px`, duration: 0.7, ease: 'power3.out' })
    },
    { scope: ref, dependencies: [reduced] },
  )
  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center' }}>
      <svg className="chart-svg" width={size} height={size} role="img" aria-label={axes.map((a) => `${a.label} ${a.value} of ${max}`).join(', ')}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <polygon key={lvl} points={axes.map((_, i) => pt(i, lvl).join(',')).join(' ')} fill="none" stroke="var(--border)" />
        ))}
        {axes.map((a, i) => {
          const [x2, y2] = pt(i, max)
          const [lx, ly] = pt(i, max + 1.05)
          return (
            <g key={a.label}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--border)" />
              <text x={lx} y={ly} textAnchor={Math.abs(lx - cx) < 6 ? 'middle' : lx > cx ? 'start' : 'end'} dominantBaseline="middle" style={{ fill: 'var(--text)', fontWeight: 600, fontSize: 12 }}>
                {a.label}
              </text>
              <text x={lx} y={ly + 14} textAnchor={Math.abs(lx - cx) < 6 ? 'middle' : lx > cx ? 'start' : 'end'} dominantBaseline="middle" style={{ fontSize: 11, fontWeight: 700 }}>
                {a.value.toFixed(1)}
              </text>
            </g>
          )
        })}
        <g data-radar>
          <polygon points={poly} fill="color-mix(in oklab, var(--primary) 22%, transparent)" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />
          {axes.map((a, i) => {
            const [x, y] = pt(i, a.value)
            return <circle key={a.label} cx={x} cy={y} r={4} fill="var(--primary)" />
          })}
        </g>
      </svg>
    </div>
  )
}

/* ─────────── Ring ─────────── */
export function Ring({ value, max, size = 132, stroke = 14, label, sub, color = 'var(--primary)' }: { value: number; max: number; size?: number; stroke?: number; label: ReactNode; sub?: ReactNode; color?: string }) {
  const ref = useRef<SVGCircleElement>(null)
  const reduced = useReducedMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = max === 0 ? 0 : value / max
  useGSAP(
    () => {
      if (!ref.current) return
      const target = c * (1 - ratio)
      if (reduced) gsap.set(ref.current, { strokeDashoffset: target })
      else gsap.fromTo(ref.current, { strokeDashoffset: c }, { strokeDashoffset: target, duration: 0.9, ease: 'power3.out' })
    },
    { dependencies: [ratio, reduced] },
  )
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} role="img" aria-label={`${value} of ${max}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunk)" strokeWidth={stroke} />
        <circle ref={ref} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="num" style={{ fontSize: size > 110 ? '1.6rem' : '1.1rem', lineHeight: 1 }}>
            {label}
          </div>
          {sub && <div className="subtle" style={{ fontSize: 11, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}
