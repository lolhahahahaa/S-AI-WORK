// Events, canteen menu, announcements and notifications — all sample data.

export interface SchoolEvent {
  id: string
  title: string
  date: string
  start: string
  end: string
  location: string
  description: string
  category: 'Sports' | 'Academic' | 'Cultural' | 'Clubs' | 'Meeting'
  rsvpable: boolean
  credits?: number
}

export const events: SchoolEvent[] = [
  { id: 'e1', title: 'Inter-house football final', date: '2026-10-30', start: '14:30', end: '16:00', location: 'Main field', description: 'Neem House vs Peepal House. Come cheer — players report at 2:00 pm.', category: 'Sports', rsvpable: true, credits: 10 },
  { id: 'e2', title: 'Lantern-making workshop', date: '2026-11-03', start: '13:00', end: '14:20', location: 'Art Room', description: 'Make a paper lantern with recycled material. Materials are provided.', category: 'Cultural', rsvpable: true, credits: 10 },
  { id: 'e3', title: 'Coding club mini-hackathon', date: '2026-11-07', start: '09:00', end: '12:30', location: 'Computer Lab', description: 'Build a small web page in teams of three. Beginners welcome.', category: 'Clubs', rsvpable: true, credits: 15 },
  { id: 'e4', title: 'Science exhibition', date: '2026-11-14', start: '09:30', end: '13:00', location: 'Assembly hall', description: 'Grade 6–10 projects on display. Volunteers needed to guide visitors.', category: 'Academic', rsvpable: true, credits: 15 },
  { id: 'e5', title: 'Parent–teacher meeting (Grade 9)', date: '2026-11-21', start: '09:00', end: '12:00', location: 'Classrooms', description: 'Parents meet subject teachers. Students attend with a parent if possible.', category: 'Meeting', rsvpable: false },
  { id: 'p1', title: 'Annual sports day', date: '2026-10-10', start: '08:30', end: '13:00', location: 'Main field', description: 'Track events and house relays.', category: 'Sports', rsvpable: true, credits: 15 },
  { id: 'p2', title: 'Hindi Diwas poetry recital', date: '2026-09-14', start: '10:20', end: '11:40', location: 'Assembly hall', description: 'Students recited poems by Hindi poets.', category: 'Cultural', rsvpable: true, credits: 10 },
  { id: 'p3', title: "Teachers' Day celebration", date: '2026-09-05', start: '11:00', end: '12:20', location: 'Assembly hall', description: 'Grade 12 students hosted classes and a short performance.', category: 'Cultural', rsvpable: false },
]

// RSVPs already recorded in the sample data for past events.
export const defaultRsvps: Record<string, 'going' | 'maybe' | 'no'> = { p1: 'going', p2: 'going', e1: 'going' }

export type Diet = 'veg' | 'egg' | 'dairy' | 'gluten' | 'nuts' | 'jain'
export interface MenuItem {
  id: string
  name: string
  diet: Diet[]
}
export interface Meal {
  key: 'breakfast' | 'snack' | 'lunch'
  label: string
  time: string
  items: MenuItem[]
}

const m = (id: string, name: string, diet: Diet[]): MenuItem => ({ id, name, diet })

