import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowDown, ArrowUp, ImagePlus, RotateCcw, Trash2 } from 'lucide-react'
import { useApp, defaultPrefs, type WidgetId, type Counsellor } from '../state/store'
import { notifCategoryLabels, type NotifCategory } from '../data/campus'
import { Field, PageHeader, Segmented, Switch } from '../components/ui'
import { Modal } from '../components/overlay'
import { BrandMark } from '../components/shell'
import { useToast } from '../components/toast'

const accents = [
  { name: 'Classroom blue', value: '#4968d5' },
  { name: 'Garden green', value: '#3f8a5f' },
  { name: 'Terracotta', value: '#c2603d' },
  { name: 'Plum', value: '#7a52b3' },
  { name: 'Teal', value: '#1f8a95' },
  { name: 'Ink', value: '#2f3b52' },
]

const widgetLabels: Record<WidgetId, { name: string; desc: string }> = {
  catchup: { name: 'Catch Me Up', desc: 'Recovery progress for the last day you missed' },
  stats: { name: 'At a glance', desc: 'Attendance, tasks, next event, credits' },
  agenda: { name: 'Today’s agenda', desc: 'Classes and breaks for today' },
  suggestions: { name: 'Suggested for you', desc: 'Rules-based reminders and ideas' },
  announcements: { name: 'Announcements', desc: 'Notices, updates and social news' },
  menu: { name: 'Today’s menu', desc: 'Next canteen meal' },
  profile: { name: 'Profile strength', desc: 'Your next profile step' },
  checkin: { name: 'Mood check-in', desc: 'Optional, private, not saved' },
}

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card settings-section" data-reveal aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} style={{ fontSize: 'var(--fs-md)' }}>
        {title}
      </h2>
      {desc && <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>{desc}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  )
}

function Branding() {
  const { state, setPrefs } = useApp()
  const toast = useToast()
  const [name, setName] = useState(state.prefs.schoolName)
  const [initials, setInitials] = useState(state.prefs.schoolInitials)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Enter the school name.'
    if (!/^[A-Za-z0-9]{1,3}$/.test(initials.trim())) errs.initials = 'Use 1–3 letters or numbers.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setPrefs({ schoolName: name.trim(), schoolInitials: initials.trim().toUpperCase() })
    toast('School branding updated across the portal.')
  }
  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setErrors({ logo: 'Choose an image file.' })
    if (file.size > 300_000) return setErrors({ logo: 'Keep the logo under 300 KB.' })
    const reader = new FileReader()
    reader.onload = () => {
      setPrefs({ logo: reader.result as string })
      setErrors({})
      toast('Logo updated.')
    }
    reader.readAsDataURL(file)
  }
  return (
    <Section id="branding" title="School branding" desc="One place to rebrand the portal for any school. Changes apply everywhere.">
      <form onSubmit={save} noValidate>
        <div className="form-grid">
          <Field id="s-name" label="School name" error={errors.name}>
            <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={48} aria-invalid={!!errors.name} />
          </Field>
          <Field id="s-init" label="Initials" hint="Shown when there’s no logo" error={errors.initials}>
            <input id="s-init" className="input" value={initials} onChange={(e) => setInitials(e.target.value)} maxLength={3} aria-invalid={!!errors.initials} />
          </Field>
        </div>
        <div className="row wrap" style={{ gap: 12, marginTop: 16, alignItems: 'center' }}>
          <BrandMark size={52} />
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <ImagePlus size={16} aria-hidden /> Upload logo
            <input type="file" accept="image/*" onChange={onLogo} className="sr-only" />
          </label>
          {state.prefs.logo && (
            <button type="button" className="btn btn-ghost" onClick={() => setPrefs({ logo: null })}>
              <Trash2 size={16} aria-hidden /> Remove logo
            </button>
          )}
          {errors.logo && <span className="error" role="alert" style={{ color: 'var(--danger)', fontSize: 'var(--fs-xs)' }}>{errors.logo}</span>}
          <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
            Save branding
          </button>
        </div>
      </form>
      <div className="field" style={{ marginTop: 20 }}>
        <span className="label" id="accent-l">
          Accent colour
        </span>
        <div className="row wrap" role="radiogroup" aria-labelledby="accent-l" style={{ gap: 10 }}>
          {accents.map((a) => (
            <button key={a.value} role="radio" aria-checked={state.prefs.accent === a.value} className="accent-swatch" onClick={() => setPrefs({ accent: a.value })} title={a.name}>
              <span style={{ background: a.value }} aria-hidden />
              {a.name}
            </button>
          ))}
          <label className="accent-swatch" style={{ cursor: 'pointer' }}>
            <input type="color" value={state.prefs.accent} onChange={(e) => setPrefs({ accent: e.target.value })} aria-label="Custom accent colour" style={{ width: 22, height: 22, border: 0, padding: 0, background: 'none' }} />
            Custom
          </label>
        </div>
      </div>
    </Section>
  )
}

