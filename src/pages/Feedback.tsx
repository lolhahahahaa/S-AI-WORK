import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, MessageSquareText, Quote } from 'lucide-react'
import { useApp, uid, type FeedbackEntry } from '../state/store'
import { subjects, student } from '../data/school'
import { events } from '../data/campus'
import { TODAY, daysUntil, fmtDay, iso, parse } from '../lib/date'
import { Empty, Field, PageHeader, PrototypeTag, Stars, Switch, Tabs } from '../components/ui'
import { useToast } from '../components/toast'

type FType = FeedbackEntry['type']
const typeLabels: Record<FType, string> = { class: 'A class', event: 'A school event', canteen: 'Canteen food', portal: 'This portal' }

const targetsFor = (t: FType) =>
  t === 'class'
    ? subjects.map((s) => s.name)
    : t === 'event'
      ? events.filter((e) => daysUntil(e.date) < 0).map((e) => e.title)
      : t === 'canteen'
        ? ['Breakfast', 'Short-break snack', 'Lunch', 'Canteen service']
        : ['Home page', 'Attendance', 'Tasks', 'Study Library', 'Study Buddy', 'Something else']

const sampleTeacherFeedback = [
  { from: 'Ms. Kavya Menon', subject: 'Science', date: '2026-10-20', strength: 'Your lab record on separation methods was clear and well labelled — the chromatography diagram was excellent.', next: 'In written answers, add one line explaining *why* a method works, not just the steps.' },
  { from: 'Mr. Imran Qureshi', subject: 'Social Science', date: '2026-10-12', strength: 'You made a thoughtful point in the democracy debate and listened well to others.', next: 'Practise map work a little each week — try labelling three features from memory before checking.' },
  { from: 'Ms. Ananya Rao', subject: 'English', date: '2026-10-05', strength: 'Your reading log questions show real curiosity about the author’s choices.', next: 'Plan essays for two minutes first; it will make your paragraphs flow better.' },
]

