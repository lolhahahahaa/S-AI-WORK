// Fictional sample data for the prototype. Nothing here is a real person,
// school record or official policy.

export const student = {
  name: 'Aarav Sharma',
  firstName: 'Aarav',
  grade: 9,
  section: 'B',
  rollNo: '14',
  admissionNo: 'S-2023-0417',
  house: 'Neem House',
  academicYear: '2026–27',
  classTeacher: 'Ms. Kavya Menon',
}

export type SubjectId = 'math' | 'sci' | 'eng' | 'sst' | 'hin' | 'comp'
export type ActivityId = 'pe' | 'art' | 'lib' | 'club'

export interface Subject {
  id: SubjectId
  name: string
  short: string
  tint: string // soft background token
  color: string // chart token
  teacher: string
  room: string
}

export const subjects: Subject[] = [
  { id: 'math', name: 'Mathematics', short: 'Ma', tint: 'var(--sky)', color: 'var(--chart-1)', teacher: 'Mr. Rohan Verma', room: '204' },
  { id: 'sci', name: 'Science', short: 'Sc', tint: 'var(--sage)', color: 'var(--chart-2)', teacher: 'Ms. Kavya Menon', room: 'Lab 2' },
  { id: 'eng', name: 'English', short: 'En', tint: 'var(--peach)', color: 'var(--chart-3)', teacher: 'Ms. Ananya Rao', room: '204' },
  { id: 'sst', name: 'Social Science', short: 'SS', tint: 'var(--butter)', color: 'var(--chart-5)', teacher: 'Mr. Imran Qureshi', room: '204' },
  { id: 'hin', name: 'Hindi', short: 'हि', tint: 'var(--lilac)', color: 'var(--chart-4)', teacher: 'Mrs. Sunita Joshi', room: '204' },
  { id: 'comp', name: 'Computer Applications', short: 'CA', tint: 'var(--sky)', color: 'var(--chart-6)', teacher: 'Mr. Dev Kapoor', room: 'Comp Lab' },
]

export const activities: Record<ActivityId, { name: string; teacher: string; room: string; tint: string }> = {
  pe: { name: 'Physical Education', teacher: 'Coach Arjun Pillai', room: 'Field', tint: 'var(--sage)' },
  art: { name: 'Art & Design', teacher: 'Ms. Meera Das', room: 'Art Room', tint: 'var(--peach)' },
  lib: { name: 'Library Period', teacher: 'Library staff', room: 'Library', tint: 'var(--butter)' },
  club: { name: 'Clubs & Activities', teacher: 'Club mentors', room: 'Various', tint: 'var(--lilac)' },
}

export const subjectById = (id: string) => subjects.find((s) => s.id === id)

export const slotInfo = (id: SubjectId | ActivityId) => {
  const s = subjectById(id)
  if (s) return { name: s.name, teacher: s.teacher, room: s.room, tint: s.tint, isSubject: true }
  const a = activities[id as ActivityId]
  return { ...a, isSubject: false }
}

export interface Bell {
  period: number | null
  label: string
  start: string
  end: string
}

export const bells: Bell[] = [
  { period: null, label: 'Assembly', start: '07:50', end: '08:00' },
  { period: 1, label: 'Period 1', start: '08:00', end: '08:40' },
  { period: 2, label: 'Period 2', start: '08:40', end: '09:20' },
  { period: 3, label: 'Period 3', start: '09:20', end: '10:00' },
  { period: null, label: 'Short break', start: '10:00', end: '10:20' },
  { period: 4, label: 'Period 4', start: '10:20', end: '11:00' },
  { period: 5, label: 'Period 5', start: '11:00', end: '11:40' },
  { period: 6, label: 'Period 6', start: '11:40', end: '12:20' },
  { period: null, label: 'Lunch', start: '12:20', end: '13:00' },
  { period: 7, label: 'Period 7', start: '13:00', end: '13:40' },
  { period: 8, label: 'Period 8', start: '13:40', end: '14:20' },
]

