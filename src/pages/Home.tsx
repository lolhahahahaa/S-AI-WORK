import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Users, PackageSearch, ArrowRight, BookOpen, CalendarCheck, CalendarHeart, ChevronRight, ClipboardList, HeartHandshake, Info, ListTodo, Lock, Megaphone, PartyPopper, Pin, Sprout, UtensilsCrossed, X, GraduationCap } from 'lucide-react'
import { useApp, type WidgetId } from '../state/store'
import { student } from '../data/school'
import { announcements, menuForDate, dietLabels, type Announcement } from '../data/campus'
import { TODAY, NOW_MINUTES, fmtLong, fmtDay, parse, relDay, greetingFor, daysUntil } from '../lib/date'
import { attendanceSummary, creditSummary, nextEventFor, profileStrength, suggestions, taskCounts, upcomingExams, type Suggestion } from '../lib/insights'
import { DayTimeline, agendaFor, stateOf } from '../components/agenda'
import { Empty, ProgressBar, StatCard, Tabs, PrototypeTag } from '../components/ui'
import { useToast } from '../components/toast'
import { useMedia, MOBILE } from '../lib/useMedia'
import { ParentHome, TeacherHome, AdminHome } from './RoleHomes'
import { latestMissedDay, recoverySummary } from '../lib/catchup'
import { Ring } from '../components/charts/charts'
import { defaultPrefs } from '../state/store'

function CatchUpHero() {
  const { state } = useApp()
  const day = latestMissedDay()
  if (!day) return null
  const sum = recoverySummary(day.date, state)
  const done = sum.total > 0 && sum.done === sum.total
  return (
    <section className="cu-home" aria-labelledby="cu-home-h" data-reveal style={{ viewTransitionName: 'catchup-hero' }}>
      <div style={{ viewTransitionName: 'catchup-ring' }}>
        <Ring value={sum.done} max={Math.max(sum.total, 1)} size={92} stroke={10} label={`${Math.round(sum.ratio * 100)}%`} sub="caught up" color="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="eyebrow">Catch Me Up</span>
        <h2 id="cu-home-h">{done ? `You’re caught up for ${fmtDay(parse(day.date))}` : `You missed ${sum.classes.length} classes on ${fmtDay(parse(day.date))}`}</h2>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>
          {done
            ? 'Every recovery step is done. Pick another day if you missed more.'
            : `${sum.done} of ${sum.total} steps done · ~${sum.minutesLeft} min left${sum.next ? ` · Next: ${sum.next.title}` : ''}`}
        </p>
        {!done && sum.missingNotes + sum.missingRecords > 0 && <p className="subtle" style={{ marginTop: 2 }}>{sum.missingNotes + sum.missingRecords} class{sum.missingNotes + sum.missingRecords > 1 ? 'es' : ''} still missing notes from teachers.</p>}
      </div>
      <div className="cu-home-actions">
        <Link to={`/catch-up?date=${day.date}${done ? '' : '&step=plan'}`} viewTransition className="btn btn-primary">
          {done ? 'Review' : 'Continue catching up'} <ArrowRight size={16} aria-hidden />
        </Link>
        <Link to="/catch-up" viewTransition className="link-btn">
          Choose another day
        </Link>
      </div>
    </section>
  )
}

const sugIcons = { peer: Users, lost: PackageSearch, exam: GraduationCap, task: ClipboardList, book: BookOpen, heart: HeartHandshake, event: PartyPopper, attendance: CalendarCheck }