function GiveFeedback() {
  const { state, update } = useApp()
  const toast = useToast()
  const [params] = useSearchParams()
  const [type, setType] = useState<FType>((params.get('type') as FType) ?? 'class')
  const [target, setTarget] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [justSent, setJustSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!target) errs.target = 'Choose what your feedback is about.'
    if (!rating) errs.rating = 'Choose a star rating.'
    if (comment.length > 500) errs.comment = 'Keep it under 500 characters.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    update((s) => ({ ...s, feedback: [{ id: uid('fb'), type, target, rating, comment: comment.trim(), anonymous, createdAt: iso(TODAY) }, ...s.feedback] }))
    setTarget('')
    setRating(0)
    setComment('')
    setJustSent(true)
    toast('Feedback saved on this device. Thank you!')
  }
  return (
    <div className="feedback-layout">
      <form className="card" onSubmit={submit} noValidate aria-labelledby="fb-h">
        <h2 id="fb-h" style={{ fontSize: 'var(--fs-md)' }}>
          What would you like to give feedback on?
        </h2>
        <div className="row wrap" style={{ gap: 6, margin: '12px 0 16px' }} role="radiogroup" aria-label="Feedback type">
          {(Object.keys(typeLabels) as FType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              className="chip"
              aria-pressed={type === t}
              onClick={() => {
                setType(t)
                setTarget('')
                setJustSent(false)
              }}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
        <div className="stack">
          <Field id="fb-target" label={type === 'class' ? 'Which class?' : type === 'event' ? 'Which event?' : type === 'canteen' ? 'Which meal?' : 'Which part?'} error={errors.target}>
            <select id="fb-target" className="select" value={target} onChange={(e) => setTarget(e.target.value)} aria-invalid={!!errors.target}>
              <option value="">Choose…</option>
              {targetsFor(type).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <div className="field">
            <span className="label" id="fb-rating-l">
              Rating
            </span>
            <Stars value={rating} onChange={setRating} label="Rating" />
            {errors.rating && (
              <span className="error" role="alert">
                {errors.rating}
              </span>
            )}
          </div>
          <Field id="fb-comment" label="Comment (optional)" hint={`${comment.length}/500 · Be specific and kind — what worked, what could be better?`} error={errors.comment}>
            <textarea id="fb-comment" className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} aria-invalid={!!errors.comment} />
          </Field>
          {(type === 'class' || type === 'event') && (
            <div className="setting-row" style={{ borderTop: 0, padding: 0 }}>
              <div>
                <strong style={{ fontSize: 'var(--fs-sm)' }}>Send anonymously</strong>
                <p>Your name won’t be attached.</p>
              </div>
              <Switch checked={anonymous} onChange={setAnonymous} label="Send anonymously" />
            </div>
          )}
          {justSent && (
            <p className="notice notice-ok" role="status">
              <CheckCircle2 size={16} aria-hidden /> Saved. In this prototype, feedback stays on your device and isn’t sent to the school.
            </p>
          )}
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Submit feedback
          </button>
        </div>
      </form>
      <section className="card" aria-labelledby="fb-mine">
        <h2 id="fb-mine" style={{ fontSize: 'var(--fs-md)' }}>
          Your feedback
        </h2>
        {state.feedback.length === 0 ? (
          <Empty icon={<MessageSquareText size={22} />} title="Nothing yet">
            Feedback you give will be listed here.
          </Empty>
        ) : (
          <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
            {state.feedback.map((f) => (
              <li key={f.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <div className="list-row-main">
                  <div className="row between wrap" style={{ gap: 6 }}>
                    <span className="list-row-title">{f.target}</span>
                    <Stars value={f.rating} label="Your rating" />
                  </div>
                  {f.comment && <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{f.comment}</p>}
                  <div className="list-row-meta">
                    <span>{typeLabels[f.type]}</span>
                    <span>{fmtDay(parse(f.createdAt))}</span>
                    {f.anonymous && (f.type === 'class' || f.type === 'event') && <span>Anonymous</span>}
                    <span className="badge">Saved on device</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function FromTeachers() {
  const { state } = useApp()
  const local = state.teacherNotes.filter((n) => n.student === student.name)
  return (
    <div className="stack">
      <div className="row between wrap">
        <p className="muted">Notes from your teachers: one thing that went well and one next step.</p>
        <PrototypeTag>Sample feedback</PrototypeTag>
      </div>
      <div className="grid grid-3">
        {[...local.map((n) => ({ from: 'Teacher (demo view)', subject: n.subject, date: n.createdAt, strength: n.strength, next: n.next })), ...sampleTeacherFeedback].map((f, i) => (
          <article key={i} className="card" data-reveal>
            <Quote size={20} style={{ color: 'var(--primary-text)' }} aria-hidden />
            <p className="subtle" style={{ marginTop: 6 }}>
              {f.subject} · {f.from} · {fmtDay(parse(f.date))}
            </p>
            <h4 style={{ marginTop: 10 }}>What went well</h4>
            <p style={{ fontSize: 'var(--fs-sm)' }}>{f.strength.replaceAll('*', '')}</p>
            <h4 style={{ marginTop: 10 }}>Next step</h4>
            <p style={{ fontSize: 'var(--fs-sm)' }}>{f.next.replaceAll('*', '')}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function TeacherWrite() {
  const { state, update } = useApp()
  const toast = useToast()
  const [f, setF] = useState({ student: student.name, subject: 'Science', strength: '', next: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (f.strength.trim().length < 10) errs.strength = 'Describe one specific strength.'
    if (f.next.trim().length < 10) errs.next = 'Suggest one clear, achievable next step.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    update((s) => ({ ...s, teacherNotes: [{ id: uid('tn'), ...f, createdAt: iso(TODAY) }, ...s.teacherNotes] }))
    setF({ ...f, strength: '', next: '' })
    toast('Feedback saved on this device (demo). It now appears in the student’s “From teachers” tab.')
  }
  return (
    <div className="feedback-layout">
      <form className="card" onSubmit={submit} noValidate>
        <h2 style={{ fontSize: 'var(--fs-md)' }}>Write feedback for a student</h2>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>
          Keep it specific, kind and actionable. Avoid comparing students or commenting on personal circumstances.
        </p>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <Field id="tw-student" label="Student">
            <select id="tw-student" className="select" value={f.student} onChange={(e) => setF({ ...f, student: e.target.value })}>
              <option>{student.name}</option>
            </select>
          </Field>
          <Field id="tw-subject" label="Subject">
            <select id="tw-subject" className="select" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
              {subjects.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field id="tw-strength" label="What went well" error={errors.strength} className="full">
            <textarea id="tw-strength" className="textarea" value={f.strength} onChange={(e) => setF({ ...f, strength: e.target.value })} aria-invalid={!!errors.strength} />
          </Field>
          <Field id="tw-next" label="Next step" error={errors.next} className="full">
            <textarea id="tw-next" className="textarea" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} aria-invalid={!!errors.next} />
          </Field>
        </div>
        <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>
          Save feedback
        </button>
      </form>
      <section className="card">
        <h2 style={{ fontSize: 'var(--fs-md)' }}>Written in this demo</h2>
        {state.teacherNotes.length === 0 ? (
          <Empty icon={<MessageSquareText size={22} />} title="None yet" />
        ) : (
          <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
            {state.teacherNotes.map((n) => (
              <li key={n.id} className="list-row">
                <div className="list-row-main">
                  <div className="list-row-title">
                    {n.student} · {n.subject}
                  </div>
                  <div className="list-row-meta">{n.strength}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function Feedback() {
  const { state } = useApp()
  const [params, setParams] = useSearchParams()
  const isTeacher = state.prefs.role === 'teacher'
  const tab = (params.get('tab') as 'give' | 'teachers' | 'teacher') ?? (isTeacher ? 'teacher' : 'give')
  const tabs = isTeacher
    ? [
        { id: 'teacher' as const, label: 'Write for students' },
        { id: 'give' as const, label: 'Give feedback' },
      ]
    : [
        { id: 'give' as const, label: 'Give feedback' },
        { id: 'teachers' as const, label: 'From teachers' },
      ]
  return (
    <>
      <PageHeader title="Feedback" description="Tell the school what’s working and what isn’t — about classes, events, food or this portal." />
      <Tabs idBase="fb" label="Feedback sections" value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} tabs={tabs} />
      <div id="fb-panel" role="tabpanel" aria-labelledby={`fb-tab-${tab}`} style={{ marginTop: 'var(--s-5)' }} data-reveal>
        {tab === 'give' ? <GiveFeedback /> : tab === 'teachers' ? <FromTeachers /> : <TeacherWrite />}
      </div>
    </>
  )
}
