// The portal's information architecture as layers — used by the 3D map,
// its 2D fallback and the Explore page panels.
export interface Layer {
  id: string
  name: string
  blurb: string
  light: string
  dark: string
  modules: { label: string; to: string }[]
  relates: string
}

export const layers: Layer[] = [
  { id: 'services', name: 'School services', blurb: 'Practical everyday help for the whole school.', light: '#f3d9c8', dark: '#6b4a3a', modules: [{ label: 'Events & Food', to: '/events' }, { label: 'Gate Pass', to: '/gate-pass' }, { label: 'Lost & Found', to: '/lost-found' }], relates: 'Feeds notifications and the Home dashboard.' },
  { id: 'staff', name: 'Teacher oversight', blurb: 'Human-reviewed support and moderation — staff only.', light: '#e2dbf2', dark: '#4b4166', modules: [{ label: 'Support alerts', to: '/support-alerts' }, { label: 'Session moderation', to: '/peer-help?tab=moderate' }], relates: 'Reads attendance and task records; never wellbeing chats.' },
  { id: 'together', name: 'Learning together', blurb: 'Classmates helping classmates, in supervised school time.', light: '#d6e6d2', dark: '#3a5a45', modules: [{ label: 'Peer Help Exchange', to: '/peer-help' }], relates: 'Linked from Catch Me Up gaps and Study Buddy.' },
  { id: 'support', name: 'Learning support', blurb: 'Recover missed work and get unstuck.', light: '#d7e5f8', dark: '#344a6b', modules: [{ label: 'Catch Me Up', to: '/catch-up' }, { label: 'Study Buddy', to: '/buddy' }], relates: 'Built from attendance, class records and assignments.' },
  { id: 'learning', name: 'Academic learning', blurb: 'Resources, progress and growth over time.', light: '#f1e6bd', dark: '#5f5530', modules: [{ label: 'Study Library', to: '/library' }, { label: 'Growth & Credits', to: '/growth' }], relates: 'Completing resources updates credits and recovery plans.' },
  { id: 'core', name: 'Daily core', blurb: 'What’s happening today and what’s due.', light: '#ffffff', dark: '#2a3330', modules: [{ label: 'Home', to: '/' }, { label: 'Schedule', to: '/schedule' }, { label: 'Tasks', to: '/tasks' }, { label: 'Attendance', to: '/attendance' }], relates: 'The source records every other layer builds on.' },
]

export const catchUpSteps = [
  { n: 1, title: 'Attendance notices the gap', body: 'Missed periods come straight from the attendance record.', to: '/attendance' },
  { n: 2, title: 'See what you missed', body: 'Teacher-posted notes, homework, announcements and deadline changes — and honest gaps where nothing was posted.', to: '/catch-up' },
  { n: 3, title: 'A plan, in the right order', body: 'Overdue first, then due soon, then what your next test covers. Each step says why.', to: '/catch-up?step=plan' },
  { n: 4, title: 'Get unstuck', body: 'Open the library chapter, ask Study Buddy, or find a classmate through Peer Help.', to: '/peer-help' },
  { n: 5, title: 'Check and move on', body: 'A short knowledge check, then progress updates in Tasks and Growth.', to: '/catch-up?step=check' },
]
