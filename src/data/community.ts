// Lost & Found, Peer Help and staff support-alert sample data.
// Every person here is fictional and shown by first name + initial only.

/* ───────── Lost & Found ───────── */
export type ItemCategory = 'bottle' | 'bag' | 'notebook' | 'clothing' | 'stationery' | 'lunchbox' | 'id' | 'electronics' | 'sports' | 'other'

export const itemCategories: { id: ItemCategory; label: string; sensitive?: boolean }[] = [
  { id: 'bottle', label: 'Water bottle' },
  { id: 'bag', label: 'Bag' },
  { id: 'notebook', label: 'Notebook / book' },
  { id: 'clothing', label: 'Clothing / uniform' },
  { id: 'stationery', label: 'Stationery / geometry box' },
  { id: 'lunchbox', label: 'Lunch box' },
  { id: 'sports', label: 'Sports kit' },
  { id: 'electronics', label: 'Calculator / electronics' },
  { id: 'id', label: 'ID card', sensitive: true },
  { id: 'other', label: 'Something else' },
]

export const itemColours = ['Blue', 'Red', 'Green', 'Black', 'Grey', 'White', 'Yellow', 'Pink', 'Purple', 'Brown', 'Orange', 'Silver']
export const campusLocations = ['Main field', 'Canteen', 'Library', 'Science Lab 2', 'Computer Lab', 'Room 204', 'Assembly hall', 'Bus bay', 'Corridor (1st floor)', 'Art Room']

export type ReportStatus = 'open' | 'claimed' | 'returned' | 'closed'

export interface ItemReport {
  id: string
  kind: 'lost' | 'found'
  category: ItemCategory
  name: string
  description: string
  colours: string[]
  date: string
  location: string
  photo: string | null
  status: ReportStatus
  reportedBy: 'me' | 'office' | 'student' | 'staff'
  /** Only shown to the office and to an approved claimant. */
  privateDetail?: string
  verifyQuestion?: string
}

export const defaultReports: ItemReport[] = [
  { id: 'LF-201', kind: 'found', category: 'bottle', name: 'Steel water bottle', description: 'Blue steel bottle with a dented base and two stickers.', colours: ['Blue', 'Silver'], date: '2026-10-27', location: 'Main field', photo: null, status: 'open', reportedBy: 'staff', privateDetail: 'Stickers: a football and the letter “A”.', verifyQuestion: 'Describe any stickers or marks on the bottle.' },
  { id: 'LF-202', kind: 'found', category: 'bag', name: 'Black backpack', description: 'Black two-strap backpack, keychain on the zip.', colours: ['Black'], date: '2026-10-26', location: 'Bus bay', photo: null, status: 'open', reportedBy: 'office', privateDetail: 'Keychain is a small rubber panda.', verifyQuestion: 'What is attached to the zip?' },
  { id: 'LF-203', kind: 'found', category: 'notebook', name: 'Maths notebook', description: 'Long notebook with a green cover, Grade 9 maths.', colours: ['Green'], date: '2026-10-23', location: 'Room 204', photo: null, status: 'open', reportedBy: 'student', privateDetail: 'Name on the first page.', verifyQuestion: 'What name and section are written inside?' },
  { id: 'LF-204', kind: 'found', category: 'id', name: 'Student ID card', description: 'School ID card in a red lanyard.', colours: ['Red'], date: '2026-10-22', location: 'Canteen', photo: null, status: 'open', reportedBy: 'staff', privateDetail: 'Card details are held by the office.', verifyQuestion: 'Give your admission number (the office will check it).' },
  { id: 'LF-205', kind: 'found', category: 'clothing', name: 'Grey school sweater', description: 'Grey V-neck sweater, size 32.', colours: ['Grey'], date: '2026-10-20', location: 'Assembly hall', photo: null, status: 'open', reportedBy: 'office', privateDetail: 'Initials stitched on the label.', verifyQuestion: 'What is written on the label?' },
  { id: 'LF-206', kind: 'found', category: 'stationery', name: 'Geometry box', description: 'Blue plastic geometry box, compass missing.', colours: ['Blue'], date: '2026-10-15', location: 'Library', photo: null, status: 'returned', reportedBy: 'student' },
  { id: 'LF-207', kind: 'lost', category: 'bottle', name: 'My water bottle', description: 'Blue steel bottle with stickers on it. Lost after football practice.', colours: ['Blue'], date: '2026-10-26', location: 'Main field', photo: null, status: 'open', reportedBy: 'me' },
]

