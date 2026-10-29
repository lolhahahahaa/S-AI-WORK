import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Headphones, Minimize2, Pause, Play, RotateCcw, Timer, Volume2, MessageCircleHeart } from 'lucide-react'
import { ambient, soundscapes, type Soundscape } from '../lib/audio'
import { useApp } from '../state/store'
import { iso, TODAY } from '../lib/date'
import { useToast } from './toast'

type Phase = 'focus' | 'break'
const presets = [
  { id: '25-5', focus: 25, rest: 5, label: '25 / 5 min' },
  { id: '45-10', focus: 45, rest: 10, label: '45 / 10 min' },
  { id: 'demo', focus: 1, rest: 1, label: '1 / 1 min (demo)' },
]

interface FocusCtx {
  open: boolean
  setOpen: (v: boolean) => void
  sound: Soundscape | null
  playing: boolean
  toggleSound: (s?: Soundscape) => void
  volume: number
  setVolume: (v: number) => void
  phase: Phase
  running: boolean
  remaining: number
  total: number
  presetId: string
  setPreset: (id: string) => void
  start: () => void
  pause: () => void
  reset: () => void
}

const Ctx = createContext<FocusCtx | null>(null)
export const useFocus = () => useContext(Ctx)!

export function FocusProvider({ children }: { children: ReactNode }) {
  const { update } = useApp()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [sound, setSound] = useState<Soundscape | null>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVol] = useState(0.5)
  const [presetId, setPresetId] = useState('25-5')
  const preset = presets.find((p) => p.id === presetId)!
  const [phase, setPhase] = useState<Phase>('focus')
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(preset.focus * 60)
  const endAt = useRef<number | null>(null)

  const total = (phase === 'focus' ? preset.focus : preset.rest) * 60

  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      const left = Math.max(0, Math.round(((endAt.current ?? 0) - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        setRunning(false)
        if (phase === 'focus') {
          update((s) => ({ ...s, focusLog: { ...s.focusLog, [iso(TODAY)]: (s.focusLog[iso(TODAY)] ?? 0) + 1 } }))
          toast('Focus session done — time for a short break.')
          setPhase('break')
          setRemaining(preset.rest * 60)
        } else {
          toast('Break finished. Ready when you are.', 'info')
          setPhase('focus')
          setRemaining(preset.focus * 60)
        }
      }
    }, 250)
    return () => clearInterval(t)
  }, [running, phase, preset, update, toast])

  useEffect(() => () => ambient.stop(), [])

  const value: FocusCtx = {
    open,
    setOpen,
    sound,
    playing,
    volume,
    setVolume: (v) => {
      setVol(v)
      ambient.setVolume(v)
    },
    toggleSound: (s) => {
      const next = s ?? sound ?? 'focus'
      if (playing && next === sound) {
        ambient.stop()
        setPlaying(false)
        return
      }
      try {
        ambient.setVolume(volume)
        ambient.play(next)
        setSound(next)
        setPlaying(true)
      } catch {
        toast('Sound isn’t available in this browser.', 'info')
      }
    },
    phase,
    running,
    remaining,
    total,
    presetId,
    setPreset: (id) => {
      const p = presets.find((x) => x.id === id)!
      setPresetId(id)
      setRunning(false)
      setPhase('focus')
      setRemaining(p.focus * 60)
    },
    start: () => {
      endAt.current = Date.now() + remaining * 1000
      setRunning(true)
    },
    pause: () => setRunning(false),
    reset: () => {
      setRunning(false)
      setPhase('focus')
      setRemaining(preset.focus * 60)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function FocusPanel() {
  const f = useFocus()
  return (
    <div className="dock" role="region" aria-label="Focus timer and ambient sound">
      <div className="row between" style={{ marginBottom: 12 }}>
        <strong className="row" style={{ gap: 8 }}>
          <Timer size={18} aria-hidden /> Focus
        </strong>
        <button className="icon-btn icon-btn-sm" onClick={() => f.setOpen(false)} aria-label="Minimise focus player">
          <Minimize2 size={16} />
        </button>
      </div>
      <div className="row" style={{ gap: 14, alignItems: 'center' }}>
        <div>
          <div className="num" style={{ fontSize: '2.2rem', lineHeight: 1 }} aria-live="off">
            {mmss(f.remaining)}
          </div>
          <span className={`badge ${f.phase === 'focus' ? 'badge-primary' : 'badge-ok'}`} style={{ marginTop: 6 }}>
            {f.phase === 'focus' ? 'Focus' : 'Break'} · {f.running ? 'running' : f.remaining === f.total ? 'ready' : 'paused'}
          </span>
        </div>
        <div className="row" style={{ marginLeft: 'auto', gap: 6 }}>
          {f.running ? (
            <button className="btn btn-primary" onClick={f.pause}>
              <Pause size={16} aria-hidden /> Pause
            </button>
          ) : (
            <button className="btn btn-primary" onClick={f.start}>
              <Play size={16} aria-hidden /> {f.remaining === f.total ? 'Start' : 'Resume'}
            </button>
          )}
          <button className="icon-btn bordered" onClick={f.reset} aria-label="Reset timer">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="progress" style={{ marginTop: 12 }} aria-hidden>
        <span style={{ transform: `scaleX(${1 - f.remaining / f.total})`, transition: 'transform 250ms linear', background: f.phase === 'break' ? 'var(--ok)' : undefined }} />
      </div>
      <label className="field" style={{ marginTop: 12 }}>
        <span className="label" style={{ fontSize: 'var(--fs-xs)' }}>Intervals</span>
        <select className="select" value={f.presetId} onChange={(e) => f.setPreset(e.target.value)}>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <div className="menu-sep" style={{ margin: '14px 0' }} />
      <div className="row between" style={{ marginBottom: 8 }}>
        <strong className="row" style={{ gap: 8, fontSize: 'var(--fs-sm)' }}>
          <Headphones size={16} aria-hidden /> Ambient sound
        </strong>
        <span className="eq" data-paused={!f.playing} aria-hidden>
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="grid grid-2" style={{ gap: 6 }}>
        {soundscapes.map((s) => (
          <button key={s.id} className="chip" aria-pressed={f.playing && f.sound === s.id} onClick={() => f.toggleSound(s.id)} title={s.desc} style={{ justifyContent: 'center' }}>
            {f.playing && f.sound === s.id ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />} {s.label}
          </button>
        ))}
      </div>
      <label className="row" style={{ marginTop: 10, gap: 8 }}>
        <Volume2 size={16} aria-hidden />
        <span className="sr-only">Volume</span>
        <input type="range" min={0} max={1} step={0.05} value={f.volume} onChange={(e) => f.setVolume(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--primary)' }} />
      </label>
      <p className="subtle" style={{ marginTop: 8 }}>
        Sounds are generated in your browser — no music service is connected. Focus sessions add up to 2 small credits a day.
      </p>
    </div>
  )
}

/** Persistent bottom-right stack: Study Buddy entry + docked focus player. */
export function FloatingDock() {
  const f = useFocus()
  const { state } = useApp()
  const location = useLocation()
  const onBuddy = location.pathname.startsWith('/buddy')
  const active = f.running || f.playing
  if (state.prefs.role !== 'student') return null
  return (
    <div className="fab-stack">
      {f.open ? (
        <FocusPanel />
      ) : (
        <button className="dock-mini" onClick={() => f.setOpen(true)} aria-label={active ? `Focus player: ${mmss(f.remaining)} ${f.running ? 'running' : 'paused'}. Open` : 'Open focus timer and sounds'}>
          {active ? (
            <>
              <span className="eq" data-paused={!f.playing} aria-hidden>
                <i />
                <i />
                <i />
              </span>
              {mmss(f.remaining)}
            </>
          ) : (
            <>
              <Timer size={16} aria-hidden /> <span className="dock-mini-label">Focus</span>
            </>
          )}
          <span className="icon-btn icon-btn-sm" aria-hidden style={{ background: 'var(--bg-sunk)' }}>
            <Headphones size={15} />
          </span>
        </button>
      )}
      {!onBuddy && !f.open && (
        <Link to="/buddy" className="fab" aria-label="Open Study Buddy">
          <MessageCircleHeart size={20} aria-hidden />
          <span className="fab-label">Study Buddy</span>
        </Link>
      )}
    </div>
  )
}
