import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultAssignments, defaultCategories, defaultTodos, type Assignment, type Todo, type TodoCategory } from '../data/tasks'
import { defaultReadNotifs, defaultRsvps, type NotifCategory } from '../data/campus'
import { defaultProgress } from '../data/library'
import { defaultReports, defaultSessions, type AlertStatus, type Claim, type ItemReport, type PeerSession } from '../data/community'

export type Role = 'student' | 'parent' | 'teacher' | 'admin'
export type ThemePref = 'light' | 'dark' | 'system'
export type WidgetId = 'catchup' | 'stats' | 'agenda' | 'suggestions' | 'announcements' | 'menu' | 'profile' | 'checkin'

export interface GatePass {
  id: string
  reason: string
  details: string
  date: string
  time: string
  returning: string
  pickup: string
  createdAt: string
  parent: 'waiting' | 'approved' | 'declined'
  school: 'waiting' | 'approved' | 'declined'
  cancelled?: boolean
}

export interface FeedbackEntry {
  id: string
  type: 'class' | 'event' | 'canteen' | 'portal'
  target: string
  rating: number
  comment: string
  anonymous: boolean
  createdAt: string
}

export interface TeacherNote {
  id: string
  student: string
  subject: string
  strength: string
  next: string
  createdAt: string
}

export interface Counsellor {
  name: string
  room: string
  hours: string
  howToReach: string
}

export interface Prefs {
  schoolName: string
  schoolInitials: string
  logo: string | null
  accent: string
  theme: ThemePref
  motion: 'system' | 'reduced' | 'full'
  sidebarOpen: boolean
  role: Role
  attendanceTarget: number
  homeWidgets: { id: WidgetId; visible: boolean }[]
  notifMuted: Record<NotifCategory, boolean>
  emailDigest: boolean
  showMoodCheckin: boolean
  counsellor: Counsellor
}

export interface PersistedState {
  version: number
  prefs: Prefs
  assignments: Assignment[]
  todos: Todo[]
  categories: TodoCategory[]
  rsvps: Record<string, 'going' | 'maybe' | 'no'>
  readNotifs: string[]
  gatePasses: GatePass[]
  feedback: FeedbackEntry[]
  teacherNotes: TeacherNote[]
  menuRatings: Record<string, number>
  progress: Record<string, { progress: number; lastOpened: string }>
  dismissed: string[]
  profile: { bio: string; goals: string[]; clubs: string[]; avatarColor: string; interests: string[] }
  focusLog: Record<string, number>
  catchup: { done: Record<string, boolean>; checks: Record<string, { score: number; total: number }>; lastDate: string | null }
  reports: ItemReport[]
  claims: Claim[]
  alerts: Record<string, { status: AlertStatus; mentor?: string; outcome?: string; log: { at: string; text: string }[] }>
  peer: { needs: string[]; offers: string[]; slots: string[]; sessions: PeerSession[]; groups: string[] }
}

/** Session-only state. Never written to storage: wellbeing data stays in memory. */
export interface SessionState {
  mood: null | { value: 1 | 2 | 3 | 4 | 5; note?: string }
  chat: { id: string; from: 'me' | 'bot'; text: string; tone?: 'care' | 'urgent'; at: string }[]
  buddyMode: 'study' | 'wellbeing'
}

export const defaultPrefs: Prefs = {
  schoolName: '[School Name]',
  schoolInitials: 'SN',
  logo: null,
  accent: '#4968d5',
  theme: 'light',
  motion: 'system',
  sidebarOpen: true,
  role: 'student',
  attendanceTarget: 85,
  homeWidgets: [
    { id: 'catchup', visible: true },
    { id: 'stats', visible: true },
    { id: 'agenda', visible: true },
    { id: 'suggestions', visible: true },
    { id: 'announcements', visible: true },
    { id: 'menu', visible: true },
    { id: 'profile', visible: true },
    { id: 'checkin', visible: true },
  ],
  notifMuted: { attendance: false, tasks: false, events: false, teacher: false, school: false },
  emailDigest: false,
  showMoodCheckin: true,
  counsellor: { name: '', room: '', hours: '', howToReach: '' },
}

const STORAGE_KEY = 'school-portal:v1'
const VERSION = 1

export const initialState = (): PersistedState => ({
  version: VERSION,
  prefs: defaultPrefs,
  assignments: defaultAssignments,
  todos: defaultTodos,
  categories: defaultCategories,
  rsvps: defaultRsvps,
  readNotifs: defaultReadNotifs,
  gatePasses: [
    { id: 'GP-0918', reason: 'Medical appointment', details: 'Dental check-up at 2:00 pm', date: '2026-09-18', time: '12:20', returning: 'No', pickup: 'Parent (mother)', createdAt: '2026-09-16', parent: 'approved', school: 'approved' },
  ],
  feedback: [],
  teacherNotes: [],
  menuRatings: {},
  progress: defaultProgress,
  dismissed: [],
  profile: { bio: '', goals: ['Improve in Social Science'], clubs: ['Coding club'], avatarColor: '#f8e1d4', interests: ['Football', 'Web design'] },
  focusLog: {},
  catchup: { done: {}, checks: {}, lastDate: null },
  reports: defaultReports,
  claims: [],
  alerts: {},
  peer: { needs: ['Physical features of India', 'Polynomials'], offers: ['HTML basics', 'Spreadsheets', 'Separation of mixtures'], slots: ['Tue lunch', 'Wed library period', 'Thu lunch'], sessions: defaultSessions, groups: [] },
})

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.version !== VERSION) return initialState()
    const base = initialState()
    // Merge so newly added keys get defaults after an update.
    return { ...base, ...parsed, prefs: { ...base.prefs, ...parsed.prefs, counsellor: { ...base.prefs.counsellor, ...parsed.prefs?.counsellor } } }
  } catch {
    return initialState()
  }
}

interface Ctx {
  state: PersistedState
  session: SessionState
  update: (fn: (s: PersistedState) => PersistedState) => void
  setPrefs: (p: Partial<Prefs>) => void
  setSession: (fn: (s: SessionState) => SessionState) => void
  resetAll: () => void
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load)
  const [session, setSessionState] = useState<SessionState>({ mood: null, chat: [], buddyMode: 'study' })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked — the demo keeps working in memory */
    }
  }, [state])

  const update = useCallback((fn: (s: PersistedState) => PersistedState) => setState(fn), [])
  const setPrefs = useCallback((p: Partial<Prefs>) => setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } })), [])
  const setSession = useCallback((fn: (s: SessionState) => SessionState) => setSessionState(fn), [])
  const resetAll = useCallback(() => {
    setState(initialState())
    setSessionState({ mood: null, chat: [], buddyMode: 'study' })
  }, [])

  const value = useMemo(() => ({ state, session, update, setPrefs, setSession, resetAll }), [state, session, update, setPrefs, setSession, resetAll])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 8)}`
