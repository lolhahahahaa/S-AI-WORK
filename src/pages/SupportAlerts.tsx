import { useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ClipboardList, Eye, HelpCircle, Info, Lock, ShieldAlert, UserCheck, XCircle } from 'lucide-react'
import { useApp, type PersistedState } from '../state/store'
import { alertRules, roster, type AlertStatus, type RosterStudent } from '../data/community'
import { useFlip } from '../lib/motion'
import { useMedia, MOBILE } from '../lib/useMedia'
import { Empty, Field, PageHeader, PrototypeTag } from '../components/ui'
import { useToast } from '../components/toast'

const PERIOD = '28 Sep – 25 Oct 2026 (compared with 31 Aug – 27 Sep)'
const mentors = ['Ms. Kavya Menon (class teacher)', 'Mr. Imran Qureshi', 'Ms. Ananya Rao', 'School counsellor (when configured)']
const statusLabel: Record<AlertStatus, string> = { new: 'New', reviewed: 'Reviewed', checkin: 'Check-in requested', mentor: 'Mentor assigned', followup: 'Follow-up recorded', resolved: 'Resolved', dismissed: 'Dismissed' }
const statusTone: Record<AlertStatus, string> = { new: 'badge-warn', reviewed: 'badge-info', checkin: 'badge-primary', mentor: 'badge-primary', followup: 'badge-info', resolved: 'badge-ok', dismissed: '' }

export function evaluate(s: RosterStudent) {
  const hits: { rule: (typeof alertRules)[number]; detail: string }[] = []
  const missing: string[] = []
  if (s.assignments) {
    if (s.assignments.missed >= 3) hits.push({ rule: alertRules[0], detail: `${s.assignments.missed} of ${s.assignments.set} assignments not handed in.` })
  } else missing.push('Assignment records')
  if (s.attendance) {
    const drop = s.attendance.before - s.attendance.recent
    if (drop >= 10) hits.push({ rule: alertRules[1], detail: `Attendance ${s.attendance.before}% → ${s.attendance.recent}% (down ${drop} points).` })
  } else missing.push('Attendance for the comparison period')
  if (s.quizzes && s.earlierQuizAvg !== null) {
    const avg = Math.round(s.quizzes.reduce((a, b) => a + b, 0) / s.quizzes.length)
    if (s.earlierQuizAvg - avg >= 12) hits.push({ rule: alertRules[2], detail: `Last 3 quizzes average ${avg}% vs ${s.earlierQuizAvg}% earlier this term (${s.quizzes.join(', ')}).` })
  } else missing.push('Quiz scores')
  return { hits, missing }
}

const flagged = roster.map((s) => ({ s, ...evaluate(s) })).filter((x) => x.hits.length > 0)

type Update = (fn: (s: PersistedState) => PersistedState) => void
function act(update: Update, id: string, status: AlertStatus, text: string, extra: Partial<PersistedState['alerts'][string]> = {}) {
  update((st) => {
    const cur = st.alerts[id] ?? { status: 'new' as AlertStatus, log: [] }
    return { ...st, alerts: { ...st.alerts, [id]: { ...cur, ...extra, status, log: [...cur.log, { at: '28 Oct', text }] } } }
  })
}

