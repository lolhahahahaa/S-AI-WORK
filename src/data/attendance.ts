import { TODAY, addDays, iso, parse, fmtMonthShort } from '../lib/date'
import { slotsForDate, subjects, type SubjectId } from './school'

export type DayStatus = 'present' | 'late' | 'half' | 'absent' | 'holiday'

export interface DayRecord {
  date: string
  status: DayStatus
  note?: string
  /** Periods (1–8) the student missed that day. */
  missed: number[]
}

const TERM_START = new Date(2026, 3, 1) // 1 Apr 2026

export const holidays: Record<string, string> = {
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-19': 'Autumn break (sample)',
  '2026-10-20': 'Autumn break (sample)',
  '2026-10-21': 'Autumn break (sample)',
}
export const isSummerBreak = (s: string) => s >= '2026-05-18' && s <= '2026-06-30'

// Explicit, hand-authored exceptions so the story in the charts is deliberate:
// a rough patch in July–September (illness, late mornings) and a better October.
const exceptions: Record<string, { status: DayStatus; note: string }> = {
  '2026-04-24': { status: 'absent', note: 'Family function (leave applied)' },
  '2026-04-28': { status: 'late', note: 'Arrived 8:25' },
  '2026-07-14': { status: 'absent', note: 'Fever (medical note)' },
  '2026-07-15': { status: 'absent', note: 'Fever (medical note)' },
  '2026-07-16': { status: 'absent', note: 'Fever (medical note)' },
  '2026-07-21': { status: 'late', note: 'Arrived 8:30' },
  '2026-07-28': { status: 'late', note: 'Bus delay' },
  '2026-08-04': { status: 'late', note: 'Arrived 8:20' },
  '2026-08-06': { status: 'absent', note: 'Unwell' },
  '2026-08-07': { status: 'absent', note: 'Unwell' },
  '2026-08-13': { status: 'late', note: 'Arrived 8:35' },
  '2026-08-25': { status: 'absent', note: 'No reason recorded' },
  '2026-09-01': { status: 'late', note: 'Arrived 8:25' },
  '2026-09-09': { status: 'absent', note: 'Dental appointment' },
  '2026-09-10': { status: 'late', note: 'Arrived 8:30' },
  '2026-09-18': { status: 'half', note: 'Left after lunch (gate pass)' },
  '2026-09-22': { status: 'absent', note: 'No reason recorded' },
  '2026-09-24': { status: 'late', note: 'Arrived 8:40' },
  '2026-10-13': { status: 'absent', note: 'Inter-school sports trial' },
}

function buildRecords(): DayRecord[] {
  const out: DayRecord[] = []
  for (let d = new Date(TERM_START); d <= TODAY; d = addDays(d, 1)) {
    const key = iso(d)
    if (!slotsForDate(d) || isSummerBreak(key)) continue
    if (holidays[key]) {
      out.push({ date: key, status: 'holiday', note: holidays[key], missed: [] })
      continue
    }
    const ex = exceptions[key]
    const status = ex?.status ?? 'present'
    const missed =
      status === 'absent' ? [1, 2, 3, 4, 5, 6, 7, 8] : status === 'late' ? [1] : status === 'half' ? [5, 6, 7, 8] : []
    out.push({ date: key, status, note: ex?.note, missed })
  }
  return out
}

export const attendanceRecords = buildRecords()
export const schoolDays = attendanceRecords.filter((r) => r.status !== 'holiday')

const dayCredit = (s: DayStatus) => (s === 'absent' ? 0 : s === 'half' ? 0.5 : 1)

export const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)
export const round1 = (n: number) => Math.round(n * 10) / 10

export function overallAttendance() {
  const attended = schoolDays.reduce((a, r) => a + dayCredit(r.status), 0)
  return {
    percent: round1(pct(attended, schoolDays.length)),
    attended,
    total: schoolDays.length,
    absent: schoolDays.filter((r) => r.status === 'absent').length,
    late: schoolDays.filter((r) => r.status === 'late').length,
    half: schoolDays.filter((r) => r.status === 'half').length,
  }
}

export function attendanceByMonth() {
  const map = new Map<string, { attended: number; total: number }>()
  for (const r of schoolDays) {
    const k = r.date.slice(0, 7)
    const m = map.get(k) ?? { attended: 0, total: 0 }
    m.attended += dayCredit(r.status)
    m.total += 1
    map.set(k, m)
  }
  return [...map.entries()].map(([k, v]) => ({
    key: k,
    label: fmtMonthShort(parse(`${k}-01`)),
    percent: round1(pct(v.attended, v.total)),
    days: v.total,
  }))
}

export function attendanceBySubject() {
  const tally: Record<string, { held: number; attended: number }> = {}
  for (const r of schoolDays) {
    const slots = slotsForDate(parse(r.date))!
    slots.forEach((slot, i) => {
      if (!subjects.some((s) => s.id === slot)) return
      const t = (tally[slot] ??= { held: 0, attended: 0 })
      t.held += 1
      if (!r.missed.includes(i + 1)) t.attended += 1
    })
  }
  return subjects.map((s) => ({
    subject: s,
    held: tally[s.id].held,
    attended: tally[s.id].attended,
    percent: round1(pct(tally[s.id].attended, tally[s.id].held)),
  }))
}

export function attendanceByPeriod() {
  return [1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
    const missed = schoolDays.filter((r) => r.missed.includes(p)).length
    return { period: p, percent: round1(pct(schoolDays.length - missed, schoolDays.length)), missed }
  })
}

export function subjectSessionsMissed(id: SubjectId) {
  return schoolDays.flatMap((r) => {
    const slots = slotsForDate(parse(r.date))!
    return slots
      .map((s, i) => ({ s, p: i + 1 }))
      .filter(({ s, p }) => s === id && r.missed.includes(p))
      .map(({ p }) => ({ date: r.date, period: p, note: r.note }))
  })
}

/** Classes still needed (all attended) to bring a subject up to the target. */
export function classesToTarget(held: number, attended: number, target: number) {
  if (pct(attended, held) >= target) return 0
  const t = target / 100
  return Math.ceil((t * held - attended) / (1 - t))
}
