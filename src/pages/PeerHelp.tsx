import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarCheck, Check, HandHeart, MapPin, MessageCircleHeart, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import { useApp, uid, type PersistedState } from '../state/store'
import { peers, peerSlots, peerTopics, slotPlace, studyGroups, type Peer, type PeerSession, type SessionStatus } from '../data/community'
import { TODAY, iso } from '../lib/date'
import { useFlip } from '../lib/motion'
import { Empty, Field, PageHeader, PrototypeTag, Tabs } from '../components/ui'
import { useToast } from '../components/toast'

const statusText: Record<SessionStatus, string> = {
  requested: 'Waiting for classmate',
  invited: 'Invitation for you',
  'awaiting-teacher': 'Waiting for teacher approval',
  scheduled: 'Scheduled',
  declined: 'Declined',
  completed: 'Done — teacher to confirm',
  verified: 'Confirmed by teacher',
}
const statusTone: Record<SessionStatus, string> = { requested: 'badge-info', invited: 'badge-primary', 'awaiting-teacher': 'badge-warn', scheduled: 'badge-ok', declined: '', completed: 'badge-info', verified: 'badge-ok' }
const peerById = (id: string) => peers.find((p) => p.id === id)!
const allTopics = peerTopics.flatMap((g) => g.topics)
const CONTACT = /(\d[\s-]?){7,}|@|https?:\/\/|instagram|snap|whatsapp|discord/i

type Update = (fn: (s: PersistedState) => PersistedState) => void
const setSession = (update: Update, id: string, patch: Partial<PeerSession>) => update((s) => ({ ...s, peer: { ...s.peer, sessions: s.peer.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) } }))

