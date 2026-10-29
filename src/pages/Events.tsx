import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarX, Check, Clock, MapPin, MessageSquareText, Sprout, UtensilsCrossed } from 'lucide-react'
import { useApp } from '../state/store'
import { events, weeklyMenu, dietLabels, type SchoolEvent } from '../data/campus'
import { TODAY, daysUntil, fmtLong, fmtTime, parse, weekdayShort, sameDay } from '../lib/date'
import { weekDates } from '../lib/insights'
import { Empty, PageHeader, PrototypeTag, Stars, Tabs } from '../components/ui'
import { useToast } from '../components/toast'

type Rsvp = 'going' | 'maybe' | 'no'
const rsvpLabel: Record<Rsvp, string> = { going: 'Going', maybe: 'Maybe', no: 'Can’t go' }

function EventCard({ e }: { e: SchoolEvent }) {
  const { state, update } = useApp()
  const toast = useToast()
  const d = parse(e.date)
  const past = daysUntil(e.date) < 0
  const rsvp = state.rsvps[e.id] as Rsvp | undefined
  const set = (v: Rsvp) => {
    update((s) => ({ ...s, rsvps: { ...s.rsvps, [e.id]: v } }))
    toast(`RSVP saved: ${rsvpLabel[v]} — ${e.title}. Saved on this device only.`)
  }
  return (
    <article className="card event-card" aria-labelledby={`ev-${e.id}`}>
      <div className="event-date" aria-hidden>
        <span>{d.toLocaleString('en-IN', { month: 'short' })}</span>
        <strong>{d.getDate()}</strong>
        <span>{weekdayShort(d)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row wrap" style={{ gap: 6, marginBottom: 4 }}>
          <span className="badge badge-outline">{e.category}</span>
          {e.credits && !past && (
            <span className="badge">
              <Sprout aria-hidden /> +{e.credits} credits
            </span>
          )}
        </div>
        <h3 id={`ev-${e.id}`}>{e.title}</h3>
        <div className="list-row-meta" style={{ marginTop: 4 }}>
          <span className="row" style={{ gap: 4 }}>
            <Clock size={14} aria-hidden /> <span className="sr-only">{fmtLong(d)}, </span>
            {fmtTime(e.start)} – {fmtTime(e.end)}
          </span>
          <span className="row" style={{ gap: 4 }}>
            <MapPin size={14} aria-hidden /> {e.location}
          </span>
        </div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 8 }}>
          {e.description}
        </p>
        <div style={{ marginTop: 12 }}>
          {past ? (
            <span className={`badge ${rsvp === 'going' ? 'badge-ok' : ''}`}>{rsvp === 'going' ? <><Check aria-hidden /> You took part</> : 'Event finished'}</span>
          ) : !e.rsvpable ? (
            <span className="badge">No RSVP needed</span>
          ) : (
            <div className="row wrap" style={{ gap: 6 }} role="group" aria-label={`RSVP for ${e.title}`}>
              {(['going', 'maybe', 'no'] as Rsvp[]).map((v) => (
                <button key={v} className="chip" aria-pressed={rsvp === v} onClick={() => set(v)}>
                  {rsvp === v && <Check size={14} aria-hidden />} {rsvpLabel[v]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function EventsTab() {
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming')
  const [cat, setCat] = useState<string>('All')
  const cats = ['All', ...new Set(events.map((e) => e.category))]
  const list = events
    .filter((e) => (when === 'upcoming' ? daysUntil(e.date) >= 0 : daysUntil(e.date) < 0) && (cat === 'All' || e.category === cat))
    .sort((a, b) => (when === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))
  return (
    <>
      <div className="toolbar">
        <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="When">
          {(['upcoming', 'past'] as const).map((w) => (
            <button key={w} className="chip" aria-pressed={when === w} onClick={() => setWhen(w)}>
              {w === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <label htmlFor="ev-cat" className="sr-only">Category</label>
          <select id="ev-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      {list.length === 0 ? (
        <Empty icon={<CalendarX size={22} />} title={`No ${when} ${cat === 'All' ? '' : cat.toLowerCase() + ' '}events`}>
          Check back later — new events appear here and in Notifications.
        </Empty>
      ) : (
        <div className="grid grid-2">
          {list.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </>
  )
}

function FoodTab() {
  const { state, update } = useApp()
  const toast = useToast()
  const days = weekDates(TODAY).slice(0, 5)
  const todayIdx = Math.min(4, (TODAY.getDay() + 6) % 7)
  const [dayIdx, setDayIdx] = useState(todayIdx)
  const meals = weeklyMenu[dayIdx]
  const rate = (id: string, name: string, v: number) => {
    update((s) => ({ ...s, menuRatings: { ...s.menuRatings, [id]: v } }))
    toast(`Rated ${name} ${v}★ (saved on this device)`)
  }
  return (
    <>
      <div className="toolbar">
        <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Day">
          {days.map((d, i) => (
            <button key={i} className="chip" aria-pressed={dayIdx === i} onClick={() => setDayIdx(i)}>
              {weekdayShort(d)} {d.getDate()}
              {sameDay(d, TODAY) && <span className="sr-only"> (today)</span>}
              {sameDay(d, TODAY) && <span aria-hidden> · Today</span>}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <PrototypeTag>Sample menu</PrototypeTag>
        </div>
      </div>
      <div className="grid grid-3">
        {meals.map((m) => (
          <section key={m.key} className={`card ${m.key === 'lunch' ? 'tint-butter' : m.key === 'snack' ? 'tint-sage' : 'tint-sky'}`} style={{ borderColor: 'transparent' }} aria-labelledby={`meal-${m.key}`}>
            <h3 id={`meal-${m.key}`}>{m.label}</h3>
            <p className="subtle row" style={{ gap: 4, color: 'var(--text-2)', marginTop: 2 }}>
              <Clock size={13} aria-hidden /> {m.time}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 12 }}>
              {m.items.map((it) => (
                <li key={it.id} className="menu-item-row">
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{it.name}</strong>
                    <span className="row wrap" style={{ gap: 4, marginTop: 4 }}>
                      {it.diet.map((d) => (
                        <span key={d} className="badge" style={{ background: 'color-mix(in oklab, var(--surface) 65%, transparent)', height: 20 }}>
                          {dietLabels[d]}
                        </span>
                      ))}
                    </span>
                  </div>
                  <Stars value={state.menuRatings[it.id] ?? 0} onChange={(v) => rate(it.id, it.name, v)} label={`Rate ${it.name}`} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="notice notice-neutral section" style={{ marginTop: 'var(--s-5)' }}>
        <UtensilsCrossed size={16} aria-hidden />
        <span>
          Dietary labels are a sample. If you have an allergy, always check with canteen staff. Got more to say?{' '}
          <Link to="/feedback?type=canteen">
            <MessageSquareText size={13} style={{ display: 'inline', verticalAlign: '-2px' }} aria-hidden /> Give canteen feedback
          </Link>
        </span>
      </div>
    </>
  )
}

export default function Events() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as 'events' | 'food') ?? 'events'
  return (
    <>
      <PageHeader title="Events & Food" description="What’s happening at school and what’s on the canteen menu." actions={<PrototypeTag />} />
      <Tabs
        idBase="ef"
        label="Section"
        value={tab}
        onChange={(t) => setParams(t === 'events' ? {} : { tab: t }, { replace: true })}
        tabs={[
          { id: 'events', label: 'Events', count: events.filter((e) => daysUntil(e.date) >= 0).length },
          { id: 'food', label: 'Canteen menu' },
        ]}
      />
      <div id="ef-panel" role="tabpanel" aria-labelledby={`ef-tab-${tab}`} style={{ marginTop: 'var(--s-4)' }} data-reveal>
        {tab === 'events' ? <EventsTab /> : <FoodTab />}
      </div>
    </>
  )
}
