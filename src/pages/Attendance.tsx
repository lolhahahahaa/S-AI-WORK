import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CalendarCheck, CheckCircle2, Clock, Info } from 'lucide-react'
import { useApp } from '../state/store'
import { attendanceByPeriod, attendanceRecords, classesToTarget, subjectSessionsMissed, type DayRecord } from '../data/attendance'
import { slotInfo, slotsForDate, subjectById, type SubjectId } from '../data/school'
import { fmtDay, fmtLong, parse } from '../lib/date'
import { attendanceSummary } from '../lib/insights'
import { ChartCard, ColumnChart, HBarChart, LineChart, Ring } from '../components/charts/charts'
import { AttendanceHeatmap, statusLabel } from '../components/charts/heatmap'
import { Drawer } from '../components/overlay'
import { Empty, PageHeader, SubjectBadge } from '../components/ui'

const statusBadge: Record<string, string> = { present: 'badge-ok', late: 'badge-warn', half: 'badge-warn', absent: 'badge-danger', holiday: '' }

function DayDetail({ r }: { r: DayRecord }) {
  const slots = slotsForDate(parse(r.date))
  return (
    <div className="card-flat" aria-live="polite">
      <div className="row between wrap" style={{ gap: 8 }}>
        <strong>{fmtLong(parse(r.date))}</strong>
        <span className={`badge ${statusBadge[r.status]}`}>{statusLabel(r.status)}</span>
      </div>
      {r.note && <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>{r.note}</p>}
      {slots && r.missed.length > 0 && r.missed.length < 8 && (
        <p style={{ fontSize: 'var(--fs-sm)', marginTop: 6 }}>
          Missed: {r.missed.map((p) => `Period ${p} (${slotInfo(slots[p - 1]).name})`).join(', ')}
        </p>
      )}
      {r.status === 'present' && <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>All 8 periods attended.</p>}
    </div>
  )
}

