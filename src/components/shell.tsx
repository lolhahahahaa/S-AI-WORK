import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Bell, CalendarDays, Check, ChevronDown, ExternalLink, LayoutGrid, Link2, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Sun, UserRound, Settings as Cog } from 'lucide-react'
import { useApp, type Role } from '../state/store'
import { BOTTOM_NAV, FOOTER_NAV, NAV, NAV_GROUPS, roleLabels } from '../lib/nav'
import { notifications, notifCategoryLabels } from '../data/campus'
import { relDay } from '../lib/date'
import { student } from '../data/school'
import { useReducedMotion } from '../lib/motion'
import { useMedia } from '../lib/useMedia'
import { useMenu, Sheet } from './overlay'
import { Segmented } from './ui'
import { useToast } from './toast'
import { FloatingDock } from './dock'
import { Intro } from './Intro'

export function BrandMark({ size = 40 }: { size?: number }) {
  const { state } = useApp()
  const { logo, schoolInitials, schoolName } = state.prefs
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden={!logo}>
      {logo ? <img src={logo} alt={`${schoolName} logo`} /> : schoolInitials.slice(0, 3)}
    </span>
  )
}

export function Avatar({ size = 36 }: { size?: number }) {
  const { state } = useApp()
  const initials = state.prefs.role === 'student' ? 'AS' : state.prefs.role === 'parent' ? 'P' : state.prefs.role === 'teacher' ? 'T' : 'A'
  return (
    <span aria-hidden style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: state.profile.avatarColor, color: '#26332e', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.36, flex: 'none' }}>
      {initials}
    </span>
  )
}

export function useUnreadCount() {
  const { state } = useApp()
  return notifications.filter((n) => !state.readNotifs.includes(n.id) && !state.prefs.notifMuted[n.category]).length
}

