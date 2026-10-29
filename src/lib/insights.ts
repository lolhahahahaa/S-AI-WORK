// Everything the UI says about the student is derived here from the same
// sample data + local state, so charts and sentences can never disagree.
import { TODAY, daysUntil, fmtDay, fmtMonthShort, iso, parse, startOfWeek, addDays } from './date'
import { attendanceBySubject, attendanceByMonth, schoolDays, overallAttendance, round1 } from '../data/attendance'
import { assessments, exams, marks, subjectById, subjects, type SubjectId } from '../data/school'
import { events } from '../data/campus'
import { resources } from '../data/library'
import type { Assignment } from '../data/tasks'
import type { PersistedState, SessionState } from '../state/store'
import { peers } from '../data/community'
import { matchesFor } from './lostfound'

/* ───────── Tasks ───────── */
export const isOnTime = (a: Assignment) => !!a.submittedOn && a.submittedOn <= a.due
export const isOverdue = (a: Assignment) => a.status === 'pending' && daysUntil(a.due) < 0

export function recentTaskRecord(assignments: Assignment[]) {
  const past = assignments.filter((a) => daysUntil(a.due) < 0).sort((a, b) => b.due.localeCompare(a.due)).slice(0, 10)
  const onTime = past.filter(isOnTime).length
  return { total: past.length, onTime, late: past.filter((a) => a.submittedOn && !isOnTime(a)).length, missing: past.filter((a) => !a.submittedOn).length }
}

export function taskCounts(state: PersistedState) {
  const pendingAssignments = state.assignments.filter((a) => a.status === 'pending')
  const openTodos = state.todos.filter((t) => !t.done)
  return {
    pending: pendingAssignments.length + openTodos.length,
    pendingAssignments,
    overdue: pendingAssignments.filter(isOverdue),
    dueSoon: pendingAssignments.filter((a) => daysUntil(a.due) >= 0 && daysUntil(a.due) <= 2),
    openTodos,
  }
}

/* ───────── Marks ───────── */
export function latestMarks() {
  // Most recent assessment that actually has data.
  const idx = Math.max(...subjects.map((s) => marks[s.id].reduce<number>((acc, v, i) => (v !== null ? i : acc), -1)))
  return {
    assessment: assessments[idx],
    rows: subjects.map((s) => ({ subject: s, score: marks[s.id][idx] as number, prev: marks[s.id][idx - 1] as number | null })),
  }
}

export function marksInsights() {
  const { rows, assessment } = latestMarks()
  const sorted = [...rows].sort((a, b) => b.score - a.score)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]
  const biggestGain = [...rows].sort((a, b) => b.score - (b.prev ?? b.score) - (a.score - (a.prev ?? a.score)))[0]
  const average = round1(rows.reduce((a, r) => a + r.score, 0) / rows.length)
  return { assessment, strongest, weakest, biggestGain, average }
}

/* ───────── Attendance ───────── */
export function attendanceSummary(target: number) {
  const overall = overallAttendance()
  const months = attendanceByMonth()
  const last = months[months.length - 1]
  const prev = months[months.length - 2]
  const bySubject = attendanceBySubject()
  return {
    overall,
    months,
    change: round1(last.percent - prev.percent),
    last,
    prev,
    bySubject,
    below: bySubject.filter((s) => s.percent < target),
  }
}

/* ───────── Credits ───────── */
export interface CreditEntry {
  date: string
  source: 'Attendance' | 'Tasks' | 'Activities' | 'Learning' | 'Focus'
  label: string
  points: number
}

export const creditRules = [
  { source: 'Attendance', rule: '+2 for each school day you attend (+1 for a half day)' },
  { source: 'Tasks', rule: '+10 for each assignment submitted on or before its due date' },
  { source: 'Activities', rule: '+10 to +15 for taking part in school events you RSVP’d to' },
  { source: 'Learning', rule: '+5 for finishing a resource in the Study Library' },
  { source: 'Focus', rule: '+3 per focus session, up to 2 a day — rest matters too' },
] as const

