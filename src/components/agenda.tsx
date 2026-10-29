import { CalendarOff, Coffee, PartyPopper, PenLine, Utensils } from 'lucide-react'
import { bells, exams, slotInfo, slotsForDate, subjectById } from '../data/school'
import { events } from '../data/campus'
import { holidays, isSummerBreak } from '../data/attendance'
import { NOW_MINUTES, TODAY, fmtTime, iso, sameDay, toMinutes } from '../lib/date'
import { Empty } from './ui'

export interface AgendaItem {
  key: string
  start: string
  end: string
  title: string
  meta: string
  kind: 'class' | 'break' | 'event' | 'exam' | 'assembly'
  tint?: string
  period?: number
}

export function agendaFor(date: Date): AgendaItem[] {
  const key = iso(date)
  const slots = holidays[key] || isSummerBreak(key) ? null : slotsForDate(date)
  const out: AgendaItem[] = []
  if (slots) {
    for (const b of bells) {
      if (b.period === null) {
        out.push({ key: b.label, start: b.start, end: b.end, title: b.label, meta: b.label === 'Lunch' ? 'Canteen open' : b.label === 'Assembly' ? 'Main ground' : 'Snack at the canteen', kind: b.label === 'Assembly' ? 'assembly' : 'break' })
        continue
      }
      const slot = slots[b.period - 1]
      const info = slotInfo(slot)
      out.push({ key: `p${b.period}`, start: b.start, end: b.end, title: info.name, meta: `${b.label} · ${info.teacher} · Room ${info.room}`, kind: 'class', tint: info.tint, period: b.period })
    }
  }
  for (const e of events.filter((x) => x.date === key)) {
    out.push({ key: e.id, start: e.start, end: e.end, title: e.title, meta: e.location, kind: 'event', tint: 'var(--peach)' })
  }
  for (const x of exams.filter((e) => e.date === key)) {
    const s = subjectById(x.subject)!
    // Tests take the first two periods on exam days.
    const i = out.findIndex((o) => o.period === 1)
    const item: AgendaItem = { key: `exam-${x.subject}`, start: '08:00', end: '09:20', title: `${s.name} — ${x.name}`, meta: x.syllabus, kind: 'exam', tint: 'var(--danger-soft)' }
    if (i >= 0) out.splice(i, 2, item)
    else out.push(item)
  }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}

export function stateOf(item: AgendaItem, date: Date) {
  if (!sameDay(date, TODAY)) return date < TODAY ? 'past' : 'future'
  if (toMinutes(item.end) <= NOW_MINUTES) return 'past'
  if (toMinutes(item.start) <= NOW_MINUTES) return 'now'
  return 'future'
}

const icons = { break: Coffee, assembly: Coffee, event: PartyPopper, exam: PenLine }

export function DayTimeline({ date, compact, hidePast }: { date: Date; compact?: boolean; hidePast?: boolean }) {
  let items = agendaFor(date)
  if (!items.length)
    return (
      <Empty icon={<CalendarOff size={22} />} title="No classes scheduled">
        {holidays[iso(date)] ? `School holiday: ${holidays[iso(date)]}.` : isSummerBreak(iso(date)) ? 'Summer break.' : date.getDay() === 0 || date.getDay() === 6 ? 'It’s the weekend. Rest counts too.' : 'Nothing is on the timetable for this day.'}
      </Empty>
    )
  if (hidePast) {
    const firstLive = items.findIndex((i) => stateOf(i, date) !== 'past')
    items = firstLive === -1 ? items.slice(-1) : items.slice(Math.max(0, firstLive - 1))
  }
  if (compact) items = items.filter((i) => i.kind !== 'assembly')
  return (
    <ol className="timeline" aria-label={`Timetable`} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((it) => {
        const st = stateOf(it, date)
        const Icon = it.kind === 'class' ? null : icons[it.kind]
        const isBreak = it.kind === 'break' || it.kind === 'assembly'
        return (
          <li key={it.key} className={`tl-item ${isBreak ? 'tl-break' : ''}`} data-state={st} style={compact && isBreak ? { minHeight: 40 } : undefined}>
            <div className="tl-time">{fmtTime(it.start).replace(' ', ' ')}</div>
            <div className="tl-rail" aria-hidden>
              <span className="tl-node" style={it.kind !== 'class' && !isBreak ? { background: it.kind === 'exam' ? 'var(--danger)' : 'var(--chart-3)', boxShadow: 'none' } : undefined} />
            </div>
            <div className="tl-body" style={!compact && it.kind === 'class' && st !== 'now' ? { background: `color-mix(in oklab, ${it.tint} 55%, transparent)` } : it.kind === 'exam' || it.kind === 'event' ? { background: it.tint } : undefined}>
              <div className="tl-title row" style={{ gap: 6 }}>
                {Icon && <Icon size={14} aria-hidden />}
                {it.kind === 'break' && it.title === 'Lunch' && <Utensils size={14} aria-hidden />}
                {it.title}
                {st === 'now' && <span className="badge badge-primary">Now</span>}
                {it.kind === 'exam' && <span className="badge badge-danger">Test</span>}
              </div>
              {!(compact && isBreak) && (
                <div className="tl-meta">
                  {compact && it.kind === 'class' ? it.meta.split(' · ').slice(1).join(' · ') : `${fmtTime(it.start)} – ${fmtTime(it.end)} · ${it.meta}`}
                </div>
              )}
              {st === 'past' && <span className="sr-only">(finished)</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
