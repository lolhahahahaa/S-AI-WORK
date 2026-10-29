import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Lenis from 'lenis'
import { useGSAP } from '@gsap/react'
import { ArrowRight, Box, Layers, Layers2, RotateCcw, Square } from 'lucide-react'
import { useApp } from '../state/store'
import { catchUpSteps, layers } from '../lib/ecosystem'
import { gsap, ScrollTrigger, SplitText, useReducedMotion } from '../lib/motion'
import type { SceneControls } from '../components/PortalScene'

const PortalScene = lazy(() => import('../components/PortalScene'))

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** 2D fallback: the same layers as an isometric stack, driven by the same state. */
function FlatStack({ sel, onSelect, exploded, dark }: { sel: string | null; onSelect: (id: string) => void; exploded: boolean; dark: boolean }) {
  return (
    <div className="flat-stack" data-exploded={exploded} role="group" aria-label="Portal layers (2D view)">
      {layers.map((l, i) => (
        <button key={l.id} className="flat-layer" aria-pressed={sel === l.id} style={{ '--i': i, '--c': dark ? l.dark : l.light } as React.CSSProperties} onClick={() => onSelect(l.id)}>
          <span>{l.name}</span>
        </button>
      ))}
    </div>
  )
}

export default function Explore() {
  const { state } = useApp()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const dark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
  const [sel, setSel] = useState<string | null>(null)
  const [exploded, setExploded] = useState(false)
  const [mode, setMode] = useState<'3d' | '2d'>(() => (hasWebGL() && !reduced ? '3d' : '2d'))
  const [visible, setVisible] = useState(true)
  const controls = useRef<SceneControls>({ explode: { value: 0 }, intro: { value: reduced ? 1 : 0 } })
  const root = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const layer = layers.find((l) => l.id === sel)

  // Lenis only on this long-form page, synced with ScrollTrigger; native scrolling everywhere else.
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t: number) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [reduced])

  // Pause the WebGL loop when the hero is off screen.
  useEffect(() => {
    if (!heroRef.current) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' })
    io.observe(heroRef.current)
    return () => io.disconnect()
  }, [])

  // Explode / reassemble from the button (also what scroll drives on desktop).
  useEffect(() => {
    gsap.to(controls.current.explode, { value: exploded ? 1 : 0, duration: reduced ? 0 : 1, ease: 'power3.inOut' })
  }, [exploded, reduced])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ desktop: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
        const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean }
        if (!motion || reduced) {
          gsap.set('.ex-path', { strokeDashoffset: 0 })
          return
        }
        const split = SplitText.create('.ex-title', { type: 'words,chars', mask: 'words' })
        gsap.from(split.chars, { yPercent: 110, duration: 0.8, ease: 'power4.out', stagger: 0.015, delay: 0.2 })
        gsap.from('.ex-hero-copy > *:not(.ex-title)', { opacity: 0, y: 14, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.6 })

        if (desktop) {
          // Scroll separates the layers, holds, then reassembles them — fully reversible.
          ScrollTrigger.create({
            trigger: '.ex-hero',
            start: 'top top',
            end: '+=130%',
            pin: true,
            scrub: 0.6,
            onUpdate: (st) => {
              const p = st.progress
              const v = p < 0.55 ? p / 0.55 : p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2
              controls.current.explode.value = v
              const label = document.querySelector('.ex-stage')
              if (label) label.textContent = v > 0.9 ? 'Layers separated — select one to focus' : v < 0.1 ? (p > 0.5 ? 'Reassembled into one portal' : 'One connected portal — scroll to separate') : 'Separating…'
            },
          })
          const track = document.querySelector<HTMLElement>('.ex-steps-track')
          if (track) {
            gsap.to(track, {
              x: () => -(track.scrollWidth - track.parentElement!.clientWidth),
              ease: 'none',
              scrollTrigger: { trigger: '.ex-steps', start: 'top 15%', end: () => `+=${track.scrollWidth}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
            })
            gsap.utils.toArray<HTMLElement>('.ex-step').forEach((el, i) => gsap.from(el, { opacity: 0.25, scale: 0.94, scrollTrigger: { trigger: '.ex-steps', start: () => `top+=${i * 200} 15%`, end: () => `top+=${i * 200 + 220} 15%`, scrub: true } }))
          }
        } else {
          gsap.utils.toArray<HTMLElement>('.ex-step').forEach((el) => gsap.from(el, { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } }))
        }
        // Connected-system diagram: paths draw as you scroll, in both directions.
        gsap.utils.toArray<SVGPathElement>('.ex-path').forEach((p) => {
          const len = p.getTotalLength()
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.ex-system', start: 'top 70%', end: 'center 45%', scrub: true } })
        })
        gsap.from('.ex-node', { scale: 0.6, opacity: 0, transformOrigin: 'center', stagger: 0.06, ease: 'back.out(1.4)', duration: 0.5, scrollTrigger: { trigger: '.ex-system', start: 'top 70%', toggleActions: 'play none none reverse' } })
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [reduced, mode] },
  )

  // Displacement transition on the detail panel when the focused layer changes (non-critical surface).
  useLayoutEffect(() => {
    if (!panelRef.current) return
    if (reduced) {
      gsap.fromTo(panelRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      return
    }
    const tl = gsap.timeline()
    tl.fromTo(panelRef.current, { opacity: 0, filter: 'url(#ex-disp)' }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    if (dispRef.current) tl.fromTo(dispRef.current, { attr: { scale: 60 } }, { attr: { scale: 0 }, duration: 0.7, ease: 'power3.out' }, 0)
    tl.set(panelRef.current, { clearProps: 'filter' })
    return () => {
      tl.progress(1)
    }
  }, [sel, reduced])

  const select = (id: string | null) => {
    setSel(id)
    if (id && !exploded && controls.current.explode.value < 0.5) setExploded(true)
  }

  return (
    <div ref={root} className="explore">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="ex-disp">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="4" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <section ref={heroRef} className="ex-hero" aria-labelledby="ex-h">
        <div className="ex-hero-copy">
          <span className="eyebrow">Portal map</span>
          <h1 id="ex-h" className="ex-title">
            One portal, six connected layers
          </h1>
          <p className="muted">Everything in {state.prefs.schoolName} Portal builds on the same records. Separate the layers to see how they connect — then jump straight into any of them.</p>
          <p className="ex-stage subtle" aria-live="polite">
            One connected portal — scroll to separate
          </p>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setExploded(!exploded)} aria-pressed={exploded}>
              {exploded ? <Layers2 size={16} aria-hidden /> : <Layers size={16} aria-hidden />} {exploded ? 'Reassemble' : 'Separate layers'}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode(mode === '3d' ? '2d' : '3d')} disabled={mode === '2d' && !hasWebGL()}>
              {mode === '3d' ? <Square size={16} aria-hidden /> : <Box size={16} aria-hidden />} {mode === '3d' ? '2D view' : '3D view'}
            </button>
            {sel && (
              <button className="btn btn-ghost" onClick={() => select(null)}>
                <RotateCcw size={16} aria-hidden /> Reset focus
              </button>
            )}
          </div>
          <div className="ex-layer-list" role="group" aria-label="Focus a layer">
            {[...layers].reverse().map((l) => (
              <button key={l.id} className="chip" aria-pressed={sel === l.id} onClick={() => select(sel === l.id ? null : l.id)}>
                <span className="dot" style={{ background: dark ? l.dark : l.light, boxShadow: 'inset 0 0 0 1px var(--border-strong)' }} aria-hidden /> {l.name}
              </button>
            ))}
          </div>
        </div>
        <div className="ex-stage-wrap">
          {mode === '3d' ? (
            <Suspense fallback={<div className="scene-loading skeleton" aria-label="Loading 3D map" />}>
              <PortalScene sel={sel} onSelect={select} controls={controls} dark={dark} accent={state.prefs.accent} onFail={() => setMode('2d')} active={visible} />
              <p className="ex-hint subtle">Drag to turn · click a layer to focus</p>
            </Suspense>
          ) : (
            <FlatStack sel={sel} onSelect={(id) => select(sel === id ? null : id)} exploded={exploded || !!sel} dark={dark} />
          )}
          <div ref={panelRef} className="ex-panel card" aria-live="polite">
            {layer ? (
              <>
                <span className="eyebrow">Layer</span>
                <h2>{layer.name}</h2>
                <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{layer.blurb}</p>
                <p className="subtle" style={{ marginTop: 6 }}>{layer.relates}</p>
                <ul className="ex-mods">
                  {layer.modules.map((m) => (
                    <li key={m.to}>
                      <Link to={m.to} viewTransition className="cu-link-row">
                        <span style={{ flex: 1 }}>{m.label}</span>
                        <ArrowRight size={16} aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <span className="eyebrow">Tip</span>
                <p style={{ fontSize: 'var(--fs-sm)' }}>Pick a layer to see what lives there and how it connects to the rest.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="ex-steps section" aria-labelledby="ex-steps-h">
        <div className="ex-steps-head">
          <span className="eyebrow">Flagship flow</span>
          <h2 id="ex-steps-h">How Catch Me Up works</h2>
        </div>
        <div className="ex-steps-viewport">
          <ol className="ex-steps-track">
            {catchUpSteps.map((s) => (
              <li key={s.n} className="ex-step card">
                <span className="ex-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{s.body}</p>
                <Link to={s.to} viewTransition className="link-btn" style={{ marginTop: 'auto' }}>
                  Open <ArrowRight size={14} aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ex-system section card" aria-labelledby="ex-sys-h">
        <h2 id="ex-sys-h">One connected system</h2>
        <p className="muted" style={{ maxWidth: '60ch', marginTop: 4 }}>Records flow one way: attendance and tasks feed recovery, recovery links to learning and classmates, and progress flows back. Staff alerts read the same records — never wellbeing chats.</p>
        <svg className="ex-diagram" viewBox="0 0 800 300" role="img" aria-label="Attendance and Tasks feed Catch Me Up, which links to the Study Library, Study Buddy and Peer Help; progress flows to Growth. Support alerts read attendance and tasks for teachers.">
          {[
            'M120 80 C 220 80, 260 150, 360 150',
            'M120 220 C 220 220, 260 150, 360 150',
            'M440 150 C 520 150, 540 60, 620 60',
            'M440 150 L 620 150',
            'M440 150 C 520 150, 540 240, 620 240',
            'M700 60 C 760 60, 760 150, 700 150',
            'M120 80 C 180 20, 300 10, 400 30',
          ].map((d, i) => (
            <path key={i} className="ex-path" d={d} fill="none" stroke={i === 6 ? 'var(--chart-4)' : 'var(--primary)'} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={i === 6 ? '6 6' : undefined} />
          ))}
          {[
            ['Attendance', 70, 80, '/attendance'],
            ['Tasks', 70, 220, '/tasks'],
            ['Catch Me Up', 400, 150, '/catch-up'],
            ['Study Library', 660, 60, '/library'],
            ['Study Buddy', 660, 150, '/buddy'],
            ['Peer Help', 660, 240, '/peer-help'],
            ['Support alerts (staff)', 470, 30, '/support-alerts'],
          ].map(([label, x, y, to]) => (
            <g key={label as string} className="ex-node" role="link" tabIndex={0} aria-label={`Open ${label}`} style={{ cursor: 'pointer' }} onClick={() => navigate(to as string, { viewTransition: true })} onKeyDown={(e) => e.key === 'Enter' && navigate(to as string, { viewTransition: true })}>
              <rect x={(x as number) - 62} y={(y as number) - 18} width="124" height="36" rx="18" fill="var(--surface)" stroke="var(--border-strong)" />
              <text x={x as number} y={(y as number) + 5} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                {label as string}
              </text>
            </g>
          ))}
        </svg>
        <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
          {[['Attendance', '/attendance'], ['Catch Me Up', '/catch-up'], ['Peer Help', '/peer-help'], ['Growth', '/growth']].map(([l, to]) => (
            <Link key={to} to={to} viewTransition className="chip">
              {l} <ArrowRight size={14} aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
