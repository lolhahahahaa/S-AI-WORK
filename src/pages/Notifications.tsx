import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck, ChevronRight, Inbox } from 'lucide-react'
import { useApp } from '../state/store'
import { notifications, notifCategoryLabels, type NotifCategory } from '../data/campus'
import { fmtTime, relDay } from '../lib/date'
import { Empty, PageHeader, Switch } from '../components/ui'
import { useToast } from '../components/toast'

const cats = Object.keys(notifCategoryLabels) as NotifCategory[]

export default function Notifications() {
  const { state, update, setPrefs } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [only, setOnly] = useState<'all' | 'unread'>('all')
  const [cat, setCat] = useState<NotifCategory | 'all'>('all')
  const isRead = (id: string) => state.readNotifs.includes(id)
  const unread = notifications.filter((n) => !isRead(n.id)).length
  const list = notifications.filter((n) => (only === 'all' || !isRead(n.id)) && (cat === 'all' || n.category === cat))
  const toggle = (id: string) => update((s) => ({ ...s, readNotifs: s.readNotifs.includes(id) ? s.readNotifs.filter((x) => x !== id) : [...s.readNotifs, id] }))
  const markAll = () => {
    update((s) => ({ ...s, readNotifs: notifications.map((n) => n.id) }))
    toast('All notifications marked as read.')
  }
  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You’re all caught up.'}
        actions={
          <button className="btn btn-secondary" onClick={markAll} disabled={!unread}>
            <CheckCheck size={16} aria-hidden /> Mark all as read
          </button>
        }
      />
      <div className="notif-layout">
        <div className="stack" data-reveal>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Show">
              <button className="chip" aria-pressed={only === 'all'} onClick={() => setOnly('all')}>
                All
              </button>
              <button className="chip" aria-pressed={only === 'unread'} onClick={() => setOnly('unread')}>
                Unread {unread > 0 && `(${unread})`}
              </button>
            </div>
            <div className="toolbar-right">
              <label htmlFor="n-cat" className="sr-only">Category</label>
              <select id="n-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value as NotifCategory | 'all')}>
                <option value="all">All categories</option>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {notifCategoryLabels[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {list.length === 0 ? (
            <div className="card">
              <Empty icon={<Inbox size={22} />} title={only === 'unread' ? 'No unread notifications' : 'No notifications'}>
                {only === 'unread' ? 'Everything here has been read.' : 'Nothing in this category yet.'}
              </Empty>
            </div>
          ) : (
            cats
              .filter((c) => list.some((n) => n.category === c))
              .map((c) => (
                <section key={c} className="card" aria-labelledby={`nc-${c}`}>
                  <div className="card-head" style={{ marginBottom: 6 }}>
                    <h2 id={`nc-${c}`} style={{ fontSize: 'var(--fs-md)' }}>
                      {notifCategoryLabels[c]}
                    </h2>
                    {state.prefs.notifMuted[c] && (
                      <span className="badge">
                        <BellOff aria-hidden /> Muted
                      </span>
                    )}
                  </div>
                  <ul className="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {list
                      .filter((n) => n.category === c)
                      .map((n) => {
                        const r = isRead(n.id)
                        return (
                          <li key={n.id} className="list-row notif-row" data-unread={!r}>
                            <span className="dot" style={{ background: r ? 'transparent' : 'var(--primary)', border: r ? '1.5px solid var(--border-strong)' : 0 }} aria-hidden />
                            <div className="list-row-main">
                              <div className="list-row-title" style={{ fontWeight: r ? 600 : 800 }}>
                                {!r && <span className="sr-only">Unread: </span>}
                                {n.title}
                              </div>
                              <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                                {n.body}
                              </p>
                              <div className="list-row-meta">
                                {relDay(n.date)} · {fmtTime(n.time)}
                              </div>
                            </div>
                            <div className="row notif-actions" style={{ gap: 4 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => toggle(n.id)}>
                                {r ? 'Mark unread' : 'Mark read'}
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  if (!r) toggle(n.id)
                                  navigate(n.link)
                                }}
                                aria-label={`Open: ${n.title}`}
                              >
                                Open <ChevronRight size={14} aria-hidden />
                              </button>
                            </div>
                          </li>
                        )
                      })}
                  </ul>
                </section>
              ))
          )}
        </div>
        <aside className="card notif-prefs" data-reveal aria-labelledby="np-h">
          <h2 id="np-h" style={{ fontSize: 'var(--fs-md)' }}>
            Preferences
          </h2>
          <p className="subtle" style={{ margin: '4px 0 8px' }}>
            Muted categories don’t count towards the bell badge, but still appear here.
          </p>
          {cats.map((c) => (
            <div key={c} className="setting-row">
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{notifCategoryLabels[c]}</span>
              <Switch checked={!state.prefs.notifMuted[c]} onChange={(on) => setPrefs({ notifMuted: { ...state.prefs.notifMuted, [c]: !on } })} label={`${notifCategoryLabels[c]} notifications`} />
            </div>
          ))}
          <div className="setting-row">
            <div>
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Weekly email digest</span>
              <p>Not connected in this prototype — no emails are sent.</p>
            </div>
            <Switch checked={state.prefs.emailDigest} onChange={(v) => setPrefs({ emailDigest: v })} label="Weekly email digest (not connected)" />
          </div>
        </aside>
      </div>
    </>
  )
}
