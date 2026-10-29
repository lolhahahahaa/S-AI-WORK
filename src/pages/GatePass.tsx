import { useState, type FormEvent } from 'react'
import { CheckCircle2, Circle, Clock, DoorOpen, FlaskConical, Plus, XCircle, Ban } from 'lucide-react'
import { useApp, type GatePass as Pass } from '../state/store'
import { TODAY, daysUntil, fmtDay, fmtLong, fmtTime, iso, parse } from '../lib/date'
import { Empty, Field, PageHeader } from '../components/ui'
import { Modal } from '../components/overlay'
import { useToast } from '../components/toast'
import { useGatePassDecision } from './RoleHomes'

const reasons = ['Medical appointment', 'Feeling unwell', 'Family event', 'Sports or competition', 'Other']

export function passStatus(g: Pass) {
  if (g.cancelled) return { label: 'Cancelled', tone: '', done: true }
  if (g.parent === 'declined') return { label: 'Declined by parent', tone: 'badge-danger', done: true }
  if (g.school === 'declined') return { label: 'Declined by school', tone: 'badge-danger', done: true }
  if (g.parent === 'waiting') return { label: 'Waiting for parent', tone: 'badge-warn', done: false }
  if (g.school === 'waiting') return { label: 'Waiting for school', tone: 'badge-warn', done: false }
  if (daysUntil(g.date) < 0) return { label: 'Used', tone: 'badge-ok', done: true }
  return { label: 'Approved', tone: 'badge-ok', done: false }
}

/** Deterministic QR-style pattern from the pass ID. Purely visual. */
function QrPattern({ seed }: { seed: string }) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const n = 21
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    cells.push((h >>> 0) % 3 === 0)
  }
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const dx = x - fx
      const dy = y - fy
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0
    }
    return -1
  }
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} width={160} height={160} role="img" aria-label="Prototype QR-style pattern, not scannable" style={{ background: '#fff', borderRadius: 12 }}>
      {Array.from({ length: n * n }, (_, i) => {
        const x = i % n
        const y = Math.floor(i / n)
        const f = finder(x, y)
        const on = f === -1 ? cells[i] : f === 1
        return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#1b2420" /> : null
      })}
    </svg>
  )
}