function TopicPicker({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="stack" style={{ gap: 8 }}>
        {peerTopics.map((g) => (
          <div key={g.subject} className="row wrap" style={{ gap: 6 }}>
            <span className="subtle" style={{ width: 150 }}>{g.subject}</span>
            {g.topics.map((t) => (
              <button key={t} type="button" className="chip" style={{ minHeight: 30 }} aria-pressed={values.includes(t)} onClick={() => onChange(values.includes(t) ? values.filter((x) => x !== t) : [...values, t])}>
                {t}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function RequestForm({ peer, topic, direction, onDone, onCancel }: { peer: Peer; topic: string; direction: 'getting' | 'giving'; onDone: () => void; onCancel: () => void }) {
  const { state, update } = useApp()
  const toast = useToast()
  const shared = peer.slots.filter((s) => state.peer.slots.includes(s))
  const [slot, setSlot] = useState(shared[0] ?? '')
  const [note, setNote] = useState('')
  const [err, setErr] = useState<Record<string, string>>({})
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!slot) errs.slot = 'Pick a time you’re both free.'
    if (note.trim().length < 8) errs.note = 'Say briefly what you’d like to cover.'
    if (CONTACT.test(note)) errs.note = 'Please don’t share phone numbers, emails or social handles — sessions happen at school.'
    setErr(errs)
    if (Object.keys(errs).length) return
    update((s) => ({ ...s, peer: { ...s.peer, sessions: [{ id: uid('ps'), topic, peerId: peer.id, slot, direction, status: 'requested', note: note.trim(), createdAt: iso(TODAY) }, ...s.peer.sessions] } }))
    toast(`Request sent to ${peer.name} (demo). A teacher approves every session.`, 'info')
    onDone()
  }
  return (
    <form className="ph-request" onSubmit={submit} noValidate data-flip-id={`req-${peer.id}-${topic}`}>
      <div className="field">
        <span className="label">When</span>
        {shared.length ? (
          <div className="row wrap" style={{ gap: 6 }} role="radiogroup" aria-label="Session time">
            {shared.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={slot === s} className="chip" aria-pressed={slot === s} onClick={() => setSlot(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : (
          <p className="notice notice-warn">You don’t share a free slot yet. Add more availability above, or join a teacher-run group.</p>
        )}
        {slot && (
          <span className="hint row" style={{ gap: 4 }}>
            <MapPin size={12} aria-hidden /> {slotPlace[slot]}
          </span>
        )}
        {err.slot && <span className="error" role="alert">{err.slot}</span>}
      </div>
      <Field id={`note-${peer.id}`} label="What would you like to cover?" hint="Visible to your classmate and the supervising teacher." error={err.note}>
        <textarea id={`note-${peer.id}`} className="textarea" style={{ minHeight: 64 }} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={!!err.note} />
      </Field>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn btn-primary btn-sm" type="submit" disabled={!shared.length}>Send request</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function SessionCard({ s, staff }: { s: PeerSession; staff: boolean }) {
  const { update } = useApp()
  const toast = useToast()
  const p = peerById(s.peerId)
  const act = (patch: Partial<PeerSession>, msg: string) => {
    setSession(update, s.id, patch)
    toast(msg, 'info')
  }
  return (
    <li className="ph-session" data-status={s.status}>
      <div className="row between wrap" style={{ gap: 8 }}>
        <div>
          <strong>{s.topic}</strong>
          <div className="subtle">
            {s.direction === 'getting' ? `Help from ${p.name}` : `You’re helping ${p.name}`} · {p.section} · {s.slot}
          </div>
        </div>
        <span className={`badge ${statusTone[s.status]}`}>{s.resolved ? 'Resolved' : statusText[s.status]}</span>
      </div>
      <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 6 }}>“{s.note}”</p>
      {s.status === 'scheduled' && (
        <p className="subtle row" style={{ gap: 4, marginTop: 4 }}>
          <MapPin size={12} aria-hidden /> {slotPlace[s.slot]}
        </p>
      )}
      <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
        {!staff && s.status === 'invited' && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => act({ status: 'awaiting-teacher' }, 'Accepted. A teacher will confirm the session.')}>Accept</button>
            <button className="btn btn-sm btn-secondary" onClick={() => act({ status: 'declined' }, 'Invitation declined. No reason is shared.')}>Decline</button>
          </>
        )}
        {!staff && s.status === 'requested' && (
          <>
            <span className="prototype-tag">Prototype</span>
            <button className="btn btn-sm btn-secondary" onClick={() => act({ status: 'awaiting-teacher' }, `${p.name} accepted (simulated).`)}>Simulate classmate accepting</button>
            <button className="btn btn-sm btn-ghost" onClick={() => act({ status: 'declined' }, 'Request cancelled.')}>Cancel request</button>
          </>
        )}
        {!staff && s.status === 'awaiting-teacher' && (
          <>
            <span className="prototype-tag">Prototype</span>
            <button className="btn btn-sm btn-secondary" onClick={() => act({ status: 'scheduled' }, 'Teacher approval simulated. Session scheduled.')}>Simulate teacher approval</button>
          </>
        )}
        {!staff && s.status === 'scheduled' && <button className="btn btn-sm btn-primary" onClick={() => act({ status: 'completed' }, 'Marked as done. The supervising teacher will confirm.')}>We met — mark done</button>}
        {!staff && s.status === 'verified' && s.direction === 'getting' && !s.resolved && <button className="btn btn-sm btn-primary" onClick={() => act({ resolved: true }, 'Help request resolved. Nice teamwork!')}>My question is sorted</button>}
        {staff && s.status === 'awaiting-teacher' && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => act({ status: 'scheduled' }, 'Session approved (demo).')}>Approve session</button>
            <button className="btn btn-sm btn-secondary" onClick={() => act({ status: 'declined' }, 'Session declined (demo).')}>Decline</button>
          </>
        )}
        {staff && s.status === 'completed' && <button className="btn btn-sm btn-primary" onClick={() => act({ status: 'verified' }, 'Participation confirmed (demo).')}><ShieldCheck size={14} aria-hidden /> Confirm participation</button>}
        {!staff && (
          <Link className="link-btn" to={`/buddy?q=${encodeURIComponent(s.topic)}`}>
            Prepare with Study Buddy <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
    </li>
  )
}

export default function PeerHelp() {
  const { state, update } = useApp()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const staff = state.prefs.role === 'teacher' || state.prefs.role === 'admin'
  const focusTopic = params.get('topic') || ''
  const tab = (params.get('tab') as 'find' | 'sessions' | 'profile' | 'moderate') ?? (staff ? 'moderate' : 'find')
  const [openReq, setOpenReq] = useState<string | null>(null)
  const scope = useRef<HTMLDivElement>(null)
  const capture = useFlip(scope, openReq)
  const me = state.peer
  const needs = useMemo(() => (focusTopic && !me.needs.includes(focusTopic) ? [focusTopic, ...me.needs] : me.needs), [focusTopic, me.needs])

  useEffect(() => {
    if (focusTopic) document.getElementById(`topic-${focusTopic}`)?.scrollIntoView({ block: 'center' })
  }, [focusTopic])

  const recs = useMemo(
    () =>
      needs.map((topic) => ({
        topic,
        peers: peers
          .filter((p) => p.canHelp.includes(topic))
          .map((p) => ({ p, shared: p.slots.filter((s) => me.slots.includes(s)) }))
          .sort((a, b) => b.shared.length - a.shared.length || b.p.helped - a.p.helped),
        group: studyGroups.find((g) => g.topic === topic),
      })),
    [needs, me.slots],
  )
  const opportunities = peers.flatMap((p) => p.needs.filter((t) => me.offers.includes(t)).map((t) => ({ p, topic: t, shared: p.slots.filter((s) => me.slots.includes(s)) })))
  const sessions = me.sessions
  const toggleReq = (key: string | null) => {
    capture()
    setOpenReq(key)
  }

  return (
    <>
      <PageHeader
        eyebrow="Learning together"
        title="Peer Help Exchange"
        description="Find a classmate who understands a topic you’re stuck on — or help someone with what you know. Every session happens at school, during school hours, and is approved by a teacher."
        actions={<PrototypeTag>Fictional classmates</PrototypeTag>}
      />
      <Tabs
        idBase="ph"
        label="Peer help sections"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        tabs={
          staff
            ? [
                { id: 'moderate', label: 'Moderation', count: sessions.filter((s) => s.status === 'awaiting-teacher' || s.status === 'completed').length },
                { id: 'sessions', label: 'All sessions', count: sessions.length },
              ]
            : [
                { id: 'find', label: 'Find help' },
                { id: 'sessions', label: 'My sessions', count: sessions.filter((s) => !['declined', 'verified'].includes(s.status)).length },
                { id: 'profile', label: 'My topics & times' },
              ]
        }
      />
      <div id="ph-panel" role="tabpanel" ref={scope} style={{ marginTop: 'var(--s-5)' }}>
        {tab === 'find' && !staff && (
          <div className="ph-layout">
            <div className="stack">
              {recs.length === 0 && <Empty icon={<Users size={22} />} title="Tell us what you need help with" action={<button className="btn btn-primary" onClick={() => setParams({ tab: 'profile' })}>Choose topics</button>} />}
              {recs.map(({ topic, peers: list, group }) => (
                <section key={topic} id={`topic-${topic}`} className={`card ${topic === focusTopic ? 'ph-focus' : ''}`} aria-labelledby={`h-${topic}`}>
                  <div className="card-head">
                    <h2 id={`h-${topic}`} style={{ fontSize: 'var(--fs-md)' }}>
                      {topic}
                    </h2>
                    {topic === focusTopic && !me.needs.includes(topic) && (
                      <button className="btn btn-sm btn-secondary" onClick={() => update((s) => ({ ...s, peer: { ...s.peer, needs: [topic, ...s.peer.needs] } }))}>
                        Save to my needs
                      </button>
                    )}
                  </div>
                  {list.length === 0 ? (
                    <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No classmate has offered help with this yet. Try Study Buddy or the library.</p>
                  ) : (
                    <ul className="ph-peers">
                      {list.map(({ p, shared }) => {
                        const key = `${p.id}-${topic}`
                        const pending = sessions.some((s) => s.peerId === p.id && s.topic === topic && !['declined', 'verified'].includes(s.status))
                        return (
                          <li key={p.id} className={`ph-peer ${openReq === key ? 'is-open' : ''}`} data-flip-id={`peer-${key}`}>
                            <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                              <span className="ph-avatar" aria-hidden data-flip-id={`peer-av-${key}`}>{p.name[0]}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong>{p.name}</strong> <span className="subtle">· {p.section} · helped {p.helped} times</span>
                                <p className="subtle" style={{ color: 'var(--text-2)' }}>
                                  <Sparkles size={12} aria-hidden style={{ display: 'inline', verticalAlign: '-1px' }} /> Why: offers help with {topic}
                                  {shared.length ? ` · you’re both free ${shared.join(', ')}` : ' · no shared free slot yet'}
                                </p>
                              </div>
                              {pending ? (
                                <span className="badge badge-info">Requested</span>
                              ) : openReq === key ? (
                                <button className="icon-btn icon-btn-sm" onClick={() => toggleReq(null)} aria-label="Close request form">
                                  <X size={16} />
                                </button>
                              ) : (
                                <button className="btn btn-sm btn-primary" onClick={() => toggleReq(key)}>
                                  Request
                                </button>
                              )}
                            </div>
                            {openReq === key && <RequestForm peer={p} topic={topic} direction="getting" onDone={() => toggleReq(null)} onCancel={() => toggleReq(null)} />}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {group && (
                    <div className="ph-group">
                      <Users size={18} aria-hidden />
                      <div style={{ flex: 1 }}>
                        <strong>{group.name}</strong>
                        <div className="subtle">
                          {group.slot} · led by {group.mentor} · {group.joined + (me.groups.includes(group.id) ? 1 : 0)}/{group.seats} places
                        </div>
                      </div>
                      <button
                        className={`btn btn-sm ${me.groups.includes(group.id) ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => {
                          update((s) => ({ ...s, peer: { ...s.peer, groups: s.peer.groups.includes(group.id) ? s.peer.groups.filter((g) => g !== group.id) : [...s.peer.groups, group.id] } }))
                          toast(me.groups.includes(group.id) ? 'You left the group.' : `Joined ${group.name} (demo).`)
                        }}
                      >
                        {me.groups.includes(group.id) ? 'Leave' : 'Join group'}
                      </button>
                    </div>
                  )}
                  <div className="row wrap" style={{ gap: 12, marginTop: 10 }}>
                    <Link className="link-btn" to={`/buddy?q=${encodeURIComponent(topic)}`}>
                      <MessageCircleHeart size={14} aria-hidden /> Ask Study Buddy
                    </Link>
                    <Link className="link-btn" to={`/library?q=${encodeURIComponent(topic.split(' ')[0])}`}>
                      <BookOpen size={14} aria-hidden /> Library
                    </Link>
                  </div>
                </section>
              ))}
            </div>
            <aside className="stack">
              <section className="card" aria-labelledby="opp-h">
                <h2 id="opp-h" style={{ fontSize: 'var(--fs-md)' }}>
                  <HandHeart size={18} aria-hidden style={{ display: 'inline', verticalAlign: '-3px' }} /> You could help
                </h2>
                {opportunities.length === 0 ? (
                  <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 8 }}>Add topics you’re confident in to see who needs help.</p>
                ) : (
                  <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                    {opportunities.map(({ p, topic, shared }) => {
                      const key = `give-${p.id}-${topic}`
                      return (
                        <li key={key} className="list-row" style={{ flexWrap: 'wrap' }} data-flip-id={key}>
                          <div className="list-row-main">
                            <div className="list-row-title">{topic}</div>
                            <div className="list-row-meta">
                              {p.name} · {shared.length ? `free ${shared[0]}` : 'no shared slot'}
                            </div>
                          </div>
                          {openReq === key ? null : (
                            <button className="btn btn-sm btn-secondary" onClick={() => toggleReq(key)}>
                              Offer help
                            </button>
                          )}
                          {openReq === key && <RequestForm peer={p} topic={topic} direction="giving" onDone={() => toggleReq(null)} onCancel={() => toggleReq(null)} />}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
              <section className="card-flat">
                <h3 className="row" style={{ gap: 6 }}>
                  <ShieldCheck size={16} aria-hidden /> How we keep it safe
                </h3>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 'var(--fs-sm)', color: 'var(--text-2)', display: 'grid', gap: 4 }}>
                  <li>Sessions only happen in supervised school spaces.</li>
                  <li>No private chat — just a short note a teacher can see.</li>
                  <li>Never share phone numbers or social handles.</li>
                  <li>You can decline anything, no reason needed.</li>
                </ul>
              </section>
            </aside>
          </div>
        )}

        {(tab === 'sessions' || tab === 'moderate') && (
          <>
            {tab === 'moderate' && <p className="notice notice-info" style={{ marginBottom: 12 }}>Approve sessions before they happen and confirm participation afterwards. Session notes are visible here; there is no private messaging between students.</p>}
            {(() => {
              const list = tab === 'moderate' ? sessions.filter((s) => s.status === 'awaiting-teacher' || s.status === 'completed') : sessions
              return list.length === 0 ? (
                <Empty icon={<CalendarCheck size={22} />} title={tab === 'moderate' ? 'Nothing waiting for review' : 'No sessions yet'} action={!staff && <button className="btn btn-primary" onClick={() => setParams({ tab: 'find' })}>Find help</button>} />
              ) : (
                <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {list.map((s) => (
                    <SessionCard key={s.id} s={s} staff={staff} />
                  ))}
                </ul>
              )
            })()}
          </>
        )}

        {tab === 'profile' && !staff && (
          <div className="card stack">
            <TopicPicker label="I’d like help with" values={me.needs} onChange={(v) => update((s) => ({ ...s, peer: { ...s.peer, needs: v } }))} />
            <TopicPicker label="I can help others with" values={me.offers} onChange={(v) => update((s) => ({ ...s, peer: { ...s.peer, offers: v } }))} />
            <div className="field">
              <span className="label">When I’m free (school time only)</span>
              <div className="row wrap" style={{ gap: 6 }}>
                {peerSlots.map((s) => (
                  <button key={s} className="chip" aria-pressed={me.slots.includes(s)} onClick={() => update((st) => ({ ...st, peer: { ...st.peer, slots: st.peer.slots.includes(s) ? st.peer.slots.filter((x) => x !== s) : [...st.peer.slots, s] } }))}>
                    {me.slots.includes(s) && <Check size={14} aria-hidden />} {s}
                  </button>
                ))}
              </div>
            </div>
            <p className="subtle">Saved automatically. Only your first name, initial and section are shown to classmates. Topics: {allTopics.length} available.</p>
          </div>
        )}
      </div>
    </>
  )
}
