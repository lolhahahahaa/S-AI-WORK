import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useApp } from '../state/store'

gsap.registerPlugin(Flip, ScrollTrigger, SplitText)
// Charts query optional mark types (bars, lines…) that not every chart has.
gsap.config({ nullTargetWarn: false })
// UI reveals should finish on time even if the tab stalls — never leave content half-faded.
gsap.ticker.lagSmoothing(0)

/** One motion language for the whole portal. */
export const DUR = { press: 0.14, fast: 0.2, base: 0.32, slow: 0.5, morph: 0.55, cine: 0.9 }
export const EASE = { out: 'power3.out', inOut: 'power2.inOut', settle: 'power4.out', drawer: 'expo.out', soft: 'sine.inOut' }
export const STAGGER = { tight: 0.03, base: 0.05, loose: 0.08 }

const query = '(prefers-reduced-motion: reduce)'

/** True when either the OS or the in-app setting asks for reduced motion. */
export function useReducedMotion() {
  const { state } = useApp()
  const [os, setOs] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setOs(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const pref = state.prefs.motion
  return pref === 'reduced' || (pref === 'system' && os)
}

/**
 * Layout morph between two React states. Call `capture()` right before the
 * state change; elements sharing a `data-flip-id` then animate from their old
 * box to their new one (card → detail, thumbnail → hero image…).
 */
export function useFlip(scope: RefObject<HTMLElement | null>, dep: unknown) {
  const reduced = useReducedMotion()
  const snap = useRef<Flip.FlipState | null>(null)
  const capture = useCallback(() => {
    if (!scope.current || reduced) return
    snap.current = Flip.getState(scope.current.querySelectorAll('[data-flip-id]'))
  }, [scope, reduced])
  useLayoutEffect(() => {
    const s = snap.current
    snap.current = null
    if (!s || !scope.current) return
    const tl = Flip.from(s, {
      targets: scope.current.querySelectorAll('[data-flip-id]'),
      duration: DUR.morph,
      ease: EASE.inOut,
      nested: true,
      prune: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: DUR.base, ease: EASE.out, delay: 0.12 }),
    })
    return () => {
      tl.progress(1)
    }
  }, [dep, scope])
  return capture
}

/** Clip-path reveal for panels swapping in place (tabs, steps). */
export function useClipReveal(ref: RefObject<HTMLElement | null>, key: unknown) {
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    if (!ref.current || reduced) return
    const tw = gsap.fromTo(ref.current, { clipPath: 'inset(0 0 100% 0 round 20px)', y: 8 }, { clipPath: 'inset(0 0 0% 0 round 20px)', y: 0, duration: DUR.slow, ease: EASE.settle, clearProps: 'clipPath,transform' })
    return () => {
      tw.progress(1)
    }
  }, [key, ref, reduced])
}

export { gsap, Flip, ScrollTrigger, SplitText }
