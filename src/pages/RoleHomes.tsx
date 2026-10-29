import { Link } from 'react-router-dom'
import { CalendarCheck, ChevronRight, DoorOpen, GraduationCap, ListTodo, Lock, MessageSquareText, Palette, PartyPopper, ShieldCheck } from 'lucide-react'
import { useApp, type GatePass } from '../state/store'
import { student, subjects, timetable } from '../data/school'
import { events } from '../data/campus'
import { TODAY, daysUntil, fmtDay, parse, fmtTime } from '../lib/date'
import { attendanceSummary, taskCounts, upcomingExams, marksInsights } from '../lib/insights'
import { bells } from '../data/school'
import { Empty, PageHeader, StatCard, PrototypeTag } from '../components/ui'
import { useToast } from '../components/toast'

function PrivacyNote({ who }: { who: string }) {
  return (
    <p className="notice notice-neutral" data-reveal>
      <Lock size={16} aria-hidden />
      <span>
        <strong>Private by design:</strong> {student.firstName}’s Study Buddy conversations and mood check-ins are never shown in the {who} view.
      </span>
    </p>
  )
}

export function useGatePassDecision() {
  const { update } = useApp()
  const toast = useToast()
  return (id: string, who: 'parent' | 'school', decision: 'approved' | 'declined') => {
    update((s) => ({ ...s, gatePasses: s.gatePasses.map((g) => (g.id === id ? { ...g, [who]: decision } : g)) }))
    toast(`Demo: ${who === 'parent' ? 'parent' : 'school'} ${decision === 'approved' ? 'approval' : 'decline'} recorded on this device only.`, 'info')
  }
}

function PassRow({ g, who }: { g: GatePass; who: 'parent' | 'school' }) {
  const decide = useGatePassDecision()
  return (
    <li className="list-row" style={{ flexWrap: 'wrap' }}>
      <span className="stat-icon" style={{ background: 'var(--sky)' }} aria-hidden>
        <DoorOpen size={17} />
      </span>
      <div className="list-row-main">
        <div className="list-row-title">
          {g.reason} · {g.id}
        </div>
        <div className="list-row-meta">
          <span>
            {fmtDay(parse(g.date))} at {fmtTime(g.time)}
          </span>
          <span>Pickup: {g.pickup}</span>
        </div>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn btn-sm btn-secondary" onClick={() => decide(g.id, who, 'declined')}>
          Decline
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => decide(g.id, who, 'approved')}>
          Approve
        </button>
      </div>
    </li>
  )
}

