import { useLayoutEffect, useRef, useState } from 'react'
import { useApp } from '../state/store'
import { gsap, SplitText, useReducedMotion } from '../lib/motion'
import { BrandMark } from './shell'

const KEY = 'portal:intro-seen'
const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

/**
 * Opening sequence, once per browser session. The overlay never blocks input
 * (pointer-events: none) — the portal underneath is usable from the first frame.
 * Brand reveal → mask opens from the logo → interface layers settle in.
 */
export function Intro() {
  const { state } = useApp()
  const reduced = useReducedMotion()
  const [show, setShow] = useState(() => !seen())
  const ref = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* private mode — fine, the intro just may replay */
    }
    if (reduced || !ref.current) {
      setShow(false)
      return
    }
    const el = ref.current
    const split = SplitText.create(el.querySelector('.intro-name'), { type: 'chars', mask: 'chars' })
    const t = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => setShow(false) })
    t.from(el.querySelector('.intro-mark'), { scale: 0.7, opacity: 0, duration: 0.5 })
      .from(split.chars, { yPercent: 110, duration: 0.5, stagger: 0.018 }, '-=0.25')
      .from(el.querySelector('.intro-sub'), { opacity: 0, y: 6, duration: 0.3 }, '-=0.2')
      .addLabel('open', '+=0.15')
      // Mask opens from the brand mark, revealing the portal from behind the foreground.
      .to(el, { '--r': '160vmax', duration: 0.9, ease: 'power3.inOut' }, 'open')
      .to(el.querySelector('.intro-center'), { scale: 1.15, opacity: 0, duration: 0.45, ease: 'power2.in' }, 'open')
      // Push-in and layered settle of the real interface.
      .fromTo('.shell-main', { scale: 1.035, transformOrigin: '50% 30%' }, { scale: 1, duration: 1, ease: 'power4.out', clearProps: 'transform' }, 'open+=0.1')
      .from('.sidebar', { x: -24, opacity: 0, duration: 0.6, clearProps: 'all' }, 'open+=0.25')
      .from('.topbar > *', { y: -10, opacity: 0, duration: 0.45, stagger: 0.04, clearProps: 'all' }, 'open+=0.3')
      .from('.bottomnav', { y: 30, opacity: 0, duration: 0.5, clearProps: 'all' }, 'open+=0.3')
    tl.current = t
    return () => {
      // revert (not progress(1)) so StrictMode's double-mount doesn't end the intro early
      t.revert()
      split.revert()
    }
  }, [show, reduced])

  if (!show) return null
  return (
    <div ref={ref} className="intro" aria-hidden="true">
      <div className="intro-center">
        <span className="intro-mark">
          <BrandMark size={72} />
        </span>
        <div className="intro-name">{state.prefs.schoolName} Portal</div>
        <div className="intro-sub">Grade 9B · Wednesday 28 October</div>
      </div>
      <button className="intro-skip" onClick={() => tl.current?.progress(1)} tabIndex={-1}>
        Skip
      </button>
    </div>
  )
}