export function creditLedger(state: PersistedState): CreditEntry[] {
  const out: CreditEntry[] = []
  for (const r of schoolDays) {
    if (r.status === 'absent') continue
    out.push({ date: r.date, source: 'Attendance', label: 'Attended school', points: r.status === 'half' ? 1 : 2 })
  }
  for (const a of state.assignments) {
    if (isOnTime(a)) out.push({ date: a.submittedOn!, source: 'Tasks', label: `On time: ${a.title}`, points: 10 })
  }
  for (const e of events) {
    if (e.credits && state.rsvps[e.id] === 'going' && daysUntil(e.date) < 0) out.push({ date: e.date, source: 'Activities', label: e.title, points: e.credits })
  }
  for (const [id, p] of Object.entries(state.progress)) {
    const r = resources.find((x) => x.id === id)
    if (r && p.progress >= 100) out.push({ date: p.lastOpened, source: 'Learning', label: `Finished: ${r.title}`, points: 5 })
  }
  for (const [date, n] of Object.entries(state.focusLog)) {
    const counted = Math.min(n, 2)
    if (counted > 0) out.push({ date, source: 'Focus', label: `${counted} focus session${counted > 1 ? 's' : ''}`, points: counted * 3 })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

export const levels = [
  { name: 'Seedling', min: 0 },
  { name: 'Sprout', min: 200 },
  { name: 'Explorer', min: 300 },
  { name: 'Trailblazer', min: 450 },
  { name: 'Pathfinder', min: 600 },
  { name: 'Mentor', min: 800 },
]

export function creditSummary(state: PersistedState) {
  const ledger = creditLedger(state)
  const total = ledger.reduce((a, e) => a + e.points, 0)
  const li = levels.reduce((acc, l, i) => (total >= l.min ? i : acc), 0)
  const level = levels[li]
  const next = levels[li + 1] ?? null
  const progress = next ? (total - level.min) / (next.min - level.min) : 1
  const bySource = ledger.reduce<Record<string, number>>((acc, e) => ((acc[e.source] = (acc[e.source] ?? 0) + e.points), acc), {})
  const monthKeys = [...new Set(ledger.map((e) => e.date.slice(0, 7)))].sort()
  let run = 0
  const byMonth = monthKeys.map((k) => {
    const pts = ledger.filter((e) => e.date.startsWith(k)).reduce((a, e) => a + e.points, 0)
    run += pts
    return { key: k, label: fmtMonthShort(parse(`${k}-01`)), earned: pts, total: run }
  })
  const weekStart = iso(startOfWeek(TODAY))
  const thisWeek = ledger.filter((e) => e.date >= weekStart).reduce((a, e) => a + e.points, 0)
  return { ledger, total, level, next, progress, bySource, byMonth, thisWeek }
}

/** Longest current run of attended school days (holidays don't break it). */
export function attendanceStreak() {
  let n = 0
  for (let i = schoolDays.length - 1; i >= 0; i--) {
    if (schoolDays[i].status === 'absent') break
    n++
  }
  return n
}

/* ───────── Badges ───────── */
export function badges(state: PersistedState) {
  const rec = recentTaskRecord(state.assignments)
  const { strongest } = marksInsights()
  const streak = attendanceStreak()
  const finished = Object.values(state.progress).filter((p) => p.progress >= 100).length
  const eventsJoined = events.filter((e) => state.rsvps[e.id] === 'going' && daysUntil(e.date) < 0).length
  const perfectWeek = (() => {
    const weeks = new Map<string, boolean>()
    for (const r of schoolDays) {
      const k = iso(startOfWeek(parse(r.date)))
      weeks.set(k, (weeks.get(k) ?? true) && r.status === 'present')
    }
    return [...weeks.values()].some(Boolean)
  })()
  return [
    { id: 'perfect-week', name: 'Perfect week', desc: 'Attended every day of a school week, on time.', earned: perfectWeek, progress: perfectWeek ? 1 : 0 },
    { id: 'streak', name: '10-day run', desc: `Attend 10 school days in a row. Current run: ${streak}.`, earned: streak >= 10, progress: Math.min(streak / 10, 1) },
    { id: 'on-time', name: 'On it', desc: `Submit 8 of 10 recent tasks on time. Now: ${rec.onTime} of ${rec.total}.`, earned: rec.onTime >= 8, progress: Math.min(rec.onTime / 8, 1) },
    { id: 'top-subject', name: `${strongest.subject.name} spark`, desc: `Scored ${strongest.score} in ${strongest.subject.name} — your best this term.`, earned: true, progress: 1 },
    { id: 'learner', name: 'Curious mind', desc: `Finish 5 Study Library resources. Now: ${finished}.`, earned: finished >= 5, progress: Math.min(finished / 5, 1) },
    { id: 'joiner', name: 'Joiner', desc: `Take part in 2 school events. Now: ${eventsJoined}.`, earned: eventsJoined >= 2, progress: Math.min(eventsJoined / 2, 1) },
  ]
}

/* ───────── Profile strength ───────── */
export function profileStrength(state: PersistedState) {
  const p = state.profile
  const items = [
    { id: 'basics', label: 'School details', done: true, hint: 'Added by your school' },
    { id: 'bio', label: 'Write a short bio', done: p.bio.trim().length >= 20, hint: 'A sentence or two about you' },
    { id: 'goals', label: 'Set a learning goal', done: p.goals.length > 0, hint: 'What do you want to get better at?' },
    { id: 'clubs', label: 'Add a club or activity', done: p.clubs.length > 0, hint: 'Clubs, sports or arts' },
    { id: 'interests', label: 'Add 3 interests', done: p.interests.length >= 3, hint: 'Helps Study Buddy suggest examples' },
  ]
  const done = items.filter((i) => i.done).length
  return { items, done, percent: Math.round((done / items.length) * 100) }
}

/* ───────── Suggestions (rules, not AI) ───────── */
export interface Suggestion {
  id: string
  title: string
  body: string
  why: string
  action: { label: string; to: string }
  tone: 'sky' | 'sage' | 'peach' | 'butter' | 'lilac'
  icon: 'exam' | 'task' | 'book' | 'heart' | 'event' | 'attendance' | 'peer' | 'lost'
}

export function suggestions(state: PersistedState, session: SessionState, target: number): Suggestion[] {
  const out: Suggestion[] = []
  const nextExam = exams.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0]
  if (nextExam && daysUntil(nextExam.date) <= 10) {
    const s = subjectById(nextExam.subject)!
    const res = resources.find((r) => r.subject === nextExam.subject && r.type === 'practice')
    out.push({
      id: `exam-${nextExam.subject}-${nextExam.date}`,
      title: `${s.name} test in ${daysUntil(nextExam.date)} days`,
      body: `Try a short warm-up on ${nextExam.syllabus.split(',')[1]?.trim() ?? nextExam.syllabus}.`,
      why: `Your ${nextExam.name} for ${s.name} is on ${fmtDay(parse(nextExam.date))}. We show revision ideas when a test is 10 days away or closer.`,
      action: { label: 'Open practice', to: res ? `/library?resource=${res.id}` : '/library' },
      tone: 'sky',
      icon: 'exam',
    })
  }
  const overdue = state.assignments.filter(isOverdue)
  const dueSoon = state.assignments.filter((a) => a.status === 'pending' && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 1)
  const t = overdue[0] ?? dueSoon[0]
  if (t) {
    out.push({
      id: `task-${t.id}`,
      title: overdue[0] ? `“${t.title}” is overdue` : `“${t.title}” is due ${daysUntil(t.due) === 0 ? 'today' : 'tomorrow'}`,
      body: overdue[0] ? 'It’s not too late — submitting today still counts. Ask your teacher if you need more time.' : 'A focused 25-minute session could get this done.',
      why: overdue[0] ? `It was due on ${t.due} and is still marked pending.` : `It’s due within the next day and still marked pending.`,
      action: { label: 'Open task', to: `/tasks?task=${t.id}` },
      tone: 'peach',
      icon: 'task',
    })
  }
  const { weakest } = marksInsights()
  const weakRes = resources.find((r) => r.subject === weakest.subject.id && r.type === 'notes')
  if (weakRes) {
    out.push({
      id: `weak-${weakest.subject.id}`,
      title: `Revision notes for ${weakest.subject.name}`,
      body: weakRes.title,
      why: `${weakest.subject.name} (${weakest.score}) was your lowest score in the latest assessment. This is about where practice helps most — not a judgement.`,
      action: { label: 'Read notes', to: `/library?resource=${weakRes.id}` },
      tone: 'butter',
      icon: 'book',
    })
  }
  const low = attendanceBySubject().filter((s) => s.percent < target)[0]
  if (low) {
    out.push({
      id: `att-${low.subject.id}-${target}`,
      title: `${low.subject.name} attendance: ${low.percent}%`,
      body: `Below your ${target}% target. See which sessions were missed.`,
      why: `Your school’s attendance target in this demo is ${target}%. Your ${low.subject.name} attendance is ${low.percent}%.`,
      action: { label: 'See attendance', to: `/attendance?subject=${low.subject.id}` },
      tone: 'lilac',
      icon: 'attendance',
    })
  }
  if (session.mood && session.mood.value <= 2) {
    out.unshift({
      id: 'care',
      title: 'Thanks for telling us how you feel',
      body: 'Study Buddy has a calmer space, and you can always talk to a trusted adult.',
      why: 'You chose a low mood in today’s private check-in. This stays on your device for this session only.',
      action: { label: 'Open wellbeing space', to: '/buddy?mode=wellbeing' },
      tone: 'sage',
      icon: 'heart',
    })
  }
  const invite = state.peer.sessions.find((x) => x.status === 'invited')
  if (invite) {
    const p = peers.find((x) => x.id === invite.peerId)
    out.push({ id: `peer-${invite.id}`, title: `${p?.name} asked for help with ${invite.topic}`, body: `${invite.slot} · in school, approved by a teacher.`, why: `You listed ${invite.topic} as something you can help with in Peer Help.`, action: { label: 'Reply', to: '/peer-help?tab=sessions' }, tone: 'sky', icon: 'peer' })
  }
  for (const r of state.reports.filter((x) => x.reportedBy === 'me' && x.kind === 'lost' && x.status === 'open')) {
    const m = matchesFor(r, state.reports).find((x) => x.label === 'Strong match')
    if (m && !state.claims.some((c) => c.reportId === m.report.id)) {
      out.push({ id: `lost-${r.id}-${m.report.id}`, title: `A found ${m.report.name.toLowerCase()} may be yours`, body: `${m.report.location} · ${m.reasons.slice(0, 2).join(' · ')}`, why: `It matches your lost report “${r.name}” on several details. Matching uses the text of the reports, not photos.`, action: { label: 'View & claim', to: `/lost-found?tab=browse&item=${m.report.id}` }, tone: 'butter', icon: 'lost' })
      break
    }
  }
  const nextEvent = events.filter((e) => e.rsvpable && daysUntil(e.date) >= 0 && !state.rsvps[e.id]).sort((a, b) => a.date.localeCompare(b.date))[0]
  if (nextEvent) {
    out.push({
      id: `event-${nextEvent.id}`,
      title: nextEvent.title,
      body: `${fmtDay(parse(nextEvent.date))} · ${nextEvent.location}`,
      why: 'Upcoming school event you haven’t responded to yet.',
      action: { label: 'View event', to: '/events' },
      tone: 'sage',
      icon: 'event',
    })
  }
  return out.filter((s) => !state.dismissed.includes(s.id))
}

/** Upcoming exam countdown list. */
export const upcomingExams = () => exams.filter((e) => daysUntil(e.date) >= 0).map((e) => ({ ...e, in: daysUntil(e.date), subjectInfo: subjectById(e.subject)! }))

export const nextEventFor = (state: PersistedState) =>
  events.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).map((e) => ({ ...e, rsvp: state.rsvps[e.id] }))[0]

export const weekDates = (d: Date) => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(d), i))

export const subjectName = (id: SubjectId) => subjectById(id)?.name ?? id