export function ParentHome() {
  const { state } = useApp()
  const att = attendanceSummary(state.prefs.attendanceTarget)
  const tasks = taskCounts(state)
  const exams = upcomingExams()
  const waiting = state.gatePasses.filter((g) => !g.cancelled && g.parent === 'waiting')
  return (
    <>
      <PageHeader eyebrow="Parent view · prototype" title={`${student.firstName}’s week`} description={`Grade ${student.grade}${student.section} · Class teacher ${student.classTeacher}`} />
      <div className="grid grid-3" data-reveal>
        <StatCard to="/attendance" label="Attendance this year" value={att.overall.percent} unit="%" tint="var(--sage)" icon={<CalendarCheck size={17} />} foot={`${att.overall.absent} days absent`} />
        <StatCard label="Assignments pending" value={tasks.pendingAssignments.length} tint="var(--peach)" icon={<ListTodo size={17} />} foot={tasks.overdue.length ? `${tasks.overdue.length} overdue` : 'None overdue'} />
        <StatCard to="/schedule?view=month" label="Next test" value={exams[0] ? `${exams[0].in}d` : '—'} tint="var(--sky)" icon={<GraduationCap size={17} />} foot={exams[0] ? `${exams[0].subjectInfo.name}, ${fmtDay(parse(exams[0].date))}` : 'None scheduled'} />
      </div>
      <div className="grid grid-2 section">
        <section className="card" data-reveal aria-labelledby="pa-h">
          <div className="card-head">
            <h2 id="pa-h" style={{ fontSize: 'var(--fs-md)' }}>
              Gate passes waiting for you
            </h2>
            <PrototypeTag>Demo approvals</PrototypeTag>
          </div>
          {waiting.length === 0 ? (
            <Empty icon={<DoorOpen size={22} />} title="Nothing to approve">
              Requests {student.firstName} makes in the student view appear here.
            </Empty>
          ) : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {waiting.map((g) => (
                <PassRow key={g.id} g={g} who="parent" />
              ))}
            </ul>
          )}
        </section>
        <section className="card" data-reveal aria-labelledby="pe-h">
          <div className="card-head">
            <h2 id="pe-h" style={{ fontSize: 'var(--fs-md)' }}>
              Coming up
            </h2>
            <Link to="/events" className="link-btn">
              All events <ChevronRight size={14} aria-hidden />
            </Link>
          </div>
          <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {events
              .filter((e) => daysUntil(e.date) >= 0)
              .slice(0, 4)
              .map((e) => (
                <li key={e.id} className="list-row">
                  <PartyPopper size={18} aria-hidden />
                  <div className="list-row-main">
                    <div className="list-row-title">{e.title}</div>
                    <div className="list-row-meta">
                      {fmtDay(parse(e.date))} · {e.location}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      </div>
      <div className="section">
        <PrivacyNote who="parent" />
      </div>
    </>
  )
}

export function TeacherHome() {
  const { state } = useApp()
  const wd = (TODAY.getDay() + 6) % 7
  const periods = bells.filter((b) => b.period !== null)
  const mine = timetable[wd]
    ?.map((s, i) => ({ s, b: periods[i] }))
    .filter((x) => x.s === 'sci')
  const { strongest, weakest } = marksInsights()
  return (
    <>
      <PageHeader eyebrow="Teacher view · prototype" title="Good morning, Ms. Menon" description="Class teacher, Grade 9B · Science. Class figures here are sample data." />
      <div className="grid grid-2">
        <section className="card" data-reveal aria-labelledby="tt-h">
          <div className="card-head">
            <h2 id="tt-h" style={{ fontSize: 'var(--fs-md)' }}>
              Your 9B Science periods today
            </h2>
          </div>
          {mine?.length ? (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {mine.map(({ b }) => (
                <li key={b.label} className="list-row">
                  <span className="subject-swatch" style={{ background: subjects[1].tint }}>
                    Sc
                  </span>
                  <div className="list-row-main">
                    <div className="list-row-title">{b.label}</div>
                    <div className="list-row-meta">
                      {fmtTime(b.start)} – {fmtTime(b.end)} · Lab 2
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={<CalendarCheck size={22} />} title="No 9B Science today" />
          )}
        </section>
        <section className="card" data-reveal aria-labelledby="tf-h">
          <div className="card-head">
            <h2 id="tf-h" style={{ fontSize: 'var(--fs-md)' }}>
              Student feedback
            </h2>
          </div>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            Write constructive notes for a student: one strength and one next step. {state.teacherNotes.length} written on this device.
          </p>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 8 }}>
            Example from sample data for {student.firstName}: strongest in {strongest.subject.name} ({strongest.score}), most room to grow in {weakest.subject.name} ({weakest.score}).
          </p>
          <Link to="/feedback?tab=teacher" className="btn btn-primary" style={{ marginTop: 14 }}>
            <MessageSquareText size={16} aria-hidden /> Write feedback
          </Link>
        </section>
      </div>
      <div className="section">
        <PrivacyNote who="teacher" />
      </div>
    </>
  )
}

export function AdminHome() {
  const { state } = useApp()
  const waiting = state.gatePasses.filter((g) => !g.cancelled && g.parent === 'approved' && g.school === 'waiting')
  return (
    <>
      <PageHeader eyebrow="Admin view · prototype" title="School operations" description="A small preview of how operations could look. Figures are sample or local to this device." />
      <div className="grid grid-3" data-reveal>
        <StatCard to="/gate-pass" label="Passes awaiting school" value={waiting.length} tint="var(--sky)" icon={<DoorOpen size={17} />} foot="After parent approval" />
        <StatCard to="/events" label="Upcoming events" value={events.filter((e) => daysUntil(e.date) >= 0).length} tint="var(--peach)" icon={<PartyPopper size={17} />} foot="This term" />
        <StatCard to="/feedback" label="Feedback on this device" value={state.feedback.length} tint="var(--butter)" icon={<MessageSquareText size={17} />} foot="Not sent anywhere" />
      </div>
      <div className="grid grid-2 section">
        <section className="card" data-reveal aria-labelledby="aw-h">
          <div className="card-head">
            <h2 id="aw-h" style={{ fontSize: 'var(--fs-md)' }}>
              Gate passes to review
            </h2>
            <PrototypeTag>Demo approvals</PrototypeTag>
          </div>
          {waiting.length === 0 ? (
            <Empty icon={<ShieldCheck size={22} />} title="All clear">
              Requests appear here once a parent approves them.
            </Empty>
          ) : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {waiting.map((g) => (
                <PassRow key={g.id} g={g} who="school" />
              ))}
            </ul>
          )}
        </section>
        <section className="card" data-reveal aria-labelledby="ab-h">
          <div className="card-head">
            <h2 id="ab-h" style={{ fontSize: 'var(--fs-md)' }}>
              Branding & configuration
            </h2>
          </div>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            School name, initials, logo, accent colour, attendance target and counsellor contact details are all set in one place.
          </p>
          <Link to="/settings" className="btn btn-secondary" style={{ marginTop: 14 }}>
            <Palette size={16} aria-hidden /> Open settings
          </Link>
        </section>
      </div>
      <div className="section">
        <PrivacyNote who="admin" />
      </div>
    </>
  )
}