function SuggestionRow({ s, onDismiss }: { s: Suggestion; onDismiss: () => void }) {
  const [why, setWhy] = useState(false)
  const Icon = sugIcons[s.icon]
  return (
    <li className="sug-row">
      <span className="stat-icon" style={{ background: `var(--${s.tone})`, width: 36, height: 36 }} aria-hidden>
        <Icon size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="list-row-title">{s.title}</div>
        <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          {s.body}
        </div>
        <div className="row wrap" style={{ gap: 14, marginTop: 6 }}>
          <Link to={s.action.to} className="link-btn">
            {s.action.label} <ArrowRight size={14} aria-hidden />
          </Link>
          <button className="link-btn" style={{ color: 'var(--text-2)', fontWeight: 600 }} aria-expanded={why} onClick={() => setWhy(!why)}>
            <Info size={14} aria-hidden /> Why am I seeing this?
          </button>
        </div>
        {why && (
          <p className="notice notice-neutral" style={{ marginTop: 8 }}>
            {s.why} <span className="subtle">These suggestions come from simple rules in this prototype, not AI.</span>
          </p>
        )}
      </div>
      <button className="icon-btn icon-btn-sm" onClick={onDismiss} aria-label={`Dismiss suggestion: ${s.title}`}>
        <X size={16} />
      </button>
    </li>
  )
}

function Suggestions() {
  const { state, session, update } = useApp()
  const toast = useToast()
  const [all, setAll] = useState(false)
  const isMobile = useMedia(MOBILE)
  const limit = isMobile ? 2 : 3
  const list = suggestions(state, session, state.prefs.attendanceTarget)
  const shown = all ? list : list.slice(0, limit)
  return (
    <section className="card" aria-labelledby="sug-h" data-reveal>
      <div className="card-head">
        <h2 id="sug-h" style={{ fontSize: 'var(--fs-md)' }}>
          Suggested for you
        </h2>
        <span className="prototype-tag">Rules-based</span>
      </div>
      {list.length === 0 ? (
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          You’re all caught up. New suggestions appear when a test or deadline gets close.
        </p>
      ) : (
        <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {shown.map((s) => (
            <SuggestionRow
              key={s.id}
              s={s}
              onDismiss={() => {
                update((st) => ({ ...st, dismissed: [...st.dismissed, s.id] }))
                toast('Suggestion hidden. You can bring it back in Settings.', 'info')
              }}
            />
          ))}
        </ul>
      )}
      {list.length > limit && (
        <button className="link-btn" style={{ marginTop: 10 }} onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? 'Show fewer' : `Show ${list.length - limit} more`}
        </button>
      )}
    </section>
  )
}

const annIcon: Record<Announcement['type'], string> = { notice: 'var(--butter)', update: 'var(--sky)', social: 'var(--peach)' }

