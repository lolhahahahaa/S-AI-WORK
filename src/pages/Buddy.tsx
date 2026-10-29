import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, HeartHandshake, Lock, MessageCircleHeart, Phone, Send, Sparkles, Trash2, UserRound } from 'lucide-react'
import { useApp, uid } from '../state/store'
import { respond, type BuddyReply } from '../lib/buddy'
import { Drawer } from '../components/overlay'
import { Segmented } from '../components/ui'
import { useMedia, MOBILE } from '../lib/useMedia'
import { useReducedMotion } from '../lib/motion'

const prompts = {
  study: ['Make me a revision plan', 'Explain polynomials', 'I have too much homework', 'Help me focus'],
  wellbeing: ['I feel stressed about exams', 'Help me breathe', 'I feel lonely', 'I want to talk to someone'],
}

function SupportPanel({ urgent }: { urgent: boolean }) {
  const { state } = useApp()
  const c = state.prefs.counsellor
  const configured = c.name.trim().length > 0
  return (
    <div className="stack" style={{ gap: 12 }}>
      {urgent && (
        <div className="notice notice-danger" role="alert">
          <AlertTriangle size={18} aria-hidden />
          <div>
            <strong>Please reach out to a real person now.</strong> If you’re in immediate danger, call <a href="tel:112">112</a>.
          </div>
        </div>
      )}
      <section className="card" style={{ boxShadow: 'none' }} aria-labelledby="real-h">
        <h3 id="real-h" className="row" style={{ gap: 8 }}>
          <HeartHandshake size={18} aria-hidden /> Talk to a real person
        </h3>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 6 }}>
          Study Buddy can’t replace someone who knows you. A trusted adult — a parent, your class teacher or the school counsellor — can really help.
        </p>
        <div className="card-flat" style={{ marginTop: 12 }}>
          <div className="row between" style={{ gap: 8 }}>
            <strong>School counsellor</strong>
            {!configured && <span className="prototype-tag">Placeholder</span>}
          </div>
          {configured ? (
            <ul style={{ margin: '6px 0 0', padding: '0 0 0 18px', fontSize: 'var(--fs-sm)' }}>
              <li>{c.name}</li>
              {c.room && <li>Where: {c.room}</li>}
              {c.hours && <li>When: {c.hours}</li>}
              {c.howToReach && <li>How: {c.howToReach}</li>}
            </ul>
          ) : (
            <p style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }} className="muted">
              Your school hasn’t added counsellor details to this prototype yet. Ask your class teacher how to reach the counsellor.
            </p>
          )}
        </div>
        <div className="card-flat" style={{ marginTop: 8 }}>
          <strong>Class teacher</strong>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>
            Ms. Kavya Menon (sample) — you can ask to talk after class.
          </p>
        </div>
      </section>
      <section className="card" style={{ boxShadow: 'none' }} aria-labelledby="ext-h">
        <h3 id="ext-h" className="row" style={{ gap: 8 }}>
          <Phone size={18} aria-hidden /> Helplines (India)
        </h3>
        <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
          <li className="list-row">
            <div className="list-row-main">
              <div className="list-row-title">Tele-MANAS</div>
              <div className="list-row-meta">Free, 24/7 mental-health support from the Ministry of Health & Family Welfare</div>
            </div>
            <a className="btn btn-sm btn-secondary" href="tel:14416">
              14416
            </a>
          </li>
          <li className="list-row">
            <div className="list-row-main">
              <div className="list-row-title">Emergency</div>
              <div className="list-row-meta">If you or someone else is in danger right now</div>
            </div>
            <a className="btn btn-sm btn-danger" href="tel:112">
              112
            </a>
          </li>
        </ul>
        <p className="subtle" style={{ marginTop: 6 }}>Tele-MANAS also answers on 1-800-891-4416.</p>
      </section>
      <section className="card-flat" aria-labelledby="priv-h">
        <h4 id="priv-h" className="row" style={{ gap: 6 }}>
          <Lock size={14} aria-hidden /> Your privacy here
        </h4>
        <ul style={{ margin: '6px 0 0', padding: '0 0 0 18px', fontSize: 'var(--fs-sm)', color: 'var(--text-2)', display: 'grid', gap: 4 }}>
          <li>This chat stays in this browser tab and is cleared when you refresh or close it.</li>
          <li>It isn’t sent to a server, a teacher or a parent in this prototype.</li>
          <li>In a real school system, ask your school who can see what. If someone might be in danger, adults may need to act to keep you safe.</li>
        </ul>
      </section>
    </div>
  )
}