/* ───────── Sidebar ───────── */
function Sidebar({ open, canToggle }: { open: boolean; canToggle: boolean }) {
  const { state, setPrefs } = useApp()
  const unread = useUnreadCount()
  const asideRef = useRef<HTMLElement>(null)
  const indRef = useRef<HTMLSpanElement>(null)
  const location = useLocation()
  const reduced = useReducedMotion()
  // One indicator glides between destinations instead of each link lighting up separately.
  useLayoutEffect(() => {
    const a = asideRef.current?.querySelector<HTMLElement>('.nav-item[aria-current="page"]')
    if (!indRef.current) return
    if (!a) {
      gsap.to(indRef.current, { opacity: 0, duration: 0.2 })
      return
    }
    gsap.to(indRef.current, { y: a.offsetTop, height: a.offsetHeight, opacity: 1, duration: reduced ? 0 : 0.45, ease: 'power3.out' })
  }, [location.pathname, open, state.prefs.role, reduced])
  const [tip, setTip] = useState<{ text: string; top: number; left: number } | null>(null)
  const showTip = (e: React.SyntheticEvent<HTMLElement>, text: string) => {
    if (open) return
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ text, top: r.top + r.height / 2 - 14, left: r.right + 10 })
  }
  const item = (key: keyof typeof NAV) => {
    const n = NAV[key]
    const Icon = n.icon
    return (
      <NavLink key={key} to={n.to} end={n.to === '/'} viewTransition className="nav-item" onMouseEnter={(e) => showTip(e, n.label)} onMouseLeave={() => setTip(null)} onClick={() => setTip(null)} onFocus={(e) => showTip(e, n.label)} onBlur={() => setTip(null)} aria-label={!open ? n.label : undefined}>
        <Icon size={20} strokeWidth={2} aria-hidden />
        <span className="nav-label">{n.label}</span>
        {key === 'notifications' && unread > 0 && <span className="nav-count" aria-label={`${unread} unread`}>{unread}</span>}
      </NavLink>
    )
  }
  return (
    <aside ref={asideRef} className="sidebar" aria-label="Main navigation">
      <span ref={indRef} className="nav-indicator" aria-hidden />
      <Link to="/" className="sidebar-brand" aria-label={`${state.prefs.schoolName} Portal home`}>
        <BrandMark />
        <span className="brand-name">
          {state.prefs.schoolName}
          <small>Portal · {roleLabels[state.prefs.role]}</small>
        </span>
      </Link>
      <nav aria-label="Primary">
        {NAV_GROUPS[state.prefs.role].map((g) => (
          <div key={g.label} role="group" aria-label={g.label}>
            <div className="nav-group-label" aria-hidden>
              {g.label}
            </div>
            {g.items.map(item)}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {FOOTER_NAV.map(item)}
        {canToggle && <button className="nav-item sidebar-toggle" style={{ border: 0, background: 'none', width: '100%' }} onClick={() => setPrefs({ sidebarOpen: !open })} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={open} onMouseEnter={(e) => showTip(e, 'Expand sidebar')} onMouseLeave={() => setTip(null)}>
          {open ? <PanelLeftClose size={20} aria-hidden /> : <PanelLeftOpen size={20} aria-hidden />}
          <span className="nav-label">Collapse</span>
        </button>}
      </div>
      {tip && !open && (
        <div className="nav-tip" style={{ top: tip.top, left: tip.left }} role="presentation">
          {tip.text}
        </div>
      )}
    </aside>
  )
}

/* ───────── Top bar pieces ───────── */
function LinksMenu() {
  const { open, setOpen, wrapRef } = useMenu()
  const links = [
    { to: '/schedule?view=month', label: 'Academic calendar' },
    { to: '/schedule', label: 'Class timetable' },
    { to: '/events?tab=food', label: 'Canteen menu' },
    { to: '/library', label: 'Study Library' },
  ]
  return (
    <div ref={wrapRef} style={{ position: 'relative' }} className="hide-mobile">
      <button className="btn btn-ghost" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Link2 size={16} aria-hidden /> Links <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div className="popover align-left" role="menu" style={{ left: 0 }}>
          <div className="menu-label">Quick links</div>
          {links.map((l) => (
            <Link key={l.to} to={l.to} role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="menu-sep" />
          <div className="menu-label">School website</div>
          <div className="menu-item" style={{ color: 'var(--text-3)', cursor: 'default' }} aria-disabled="true">
            <ExternalLink size={14} aria-hidden /> Not configured in this prototype
          </div>
        </div>
      )}
    </div>
  )
}

function BellMenu() {
  const { state, update } = useApp()
  const unread = useUnreadCount()
  const { open, setOpen, wrapRef } = useMenu()
  const navigate = useNavigate()
  const list = notifications.filter((n) => !state.prefs.notifMuted[n.category]).slice(0, 5)
  const markAll = () => update((s) => ({ ...s, readNotifs: [...new Set([...s.readNotifs, ...notifications.map((n) => n.id)])] }))
  const go = (id: string, link: string) => {
    update((s) => ({ ...s, readNotifs: [...new Set([...s.readNotifs, id])] }))
    setOpen(false)
    navigate(link)
  }
  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button className="icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`Notifications, ${unread} unread`} onClick={() => setOpen(!open)}>
        <Bell size={20} aria-hidden />
        {unread > 0 && <span className="badge-dot">{unread}</span>}
      </button>
      {open && (
        <div className="popover" role="menu" style={{ right: 0, width: 'min(360px, calc(100vw - 24px))' }}>
          <div className="row between" style={{ padding: '6px 10px' }}>
            <strong>Notifications</strong>
            <button className="link-btn" onClick={markAll} disabled={unread === 0} role="menuitem">
              Mark all as read
            </button>
          </div>
          {list.map((n) => {
            const isUnread = !state.readNotifs.includes(n.id)
            return (
              <button key={n.id} role="menuitem" className="menu-item" style={{ alignItems: 'flex-start', padding: '10px' }} onClick={() => go(n.id, n.link)}>
                <span className="dot" style={{ marginTop: 7, background: isUnread ? 'var(--primary)' : 'transparent' }} aria-hidden />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: isUnread ? 800 : 600 }}>
                    {isUnread && <span className="sr-only">Unread: </span>}
                    {n.title}
                  </span>
                  <span className="subtle" style={{ display: 'block' }}>
                    {notifCategoryLabels[n.category]} · {relDay(n.date)}
                  </span>
                </span>
              </button>
            )
          })}
          <div className="menu-sep" />
          <Link to="/notifications" role="menuitem" className="menu-item" style={{ justifyContent: 'center', color: 'var(--primary-text)' }} onClick={() => setOpen(false)}>
            See all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

function AccountMenu() {
  const { state, setPrefs } = useApp()
  const { open, setOpen, wrapRef } = useMenu()
  const navigate = useNavigate()
  const toast = useToast()
  const dark = state.prefs.theme === 'dark' || (state.prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const switchRole = (r: Role) => {
    setPrefs({ role: r })
    setOpen(false)
    navigate('/')
    toast(`Showing the ${roleLabels[r].toLowerCase()} view (prototype — no real sign-in)`, 'info')
  }
  const name = state.prefs.role === 'student' ? student.name : `${roleLabels[state.prefs.role]} (demo)`
  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button className="row" style={{ border: 0, background: 'none', padding: 2, borderRadius: 999, gap: 6 }} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen(!open)}>
        <Avatar />
        <ChevronDown size={14} className="hide-mobile" aria-hidden />
      </button>
      {open && (
        <div className="popover" role="menu" style={{ right: 0, width: 260 }}>
          <div style={{ padding: '8px 10px 10px' }}>
            <strong style={{ display: 'block' }}>{name}</strong>
            <span className="subtle">
              Grade {student.grade}
              {student.section} · {state.prefs.schoolName}
            </span>
          </div>
          <div className="menu-sep" />
          <div className="menu-label">View as (prototype)</div>
          {(Object.keys(roleLabels) as Role[]).map((r) => (
            <button key={r} role="menuitemradio" aria-checked={state.prefs.role === r} className="menu-item" onClick={() => switchRole(r)}>
              <span style={{ width: 16 }}>{state.prefs.role === r && <Check size={16} aria-hidden />}</span>
              {roleLabels[r]}
            </button>
          ))}
          <div className="menu-sep" />
          <button role="menuitem" className="menu-item" onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })}>
            {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />} {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <Link to="/profile" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
            <UserRound size={16} aria-hidden /> Profile
          </Link>
          <Link to="/settings" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
            <Cog size={16} aria-hidden /> Settings
          </Link>
          <div className="menu-sep" />
          <div className="menu-item" aria-disabled="true" style={{ color: 'var(--text-3)', cursor: 'default' }}>
            <LogOut size={16} aria-hidden /> Sign out (no sign-in in demo)
          </div>
        </div>
      )}
    </div>
  )
}

function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useApp()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const current = Object.values(NAV).find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)))
  const mode = current?.mode === 'lms' ? 'lms' : 'erp'
  return (
    <header className="topbar" data-scrolled={scrolled}>
      <Link to="/" className="topbar-mobile-brand row" style={{ textDecoration: 'none', color: 'var(--text)', gap: 10 }} aria-label="Home">
        <BrandMark size={34} />
        <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{current?.label ?? 'Portal'}</strong>
      </Link>
      {state.prefs.role === 'student' && (
        <span className="hide-mobile">
          <Segmented
            label="Switch between school operations (ERP) and learning (LMS)"
            value={mode}
            onChange={(v) => navigate(v === 'lms' ? '/library' : '/')}
            options={[
              { id: 'erp', label: 'ERP' },
              { id: 'lms', label: 'LMS' },
            ]}
          />
        </span>
      )}
      <LinksMenu />
      <div className="topbar-spacer" />
      <span className="hide-mobile subtle row" style={{ gap: 6 }}>
        <CalendarDays size={14} aria-hidden /> Demo date: Wed 28 Oct 2026
      </span>
      <BellMenu />
      <AccountMenu />
    </header>
  )
}