function Appearance() {
  const { state, setPrefs } = useApp()
  return (
    <Section id="appearance" title="Appearance & motion">
      <div className="setting-row">
        <div>
          <strong style={{ fontSize: 'var(--fs-sm)' }}>Theme</strong>
          <p>System follows your device setting.</p>
        </div>
        <Segmented label="Theme" value={state.prefs.theme} onChange={(theme) => setPrefs({ theme })} options={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'system', label: 'System' }]} />
      </div>
      <div className="setting-row">
        <div>
          <strong style={{ fontSize: 'var(--fs-sm)' }}>Motion</strong>
          <p>Reduced keeps fades but removes movement.</p>
        </div>
        <Segmented label="Motion" value={state.prefs.motion} onChange={(motion) => setPrefs({ motion })} options={[{ id: 'system', label: 'System' }, { id: 'reduced', label: 'Reduced' }, { id: 'full', label: 'Full' }]} />
      </div>
    </Section>
  )
}

function HomeWidgets() {
  const { state, setPrefs } = useApp()
  const saved = state.prefs.homeWidgets
  const list = [...defaultPrefs.homeWidgets.filter((d) => !saved.some((w) => w.id === d.id)), ...saved]
  const move = (i: number, d: -1 | 1) => {
    const arr = [...list]
    ;[arr[i], arr[i + d]] = [arr[i + d], arr[i]]
    setPrefs({ homeWidgets: arr })
  }
  return (
    <Section id="home" title="Home widgets" desc="Choose what appears on Home and in what order. Wide widgets sit in the main column; small ones in the side column.">
      <ul className="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {list.map((w, i) => (
          <li key={w.id} className="list-row">
            <div className="list-row-main">
              <div className="list-row-title" style={{ opacity: w.visible ? 1 : 0.55 }}>{widgetLabels[w.id].name}</div>
              <div className="list-row-meta">{widgetLabels[w.id].desc}</div>
            </div>
            <button className="icon-btn icon-btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${widgetLabels[w.id].name} up`}>
              <ArrowUp size={15} />
            </button>
            <button className="icon-btn icon-btn-sm" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${widgetLabels[w.id].name} down`}>
              <ArrowDown size={15} />
            </button>
            <Switch checked={w.visible} onChange={(v) => setPrefs({ homeWidgets: list.map((x) => (x.id === w.id ? { ...x, visible: v } : x)) })} label={`Show ${widgetLabels[w.id].name}`} />
          </li>
        ))}
      </ul>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setPrefs({ homeWidgets: defaultPrefs.homeWidgets })}>
        <RotateCcw size={14} aria-hidden /> Reset layout
      </button>
    </Section>
  )
}

function NotificationPrefs() {
  const { state, setPrefs } = useApp()
  return (
    <Section id="notifications" title="Notifications">
      {(Object.keys(notifCategoryLabels) as NotifCategory[]).map((c) => (
        <div key={c} className="setting-row">
          <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{notifCategoryLabels[c]}</span>
          <Switch checked={!state.prefs.notifMuted[c]} onChange={(on) => setPrefs({ notifMuted: { ...state.prefs.notifMuted, [c]: !on } })} label={`${notifCategoryLabels[c]} notifications`} />
        </div>
      ))}
    </Section>
  )
}

function SchoolConfig() {
  const { state, setPrefs } = useApp()
  const toast = useToast()
  const [target, setTarget] = useState(String(state.prefs.attendanceTarget))
  const [c, setC] = useState<Counsellor>(state.prefs.counsellor)
  const [err, setErr] = useState('')
  const save = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(target)
    if (!Number.isFinite(n) || n < 50 || n > 100) return setErr('Use a number between 50 and 100.')
    setErr('')
    setPrefs({ attendanceTarget: Math.round(n), counsellor: { name: c.name.trim(), room: c.room.trim(), hours: c.hours.trim(), howToReach: c.howToReach.trim() } })
    toast('School settings saved.')
  }
  return (
    <Section id="school" title="School configuration" desc="Normally set by the school administrator. Only enter details that have been verified by the school.">
      <form onSubmit={save} noValidate>
        <div className="form-grid">
          <Field id="s-target" label="Attendance target (%)" hint="Used for warnings and charts. The sample default is 85% — not an official policy." error={err} className="full">
            <input id="s-target" className="input" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} aria-invalid={!!err} style={{ maxWidth: 140 }} />
          </Field>
          <Field id="c-name" label="School counsellor name">
            <input id="c-name" className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="Not set" />
          </Field>
          <Field id="c-room" label="Where to find them">
            <input id="c-room" className="input" value={c.room} onChange={(e) => setC({ ...c, room: e.target.value })} placeholder="Not set" />
          </Field>
          <Field id="c-hours" label="When they’re available">
            <input id="c-hours" className="input" value={c.hours} onChange={(e) => setC({ ...c, hours: e.target.value })} placeholder="Not set" />
          </Field>
          <Field id="c-how" label="How to reach them">
            <input id="c-how" className="input" value={c.howToReach} onChange={(e) => setC({ ...c, howToReach: e.target.value })} placeholder="Not set" />
          </Field>
        </div>
        <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>
          Save school settings
        </button>
      </form>
    </Section>
  )
}

function Privacy() {
  const { state, setPrefs, update, session, setSession, resetAll } = useApp()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  return (
    <Section id="privacy" title="Privacy & data" desc="This prototype keeps everything in your browser. Nothing is sent to a server.">
      <div className="setting-row">
        <div>
          <strong style={{ fontSize: 'var(--fs-sm)' }}>Offer a mood check-in on Home</strong>
          <p>Always optional. Your answer is kept in memory only and never saved.</p>
        </div>
        <Switch checked={state.prefs.showMoodCheckin} onChange={(v) => setPrefs({ showMoodCheckin: v })} label="Offer mood check-in" />
      </div>
      <div className="setting-row">
        <div>
          <strong style={{ fontSize: 'var(--fs-sm)' }}>Clear Study Buddy chat and today’s check-in</strong>
          <p>{session.chat.length} messages in this session{session.mood ? ' · check-in answered' : ''}. These are cleared on refresh anyway.</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setSession((s) => ({ ...s, chat: [], mood: null }))
            toast('Session data cleared.')
          }}
          disabled={!session.chat.length && !session.mood}
        >
          Clear now
        </button>
      </div>
      <div className="setting-row">
        <div>
          <strong style={{ fontSize: 'var(--fs-sm)' }}>Bring back hidden suggestions</strong>
          <p>{state.dismissed.length} hidden.</p>
        </div>
        <button className="btn btn-secondary btn-sm" disabled={!state.dismissed.length} onClick={() => update((s) => ({ ...s, dismissed: [] }))}>
          Restore
        </button>
      </div>
      <div className="setting-row">
        <div>
          <strong style={{ fontSize: 'var(--fs-sm)' }}>Reset all demo data</strong>
          <p>Restores sample tasks, RSVPs, settings and branding.</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}>
          Reset
        </button>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset the demo?"
        description="Your to-dos, feedback, gate passes, ratings and settings on this device will go back to the sample data."
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirm(false)} data-autofocus>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                resetAll()
                setConfirm(false)
                toast('Demo data reset.')
              }}
            >
              Reset everything
            </button>
          </>
        }
      >
        <span />
      </Modal>
    </Section>
  )
}

export default function Settings() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ block: 'start' }), 50)
  }, [hash])
  const links = [
    ['branding', 'Branding'],
    ['appearance', 'Appearance'],
    ['home', 'Home widgets'],
    ['notifications', 'Notifications'],
    ['school', 'School'],
    ['privacy', 'Privacy'],
  ]
  return (
    <>
      <PageHeader title="Settings" description="Personalise the portal. Preferences are saved in this browser." />
      <div className="settings-layout">
        <nav className="settings-nav hide-mobile" aria-label="Settings sections">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="nav-item" onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
              {label}
            </a>
          ))}
        </nav>
        <div className="stack">
          <Branding />
          <Appearance />
          <HomeWidgets />
          <NotificationPrefs />
          <SchoolConfig />
          <Privacy />
        </div>
      </div>
    </>
  )
}
