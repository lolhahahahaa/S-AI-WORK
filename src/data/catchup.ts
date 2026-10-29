// Class records the portal knows about for days Aarav missed (sample data).
// A record only contains what a teacher actually posted. Missing notes or
// missing records are kept as gaps — the app never invents lesson content.
import type { SubjectId } from './school'

export interface ClassRecord {
  date: string
  period: number
  subject: SubjectId
  topic: string
  /** Teacher-posted summary. null = teacher hasn't posted notes for this class. */
  notes: string | null
  postedBy?: string
  resourceIds: string[]
  homework?: { assignmentId: string; effort: number }
  deadlineChange?: { assignmentId: string; from: string; to: string; note: string }
  announcement?: string
}

export const classRecords: ClassRecord[] = [
  // Tue 13 Oct — absent (inter-school sports trial)
  { date: '2026-10-13', period: 1, subject: 'comp', topic: 'Spreadsheets: cell references in formulas', notes: 'We practised relative references (A1) and how they change when a formula is copied. Everyone built a small marks table using =SUM and =AVERAGE.', postedBy: 'Mr. Dev Kapoor', resourceIds: ['comp-sheet-video'], announcement: 'Bring a list of 5 monthly expenses for Thursday’s budget activity.' },
  { date: '2026-10-13', period: 2, subject: 'eng', topic: 'Planning a short essay', notes: 'Four-paragraph plan: introduction, two supporting points with examples, conclusion. Essay topic for homework announced.', postedBy: 'Ms. Ananya Rao', resourceIds: ['eng-essay-notes'], homework: { assignmentId: 'a3', effort: 45 } },
  { date: '2026-10-13', period: 3, subject: 'sci', topic: 'Separation of mixtures: chromatography demo', notes: 'Demonstrated paper chromatography with black ink. Lab record must include the diagram, observation and one reason the dyes separate.', postedBy: 'Ms. Kavya Menon', resourceIds: ['sci-matter-notes', 'sci-matter-video'], homework: { assignmentId: 'a2', effort: 40 } },
  { date: '2026-10-13', period: 4, subject: 'math', topic: 'Polynomials: the remainder theorem', notes: null, resourceIds: ['math-poly-notes', 'math-poly-video'], homework: { assignmentId: 'a1', effort: 35 }, deadlineChange: { assignmentId: 'a1', from: '2026-10-27', to: '2026-10-29', note: 'Due date moved after the class asked for more practice time.' } },
  { date: '2026-10-13', period: 5, subject: 'sst', topic: 'Physical features: the Peninsular Plateau', notes: 'Covered the Central Highlands and the Deccan Plateau, and how the Western and Eastern Ghats edge the plateau. Map work set as homework.', postedBy: 'Mr. Imran Qureshi', resourceIds: ['sst-physical-notes', 'sst-physical-practice'], homework: { assignmentId: 'a4', effort: 30 } },
  // P6 Hindi and P7 Art: no record was added — shown as a gap.
  { date: '2026-10-13', period: 8, subject: 'sci', topic: 'Separation of mixtures: filtration practice', notes: 'Continued from Period 3 — groups filtered muddy water and recorded observations.', postedBy: 'Ms. Kavya Menon', resourceIds: ['sci-matter-notes'] },

  // Tue 22 Sep — absent. Only a couple of classes were logged.
  { date: '2026-09-22', period: 3, subject: 'sci', topic: 'Matter: evaporation and cooling', notes: 'Evaporation happens below boiling point at the surface and causes cooling.', postedBy: 'Ms. Kavya Menon', resourceIds: ['sci-matter-notes'] },
  { date: '2026-09-22', period: 4, subject: 'math', topic: 'Number systems: irrational numbers', notes: null, resourceIds: ['math-ns-notes', 'math-ns-practice'] },

  // Fri 18 Sep — half day (left after lunch).
  { date: '2026-09-18', period: 5, subject: 'sst', topic: 'What is democracy? — features', notes: 'Features of democracy with examples; class discussion on free and fair elections.', postedBy: 'Mr. Imran Qureshi', resourceIds: ['sst-democracy-notes'] },
]

/** Knowledge-check questions are taken from existing library practice sheets. */
export const checkSources: Partial<Record<SubjectId, string>> = {
  math: 'math-poly-practice',
  sst: 'sst-physical-practice',
  sci: 'sci-atoms-practice',
  eng: 'eng-grammar-practice',
}