/* ───────── Mobile ───────── */
function BottomNav({ onMore }: { onMore: () => void }) {
  const { state } = useApp()
  return (
    <nav className="bottomnav" aria-label="Main">
      {BOTTOM_NAV[state.prefs.role].map((k) => {
        const n = NAV[k]
        const Icon = n.icon
        return (
          <NavLink key={k} to={n.to} end={n.to === '/'} viewTransition className="bottomnav-item">
            <Icon size={22} aria-hidden />
            <span>{n.label.replace('Study ', '')}</span>
          </NavLink>
        )
      })}
      <button className="bottomnav-item" onClick={onMore} aria-haspopup="dialog">
        <LayoutGrid size={22} aria-hidden />
        <span>More</span>
      </button>
    </nav>
  )
}

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp()
  const location = useLocation()
  const unread = useUnreadCount()
  useEffect(() => onClose(), [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  const groups = [...NAV_GROUPS[state.prefs.role], { label: 'Account', items: FOOTER_NAV }]
  return (
    <Sheet open={open} onClose={onClose} title="All pages">
      {groups.map((g) => (
        <div key={g.label} style={{ marginBottom: 16 }}>
          <div className="menu-label" style={{ padding: '0 2px 8px' }}>
            {g.label}
          </div>
          <div className="sheet-grid">
            {g.items.map((k) => {
              const n = NAV[k]
              const Icon = n.icon
              return (
                <NavLink key={k} to={n.to} end={n.to === '/'} viewTransition className="sheet-link">
                  <Icon size={22} aria-hidden />
                  {n.label}
                  {k === 'notifications' && unread > 0 && <span className="badge badge-danger">{unread} new</span>}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </Sheet>
  )
}

/* ───────── Theme application ───────── */
function readableInk(hex: string) {
  const v = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.35 ? '#1b2420' : '#ffffff'
}

function useThemeEffect() {
  const { state } = useApp()
  const { theme, accent, motion, schoolName } = state.prefs
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => (root.dataset.theme = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', accent)
    document.documentElement.style.setProperty('--primary-ink', readableInk(accent))
  }, [accent])
  useEffect(() => {
    if (motion === 'system') delete document.documentElement.dataset.motion
    else document.documentElement.dataset.motion = motion
  }, [motion])
  useEffect(() => {
    document.querySelector('meta[name="application-name"]')?.setAttribute('content', `${schoolName} Portal`)
  }, [schoolName])
}

/* ───────── Shell ───────── */
export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [more, setMore] = useState(false)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const wide = useMedia('(min-width: 1200px)')
  const sidebarOpen = wide && state.prefs.sidebarOpen
  useThemeEffect()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    const page = Object.values(NAV).find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)))
    document.title = `${page?.label ?? 'Page not found'} · ${state.prefs.schoolName} Portal`
  }, [location.pathname, state.prefs.schoolName])

  // Subtle, quick content reveal on route change. Never delays interaction.
  useGSAP(
    () => {
      if (reduced) return
      gsap.fromTo('[data-reveal]', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out', stagger: { amount: 0.18 }, clearProps: 'opacity,transform' })
    },
    { scope: mainRef, dependencies: [location.pathname, reduced], revertOnUpdate: true },
  )

  return (
    <div className="shell" data-sidebar={sidebarOpen ? 'open' : 'closed'}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar open={sidebarOpen} canToggle={wide} />
      <div className="shell-main">
        <TopBar />
        <main id="main" ref={mainRef} className="page" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomNav onMore={() => setMore(true)} />
      <MoreSheet open={more} onClose={() => setMore(false)} />
      <FloatingDock />
      <Intro />
    </div>
  )
}