export type ClaimStatus = 'submitted' | 'verifying' | 'approved' | 'returned' | 'rejected'

export interface Claim {
  id: string
  reportId: string
  answer: string
  createdAt: string
  status: ClaimStatus
  note?: string
}

/* ───────── Peer Help ───────── */
export const peerTopics: { subject: string; topics: string[] }[] = [
  { subject: 'Mathematics', topics: ['Number systems', 'Polynomials'] },
  { subject: 'Science', topics: ['Separation of mixtures', 'Atoms & molecules'] },
  { subject: 'English', topics: ['Essay writing', 'Tenses'] },
  { subject: 'Social Science', topics: ['Physical features of India', 'Democracy'] },
  { subject: 'Hindi', topics: ['Formal letters (पत्र लेखन)'] },
  { subject: 'Computer Applications', topics: ['HTML basics', 'Spreadsheets'] },
]

/** Supervised school slots only — no off-campus or after-hours meetups. */
export const peerSlots = ['Mon lunch', 'Tue lunch', 'Wed library period', 'Thu lunch', 'Fri clubs period']
export const slotPlace: Record<string, string> = {
  'Mon lunch': 'Library (supervised)',
  'Tue lunch': 'Library (supervised)',
  'Wed library period': 'Library, with Grade 9 library staff',
  'Thu lunch': 'Room 204 (Maths help desk)',
  'Fri clubs period': 'Computer Lab (club mentor present)',
}

export interface Peer {
  id: string
  name: string
  section: string
  canHelp: string[]
  needs: string[]
  slots: string[]
  helped: number
}

export const peers: Peer[] = [
  { id: 'p-diya', name: 'Diya K.', section: '9A', canHelp: ['Polynomials', 'Number systems'], needs: ['HTML basics'], slots: ['Tue lunch', 'Thu lunch'], helped: 6 },
  { id: 'p-kabir', name: 'Kabir M.', section: '9B', canHelp: ['Physical features of India', 'Democracy'], needs: ['Spreadsheets'], slots: ['Wed library period', 'Thu lunch'], helped: 3 },
  { id: 'p-meera', name: 'Meera P.', section: '9C', canHelp: ['Essay writing', 'Tenses', 'Physical features of India'], needs: ['Polynomials'], slots: ['Mon lunch', 'Tue lunch'], helped: 9 },
  { id: 'p-ishaan', name: 'Ishaan R.', section: '9B', canHelp: ['Atoms & molecules', 'Separation of mixtures'], needs: ['Formal letters (पत्र लेखन)'], slots: ['Fri clubs period', 'Thu lunch'], helped: 2 },
  { id: 'p-sara', name: 'Sara N.', section: '9A', canHelp: ['Formal letters (पत्र लेखन)', 'Democracy'], needs: ['HTML basics', 'Separation of mixtures'], slots: ['Wed library period', 'Fri clubs period'], helped: 4 },
  { id: 'p-vihaan', name: 'Vihaan G.', section: '9C', canHelp: ['Polynomials', 'Spreadsheets'], needs: ['Essay writing'], slots: ['Mon lunch', 'Wed library period'], helped: 5 },
]