function Stepper({ g }: { g: Pass }) {
  const steps = [
    { label: 'Requested', state: 'done', note: fmtDay(parse(g.createdAt)) },
    { label: 'Parent', state: g.parent === 'approved' ? 'done' : g.parent === 'declined' ? 'declined' : g.cancelled ? 'idle' : 'current', note: g.parent === 'waiting' ? 'Waiting' : g.parent === 'approved' ? 'Approved' : 'Declined' },
    { label: 'School', state: g.school === 'approved' ? 'done' : g.school === 'declined' ? 'declined' : g.parent === 'approved' && !g.cancelled ? 'current' : 'idle', note: g.school === 'waiting' ? (g.parent === 'approved' ? 'Waiting' : 'After parent') : g.school === 'approved' ? 'Approved' : 'Declined' },
    { label: 'Pass ready', state: g.parent === 'approved' && g.school === 'approved' && !g.cancelled ? 'done' : 'idle', note: '' },
  ]
  return (
    <ol className="stepper" aria-label="Approval progress">
      {steps.map((s) => (
        <li key={s.label} data-state={s.state}>
          <span className="stepper-icon" aria-hidden>
            {s.state === 'done' ? <CheckCircle2 size={20} /> : s.state === 'declined' ? <XCircle size={20} /> : s.state === 'current' ? <Clock size={20} /> : <Circle size={20} />}
          </span>
          <span>
            <strong style={{ display: 'block' }}>{s.label}</strong>
            <span className="subtle">
              {s.note}
              <span className="sr-only"> ({s.state === 'done' ? 'complete' : s.state === 'current' ? 'in progress' : s.state === 'declined' ? 'declined' : 'not started'})</span>
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

function ActivePass({ g }: { g: Pass }) {
  const { state, update } = useApp()
  const toast = useToast()
  const decide = useGatePassDecision()
  const st = passStatus(g)
  const role = state.prefs.role
  const approved = g.parent === 'approved' && g.school === 'approved' && !g.cancelled
  return (
    <section className="card gp-active" data-reveal aria-labelledby="gp-act">
      <div className="card-head" style={{ flexWrap: 'wrap' }}>
        <div>
          <h2 id="gp-act" style={{ fontSize: 'var(--fs-md)' }}>
            {g.reason} · {g.id}
          </h2>
          <p className="subtle">
            {fmtLong(parse(g.date))} · leaving {fmtTime(g.time)} · pickup: {g.pickup}
          </p>
        </div>
        <span className={`badge ${st.tone}`}>{st.label}</span>
      </div>
      <Stepper g={g} />
      {approved ? (
        <div className="gp-pass">
          <QrPattern seed={g.id} />
          <div>
            <h3>Gate pass approved</h3>
            <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>
              Show this at the gate on {fmtDay(parse(g.date))} from {fmtTime(g.time)}.
            </p>
            <p className="notice notice-warn" style={{ marginTop: 10 }}>
              <FlaskConical size={16} aria-hidden /> Prototype only — this pattern isn’t a real QR code and isn’t connected to any school security system.
            </p>
          </div>
        </div>
      ) : (
        !st.done && (
          <div className="gp-sim">
            {role === 'student' && (
              <>
                <p className="subtle" style={{ marginBottom: 8 }}>
                  <strong>Prototype:</strong> no one has been notified. Use these buttons to preview what happens next, or switch to the Parent / Admin view in the account menu.
                </p>
                <div className="row wrap" style={{ gap: 6 }}>
                  {g.parent === 'waiting' && (
                    <button className="btn btn-sm btn-secondary" onClick={() => decide(g.id, 'parent', 'approved')}>
                      Simulate parent approval
                    </button>
                  )}
                  {g.parent === 'approved' && g.school === 'waiting' && (
                    <button className="btn btn-sm btn-secondary" onClick={() => decide(g.id, 'school', 'approved')}>
                      Simulate school approval
                    </button>
                  )}
                  <button className="btn btn-sm btn-ghost" onClick={() => decide(g.id, g.parent === 'waiting' ? 'parent' : 'school', 'declined')}>
                    Simulate a decline
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      update((s) => ({ ...s, gatePasses: s.gatePasses.map((x) => (x.id === g.id ? { ...x, cancelled: true } : x)) }))
                      toast('Request cancelled.')
                    }}
                  >
                    <Ban size={14} aria-hidden /> Cancel request
                  </button>
                </div>
              </>
            )}
            {role === 'parent' && g.parent === 'waiting' && (
              <div className="row wrap" style={{ gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => decide(g.id, 'parent', 'approved')}>Approve as parent (demo)</button>
                <button className="btn btn-secondary btn-sm" onClick={() => decide(g.id, 'parent', 'declined')}>Decline</button>
              </div>
            )}
            {role === 'admin' && g.parent === 'approved' && g.school === 'waiting' && (
              <div className="row wrap" style={{ gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => decide(g.id, 'school', 'approved')}>Approve for school (demo)</button>
                <button className="btn btn-secondary btn-sm" onClick={() => decide(g.id, 'school', 'declined')}>Decline</button>
              </div>
            )}
          </div>
        )
      )}
    </section>
  )
}

function RequestForm({ onDone }: { onDone: () => void }) {
  const { update } = useApp()
  const toast = useToast()
  const [f, setF] = useState({ reason: '', details: '', date: iso(TODAY), time: '12:20', returning: 'No', pickup: 'Parent' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!f.reason) errs.reason = 'Choose a reason.'
    if (f.details.trim().length < 10) errs.details = 'Add a few more details (at least 10 characters).'
    if (!f.date || f.date < iso(TODAY)) errs.date = 'Pick today or a later date.'
    else if ([0, 6].includes(parse(f.date).getDay())) errs.date = 'There are no classes at the weekend.'
    if (!f.time || f.time < '08:00' || f.time > '14:20') errs.time = 'Choose a time during school hours (8:00 am – 2:20 pm).'
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`gp-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const id = `GP-${String(Math.floor(1000 + Math.random() * 9000))}`
    update((s) => ({ ...s, gatePasses: [{ id, ...f, details: f.details.trim(), createdAt: iso(TODAY), parent: 'waiting', school: 'waiting' }, ...s.gatePasses] }))
    toast('Request saved on this device. In this prototype, no parent or teacher is notified.', 'info')
    onDone()
  }
  const err = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `gp-${k}-err` : undefined })
  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field id="gp-reason" label="Reason for leaving" error={errors.reason} className="full">
          <select id="gp-reason" className="select" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} {...err('reason')} data-autofocus>
            <option value="">Choose…</option>
            {reasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field id="gp-details" label="Details" hint="Where you’re going and anything the gate should know." error={errors.details} className="full">
          <textarea id="gp-details" className="textarea" value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} {...err('details')} />
        </Field>
        <Field id="gp-date" label="Date" error={errors.date}>
          <input id="gp-date" type="date" className="input" min={iso(TODAY)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} {...err('date')} />
        </Field>
        <Field id="gp-time" label="Departure time" error={errors.time}>
          <input id="gp-time" type="time" className="input" min="08:00" max="14:20" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} {...err('time')} />
        </Field>
        <Field id="gp-pickup" label="Who will pick you up?">
          <select id="gp-pickup" className="select" value={f.pickup} onChange={(e) => setF({ ...f, pickup: e.target.value })}>
            <option>Parent</option>
            <option>Guardian</option>
            <option>School-approved driver</option>
          </select>
        </Field>
        <Field id="gp-ret" label="Returning to school today?">
          <select id="gp-ret" className="select" value={f.returning} onChange={(e) => setF({ ...f, returning: e.target.value })}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </Field>
      </div>
      <p className="notice notice-info" style={{ marginTop: 16 }}>
        A real request would need approval from your parent and then the school. Here, you can preview those steps yourself.
      </p>
      <div className="modal-foot">
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Submit request
        </button>
      </div>
    </form>
  )
}

export default function GatePass() {
  const { state } = useApp()
  const [open, setOpen] = useState(false)
  const passes = state.gatePasses
  const active = passes.filter((g) => !passStatus(g).done)
  const history = passes.filter((g) => passStatus(g).done)
  return (
    <>
      <PageHeader
        title="Gate Pass"
        description="Need to leave school early? Request a pass, follow its approval, and show it at the gate."
        actions={
          state.prefs.role === 'student' && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} aria-hidden /> New request
            </button>
          )
        }
      />
      <ol className="gp-how" data-reveal aria-label="How it works">
        <li>
          <strong>1. Request</strong> <span className="subtle">You fill in the reason and time.</span>
        </li>
        <li>
          <strong>2. Parent approves</strong> <span className="subtle">Your parent confirms the pickup.</span>
        </li>
        <li>
          <strong>3. School approves</strong> <span className="subtle">The office checks and approves.</span>
        </li>
        <li>
          <strong>4. Show your pass</strong> <span className="subtle">At the gate on the day.</span>
        </li>
      </ol>
      <div className="stack section">
        {active.length === 0 ? (
          <div className="card">
            <Empty icon={<DoorOpen size={22} />} title="No active requests" action={state.prefs.role === 'student' && <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} aria-hidden /> New request</button>}>
              When you request a gate pass, its approval status will show here.
            </Empty>
          </div>
        ) : (
          active.map((g) => <ActivePass key={g.id} g={g} />)
        )}
      </div>
      <section className="section" data-reveal aria-labelledby="gp-hist">
        <h2 id="gp-hist" style={{ fontSize: 'var(--fs-md)', marginBottom: 12 }}>
          History
        </h2>
        {history.length === 0 ? (
          <p className="muted">No past requests.</p>
        ) : (
          <ul className="list card" style={{ listStyle: 'none', margin: 0, padding: '4px 16px' }}>
            {history.map((g) => {
              const st = passStatus(g)
              return (
                <li key={g.id} className="list-row">
                  <DoorOpen size={18} aria-hidden />
                  <div className="list-row-main">
                    <div className="list-row-title">
                      {g.reason} <span className="subtle">· {g.id}</span>
                    </div>
                    <div className="list-row-meta">
                      {fmtDay(parse(g.date))} · {fmtTime(g.time)} · {g.details}
                    </div>
                  </div>
                  <span className={`badge ${st.tone}`}>{st.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="New gate pass request">
        <RequestForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  )
}