function SubjectDrawer({ id, onClose, target }: { id: SubjectId | null; onClose: () => void; target: number }) {
  const { state } = useApp()
  const s = id ? subjectById(id) : null
  const row = attendanceSummary(state.prefs.attendanceTarget).bySubject.find((x) => x.subject.id === id)
  const missed = id ? subjectSessionsMissed(id) : []
  const need = row ? classesToTarget(row.held, row.attended, target) : 0
  return (
    <Drawer open={!!id} onClose={onClose} title={s ? `${s.name} attendance` : ''} description={s ? `${s.teacher} · ${row?.attended} of ${row?.held} sessions attended` : ''}>
      {row && (
        <div className="stack">
          <div className="row" style={{ gap: 16 }}>
            <Ring value={row.percent} max={100} size={104} stroke={11} label={`${row.percent}%`} sub="attended" color={row.percent < target ? 'var(--danger)' : 'var(--ok)'} />
            <p style={{ fontSize: 'var(--fs-sm)' }}>
              {need > 0 ? (
                <>
                  You’re below the {target}% target. Attending the next <strong>{need}</strong> {s?.name} sessions would bring you back above it.
                </>
              ) : (
                <>You’re at or above the {target}% target for this subject.</>
              )}
            </p>
          </div>
          <h3>Missed sessions ({missed.length})</h3>
          {missed.length === 0 ? (
            <Empty icon={<CheckCircle2 size={22} />} title="No missed sessions" />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Period</th>
                    <th scope="col">Recorded reason</th>
                  </tr>
                </thead>
                <tbody>
                  {missed.map((m) => (
                    <tr key={m.date + m.period}>
                      <td>{fmtDay(parse(m.date))}</td>
                      <td>P{m.period}</td>
                      <td>{m.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="subtle">If a record looks wrong, speak to your class teacher — this prototype can’t change official records.</p>
        </div>
      )}
    </Drawer>
  )
}

export default function Attendance() {
  const { state } = useApp()
  const target = state.prefs.attendanceTarget
  const sum = attendanceSummary(target)
  const [params, setParams] = useSearchParams()
  const openSubject = params.get('subject') as SubjectId | null
  const [selectedDay, setSelectedDay] = useState<DayRecord>(() => [...attendanceRecords].reverse().find((r) => r.status !== 'present' && r.status !== 'holiday')!)
  const [filter, setFilter] = useState<'all' | 'absent' | 'late' | 'half'>('all')
  const periods = attendanceByPeriod()
  const worstPeriod = [...periods].sort((a, b) => a.percent - b.percent)[0]
  const records = useMemo(() => [...attendanceRecords].reverse().filter((r) => r.status !== 'present' && r.status !== 'holiday' && (filter === 'all' || r.status === filter)), [filter])
  const sortedSubjects = [...sum.bySubject].sort((a, b) => a.percent - b.percent)
  const best = sortedSubjects[sortedSubjects.length - 1]
  const lowest = sortedSubjects[0]
  const setSubject = (id: SubjectId | null) => {
    const p = new URLSearchParams(params)
    if (id) p.set('subject', id)
    else p.delete('subject')
    setParams(p, { replace: true })
  }

  return (
    <>
      <PageHeader
        eyebrow={`Academic year 2026–27 · ${sum.overall.total} school days so far`}
        title="Attendance"
        description="Your overall attendance, how it differs by subject, and what to do next."
        actions={
          <span className="badge badge-outline" style={{ height: 32, padding: '0 12px' }}>
            Target {target}% · <Link to="/settings#school">sample setting</Link>
          </span>
        }
      />

      <section className="att-overview card" data-reveal aria-label="Overview">
        <Ring value={sum.overall.percent} max={100} size={148} stroke={15} label={`${sum.overall.percent}%`} sub="overall" color={sum.overall.percent < target ? 'var(--danger)' : 'var(--ok)'} />
        <div className="att-overview-body">
          <h2>{sum.overall.percent >= target ? 'You’re on track overall' : 'Your overall attendance is below target'}</h2>
          <p className="muted" style={{ marginTop: 4 }}>
            Your attendance {sum.change >= 0 ? 'improved' : 'dropped'} {Math.abs(sum.change)} points in {sum.last.label} compared with {sum.prev.label}.
          </p>
          <dl className="att-counts">
            <div>
              <dt>Present</dt>
              <dd className="num">{sum.overall.total - sum.overall.absent - sum.overall.half}</dd>
            </div>
            <div>
              <dt>Late</dt>
              <dd className="num">{sum.overall.late}</dd>
            </div>
            <div>
              <dt>Half day</dt>
              <dd className="num">{sum.overall.half}</dd>
            </div>
            <div>
              <dt>Absent</dt>
              <dd className="num">{sum.overall.absent}</dd>
            </div>
          </dl>
        </div>
        {sum.below.length > 0 ? (
          <div className="notice notice-warn att-warning" role="status">
            <AlertTriangle size={18} aria-hidden />
            <div>
              <strong>{sum.below.map((b) => b.subject.name).join(', ')} {sum.below.length > 1 ? 'are' : 'is'} below your {target}% target.</strong>
              <p style={{ marginTop: 2 }}>
                {sum.below[0].subject.name}: {sum.below[0].percent}%. Attending the next {classesToTarget(sum.below[0].held, sum.below[0].attended, target)} sessions would fix it. Most of these were first-period late arrivals.
              </p>
              <button className="link-btn" style={{ marginTop: 6 }} onClick={() => setSubject(sum.below[0].subject.id)}>
                See missed sessions
              </button>
              <p className="subtle" style={{ marginTop: 6 }}>This is a friendly heads-up from sample data, not an official notice.</p>
            </div>
          </div>
        ) : (
          <div className="notice notice-ok att-warning">
            <CheckCircle2 size={18} aria-hidden /> Every subject is at or above your {target}% target.
          </div>
        )}
      </section>

      <div className="grid att-grid section">
        <ChartCard
          title="Attendance by subject"
          subtitle="Share of each subject’s sessions you attended. Select a subject for details."
          insight={`${best.subject.name} is your most-attended subject (${best.percent}%); ${lowest.subject.name} is lowest (${lowest.percent}%).`}
          table={{ head: ['Subject', 'Attended', 'Held', '%'], rows: sum.bySubject.map((s) => [s.subject.name, s.attended, s.held, `${s.percent}%`]) }}
        >
          <HBarChart
            data={sum.bySubject.map((s) => ({ label: s.subject.name, value: s.percent, color: s.percent < target ? undefined : 'var(--chart-2)', pattern: s.percent < target, note: s.percent < target ? 'below target' : undefined }))}
            threshold={{ value: target, label: `${target}% target` }}
            onSelect={(i) => setSubject(sum.bySubject[i].subject.id)}
            labelWidth={170}
          />
        </ChartCard>

        <ChartCard
          title="Monthly trend"
          subtitle="Percentage of school days attended each month (June was summer break)."
          insight={`Your attendance ${sum.change >= 0 ? 'improved' : 'dropped'} ${Math.abs(sum.change)} points this month — from ${sum.prev.percent}% in ${sum.prev.label} to ${sum.last.percent}% in ${sum.last.label}.`}
          table={{ head: ['Month', 'School days', '%'], rows: sum.months.map((m) => [m.label, m.days, `${m.percent}%`]) }}
        >
          <LineChart labels={sum.months.map((m) => m.label)} series={[{ name: 'Attendance', color: 'var(--primary)', values: sum.months.map((m) => m.percent) }]} min={70} max={100} unit="%" threshold={{ value: target, label: 'Target' }} area />
        </ChartCard>
      </div>

      <section className="card section" data-reveal aria-labelledby="cal-h">
        <div className="card-head">
          <div>
            <h3 id="cal-h">Calendar</h3>
            <div className="chart-sub">Each square is a school day. Select one to see what happened.</div>
          </div>
        </div>
        <div className="att-cal">
          <AttendanceHeatmap selected={selectedDay?.date} onSelect={setSelectedDay} />
          {selectedDay && <DayDetail r={selectedDay} />}
        </div>
      </section>

      <div className="grid att-grid section">
        <ChartCard
          title="Attendance by period"
          subtitle="How often you were present in each period of the day."
          insight={`Period ${worstPeriod.period} is the one you miss most (${worstPeriod.missed} times) — mostly late arrivals. Leaving 10 minutes earlier could make the biggest difference.`}
          table={{ head: ['Period', 'Missed', '%'], rows: periods.map((p) => [`Period ${p.period}`, p.missed, `${p.percent}%`]) }}
        >
          <ColumnChart data={periods.map((p) => ({ label: `P${p.period}`, value: p.percent }))} max={100} unit="%" highlightMin />
        </ChartCard>

        <section className="card" data-reveal aria-labelledby="rec-h">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h3 id="rec-h">Detailed records</h3>
            <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Filter records">
              {(['all', 'absent', 'late', 'half'] as const).map((f) => (
                <button key={f} className="chip" style={{ minHeight: 30, padding: '0 10px' }} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : statusLabel(f)}
                </button>
              ))}
            </div>
          </div>
          {records.length === 0 ? (
            <Empty icon={<CalendarCheck size={22} />} title="No records of this type" />
          ) : (
            <ul className="list att-records" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {records.map((r) => (
                <li key={r.date} className="list-row">
                  {r.status === 'absent' ? <Info size={16} aria-hidden /> : <Clock size={16} aria-hidden />}
                  <div className="list-row-main">
                    <div className="list-row-title" style={{ fontWeight: 600 }}>{fmtDay(parse(r.date))}</div>
                    <div className="list-row-meta">{r.note ?? 'No reason recorded'}</div>
                  </div>
                  <span className={`badge ${statusBadge[r.status]}`}>{statusLabel(r.status)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="subtle" style={{ marginTop: 10 }}>Showing sample records. Present days are shown on the calendar.</p>
        </section>
      </div>

      <section className="section" data-reveal aria-label="Subjects">
        <h3 style={{ marginBottom: 12 }}>Subject breakdown</h3>
        <div className="grid grid-3">
          {sum.bySubject.map((s) => (
            <button key={s.subject.id} className="stat" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setSubject(s.subject.id)} aria-label={`${s.subject.name}: ${s.percent}%. ${s.attended} of ${s.held} sessions. Show details`}>
              <div className="row" style={{ gap: 10 }}>
                <SubjectBadge short={s.subject.short} tint={s.subject.tint} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{s.subject.name}</div>
                  <div className="subtle">
                    {s.attended}/{s.held} sessions
                  </div>
                </div>
                <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--fs-lg)', color: s.percent < target ? 'var(--danger)' : undefined }}>
                  {s.percent}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <SubjectDrawer id={openSubject} onClose={() => setSubject(null)} target={target} />
    </>
  )
}