// Mon–Fri menus. Breakfast is optional and served before assembly.
export const weeklyMenu: Meal[][] = [
  [
    { key: 'breakfast', label: 'Breakfast', time: '7:20 – 7:45 am', items: [m('poha', 'Vegetable poha', ['veg', 'nuts']), m('milk', 'Warm milk', ['veg', 'dairy'])] },
    { key: 'snack', label: 'Short break', time: '10:00 – 10:20 am', items: [m('fruit', 'Seasonal fruit cup', ['veg']), m('chana', 'Roasted chana', ['veg'])] },
    { key: 'lunch', label: 'Lunch', time: '12:20 – 1:00 pm', items: [m('rajma', 'Rajma chawal', ['veg']), m('salad', 'Cucumber salad', ['veg']), m('curd', 'Curd', ['veg', 'dairy'])] },
  ],
  [
    { key: 'breakfast', label: 'Breakfast', time: '7:20 – 7:45 am', items: [m('idli', 'Idli with sambar', ['veg']), m('chutney', 'Coconut chutney', ['veg'])] },
    { key: 'snack', label: 'Short break', time: '10:00 – 10:20 am', items: [m('sprouts', 'Sprouts chaat', ['veg']), m('lassi', 'Sweet lassi', ['veg', 'dairy'])] },
    { key: 'lunch', label: 'Lunch', time: '12:20 – 1:00 pm', items: [m('roti', 'Roti', ['veg', 'gluten']), m('paneer', 'Matar paneer', ['veg', 'dairy']), m('dal', 'Dal tadka', ['veg'])] },
  ],
  [
    { key: 'breakfast', label: 'Breakfast', time: '7:20 – 7:45 am', items: [m('upma', 'Rava upma', ['veg', 'gluten']), m('banana', 'Banana', ['veg'])] },
    { key: 'snack', label: 'Short break', time: '10:00 – 10:20 am', items: [m('sandwich', 'Veg sandwich', ['veg', 'gluten']), m('buttermilk', 'Buttermilk', ['veg', 'dairy'])] },
    { key: 'lunch', label: 'Lunch', time: '12:20 – 1:00 pm', items: [m('veg-pulao', 'Vegetable pulao', ['veg']), m('raita', 'Boondi raita', ['veg', 'dairy']), m('kadhi', 'Kadhi', ['veg', 'dairy'])] },
  ],
  [
    { key: 'breakfast', label: 'Breakfast', time: '7:20 – 7:45 am', items: [m('paratha', 'Aloo paratha', ['veg', 'gluten']), m('curd2', 'Curd', ['veg', 'dairy'])] },
    { key: 'snack', label: 'Short break', time: '10:00 – 10:20 am', items: [m('dhokla', 'Dhokla', ['veg']), m('fruit2', 'Apple slices', ['veg'])] },
    { key: 'lunch', label: 'Lunch', time: '12:20 – 1:00 pm', items: [m('chole', 'Chole with rice', ['veg']), m('egg-curry', 'Egg curry (optional)', ['egg']), m('salad2', 'Carrot salad', ['veg'])] },
  ],
  [
    { key: 'breakfast', label: 'Breakfast', time: '7:20 – 7:45 am', items: [m('dosa', 'Plain dosa', ['veg']), m('sambar', 'Sambar', ['veg'])] },
    { key: 'snack', label: 'Short break', time: '10:00 – 10:20 am', items: [m('makhana', 'Roasted makhana', ['veg']), m('juice', 'Fresh lime water', ['veg'])] },
    { key: 'lunch', label: 'Lunch', time: '12:20 – 1:00 pm', items: [m('khichdi', 'Vegetable khichdi', ['veg']), m('papad', 'Papad', ['veg']), m('kheer', 'Rice kheer', ['veg', 'dairy', 'nuts'])] },
  ],
]

export const dietLabels: Record<Diet, string> = {
  veg: 'Vegetarian',
  egg: 'Contains egg',
  dairy: 'Dairy',
  gluten: 'Gluten',
  nuts: 'Nuts',
  jain: 'Jain option',
}

export const menuForDate = (d: Date) => {
  const wd = (d.getDay() + 6) % 7
  return wd < 5 ? weeklyMenu[wd] : null
}

export interface Announcement {
  id: string
  type: 'notice' | 'update' | 'social'
  title: string
  body: string
  date: string
  from: string
  link?: string
  pinned?: boolean
}