type Slot = SubjectId | ActivityId
// Index 0 = Monday … 4 = Friday. Weekends have no classes.
export const timetable: Slot[][] = [
  ['math', 'sci', 'eng', 'sst', 'hin', 'comp', 'math', 'pe'],
  ['comp', 'eng', 'sci', 'math', 'sst', 'hin', 'art', 'sci'],
  ['sci', 'math', 'hin', 'eng', 'comp', 'sst', 'lib', 'math'],
  ['comp', 'sst', 'math', 'sci', 'eng', 'hin', 'sci', 'pe'],
  ['eng', 'math', 'sci', 'hin', 'sst', 'comp', 'eng', 'club'],
]

export const slotsForDate = (d: Date): Slot[] | null => {
  const wd = (d.getDay() + 6) % 7
  return wd < 5 ? timetable[wd] : null
}

// Periodic Test 2 — the upcoming exam window that drives several suggestions.
export const exams = [
  { subject: 'math' as SubjectId, date: '2026-11-04', name: 'Periodic Test 2', syllabus: 'Number systems, Polynomials' },
  { subject: 'sci' as SubjectId, date: '2026-11-05', name: 'Periodic Test 2', syllabus: 'Matter, Atoms & molecules' },
  { subject: 'eng' as SubjectId, date: '2026-11-06', name: 'Periodic Test 2', syllabus: 'Beehive ch. 3–5, grammar' },
  { subject: 'sst' as SubjectId, date: '2026-11-09', name: 'Periodic Test 2', syllabus: 'Physical features of India, Democracy' },
  { subject: 'hin' as SubjectId, date: '2026-11-10', name: 'Periodic Test 2', syllabus: 'क्षितिज पाठ 3–4, पत्र लेखन' },
  { subject: 'comp' as SubjectId, date: '2026-11-11', name: 'Periodic Test 2', syllabus: 'HTML basics, Spreadsheets' },
]

// Assessment results (out of 100). Periodic Test 2 has not happened yet,
// which the analytics show as a gap rather than inventing a score.
export const assessments = [
  { id: 'g8final', label: 'Grade 8 Final', short: 'G8 Final', month: 'Mar 2026' },
  { id: 'pt1', label: 'Periodic Test 1', short: 'PT 1', month: 'Jul 2026' },
  { id: 'hy', label: 'Half-Yearly', short: 'Half-Yearly', month: 'Sep 2026' },
  { id: 'pt2', label: 'Periodic Test 2', short: 'PT 2', month: 'Nov 2026' },
] as const

export const marks: Record<SubjectId, (number | null)[]> = {
  math: [78, 72, 76, null],
  sci: [82, 86, 89, null],
  eng: [80, 79, 81, null],
  sst: [74, 68, 66, null],
  hin: [70, 71, 74, null],
  comp: [85, 80, 83, null],
}

// Skills observed through activities and teacher check-ins (1–5, sample).
export const skills = [
  { id: 'communication', label: 'Communication', value: 3.8 },
  { id: 'creativity', label: 'Creativity', value: 4.2 },
  { id: 'teamwork', label: 'Teamwork', value: 4.0 },
  { id: 'technology', label: 'Technology', value: 4.5 },
  { id: 'leadership', label: 'Leadership', value: 3.0 },
  { id: 'discipline', label: 'Discipline', value: 3.6 },
]

// Days per week with any study activity (focus sessions, resources opened).
// Counts days, never hours — the product does not reward long sessions.
export const studyDaysByWeek = [
  { week: '7 Sep', days: 3 },
  { week: '14 Sep', days: 4 },
  { week: '21 Sep', days: 2 },
  { week: '28 Sep', days: 4 },
  { week: '5 Oct', days: 5 },
  { week: '12 Oct', days: 3 },
  { week: '19 Oct', days: 4 },
  { week: '26 Oct', days: 3 },
]
export const studyDaysByMonth = [
  { month: 'Jun', days: 9 },
  { month: 'Jul', days: 14 },
  { month: 'Aug', days: 15 },
  { month: 'Sep', days: 14 },
  { month: 'Oct', days: 17 },
]
