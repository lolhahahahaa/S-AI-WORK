import { useState } from 'react'
import { Award, Lock, Sprout } from 'lucide-react'
import { useApp } from '../state/store'
import { assessments, marks, skills, studyDaysByMonth, studyDaysByWeek, subjects } from '../data/school'
import { attendanceSummary, badges, creditRules, creditSummary, latestMarks, marksInsights, recentTaskRecord } from '../lib/insights'
import { ChartCard, ColumnChart, HBarChart, LineChart, Radar, Ring, SeriesLegend, type Series } from '../components/charts/charts'
import { AttendanceHeatmap, statusLabel } from '../components/charts/heatmap'
import { Disclosure, PageHeader, ProgressBar, Segmented } from '../components/ui'
import { fmtLong, parse } from '../lib/date'
import type { DayRecord } from '../data/attendance'

const markers: Series['marker'][] = ['circle', 'square', 'diamond', 'triangle', 'circle', 'square']

export default function Growth() {
  const { state } = useApp()
  const cr = creditSummary(state)
  const att = attendanceSummary(state.prefs.attendanceTarget)
  const { strongest, weakest, biggestGain, average, assessment } = marksInsights()
  const { rows } = latestMarks()
  const rec = recentTaskRecord(state.assignments)
  const [consistency, setConsistency] = useState<'week' | 'month'>('week')
  const [shownSubjects, setShownSubjects] = useState<string[]>(subjects.map((s) => s.id))
  const [day, setDay] = useState<DayRecord | null>(null)
  const sortedSkills = [...skills].sort((a, b) => b.value - a.value)
  const series: Series[] = subjects
    .filter((s) => shownSubjects.includes(s.id))
    .map((s) => ({ name: s.name, color: s.color, values: marks[s.id], marker: markers[subjects.indexOf(s)], dashed: subjects.indexOf(s) % 2 === 1 }))
  const weekly = studyDaysByWeek
  const avgWeek = (weekly.reduce((a, w) => a + w.days, 0) / weekly.length).toFixed(1)
  const lastMonth = studyDaysByMonth[studyDaysByMonth.length - 1]
  const prevMonth = studyDaysByMonth[studyDaysByMonth.length - 2]
  const earned = badges(state)
  const weakSeries = marks[weakest.subject.id].filter((v): v is number => v !== null)
  const weakDipping = weakSeries.length >= 3 && weakSeries[weakSeries.length - 1] < weakSeries[weakSeries.length - 2] && weakSeries[weakSeries.length - 2] < weakSeries[weakSeries.length - 3]

  return (
    <>
      <PageHeader eyebrow="Analytics · sample data" title="Growth & Credits" description="How you’re growing across subjects, skills and habits. These numbers describe what happened — they don’t define what you can do." />

      <section className="card credits-hero" data-reveal aria-labelledby="cr-h">
        <div className="credits-level">
          <span className="stat-icon" style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--butter)' }} aria-hidden>
            <Sprout size={28} />
          </span>
          <div>
            <div className="subtle" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Level
            </div>
            <h2 id="cr-h" style={{ fontSize: 'var(--fs-xl)' }}>
              {cr.level.name}
            </h2>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span>
              <span className="num" style={{ fontSize: 'var(--fs-2xl)' }}>
                {cr.total}
              </span>{' '}
              <span className="muted">credits</span>
            </span>
            <span className="subtle">{cr.next ? `${cr.next.min - cr.total} to ${cr.next.name}` : 'Top level reached'}</span>
          </div>
          <ProgressBar value={cr.progress * 100} label={`Progress to ${cr.next?.name ?? 'top level'}`} size="lg" color="var(--chart-5)" />
          <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
            {Object.entries(cr.bySource).map(([k, v]) => (
              <span key={k} className="badge badge-outline">
                {k}: {v}
              </span>
            ))}
            <span className="badge badge-primary">This week: +{cr.thisWeek}</span>
          </div>
        </div>
        <div className="credits-rules">
          <Disclosure summary="How credits are earned">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 'var(--fs-sm)', display: 'grid', gap: 4 }}>
              {creditRules.map((r) => (
                <li key={r.source}>{r.rule}</li>
              ))}
              <li>Credits are never taken away — being ill or needing rest never costs you anything.</li>
            </ul>
            <p className="subtle" style={{ marginTop: 6 }}>Prototype points — not an official school record.</p>
          </Disclosure>
        </div>
      </section>

      <h2 className="section" style={{ fontSize: 'var(--fs-lg)', marginBottom: 12 }}>
        Academics
      </h2>
      <div className="grid grid-2">
        <ChartCard
          title={`Marks by subject — ${assessment.label}`}
          subtitle="Score out of 100 in your latest assessment."
          insight={`${strongest.subject.name} is your strongest subject this term (${strongest.score}). ${weakest.subject.name} (${weakest.score}) has the most room to grow. Your average is ${average}.`}
          table={{ head: ['Subject', 'Score', 'Previous'], rows: rows.map((r) => [r.subject.name, r.score, r.prev ?? '—']) }}
        >
          <HBarChart data={rows.map((r) => ({ label: r.subject.name, value: r.score, color: r.subject.color }))} unit="" labelWidth={170} />
        </ChartCard>
        <ChartCard
          title="Marks across assessments"
          subtitle="Periodic Test 2 hasn’t happened yet, so it shows no data."
          legend={<SeriesLegend series={series} />}
          actions={null}
          insight={`${biggestGain.subject.name} improved the most since ${assessments[1].short} (+${biggestGain.score - (biggestGain.prev ?? biggestGain.score)}). ${weakDipping ? `${weakest.subject.name} has dipped two assessments in a row — a good place to focus revision.` : `${weakest.subject.name} is the subject with the most room to grow.`}`}
          table={{ head: ['Subject', ...assessments.map((a) => a.short)], rows: subjects.map((s) => [s.name, ...marks[s.id].map((v) => v ?? 'No data')]) }}
        >
          <div className="row wrap" style={{ gap: 4, marginBottom: 8 }} role="group" aria-label="Subjects shown">
            {subjects.map((s) => (
              <button key={s.id} className="chip" style={{ minHeight: 28, padding: '0 10px', fontSize: 'var(--fs-xs)' }} aria-pressed={shownSubjects.includes(s.id)} onClick={() => setShownSubjects((v) => (v.includes(s.id) ? (v.length > 1 ? v.filter((x) => x !== s.id) : v) : [...v, s.id]))}>
                {s.short}
              </button>
            ))}
          </div>
          <LineChart labels={assessments.map((a) => a.short)} series={series} min={50} max={100} />
        </ChartCard>
      </div>

      <h2 className="section" style={{ fontSize: 'var(--fs-lg)', marginBottom: 12 }}>
        Attendance
      </h2>
      <div className="grid grid-2">
        <ChartCard title="Attendance calendar" subtitle="Select a day to see its record." insight={day ? `${fmtLong(parse(day.date))}: ${statusLabel(day.status)}${day.note ? ` — ${day.note}` : ''}.` : `${att.overall.percent}% overall across ${att.overall.total} school days.`}>
          <AttendanceHeatmap selected={day?.date} onSelect={setDay} />
        </ChartCard>
        <ChartCard title="Attendance trend" subtitle="Monthly attendance (%)." insight={`Your attendance ${att.change >= 0 ? 'improved' : 'dropped'} ${Math.abs(att.change)} points this month (${att.prev.label} ${att.prev.percent}% → ${att.last.label} ${att.last.percent}%).`} table={{ head: ['Month', '%'], rows: att.months.map((m) => [m.label, `${m.percent}%`]) }}>
          <LineChart labels={att.months.map((m) => m.label)} series={[{ name: 'Attendance', color: 'var(--chart-2)', values: att.months.map((m) => m.percent) }]} min={70} max={100} unit="%" area />
        </ChartCard>
      </div>

      <h2 className="section" style={{ fontSize: 'var(--fs-lg)', marginBottom: 12 }}>
        Skills & habits
      </h2>
      <div className="grid grid-3">
        <ChartCard title="Skills" subtitle="From activities and teacher check-ins, 1–5." insight={`${sortedSkills[0].label} is your strongest skill (${sortedSkills[0].value}). ${sortedSkills[sortedSkills.length - 1].label} (${sortedSkills[sortedSkills.length - 1].value}) is a skill to try in a club or group project.`} table={{ head: ['Skill', 'Level'], rows: skills.map((s) => [s.label, s.value]) }}>
          <Radar axes={skills} />
        </ChartCard>
        <ChartCard title="Task completion" subtitle="Your 10 most recent assignments." insight={`You completed ${rec.onTime} of your ${rec.total} recent tasks on time.`} table={{ head: ['Outcome', 'Tasks'], rows: [['On time', rec.onTime], ['Late', rec.late], ['Not handed in', rec.missing]] }}>
          <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0' }}>
            <Ring value={rec.onTime} max={rec.total} size={160} stroke={16} label={`${Math.round((rec.onTime / rec.total) * 100)}%`} sub="on time" color="var(--ok)" />
          </div>
          <div className="legend" style={{ justifyContent: 'center' }}>
            <span>
              <i style={{ background: 'var(--ok)' }} /> On time {rec.onTime}
            </span>
            <span>
              <i style={{ background: 'var(--bg-sunk)', border: '1px solid var(--border-strong)' }} /> Late or missing {rec.late + rec.missing}
            </span>
          </div>
        </ChartCard>
        <ChartCard
          title="Study consistency"
          subtitle={consistency === 'week' ? 'Days per week with any study activity.' : 'Days per month with any study activity.'}
          actions={<Segmented label="Period" value={consistency} onChange={setConsistency} options={[{ id: 'week', label: 'Weekly' }, { id: 'month', label: 'Monthly' }]} />}
          insight={consistency === 'week' ? `You studied on ${avgWeek} days a week on average. We count days, not hours — steady beats long.` : `${lastMonth.days} study days in ${lastMonth.month}, up from ${prevMonth.days} in ${prevMonth.month}.`}
          table={{ head: [consistency === 'week' ? 'Week of' : 'Month', 'Days'], rows: consistency === 'week' ? weekly.map((w) => [w.week, w.days]) : studyDaysByMonth.map((m) => [m.month, m.days]) }}
        >
          {consistency === 'week' ? (
            <ColumnChart data={weekly.map((w) => ({ label: w.week.split(' ')[0], value: w.days }))} max={7} />
          ) : (
            <ColumnChart data={studyDaysByMonth.map((m) => ({ label: m.month, value: m.days }))} max={31} />
          )}
        </ChartCard>
      </div>

      <h2 className="section" style={{ fontSize: 'var(--fs-lg)', marginBottom: 12 }}>
        Credits & achievements
      </h2>
      <div className="grid grid-2">
        <ChartCard title="Credits over time" subtitle="Running total by month." insight={`You earned ${cr.byMonth[cr.byMonth.length - 1].earned} credits in ${cr.byMonth[cr.byMonth.length - 1].label}, mostly from ${Object.entries(cr.bySource).sort((a, b) => b[1] - a[1])[0][0].toLowerCase()}.`} table={{ head: ['Month', 'Earned', 'Total'], rows: cr.byMonth.map((m) => [m.label, m.earned, m.total]) }}>
          <LineChart labels={cr.byMonth.map((m) => m.label)} series={[{ name: 'Credits', color: 'var(--chart-5)', values: cr.byMonth.map((m) => m.total) }]} min={0} max={Math.ceil((cr.total + 50) / 100) * 100} area />
        </ChartCard>
        <section className="card" data-reveal aria-labelledby="badges-h">
          <div className="card-head">
            <h3 id="badges-h">Badges</h3>
            <span className="subtle">
              {earned.filter((b) => b.earned).length} of {earned.length} earned
            </span>
          </div>
          <ul className="badge-grid">
            {earned.map((b) => (
              <li key={b.id} className="badge-tile" data-earned={b.earned}>
                <span className="badge-medal" aria-hidden>
                  {b.earned ? <Award size={22} /> : <Lock size={18} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block' }}>
                    {b.name} <span className="sr-only">{b.earned ? '(earned)' : '(not yet earned)'}</span>
                  </strong>
                  <span className="subtle" style={{ display: 'block' }}>
                    {b.desc}
                  </span>
                  {!b.earned && (
                    <div style={{ marginTop: 6 }}>
                      <ProgressBar value={b.progress * 100} label={`${b.name} progress`} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