export const announcements: Announcement[] = [
  { id: 'n1', type: 'notice', title: 'Periodic Test 2 timetable released', body: 'Tests run 4–11 November. Mathematics is first on Wednesday 4 November. Syllabus is listed in Schedule.', date: '2026-10-27', from: 'Examinations office', link: '/schedule', pinned: true },
  { id: 'n2', type: 'update', title: 'New revision notes for Social Science', body: 'Mr. Qureshi has added notes and a practice sheet for "Physical features of India".', date: '2026-10-27', from: 'Social Science', link: '/library?subject=sst' },
  { id: 'n3', type: 'social', title: 'Neem House reaches the football final', body: 'The final is on Friday at 2:30 pm on the main field. Wear house colours!', date: '2026-10-26', from: 'Sports department', link: '/events' },
  { id: 'n4', type: 'notice', title: 'Winter uniform from 2 November', body: 'Sweaters and blazers can be worn from Monday 2 November.', date: '2026-10-23', from: 'Principal’s office' },
  { id: 'n5', type: 'update', title: 'Canteen adds a fruit option every break', body: 'A seasonal fruit cup is now available at every short break. Rate it in Events & Food.', date: '2026-10-22', from: 'Canteen committee', link: '/events?tab=food' },
  { id: 'n6', type: 'social', title: 'Coding club hackathon — teams of three', body: 'Sign up through Events. Beginners are welcome; mentors will help.', date: '2026-10-21', from: 'Coding club', link: '/events' },
  { id: 'n7', type: 'notice', title: 'Library timing change on Fridays', body: 'On Fridays the library closes at 3:00 pm instead of 4:00 pm this term.', date: '2026-10-16', from: 'Library' },
]

export type NotifCategory = 'attendance' | 'tasks' | 'events' | 'teacher' | 'school'

export interface Notification {
  id: string
  category: NotifCategory
  title: string
  body: string
  date: string
  time: string
  link: string
}

export const notifCategoryLabels: Record<NotifCategory, string> = {
  attendance: 'Attendance',
  tasks: 'Tasks',
  events: 'Events',
  teacher: 'Teacher messages',
  school: 'School updates',
}

export const notifications: Notification[] = [
  { id: 'x1', category: 'tasks', title: 'Map work is overdue', body: 'Social Science — "Map work: Physical features of India" was due yesterday.', date: '2026-10-28', time: '07:00', link: '/tasks?task=a4' },
  { id: 'x2', category: 'tasks', title: 'Due tomorrow: Exercise 2.3', body: 'Mathematics — Polynomials, questions 1–5.', date: '2026-10-28', time: '07:00', link: '/tasks?task=a1' },
  { id: 'x3', category: 'teacher', title: 'Message from Mr. Verma', body: '“Bring graph paper on Thursday for the polynomial activity.”', date: '2026-10-27', time: '15:10', link: '/schedule' },
  { id: 'x4', category: 'attendance', title: 'Computer Applications attendance is below your target', body: 'Most missed sessions were first-period lates. See Attendance for details.', date: '2026-10-27', time: '09:00', link: '/attendance' },
  { id: 'x5', category: 'events', title: 'You’re going to the football final', body: 'Friday 30 Oct, 2:30 pm · Main field.', date: '2026-10-26', time: '18:20', link: '/events' },
  { id: 'x6', category: 'school', title: 'Periodic Test 2 timetable released', body: 'Tests run 4–11 November.', date: '2026-10-27', time: '11:00', link: '/schedule?view=month' },
  { id: 'x7', category: 'teacher', title: 'Feedback on your HTML page', body: 'Mr. Kapoor graded your assignment: 18/20.', date: '2026-10-24', time: '16:40', link: '/tasks?task=a6' },
  { id: 'x8', category: 'events', title: 'New event: Lantern-making workshop', body: 'Tuesday 3 Nov in the Art Room. RSVP to save a seat.', date: '2026-10-23', time: '12:00', link: '/events' },
  { id: 'x9', category: 'school', title: 'Winter uniform from 2 November', body: 'Sweaters and blazers allowed from Monday.', date: '2026-10-23', time: '10:00', link: '/' },
  { id: 'x10', category: 'attendance', title: 'Attendance marked: absent on 13 Oct', body: 'Reason recorded: inter-school sports trial.', date: '2026-10-13', time: '10:00', link: '/attendance' },
]

export const defaultReadNotifs = ['x7', 'x8', 'x9', 'x10']