function Announcements() {
  const [tab, setTab] = useState<'all' | 'notice' | 'update' | 'social'>('all')
  const list = announcements.filter((a) => tab === 'all' || a.type === tab)
  return (
    <section className="card" aria-labelledby="ann-h" data-reveal>
      <div className="card-head" style={{ marginBottom: 8 }}>
        <h2 id="ann-h" style={{ fontSize: 'var(--fs-md)' }}>
          <Megaphone size={18} aria-hidden /> Announcements
        </h2>
        <PrototypeTag />
      </div>
      <Tabs
        idBase="ann"
        label="Filter announcements"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'notice', label: 'Notices' },
          { id: 'update', label: 'Updates' },
          { id: 'social', label: 'Social' },
        ]}
      />
      <div id="ann-panel" role="tabpanel" aria-labelledby={`ann-tab-${tab}`}>
        {list.length === 0 ? (
          <Empty icon={<Megaphone size={22} />} title="Nothing here yet" />
        ) : (
          <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {list.slice(0, 5).map((a) => (
              <li key={a.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <span className="dot" style={{ width: 10, height: 10, marginTop: 7, background: annIcon[a.type], boxShadow: 'inset 0 0 0 1.5px var(--border-strong)' }} aria-hidden />
                <div className="list-row-main">
                  <div className="list-row-title row" style={{ gap: 6 }}>
                    {a.pinned && <Pin size={14} aria-label="Pinned" />}
                    {a.title}
                  </div>
                  <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 2 }}>
                    {a.body}
                  </p>
                  <div className="list-row-meta" style={{ marginTop: 4 }}>
                    <span>{a.from}</span>
                    <span>{relDay(a.date)}</span>
                    <span className="badge badge-outline" style={{ height: 20 }}>
                      {a.type === 'notice' ? 'Notice' : a.type === 'update' ? 'Update' : 'Social'}
                    </span>
                    {a.link && (
                      <Link to={a.link} className="link-btn">
                        Open <ChevronRight size={14} aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function AgendaCard() {
  const items = agendaFor(TODAY).filter((i) => i.kind === 'class')
  const left = items.filter((i) => stateOf(i, TODAY) !== 'past').length
  return (
    <section className="card" aria-labelledby="agenda-h" data-reveal>
      <div className="card-head" style={{ marginBottom: 10 }}>
        <div>
          <h2 id="agenda-h" style={{ fontSize: 'var(--fs-md)' }}>
            Today’s agenda
          </h2>
          <div className="subtle">
            {left} of {items.length} classes left
          </div>
        </div>
        <Link to="/schedule" className="link-btn">
          Full day <ChevronRight size={14} aria-hidden />
        </Link>
      </div>
      <DayTimeline date={TODAY} compact hidePast />
    </section>
  )
}

function MenuCard() {
  const { state } = useApp()
  const meals = menuForDate(TODAY)
  const upcoming = meals?.find((m) => (m.key === 'lunch' ? NOW_MINUTES < 13 * 60 : m.key === 'snack' ? NOW_MINUTES < 10 * 60 + 20 : NOW_MINUTES < 7 * 60 + 45)) ?? meals?.[2]
  return (
    <section className="card tint-butter" style={{ borderColor: 'transparent' }} aria-labelledby="menu-h" data-reveal>
      <div className="card-head" style={{ marginBottom: 8 }}>
        <h2 id="menu-h" style={{ fontSize: 'var(--fs-md)' }}>
          <UtensilsCrossed size={18} aria-hidden /> Today’s menu
        </h2>
        <Link to="/events?tab=food" className="link-btn">
          Rate & more <ChevronRight size={14} aria-hidden />
        </Link>
      </div>
      {!meals || !upcoming ? (
        <p className="muted">The canteen is closed today.</p>
      ) : (
        <>
          <div className="subtle" style={{ color: 'var(--text-2)' }}>
            Next: <strong style={{ color: 'var(--text)' }}>{upcoming.label}</strong> · {upcoming.time}
          </div>
          <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6 }}>
            {upcoming.items.map((i) => (
              <li key={i.id} className="row between" style={{ gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{i.name}</span>
                <span className="row" style={{ gap: 4 }}>
                  {state.menuRatings[i.id] && <span className="subtle">You: {state.menuRatings[i.id]}★</span>}
                  {i.diet.filter((d) => d !== 'veg').map((d) => (
                    <span key={d} className="badge" style={{ background: 'color-mix(in oklab, var(--surface) 60%, transparent)', height: 20 }}>
                      {dietLabels[d]}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function ProfileCard() {
  const { state } = useApp()
  const p = profileStrength(state)
  const next = p.items.find((i) => !i.done)
  return (
    <section className="card" aria-labelledby="ps-h" data-reveal>
      <div className="card-head" style={{ marginBottom: 10 }}>
        <h2 id="ps-h" style={{ fontSize: 'var(--fs-md)' }}>
          Profile strength
        </h2>
        <span className="num" style={{ fontSize: 'var(--fs-lg)' }}>
          {p.percent}%
        </span>
      </div>
      <ProgressBar value={p.percent} label="Profile strength" />
      <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>
        {next ? (
          <>
            Next: <strong style={{ color: 'var(--text)' }}>{next.label}</strong>. {next.hint}.
          </>
        ) : (
          'Your profile is complete. Nice!'
        )}
      </p>
      <Link to="/profile" className="link-btn" style={{ marginTop: 8 }}>
        {next ? 'Complete profile' : 'View profile'} <ChevronRight size={14} aria-hidden />
      </Link>
    </section>
  )
}

const moods = [
  { v: 5, label: 'Great', face: '😄' },
  { v: 4, label: 'Good', face: '🙂' },
  { v: 3, label: 'Okay', face: '😐' },
  { v: 2, label: 'Low', face: '😕' },
  { v: 1, label: 'Really low', face: '😞' },
] as const

function MoodCheckin() {
  const { session, setSession, state } = useApp()
  const [hidden, setHidden] = useState(false)
  if (hidden || !state.prefs.showMoodCheckin) return null
  const m = session.mood
  return (
    <section className="card tint-sage" style={{ borderColor: 'transparent' }} aria-labelledby="mood-h" data-reveal>
      <div className="card-head" style={{ marginBottom: 8 }}>
        <h2 id="mood-h" style={{ fontSize: 'var(--fs-md)' }}>
          How are you feeling today?
        </h2>
        <button className="icon-btn icon-btn-sm" onClick={() => setHidden(true)} aria-label="Skip check-in">
          <X size={16} />
        </button>
      </div>
      <p className="row subtle" style={{ gap: 6, color: 'var(--text-2)' }}>
        <Lock size={13} aria-hidden /> Optional and private. Not saved after you close the portal.
      </p>
      <div className="row wrap" role="radiogroup" aria-label="Mood" style={{ gap: 6, marginTop: 10 }}>
        {moods.map((o) => (
          <button key={o.v} role="radio" aria-checked={m?.value === o.v} className="chip mood-chip" aria-pressed={m?.value === o.v} onClick={() => setSession((s) => ({ ...s, mood: { value: o.v } }))}>
            <span aria-hidden>{o.face}</span> {o.label}
          </button>
        ))}
      </div>
      {m && (
        <p className="notice" style={{ marginTop: 10, background: 'color-mix(in oklab, var(--surface) 70%, transparent)' }} role="status">
          {m.value >= 4 ? (
            'Glad to hear it. Have a good day!'
          ) : m.value === 3 ? (
            'Thanks for checking in. Small breaks between tasks can help on “okay” days.'
          ) : (
            <span>
              Thanks for telling us. Feeling low happens to everyone sometimes. <Link to="/buddy?mode=wellbeing">Open a calm space</Link> or talk to a trusted adult — a parent, your class teacher or the school counsellor.
            </span>
          )}
        </p>
      )}
    </section>
  )
}

function StatsRow() {
  const { state } = useApp()
  const att = attendanceSummary(state.prefs.attendanceTarget)
  const tasks = taskCounts(state)
  const ev = nextEventFor(state)
  const cr = creditSummary(state)
  return (
    <section className="grid grid-4" aria-label="At a glance" data-reveal>
      <StatCard
        to="/attendance"
        label="Attendance"
        value={att.overall.percent}
        unit="%"
        tint="var(--sage)"
        icon={<CalendarCheck size={17} />}
        foot={att.change >= 0 ? `Up ${att.change} pts in ${att.last.label}` : `Down ${-att.change} pts in ${att.last.label}`}
      />
      <StatCard
        to="/tasks"
        label="Pending tasks"
        value={tasks.pending}
        tint="var(--peach)"
        icon={<ListTodo size={17} />}
        foot={tasks.overdue.length ? `${tasks.overdue.length} overdue · ${tasks.dueSoon.length} due soon` : `${tasks.dueSoon.length} due in the next 2 days`}
      />
      <StatCard to="/events" label="Next event" value={<span style={{ fontSize: '1.25rem', lineHeight: 1.25, display: 'block' }}>{ev ? ev.title : 'None'}</span>} tint="var(--sky)" icon={<CalendarHeart size={17} />} foot={ev ? `${fmtDay(parse(ev.date))}${ev.rsvp === 'going' ? ' · You’re going' : ''}` : 'Nothing scheduled'} />
      <StatCard to="/growth" label="Credits" value={cr.total} tint="var(--butter)" icon={<Sprout size={17} />} foot={`${cr.level.name}${cr.next ? ` · ${cr.next.min - cr.total} to ${cr.next.name}` : ''}`} />
    </section>
  )
}

function Greeting() {
  const { state } = useApp()
  const tasks = taskCounts(state)
  const exam = upcomingExams()[0]
  const classesLeft = agendaFor(TODAY).filter((i) => i.kind === 'class' && stateOf(i, TODAY) !== 'past').length
  const bits: ReactNode[] = [`${classesLeft} classes left today`]
  if (tasks.overdue.length) bits.push(`${tasks.overdue.length} overdue task`)
  if (tasks.dueSoon.length) bits.push(`${tasks.dueSoon.length} due soon`)
  return (
    <header className="page-header home-greeting" data-reveal>
      <div>
        <div className="eyebrow">
          {fmtLong(TODAY)} · Grade {student.grade}
          {student.section}
        </div>
        <h1>
          {greetingFor(NOW_MINUTES)}, {student.firstName}
        </h1>
        <p>
          {bits.join(' · ')}.{exam && daysUntil(exam.date) <= 10 && <> Next test: {exam.subjectInfo.name}, {fmtDay(parse(exam.date))} ({exam.in} days).</>}
        </p>
      </div>
      <div className="page-actions hide-mobile">
        <Link to="/tasks" className="btn btn-secondary">
          <ListTodo size={16} aria-hidden /> My tasks
        </Link>
        <Link to="/schedule" className="btn btn-primary">
          Today’s timetable
        </Link>
      </div>
    </header>
  )
}

const MAIN: WidgetId[] = ['catchup', 'stats', 'suggestions', 'announcements']
const widgetsMap: Record<WidgetId, () => ReactNode> = {
  catchup: () => <CatchUpHero key="catchup" />,
  stats: () => <StatsRow key="stats" />,
  suggestions: () => <Suggestions key="sug" />,
  announcements: () => <Announcements key="ann" />,
  agenda: () => <AgendaCard key="agenda" />,
  menu: () => <MenuCard key="menu" />,
  profile: () => <ProfileCard key="profile" />,
  checkin: () => <MoodCheckin key="mood" />,
}

function StudentHome() {
  const { state } = useApp()
  const isMobile = useMedia(MOBILE)
  // Widgets added in later versions appear even if older saved preferences don't list them.
  const saved = state.prefs.homeWidgets
  const widgets = [...defaultPrefs.homeWidgets.filter((d) => !saved.some((w) => w.id === d.id)), ...saved]
  const visible = widgets.filter((w) => w.visible)
  const main = visible.filter((w) => MAIN.includes(w.id))
  const aside = visible.filter((w) => !MAIN.includes(w.id))
  // On phones the agenda leads: "what's happening today" comes first.
  const rankMobile = (id: WidgetId) => (id === 'catchup' ? 0 : id === 'agenda' ? 1 : 2)
  const mobileOrder = [...visible].sort((a, b) => rankMobile(a.id) - rankMobile(b.id))
  return (
    <>
      <Greeting />
      {isMobile ? (
        <div className="stack">{mobileOrder.map((w) => widgetsMap[w.id]())}</div>
      ) : (
        <div className="home-grid">
          <div className="stack">{main.map((w) => widgetsMap[w.id]())}</div>
          <aside className="stack" aria-label="Today">
            {aside.map((w) => widgetsMap[w.id]())}
          </aside>
        </div>
      )}
      {visible.length === 0 && (
        <Empty icon={<Info size={22} />} title="Your Home is empty" action={<Link to="/settings#home" className="btn btn-secondary">Choose widgets</Link>}>
          All Home widgets are hidden.
        </Empty>
      )}
    </>
  )
}

export default function Home() {
  const { state } = useApp()
  if (state.prefs.role === 'parent') return <ParentHome />
  if (state.prefs.role === 'teacher') return <TeacherHome />
  if (state.prefs.role === 'admin') return <AdminHome />
  return <StudentHome />
}
