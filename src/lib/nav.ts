import { Compass, HandHeart, History, PackageSearch, ShieldAlert, Bell, BookOpen, CalendarCheck, CalendarDays, DoorOpen, House, ListTodo, MessageCircleHeart, MessageSquareText, Palette, Settings, Sprout, UserRound, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { Role } from '../state/store'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Which side of the ERP / LMS switch the page belongs to. */
  mode: 'erp' | 'lms' | 'account'
}

export const NAV: Record<string, NavItem> = {
  home: { to: '/', label: 'Home', icon: House, mode: 'erp' },
  catchup: { to: '/catch-up', label: 'Catch Me Up', icon: History, mode: 'lms' },
  peer: { to: '/peer-help', label: 'Peer Help', icon: HandHeart, mode: 'lms' },
  lost: { to: '/lost-found', label: 'Lost & Found', icon: PackageSearch, mode: 'erp' },
  alerts: { to: '/support-alerts', label: 'Support alerts', icon: ShieldAlert, mode: 'erp' },
  explore: { to: '/explore', label: 'Portal map', icon: Compass, mode: 'account' },
  schedule: { to: '/schedule', label: 'Schedule', icon: CalendarDays, mode: 'erp' },
  tasks: { to: '/tasks', label: 'Tasks', icon: ListTodo, mode: 'lms' },
  attendance: { to: '/attendance', label: 'Attendance', icon: CalendarCheck, mode: 'erp' },
  library: { to: '/library', label: 'Study Library', icon: BookOpen, mode: 'lms' },
  growth: { to: '/growth', label: 'Growth & Credits', icon: Sprout, mode: 'lms' },
  buddy: { to: '/buddy', label: 'Study Buddy', icon: MessageCircleHeart, mode: 'lms' },
  events: { to: '/events', label: 'Events & Food', icon: UtensilsCrossed, mode: 'erp' },
  gatepass: { to: '/gate-pass', label: 'Gate Pass', icon: DoorOpen, mode: 'erp' },
  feedback: { to: '/feedback', label: 'Feedback', icon: MessageSquareText, mode: 'erp' },
  notifications: { to: '/notifications', label: 'Notifications', icon: Bell, mode: 'account' },
  profile: { to: '/profile', label: 'Profile', icon: UserRound, mode: 'account' },
  settings: { to: '/settings', label: 'Settings', icon: Settings, mode: 'account' },
  style: { to: '/style-guide', label: 'Style Guide', icon: Palette, mode: 'account' },
}

/** Grouped by how often a student needs them: daily → learning → occasional. */
export const NAV_GROUPS: Record<Role, { label: string; items: (keyof typeof NAV)[] }[]> = {
  student: [
    { label: 'Today', items: ['home', 'catchup', 'schedule', 'tasks', 'attendance'] },
    { label: 'Learning', items: ['library', 'peer', 'buddy', 'growth'] },
    { label: 'School life', items: ['events', 'lost', 'gatepass', 'feedback'] },
  ],
  parent: [
    { label: 'My child', items: ['home', 'attendance', 'schedule', 'growth'] },
    { label: 'School', items: ['events', 'gatepass', 'lost', 'feedback'] },
  ],
  teacher: [
    { label: 'Teaching', items: ['home', 'schedule', 'tasks'] },
    { label: 'Students', items: ['alerts', 'peer', 'feedback', 'attendance'] },
    { label: 'School', items: ['events', 'lost'] },
  ],
  admin: [
    { label: 'Operations', items: ['home', 'gatepass', 'lost', 'events'] },
    { label: 'Insight', items: ['alerts', 'feedback', 'attendance'] },
  ],
}

export const FOOTER_NAV: (keyof typeof NAV)[] = ['explore', 'notifications', 'profile', 'settings', 'style']

/** Mobile bottom bar: the four most frequent destinations + More. */
export const BOTTOM_NAV: Record<Role, (keyof typeof NAV)[]> = {
  student: ['home', 'catchup', 'tasks', 'library'],
  parent: ['home', 'attendance', 'gatepass', 'events'],
  teacher: ['home', 'alerts', 'peer', 'feedback'],
  admin: ['home', 'gatepass', 'events', 'feedback'],
}

export const roleLabels: Record<Role, string> = { student: 'Student', parent: 'Parent', teacher: 'Teacher', admin: 'Admin' }
