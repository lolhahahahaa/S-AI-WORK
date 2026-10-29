import { useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, GraduationCap, PartyPopper } from 'lucide-react'
import { events } from '../data/campus'
import { exams, subjectById } from '../data/school'
import { holidays } from '../data/attendance'
import { TODAY, addDays, fmtDay, fmtLong, fmtMonth, iso, parse, sameDay, startOfWeek, weekdayShort, fmtTime, daysUntil } from '../lib/date'
import { weekDates } from '../lib/insights'
import { DayTimeline, agendaFor } from '../components/agenda'
import { Empty, PageHeader, Segmented } from '../components/ui'

function markersFor(d: Date) {
  const key = iso(d)
  return {
    exam: exams.find((e) => e.date === key),
    events: events.filter((e) => e.date === key),
    holiday: holidays[key],
  }
}

function WeekStrip({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const days = weekDates(selected)
  return (
    <div className="week-strip-wrap">
      <button className="icon-btn bordered" onClick={() => onSelect(addDays(selected, -7))} aria-label="Previous week">
        <ChevronLeft size={18} />
      </button>
      <div className="week-strip" role="group" aria-label={`Week of ${fmtDay(days[0])}`}>
        {days.map((d) => {
          const m = markersFor(d)
          const isSel = sameDay(d, selected)
          const isToday = sameDay(d, TODAY)
          return (
            <button key={iso(d)} className="week-day" aria-pressed={isSel} aria-current={isToday ? 'date' : undefined} aria-label={`${fmtLong(d)}${isToday ? ', today' : ''}${m.exam ? ', test' : ''}${m.events.length ? `, ${m.events.length} event` : ''}`} onClick={() => onSelect(d)}>
              <span className="week-day-name">{weekdayShort(d)}</span>
              <span className="week-day-num">{d.getDate()}</span>
              <span className="week-day-dots" aria-hidden>
                {m.exam && <i style={{ background: 'var(--danger)' }} />}
                {m.events.length > 0 && <i style={{ background: 'var(--chart-3)' }} />}
                {isToday && !isSel && <i style={{ background: 'var(--primary)' }} />}
              </span>
            </button>
          )
        })}
      </div>
      <button className="icon-btn bordered" onClick={() => onSelect(addDays(selected, 7))} aria-label="Next week">
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function MonthGrid({ selected, onSelect, month, setMonth }: { selected: Date; onSelect: (d: Date) => void; month: Date; setMonth: (d: Date) => void }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = startOfWeek(first)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const rows = cells[35].getMonth() !== month.getMonth() ? 5 : 6
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 12 }}>
        <button className="icon-btn bordered" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h2 aria-live="polite">{fmtMonth(month)}</h2>
        <button className="icon-btn bordered" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="month-grid" role="grid" aria-label={fmtMonth(month)}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="month-head" role="columnheader">
            {d}
          </div>
        ))}
        {cells.slice(0, rows * 7).map((d) => {
          const m = markersFor(d)
          const inMonth = d.getMonth() === month.getMonth()
          const isSel = sameDay(d, selected)
          return (
            <button key={iso(d)} role="gridcell" className="month-cell" data-out={!inMonth} aria-selected={isSel} aria-current={sameDay(d, TODAY) ? 'date' : undefined} aria-label={`${fmtLong(d)}${m.exam ? `, ${subjectById(m.exam.subject)?.name} test` : ''}${m.events.map((e) => `, ${e.title}`).join('')}${m.holiday ? `, holiday` : ''}`} onClick={() => onSelect(d)}>
              <span className="month-num">{d.getDate()}</span>
              <span className="month-marks">
                {m.exam && <span className="month-tag tag-exam">{subjectById(m.exam.subject)?.short} test</span>}
                {m.events.slice(0, 1).map((e) => (
                  <span key={e.id} className="month-tag tag-event">
                    {e.title}
                  </span>
                ))}
                {m.holiday && <span className="month-tag tag-holiday">Holiday</span>}
              </span>
            </button>
          )
        })}
      </div>
      <div className="legend" style={{ marginTop: 12 }}>
        <span>
          <i style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }} /> Test
        </span>
        <span>
          <i style={{ background: 'var(--peach)' }} /> Event
        </span>
        <span>
          <i style={{ background: 'var(--bg-sunk)', border: '1px dashed var(--border-strong)' }} /> Holiday
        </span>
      </div>
    </div>
  )
}