export default function Buddy() {
  const { session, setSession, state } = useApp()
  const [params, setParams] = useSearchParams()
  const isMobile = useMedia(MOBILE)
  const reduced = useReducedMotion()
  const [input, setInput] = useState(() => (params.get('q') ? `Explain ${params.get('q')}` : ''))
  const [typing, setTyping] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mode = (params.get('mode') as 'study' | 'wellbeing') ?? session.buddyMode
  const urgent = session.chat.some((m) => m.tone === 'urgent')

  useEffect(() => {
    if (params.get('mode') && params.get('mode') !== session.buddyMode) setSession((s) => ({ ...s, buddyMode: params.get('mode') as 'study' | 'wellbeing' }))
  }, [params, session.buddyMode, setSession])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [session.chat.length, typing, reduced])

  const setMode = (m: 'study' | 'wellbeing') => {
    setSession((s) => ({ ...s, buddyMode: m }))
    setParams(m === 'wellbeing' ? { mode: m } : {}, { replace: true })
  }

  const send = (text: string) => {
    const t = text.trim()
    if (!t || typing) return
    setSession((s) => ({ ...s, chat: [...s.chat, { id: uid('m'), from: 'me', text: t, at: '' }] }))
    setInput('')
    const reply: BuddyReply = respond(t, { mode, assignments: state.assignments })
    const deliver = () => {
      setSession((s) => ({ ...s, chat: [...s.chat, { id: uid('m'), from: 'bot', text: reply.text + (reply.link ? `\n[[${reply.link.label}|${reply.link.to}]]` : ''), tone: reply.tone, at: '' }] }))
      setTyping(false)
      if (reply.tone === 'urgent' && isMobile) setSupportOpen(true)
    }
    // Urgent replies are never delayed.
    if (reply.tone === 'urgent' || reduced) deliver()
    else {
      setTyping(true)
      setTimeout(deliver, 650)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
    inputRef.current?.focus()
  }

  const welcome =
    mode === 'wellbeing'
      ? 'Hi Aarav. This is a calm space. You can tell me how you’re feeling, try a breathing exercise, or find someone to talk to. There’s no right or wrong thing to say.'
      : 'Hi Aarav! I can help with revision plans, quick topic summaries, organising homework and staying focused. What are you working on?'

  return (
    <div className="buddy" data-mode={mode}>
      <header className="buddy-head" data-reveal>
        <div className="row" style={{ gap: 12, minWidth: 0 }}>
          <span className="stat-icon" style={{ width: 44, height: 44, borderRadius: 14, background: mode === 'wellbeing' ? 'var(--sage)' : 'var(--sky)' }} aria-hidden>
            <MessageCircleHeart size={22} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'var(--fs-xl)' }}>Study Buddy</h1>
            <p className="subtle row" style={{ gap: 6 }}>
              <Sparkles size={13} aria-hidden /> Demo responses — not a live AI and not a counsellor
            </p>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <Segmented
            label="Conversation mode"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'study', label: 'Study help' },
              { id: 'wellbeing', label: 'Wellbeing' },
            ]}
          />
          {isMobile && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSupportOpen(true)}>
              <UserRound size={14} aria-hidden /> Real person
            </button>
          )}
        </div>
      </header>

      <div className="buddy-layout">
        <section className="buddy-chat card" aria-label="Conversation">
          <div ref={listRef} className="buddy-messages" role="log" aria-live="polite" aria-relevant="additions">
            <div className="notice notice-neutral" style={{ alignSelf: 'stretch' }}>
              <HeartHandshake size={16} aria-hidden />
              <span>
                Study Buddy uses pre-written replies in this prototype. It isn’t a replacement for a school counsellor or qualified professional.{' '}
                {!isMobile && 'For real support, see “Talk to a real person”.'}
              </span>
            </div>
            <div className={`bubble bubble-bot ${mode === 'wellbeing' ? 'bubble-care' : ''}`}>{welcome}</div>
            {session.chat.map((m) => {
              const [body, linkPart] = m.text.split('\n[[')
              const link = linkPart?.replace(']]', '').split('|')
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 4 }}>
                  <div className={`bubble ${m.from === 'me' ? 'bubble-me' : `bubble-bot ${m.tone === 'care' || mode === 'wellbeing' ? 'bubble-care' : ''}`}`} style={m.tone === 'urgent' ? { background: 'var(--danger-soft)', borderColor: 'transparent' } : undefined}>
                    {body}
                    {link && (
                      <div style={{ marginTop: 8 }}>
                        <Link to={link[1]} className="btn btn-sm btn-secondary">
                          {link[0]}
                        </Link>
                      </div>
                    )}
                  </div>
                  <span className="bubble-meta">
                    {m.from === 'me' ? 'You' : 'Study Buddy · demo response'}
                  </span>
                </div>
              )
            })}
            {typing && (
              <div className="bubble bubble-bot typing" aria-label="Study Buddy is typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <div className="buddy-composer">
            <div className="buddy-prompts" role="group" aria-label="Suggested messages">
              {prompts[mode].map((p) => (
                <button key={p} className="chip" style={{ minHeight: 32, flex: 'none' }} onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
              <label htmlFor="buddy-input" className="sr-only">
                Message Study Buddy
              </label>
              <textarea
                id="buddy-input"
                ref={inputRef}
                className="textarea"
                rows={1}
                style={{ minHeight: 44, maxHeight: 140, borderRadius: 22, padding: '11px 16px', resize: 'none', overflow: 'hidden' }}
                placeholder={mode === 'wellbeing' ? 'How are you feeling?' : 'Ask about a topic or a plan…'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
              />
              <button type="submit" className="icon-btn" style={{ background: 'var(--primary)', color: 'var(--primary-ink)', width: 44, height: 44 }} aria-label="Send message" disabled={!input.trim() || typing}>
                <Send size={18} />
              </button>
            </form>
            <div className="row between" style={{ marginTop: 6 }}>
              <span className="subtle row" style={{ gap: 4 }}>
                <Lock size={12} aria-hidden /> Not saved · clears on refresh
              </span>
              {session.chat.length > 0 && (
                <button className="link-btn" style={{ color: 'var(--text-2)', fontWeight: 600 }} onClick={() => setSession((s) => ({ ...s, chat: [] }))}>
                  <Trash2 size={13} aria-hidden /> Clear chat
                </button>
              )}
            </div>
          </div>
        </section>
        {!isMobile && (
          <aside className="buddy-side" aria-label="Support">
            <SupportPanel urgent={urgent} />
          </aside>
        )}
      </div>
      {isMobile && (
        <Drawer open={supportOpen} onClose={() => setSupportOpen(false)} title="Get support">
          <SupportPanel urgent={urgent} />
        </Drawer>
      )}
      {isMobile && urgent && !supportOpen && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={() => setSupportOpen(true)}>
          <AlertTriangle size={16} aria-hidden /> See who you can talk to now
        </button>
      )}
    </div>
  )
}