function Review({ item, onBack }: { item: (typeof flagged)[number]; onBack?: () => void }) {
  const { state, update } = useApp()
  const toast = useToast()
  const st = state.alerts[item.s.id] ?? { status: 'new' as AlertStatus, log: [] }
  const [mentor, setMentor] = useState(st.mentor ?? mentors[0])
  const [outcome, setOutcome] = useState('')
  const [dismissReason, setDismissReason] = useState('')
  const [err, setErr] = useState('')
  const closed = st.status === 'resolved' || st.status === 'dismissed'
  const doAct = (status: AlertStatus, text: string, extra = {}) => {
    act(update, item.s.id, status, text, extra)
    toast(`${statusLabel[status]} · ${item.s.name}`, 'info')
  }
  const record = (e: FormEvent) => {
    e.preventDefault()
    if (outcome.trim().length < 10) return setErr('Write a short, factual note (at least 10 characters).')
    setErr('')
    doAct('followup', `Follow-up: ${outcome.trim()}`, { outcome: outcome.trim() })
    setOutcome('')
  }
  return (
    <article className="card sa-review" data-flip-id={`alert-${item.s.id}`} aria-labelledby="sa-review-h">
      {onBack && (
        <button className="link-btn" onClick={onBack} style={{ marginBottom: 10 }}>
          <ArrowLeft size={16} aria-hidden /> All alerts
        </button>
      )}
      <div className="row between wrap" style={{ gap: 8 }}>
        <h2 id="sa-review-h" data-flip-id={`alert-name-${item.s.id}`}>{item.s.name}</h2>
        <span className={`badge ${statusTone[st.status]}`}>{statusLabel[st.status]}</span>
      </div>
      <p className="subtle">Grade 9B · fictional student · {PERIOD}</p>

      <h3 className="sa-h">What we observed</h3>
      <ul className="sa-hits">
        {item.hits.map((h) => (
          <li key={h.rule.id}>
            <strong>{h.rule.label}</strong>
            <span>{h.detail}</span>
            <span className="subtle">Rule: {h.rule.rule}</span>
          </li>
        ))}
      </ul>
      <h3 className="sa-h">Information we have and don’t have</h3>
      <p style={{ fontSize: 'var(--fs-sm)' }}>
        Available: {[item.s.assignments && 'assignments', item.s.attendance && 'attendance', item.s.quizzes && 'quiz scores'].filter(Boolean).join(', ')}.
        {item.missing.length > 0 && <> Missing: <strong>{item.missing.join(', ')}</strong>.</>} We don’t know about illness, family events, or anything outside these records.
      </p>
      <h3 className="sa-h">Why a check-in may help</h3>
      <p style={{ fontSize: 'var(--fs-sm)' }}>A short, friendly conversation can find out whether something practical (missed notes, timing, workload) is getting in the way — early, before it grows. This is not a judgement about the student.</p>
      <p className="notice notice-warn" style={{ marginTop: 10 }}>
        <HelpCircle size={16} aria-hidden /> Patterns can be incomplete or misleading. Nothing happens automatically — a teacher decides what, if anything, to do.
      </p>

      <h3 className="sa-h">Records</h3>
      <div className="table-wrap">
        <table className="data-table">
          <tbody>
            <tr><th scope="row">Assignments (4 weeks)</th><td className="n">{item.s.assignments ? `${item.s.assignments.set - item.s.assignments.missed}/${item.s.assignments.set} handed in` : 'Not available'}</td></tr>
            <tr><th scope="row">Attendance</th><td className="n">{item.s.attendance ? `${item.s.attendance.before}% → ${item.s.attendance.recent}%` : 'Not available'}</td></tr>
            <tr><th scope="row">Recent quizzes</th><td className="n">{item.s.quizzes ? item.s.quizzes.map((q) => `${q}%`).join(' · ') : 'Not recorded'}</td></tr>
            <tr><th scope="row">Earlier quiz average</th><td className="n">{item.s.earlierQuizAvg !== null ? `${item.s.earlierQuizAvg}%` : '—'}</td></tr>
          </tbody>
        </table>
      </div>

      {!closed && (
        <>
          <h3 className="sa-h">Actions</h3>
          <div className="row wrap" style={{ gap: 6 }}>
            {st.status === 'new' && <button className="btn btn-sm btn-secondary" onClick={() => doAct('reviewed', 'Reviewed the records')}><Eye size={14} aria-hidden /> Mark reviewed</button>}
            <button className="btn btn-sm btn-primary" onClick={() => doAct('checkin', 'Requested a supportive check-in with the class teacher')}>Request a supportive check-in</button>
          </div>
          <div className="row wrap" style={{ gap: 6, marginTop: 10, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 220px' }}>
              <label htmlFor="sa-mentor">Follow-up mentor</label>
              <select id="sa-mentor" className="select" value={mentor} onChange={(e) => setMentor(e.target.value)}>
                {mentors.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => doAct('mentor', `Assigned ${mentor}`, { mentor })}><UserCheck size={14} aria-hidden /> Assign</button>
          </div>
          <form onSubmit={record} className="stack" style={{ gap: 8, marginTop: 12 }} noValidate>
            <Field id="sa-outcome" label="Record a follow-up outcome" hint="Factual and kind. Don’t record health or family details here." error={err}>
              <textarea id="sa-outcome" className="textarea" style={{ minHeight: 70 }} value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-invalid={!!err} />
            </Field>
            <div className="row wrap" style={{ gap: 6 }}>
              <button className="btn btn-sm btn-secondary" type="submit">Save outcome</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => doAct('resolved', 'Resolved')}><CheckCircle2 size={14} aria-hidden /> Resolve</button>
            </div>
          </form>
          <details className="disclose" style={{ marginTop: 12 }}>
            <summary>Dismiss as not relevant</summary>
            <div className="row wrap" style={{ gap: 6 }}>
              <label htmlFor="sa-dismiss" className="sr-only">Reason</label>
              <select id="sa-dismiss" className="select" style={{ flex: '1 1 200px' }} value={dismissReason} onChange={(e) => setDismissReason(e.target.value)}>
                <option value="">Choose a reason…</option>
                <option>Known reason (e.g. approved leave)</option>
                <option>Records are wrong or incomplete</option>
                <option>Already being supported</option>
              </select>
              <button className="btn btn-sm btn-danger" disabled={!dismissReason} onClick={() => doAct('dismissed', `Dismissed: ${dismissReason}`)}><XCircle size={14} aria-hidden /> Dismiss</button>
            </div>
          </details>
        </>
      )}
      {closed && (
        <button className="btn btn-sm btn-secondary" style={{ marginTop: 12 }} onClick={() => doAct('reviewed', 'Reopened')}>
          Reopen
        </button>
      )}
      {st.log.length > 0 && (
        <>
          <h3 className="sa-h">History</h3>
          <ol className="sa-log">
            {st.log.map((l, i) => (
              <li key={i}>
                <span className="subtle">{l.at}</span> {l.text}
              </li>
            ))}
          </ol>
        </>
      )}
    </article>
  )
}

export default function SupportAlerts() {
  const { state } = useApp()
  const [params, setParams] = useSearchParams()
  const isMobile = useMedia(MOBILE)
  const allowed = state.prefs.role === 'teacher' || state.prefs.role === 'admin'
  const [filter, setFilter] = useState<'open' | 'closed'>('open')
  const scope = useRef<HTMLDivElement>(null)
  const sel = params.get('student')
  const capture = useFlip(scope, sel)
  if (!allowed)
    return (
      <Empty icon={<Lock size={22} />} title="This area is for teachers and mentors">
        Switch to the Teacher or Admin view in the account menu to preview it. (In this prototype, hiding a page isn’t real security — a real system would check permissions on the server.)
      </Empty>
    )
  const statusOf = (id: string) => state.alerts[id]?.status ?? 'new'
  const list = flagged.filter((f) => (filter === 'open' ? !['resolved', 'dismissed'].includes(statusOf(f.s.id)) : ['resolved', 'dismissed'].includes(statusOf(f.s.id))))
  const selected = flagged.find((f) => f.s.id === sel)
  const choose = (id: string | null) => {
    capture()
    setParams(id ? { student: id } : {})
  }
  return (
    <>
      <PageHeader
        eyebrow="Staff only · Grade 9B"
        title="Support alerts"
        description="Observable academic patterns that might be worth a friendly human check-in. Based on simple rules you can see — not a score, and never a diagnosis."
        actions={<PrototypeTag>Fictional students</PrototypeTag>}
      />
      <details className="card-flat disclose" style={{ marginBottom: 16 }}>
        <summary>
          <Info size={14} aria-hidden /> The rules ({alertRules.length}) and how alerts are used
        </summary>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 'var(--fs-sm)', display: 'grid', gap: 4 }}>
          {alertRules.map((r) => (
            <li key={r.id}>
              <strong>{r.label}:</strong> {r.rule}
            </li>
          ))}
          <li>Alerts are never shown to students, parents or classmates, and never trigger anything automatically.</li>
          <li>Students without alerts aren’t listed. Mood check-ins and Study Buddy chats are never used.</li>
        </ul>
      </details>
      <div ref={scope} className={`sa-layout ${selected ? 'has-selection' : ''}`}>
        {(!isMobile || !selected) && (
          <section aria-label="Alerts">
            <div className="row" style={{ gap: 6, marginBottom: 10 }} role="group" aria-label="Filter">
              <button className="chip" aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>Open</button>
              <button className="chip" aria-pressed={filter === 'closed'} onClick={() => setFilter('closed')}>Resolved & dismissed</button>
            </div>
            {list.length === 0 ? (
              <Empty icon={<ClipboardList size={22} />} title={filter === 'open' ? 'No open alerts' : 'Nothing closed yet'} />
            ) : (
              <ul className="sa-list">
                {list.map((f) => (
                  <li key={f.s.id}>
                    <button className="sa-row" aria-current={sel === f.s.id ? 'true' : undefined} onClick={() => choose(f.s.id)} data-flip-id={sel === f.s.id ? undefined : `alert-${f.s.id}`}>
                      <ShieldAlert size={18} aria-hidden />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block' }} data-flip-id={sel === f.s.id ? undefined : `alert-name-${f.s.id}`}>{f.s.name}</strong>
                        <span className="subtle">{f.hits.map((h) => h.rule.label).join(' · ')}</span>
                      </span>
                      <span className={`badge ${statusTone[statusOf(f.s.id)]}`}>{statusLabel[statusOf(f.s.id)]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="subtle" style={{ marginTop: 10 }}>{roster.length - flagged.length} of {roster.length} students have no alert.</p>
          </section>
        )}
        {selected ? (
          <Review key={selected.s.id} item={selected} onBack={isMobile ? () => choose(null) : undefined} />
        ) : (
          !isMobile && (
            <div className="card">
              <Empty icon={<ShieldAlert size={22} />} title="Select an alert to review">Each alert explains the pattern, the rule, and what information is missing.</Empty>
            </div>
          )
        )}
      </div>
    </>
  )
}