function DaySummary({ date, onOpen }: { date: Date; onOpen: () => void }) {
  const m = markersFor(date)
  const classes = agendaFor(date).filter((a) => a.kind === 'class').length
  return (
    <section className="card" aria-live="polite" aria-label="Selected day">
      <h3>{fmtLong(date)}</h3>
      <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>
        {m.holiday ? `Holiday — ${m.holiday}` : classes ? `${classes} classes` : 'No classes'}
      </p>
      <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
        {m.exam && (
          <li className="list-row">
            <GraduationCap size={18} aria-hidden />
            <div className="list-row-main">
              <div className="list-row-title">
                {subjectById(m.exam.subject)?.name} — {m.exam.name}
              </div>
              <div className="list-row-meta">Syllabus: {m.exam.syllabus}</div>
            </div>
          </li>
        )}
        {m.events.map((e) => (
          <li key={e.id} className="list-row">
            <PartyPopper size={18} aria-hidden />
            <div className="list-row-main">
              <div className="list-row-title">{e.title}</div>
              <div className="list-row-meta">
                {fmtTime(e.start)} · {e.location}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {classes > 0 && (
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={onOpen}>
          Open day timeline
        </button>
      )}
    </section>
  )
}

export default function Schedule() {
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as 'day' | 'month') ?? 'day'
  const selected = params.get('date') ? parse(params.get('date')!) : TODAY
  const month = params.get('month') ? parse(`${params.get('month')}-01`) : new Date(selected.getFullYear(), selected.getMonth(), 1)
  const set = (next: Partial<{ view: string; date: Date; month: Date }>) => {
    const p = new URLSearchParams(params)
    if (next.view) {
      if (next.view === 'day') p.delete('view')
      else p.set('view', next.view)
    }
    if (next.date) {
      if (sameDay(next.date, TODAY)) p.delete('date')
      else p.set('date', iso(next.date))
    }
    if (next.month) p.set('month', iso(next.month).slice(0, 7))
    setParams(p, { replace: true })
  }
  const tests = exams.filter((e) => daysUntil(e.date) >= 0)

  return (
    <>
      <PageHeader
        eyebrow="Grade 9B · 2026–27"
        title="Schedule"
        description="Your timetable, tests and school events in one place."
        actions={
          <div className="row wrap" style={{ gap: 8 }}>
            {!sameDay(selected, TODAY) && (
              <button className="btn btn-secondary" onClick={() => set({ date: TODAY, month: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1) })}>
                Today
              </button>
            )}
            <Segmented
              label="Calendar view"
              value={view}
              onChange={(v) => set({ view: v })}
              options={[
                { id: 'day', label: 'Day' },
                { id: 'month', label: 'Month' },
              ]}
            />
          </div>
        }
      />
      <div className="schedule-layout">
        <div className="stack" data-reveal>
          {view === 'day' ? (
            <>
              <WeekStrip selected={selected} onSelect={(d) => set({ date: d })} />
              <section className="card" aria-label={`Timetable for ${fmtLong(selected)}`}>
                <div className="card-head">
                  <h2 style={{ fontSize: 'var(--fs-md)' }}>
                    {fmtLong(selected)}
                    {sameDay(selected, TODAY) && <span className="badge badge-primary">Today</span>}
                  </h2>
                </div>
                <DayTimeline date={selected} />
              </section>
            </>
          ) : (
            <>
              <MonthGrid selected={selected} month={month} onSelect={(d) => set({ date: d })} setMonth={(m) => set({ month: m })} />
              <DaySummary date={selected} onOpen={() => set({ view: 'day' })} />
            </>
          )}
        </div>
        <aside className="stack" aria-label="Upcoming tests" data-reveal>
          <section className="card">
            <div className="card-head">
              <h2 style={{ fontSize: 'var(--fs-md)' }}>
                <GraduationCap size={18} aria-hidden /> Periodic Test 2
              </h2>
            </div>
            {tests.length === 0 ? (
              <Empty icon={<CalendarDays size={22} />} title="No upcoming tests" />
            ) : (
              <ul className="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tests.map((e) => {
                  const s = subjectById(e.subject)!
                  return (
                    <li key={e.subject}>
                      <button className="list-row task-row" onClick={() => set({ date: parse(e.date) })}>
                        <span className="subject-swatch" style={{ background: s.tint }} aria-hidden>
                          {s.short}
                        </span>
                        <span className="list-row-main">
                          <span className="list-row-title" style={{ display: 'block' }}>{s.name}</span>
                          <span className="list-row-meta">{e.syllabus}</span>
                        </span>
                        <span className="subtle" style={{ whiteSpace: 'nowrap' }}>
                          {fmtDay(parse(e.date))}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="subtle" style={{ marginTop: 8 }}>
              Sample timetable. Check with your school for the official schedule.
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
