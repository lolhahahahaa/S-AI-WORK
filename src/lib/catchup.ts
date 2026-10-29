// Catch Me Up: everything here is derived from attendance, the timetable,
// teacher-posted class records and the student's assignments.
import { attendanceRecords, type DayRecord } from '../data/attendance'
import { classRecords, checkSources, type ClassRecord } from '../data/catchup'
import { exams, slotInfo, slotsForDate, subjectById, type SubjectId } from '../data/school'
import { resources } from '../data/library'
import { daysUntil, fmtDay, parse } from './date'
import type { PersistedState } from '../state/store'

export interface MissedDay extends DayRecord {
  periods: number
}

export const missedDays = (): MissedDay[] =>
  attendanceRecords
    .filter((r) => r.missed.length > 0)
    .map((r) => ({ ...r, periods: r.missed.length }))
    .reverse()

export interface MissedClass {
  period: number
  subject: string
  subjectId?: SubjectId
  teacher: string
  tint: string
  isActivity: boolean
  record?: ClassRecord
}

export function missedClasses(date: string): MissedClass[] {
  const day = attendanceRecords.find((r) => r.date === date)
  const slots = slotsForDate(parse(date))
  if (!day || !slots) return []
  return day.missed.map((p) => {
    const slot = slots[p - 1]
    const info = slotInfo(slot)
    return {
      period: p,
      subject: info.name,
      subjectId: info.isSubject ? (slot as SubjectId) : undefined,
      teacher: info.teacher,
      tint: info.tint,
      isActivity: !info.isSubject,
      record: classRecords.find((c) => c.date === date && c.period === p),
    }
  })
}

export type PlanKind = 'notes' | 'gap' | 'homework' | 'check'

export interface PlanItem {
  id: string
  kind: PlanKind
  title: string
  subjectId?: SubjectId
  period?: number
  due?: string
  effort?: number
  priority: 1 | 2 | 3 | 4 | 5
  priorityLabel: string
  why: string
  done: boolean
  resourceId?: string
  assignmentId?: string
  topic?: string
}

const testFor = (s?: SubjectId) => exams.find((e) => e.subject === s && daysUntil(e.date) >= 0)

function rank(due: string | undefined, subjectId: SubjectId | undefined): Pick<PlanItem, 'priority' | 'priorityLabel' | 'why'> {
  const test = testFor(subjectId)
  if (due && daysUntil(due) < 0) return { priority: 1, priorityLabel: 'Do first', why: `It was due ${fmtDay(parse(due))} — the longer it waits, the harder it gets.` }
  if (due && daysUntil(due) <= 2) return { priority: 2, priorityLabel: 'Due soon', why: `Due ${fmtDay(parse(due))}, in ${daysUntil(due)} day${daysUntil(due) === 1 ? '' : 's'}.` }
  if (test && daysUntil(test.date) <= 10) return { priority: 3, priorityLabel: 'Before your test', why: `${subjectById(subjectId!)?.name} test on ${fmtDay(parse(test.date))} covers this.` }
  if (due) return { priority: 4, priorityLabel: 'This week', why: `Due ${fmtDay(parse(due))}.` }
  return { priority: 4, priorityLabel: 'Catch up', why: 'Helps the next lesson make sense.' }
}

export function recoveryPlan(date: string, state: PersistedState): PlanItem[] {
  const items: PlanItem[] = []
  for (const c of missedClasses(date)) {
    if (!c.record || c.isActivity) continue
    const r = c.record
    const res = r.resourceIds.map((id) => resources.find((x) => x.id === id)).find(Boolean)
    if (r.notes) {
      const id = `${date}-p${r.period}-notes`
      items.push({ id, kind: 'notes', title: `Read the class notes: ${r.topic}`, subjectId: r.subject, period: r.period, effort: res?.minutes ?? 10, done: !!state.catchup.done[id], resourceId: res?.id, topic: r.topic, ...rank(undefined, r.subject) })
    } else {
      const id = `${date}-p${r.period}-gap`
      items.push({ id, kind: 'gap', title: `Notes not posted yet: ${r.topic}`, subjectId: r.subject, period: r.period, effort: res?.minutes, done: !!state.catchup.done[id], resourceId: res?.id, topic: r.topic, priority: 3, priorityLabel: 'Needs a source', why: `${subjectById(r.subject)?.teacher} hasn’t posted notes for this class. Use the library chapter, ask a classmate, or ask your teacher.` })
    }
    if (r.homework) {
      const a = state.assignments.find((x) => x.id === r.homework!.assignmentId)
      if (a) items.push({ id: `hw-${a.id}`, kind: 'homework', title: a.title, subjectId: a.subject, period: r.period, due: a.due, effort: r.homework.effort, done: a.status !== 'pending', assignmentId: a.id, topic: r.topic, ...(a.status !== 'pending' ? { priority: 4 as const, priorityLabel: 'Handed in', why: 'Already marked as submitted in Tasks.' } : rank(a.due, a.subject)) })
    }
  }
  const checkSubjects = checkSubjectsFor(date)
  if (checkSubjects.length) {
    const id = `${date}-check`
    items.push({ id, kind: 'check', title: 'Quick knowledge check', effort: 5, done: !!state.catchup.checks[date], priority: 5, priorityLabel: 'Last step', why: 'Checks you’ve understood the main ideas before moving on.' })
  }
  return items.sort((a, b) => Number(a.done) - Number(b.done) || a.priority - b.priority || (a.due ?? '9').localeCompare(b.due ?? '9'))
}

export function checkSubjectsFor(date: string) {
  const subs = new Set(missedClasses(date).filter((c) => c.record && c.subjectId && checkSources[c.subjectId]).map((c) => c.subjectId!))
  return [...subs]
}

export function checkQuestions(date: string) {
  return checkSubjectsFor(date).flatMap((s) => {
    const r = resources.find((x) => x.id === checkSources[s])
    return (r?.questions ?? []).slice(0, 2).map((q) => ({ ...q, subject: subjectById(s)!.name }))
  })
}

export function recoverySummary(date: string, state: PersistedState) {
  const plan = recoveryPlan(date, state)
  const done = plan.filter((p) => p.done).length
  const classes = missedClasses(date)
  return {
    plan,
    done,
    total: plan.length,
    ratio: plan.length ? done / plan.length : 1,
    classes,
    missingRecords: classes.filter((c) => !c.record && !c.isActivity).length,
    missingNotes: classes.filter((c) => c.record && !c.record.notes).length,
    minutesLeft: plan.filter((p) => !p.done).reduce((a, p) => a + (p.effort ?? 0), 0),
    next: plan.find((p) => !p.done),
  }
}

/** The most recent missed full or half day — what Home surfaces. */
export const latestMissedDay = () => missedDays().find((d) => d.status === 'absent' || d.status === 'half')