export const studyGroups = [
  { id: 'g-maths', name: 'Maths test-prep circle', topic: 'Polynomials', slot: 'Thu lunch', mentor: 'Mr. Rohan Verma', seats: 8, joined: 5 },
  { id: 'g-geo', name: 'Map work club', topic: 'Physical features of India', slot: 'Wed library period', mentor: 'Mr. Imran Qureshi', seats: 6, joined: 4 },
  { id: 'g-code', name: 'Web basics corner', topic: 'HTML basics', slot: 'Fri clubs period', mentor: 'Mr. Dev Kapoor', seats: 10, joined: 7 },
]

export type SessionStatus = 'requested' | 'invited' | 'awaiting-teacher' | 'scheduled' | 'declined' | 'completed' | 'verified'

export interface PeerSession {
  id: string
  topic: string
  peerId: string
  slot: string
  direction: 'getting' | 'giving'
  status: SessionStatus
  note: string
  createdAt: string
  resolved?: boolean
}

export const defaultSessions: PeerSession[] = [
  { id: 'ps-1', topic: 'HTML basics', peerId: 'p-sara', slot: 'Wed library period', direction: 'giving', status: 'invited', note: 'Could you help me add images and lists to my page?', createdAt: '2026-10-27' },
  { id: 'ps-0', topic: 'Separation of mixtures', peerId: 'p-ishaan', slot: 'Fri clubs period', direction: 'getting', status: 'verified', note: 'Lab record diagrams', createdAt: '2026-10-09', resolved: true },
]

/* ───────── Support alerts (staff only) ───────── */
export interface RosterStudent {
  id: string
  name: string
  /** Assignments set / not handed in over the last 4 weeks. */
  assignments: { set: number; missed: number } | null
  /** Attendance % for the 4 weeks before, and the last 4 weeks. */
  attendance: { before: number; recent: number } | null
  /** Recent quiz scores (%), oldest first. Null when quizzes weren't recorded. */
  quizzes: number[] | null
  earlierQuizAvg: number | null
}

// Fictional Grade 9B roster for the teacher demo.
export const roster: RosterStudent[] = [
  { id: 's-1', name: 'Rohan T.', assignments: { set: 8, missed: 4 }, attendance: { before: 94, recent: 78 }, quizzes: [72, 61, 52], earlierQuizAvg: 74 },
  { id: 's-2', name: 'Meera P.', assignments: { set: 8, missed: 0 }, attendance: { before: 96, recent: 95 }, quizzes: [88, 91, 90], earlierQuizAvg: 86 },
  { id: 's-3', name: 'Kabir M.', assignments: { set: 8, missed: 3 }, attendance: { before: 92, recent: 90 }, quizzes: null, earlierQuizAvg: null },
  { id: 's-4', name: 'Sara N.', assignments: { set: 8, missed: 1 }, attendance: { before: 97, recent: 84 }, quizzes: [80, 78, 81], earlierQuizAvg: 79 },
  { id: 's-5', name: 'Ishaan R.', assignments: { set: 8, missed: 1 }, attendance: { before: 90, recent: 91 }, quizzes: [74, 60, 55], earlierQuizAvg: 77 },
  { id: 's-6', name: 'Diya K.', assignments: { set: 8, missed: 0 }, attendance: null, quizzes: [93, 95, 92], earlierQuizAvg: 90 },
  { id: 's-7', name: 'Vihaan G.', assignments: { set: 8, missed: 2 }, attendance: { before: 88, recent: 86 }, quizzes: [70, 71, 69], earlierQuizAvg: 72 },
]

export const alertRules = [
  { id: 'missed', label: 'Repeated missed assignments', rule: '3 or more of the last 8 assignments not handed in (4 weeks).' },
  { id: 'attendance', label: 'Change in attendance', rule: 'Attendance down 10 or more points comparing the last 4 weeks with the 4 weeks before.' },
  { id: 'quiz', label: 'Decline in quiz scores', rule: 'Average of the last 3 quizzes 12 or more points below the student’s earlier average this term.' },
] as const

export type AlertStatus = 'new' | 'reviewed' | 'checkin' | 'mentor' | 'followup' | 'resolved' | 'dismissed'
