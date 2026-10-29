import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BookOpen, CalendarClock, CalendarX2, Check, CheckCircle2, ChevronDown, ClipboardCheck, FileQuestion, FileText, Megaphone, MessageCircleHeart, PartyPopper, RotateCcw, Sparkles, Timer, Users } from 'lucide-react'
import { useApp, type PersistedState } from '../state/store'
import { attendanceRecords } from '../data/attendance'
import { resources } from '../data/library'
import { subjectById } from '../data/school'
import { TODAY, fmtDay, fmtLong, iso, parse, relDay } from '../lib/date'
import { checkQuestions, missedDays, recoverySummary, type MissedClass, type PlanItem } from '../lib/catchup'
import { useClipReveal, useFlip } from '../lib/motion'
import { statusLabel } from '../components/charts/heatmap'
import { Ring } from '../components/charts/charts'
import { Empty, ProgressBar, SubjectBadge } from '../components/ui'
import { useToast } from '../components/toast'

type Step = 'classes' | 'plan' | 'check'
const kindIcon = { notes: FileText, gap: FileQuestion, homework: ClipboardCheck, check: Sparkles }

function setDone(update: (fn: (s: PersistedState) => PersistedState) => void, id: string, v: boolean) {
  update((s) => ({ ...s, catchup: { ...s.catchup, done: { ...s.catchup.done, [id]: v } } }))
}

/* ───────── Step 1: missed classes ───────── */
function ClassCard({ c, open, onToggle }: { c: MissedClass; open: boolean; onToggle: () => void }) {
  const { state } = useApp()
  const r = c.record
  const subject = c.subjectId ? subjectById(c.subjectId) : null
  const hw = r?.homework ? state.assignments.find((a) => a.id === r.homework!.assignmentId) : null
  const res = r?.resourceIds.map((id) => resources.find((x) => x.id === id)!).filter(Boolean) ?? []
  return (
    <article className={`cu-class ${open ? 'is-open' : ''}`} data-flip-id={`class-${c.period}`}>
      <button className="cu-class-head" onClick={onToggle} aria-expanded={open} disabled={c.isActivity && !r}>
        <span data-flip-id={`class-badge-${c.period}`}>
          <SubjectBadge short={subject?.short ?? 'P'} tint={c.tint} size={open ? 48 : 40} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="subtle">Period {c.period}</span>
          <strong style={{ display: 'block' }}>{c.subject}</strong>
          <span className="muted" style={{ fontSize: 'var(--fs-sm)', display: 'block' }}>
            {r ? r.topic : c.isActivity ? 'Activity period — nothing to catch up' : 'No class record added'}
          </span>
        </span>
        <span className="cu-class-tags">
          {r?.notes && <span className="badge badge-ok">Notes</span>}
          {r && !r.notes && <span className="badge badge-warn">No notes</span>}
          {!r && !c.isActivity && <span className="badge">No record</span>}
          {r?.homework && <span className="badge badge-info">Homework</span>}
          {r?.deadlineChange && <span className="badge badge-danger">Date changed</span>}
        </span>
        {(r || !c.isActivity) && <ChevronDown size={18} className="cu-chevron" aria-hidden />}
      </button>
      {open && (
        <div className="cu-class-body" data-flip-id={`class-body-${c.period}`}>
          {!r ? (
            <div className="notice notice-neutral">
              <FileQuestion size={16} aria-hidden />
              <span>
                {subject?.teacher ?? 'Your teacher'} hasn’t added a record for this class yet, so we can’t tell you what was covered. Ask your teacher or a classmate — we won’t guess.
              </span>
            </div>
          ) : (
            <>
              {r.notes ? (
                <figure className="cu-recap">
                  <blockquote>{r.notes}</blockquote>
                  <figcaption className="subtle">Posted by {r.postedBy} · sample class record</figcaption>
                </figure>
              ) : (
                <div className="notice notice-warn">
                  <AlertTriangle size={16} aria-hidden />
                  <span>
                    Notes for “{r.topic}” haven’t been posted. The library chapter below covers the topic in general, but it isn’t a record of this lesson.
                  </span>
                </div>
              )}
              {r.deadlineChange && (
                <p className="notice notice-danger">
                  <CalendarClock size={16} aria-hidden />
                  <span>
                    <strong>Deadline changed:</strong> {fmtDay(parse(r.deadlineChange.from))} → {fmtDay(parse(r.deadlineChange.to))}. {r.deadlineChange.note}
                  </span>
                </p>
              )}
              {r.announcement && (
                <p className="notice notice-info">
                  <Megaphone size={16} aria-hidden />
                  <span>{r.announcement}</span>
                </p>
              )}
              {hw && (
                <Link to={`/tasks?task=${hw.id}`} className="cu-link-row">
                  <ClipboardCheck size={18} aria-hidden />
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: 'block' }}>{hw.title}</strong>
                    <span className="subtle">
                      Due {fmtDay(parse(hw.due))} · {hw.status === 'pending' ? 'not handed in' : hw.status}
                    </span>
                  </span>
                  <ArrowRight size={16} aria-hidden />
                </Link>
              )}
              {res.map((x) => (
                <Link key={x.id} to={`/library?resource=${x.id}`} className="cu-link-row">
                  <BookOpen size={18} aria-hidden />
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: 'block' }}>{x.title}</strong>
                    <span className="subtle">
                      Study Library · {x.type} · {x.minutes} min
                    </span>
                  </span>
                  <ArrowRight size={16} aria-hidden />
                </Link>
              ))}
              <div className="row wrap" style={{ gap: 8 }}>
                <Link to={`/buddy?q=${encodeURIComponent(r.topic.split(':').pop()!.trim())}`} className="btn btn-sm btn-secondary">
                  <MessageCircleHeart size={14} aria-hidden /> Ask Study Buddy
                </Link>
                <Link to={`/peer-help?topic=${encodeURIComponent(peerTopicFor(r.topic))}`} className="btn btn-sm btn-secondary">
                  <Users size={14} aria-hidden /> Find a classmate to help
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  )
}

const peerTopicFor = (topic: string) => {
  const t = topic.toLowerCase()
  if (t.includes('polynomial')) return 'Polynomials'
  if (t.includes('number')) return 'Number systems'
  if (t.includes('plateau') || t.includes('physical')) return 'Physical features of India'
  if (t.includes('democracy')) return 'Democracy'
  if (t.includes('mixture') || t.includes('chromatography') || t.includes('filtration') || t.includes('evaporation')) return 'Separation of mixtures'
  if (t.includes('essay')) return 'Essay writing'
  if (t.includes('spreadsheet')) return 'Spreadsheets'
  return ''
}

/* ───────── Step 2: plan ───────── */
function PlanRow({ item, onBefore }: { item: PlanItem; onBefore: () => void }) {
  const { update } = useApp()
  const toast = useToast()
  const Icon = kindIcon[item.kind]
  const subject = item.subjectId ? subjectById(item.subjectId) : null
  const toggle = () => {
    onBefore()
    if (item.kind === 'homework' && item.assignmentId) {
      const id = item.assignmentId
      const next = item.done ? 'pending' : 'submitted'
      update((s) => ({ ...s, assignments: s.assignments.map((a) => (a.id === id ? { ...a, status: next, submittedOn: next === 'submitted' ? iso(TODAY) : undefined } : a)) }))
      if (!item.done)
        toast(`Marked “${item.title}” as submitted in Tasks.`, 'ok', {
          label: 'Undo',
          run: () => update((s) => ({ ...s, assignments: s.assignments.map((a) => (a.id === id ? { ...a, status: 'pending', submittedOn: undefined } : a)) })),
        })
      return
    }
    setDone(update, item.id, !item.done)
    if (item.kind === 'notes' && item.resourceId && !item.done) {
      const rid = item.resourceId
      update((s) => ({ ...s, progress: { ...s.progress, [rid]: { progress: Math.max(s.progress[rid]?.progress ?? 0, 60), lastOpened: iso(TODAY) } } }))
    }
    if (!item.done) toast('Recovery step done.', 'ok', { label: 'Undo', run: () => setDone(update, item.id, false) })
  }
  return (
    <li className="cu-step" data-done={item.done} data-flip-id={`plan-${item.id}`}>
      <button className="cu-check" role="checkbox" aria-checked={item.done} aria-label={`${item.done ? 'Mark not done' : 'Mark done'}: ${item.title}`} onClick={toggle} disabled={item.kind === 'check'}>
        {item.done && <Check size={16} strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row wrap" style={{ gap: 6 }}>
          <span className={`badge ${item.priority === 1 ? 'badge-danger' : item.priority === 2 ? 'badge-warn' : item.priority === 3 ? 'badge-info' : ''}`}>{item.priorityLabel}</span>
          {subject && <span className="subtle">{subject.name}</span>}
          {item.effort ? <span className="subtle">· ~{item.effort} min</span> : <span className="subtle">· time unknown</span>}
          {item.kind === 'homework' && item.due && <span className="subtle">· due {relDay(item.due).toLowerCase()}</span>}
        </div>
        <div className="cu-step-title">
          <Icon size={16} aria-hidden /> {item.title}
        </div>
        <p className="subtle" style={{ color: 'var(--text-2)' }}>
          Why: {item.why}
        </p>
        <div className="row wrap" style={{ gap: 12, marginTop: 6 }}>
          {item.resourceId && (
            <Link className="link-btn" to={`/library?resource=${item.resourceId}`}>
              Open resource <ArrowRight size={14} aria-hidden />
            </Link>
          )}
          {item.assignmentId && (
            <Link className="link-btn" to={`/tasks?task=${item.assignmentId}`}>
              Open in Tasks <ArrowRight size={14} aria-hidden />
            </Link>
          )}
          {item.kind === 'gap' && item.topic && (
            <Link className="link-btn" to={`/peer-help?topic=${encodeURIComponent(peerTopicFor(item.topic))}`}>
              Find a classmate <ArrowRight size={14} aria-hidden />
            </Link>
          )}
          {item.topic && item.kind !== 'homework' && (
            <Link className="link-btn" to={`/buddy?q=${encodeURIComponent(item.topic.split(':').pop()!.trim())}`}>
              Ask Study Buddy <ArrowRight size={14} aria-hidden />
            </Link>
          )}
          {item.kind === 'check' && !item.done && (
            <a className="link-btn" href={`#check`}>
              Start the check <ArrowRight size={14} aria-hidden />
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

/* ───────── Step 3: knowledge check ───────── */
function KnowledgeCheck({ date }: { date: string }) {
  const { state, update } = useApp()
  const qs = useMemo(() => checkQuestions(date), [date])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const saved = state.catchup.checks[date]
  if (!qs.length) return <Empty icon={<FileQuestion size={22} />} title="No questions for these classes yet">There are no practice questions linked to the classes you missed.</Empty>
  const finished = Object.keys(answers).length === qs.length
  const score = qs.filter((q, i) => answers[i] === q.answer).length
  const submit = () => update((s) => ({ ...s, catchup: { ...s.catchup, checks: { ...s.catchup.checks, [date]: { score, total: qs.length } } } }))
  if (saved && !Object.keys(answers).length)
    return (
      <div className="stack">
        <div className="notice notice-ok">
          <CheckCircle2 size={18} aria-hidden />
          <span>
            You scored <strong>{saved.score} of {saved.total}</strong>. {saved.score / saved.total >= 0.75 ? 'You’ve got the main ideas.' : 'Worth another look at the notes — or ask a classmate.'}
          </span>
        </div>
        <button className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => update((s) => { const c = { ...s.catchup.checks }; delete c[date]; return { ...s, catchup: { ...s.catchup, checks: c } } })}>
          <RotateCcw size={14} aria-hidden /> Try again
        </button>
      </div>
    )
  return (
    <div className="stack">
      {qs.map((q, i) => (
        <fieldset key={i} className="card-flat" style={{ margin: 0 }}>
          <legend className="subtle" style={{ padding: 0 }}>{q.subject}</legend>
          <p style={{ fontWeight: 700 }}>
            {i + 1}. {q.q}
          </p>
          <div className="grid grid-2" style={{ gap: 6, marginTop: 8 }}>
            {q.options.map((o, j) => {
              const picked = answers[i]
              const show = picked !== undefined
              return (
                <button key={j} className="quiz-opt" disabled={show} data-state={show ? (j === q.answer ? 'correct' : picked === j ? 'wrong' : 'idle') : 'idle'} onClick={() => setAnswers({ ...answers, [i]: j })}>
                  {o}
                </button>
              )
            })}
          </div>
          {answers[i] !== undefined && <p className="subtle" style={{ marginTop: 6, color: 'var(--text-2)' }} role="status">{answers[i] === q.answer ? 'Correct. ' : 'Not quite. '}{q.why}</p>}
        </fieldset>
      ))}
      <button className="btn btn-primary" disabled={!finished} onClick={submit} style={{ alignSelf: 'flex-start' }}>
        {finished ? `Save result (${score}/${qs.length})` : `Answer all ${qs.length} questions`}
      </button>
      <p className="subtle">Questions come from the Study Library practice sheets for the subjects you missed.</p>
    </div>
  )
}

/* ───────── Page ───────── */
export default function CatchUp() {
  const { state, update } = useApp()
  const [params, setParams] = useSearchParams()
  const days = missedDays().filter((d) => d.status !== 'late' || d.periods > 0)
  const fullDays = days.filter((d) => d.status === 'absent' || d.status === 'half')
  const date = params.get('date') ?? state.catchup.lastDate ?? fullDays[0]?.date ?? iso(TODAY)
  const step = (params.get('step') as Step) ?? 'classes'
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parse(date).getTime())
  const record = attendanceRecords.find((r) => r.date === date)
  const sum = valid ? recoverySummary(date, state) : null
  const [open, setOpen] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const planRef = useRef<HTMLOListElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const flipClasses = useFlip(listRef, open)
  const flipPlan = useFlip(planRef, sum?.plan.map((p) => p.id + p.done).join())
  useClipReveal(panelRef, step + date)

  const go = (next: Partial<{ date: string; step: Step }>) => {
    const p = new URLSearchParams(params)
    if (next.date) {
      p.set('date', next.date)
      update((s) => ({ ...s, catchup: { ...s.catchup, lastDate: next.date! } }))
      setOpen(null)
    }
    if (next.step) p.set('step', next.step)
    setParams(p, { replace: true })
  }

  const steps: { id: Step; label: string; meta: string }[] = sum
    ? [
        { id: 'classes', label: 'What you missed', meta: `${sum.classes.length} classes` },
        { id: 'plan', label: 'Recovery plan', meta: `${sum.done}/${sum.total} done` },
        { id: 'check', label: 'Knowledge check', meta: state.catchup.checks[date] ? `${state.catchup.checks[date].score}/${state.catchup.checks[date].total}` : 'Not started' },
      ]
    : []

  return (
    <>
      <header className="cu-hero" data-reveal style={{ viewTransitionName: 'catchup-hero' }}>
        <div style={{ viewTransitionName: 'catchup-ring' }}>
          <Ring value={sum ? sum.done : 0} max={sum ? Math.max(sum.total, 1) : 1} size={108} stroke={12} label={sum && sum.total ? `${Math.round(sum.ratio * 100)}%` : '—'} sub="recovered" color="var(--primary)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Catch Me Up</div>
          <h1>{valid ? fmtLong(parse(date)) : 'Choose a day'}</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            {!valid
              ? 'That date isn’t valid.'
              : !record
                ? 'There was no school that day.'
                : record.missed.length === 0
                  ? 'You were in every class that day.'
                  : `${statusLabel(record.status)}${record.note ? ` · ${record.note}` : ''} · ${sum!.classes.length} class${sum!.classes.length === 1 ? '' : 'es'} missed${sum!.total ? ` · ${sum!.total - sum!.done} step${sum!.total - sum!.done === 1 ? '' : 's'} left (~${sum!.minutesLeft} min)` : ''}`}
          </p>
          <div className="row wrap" style={{ gap: 12, marginTop: 10 }}>
            <Link to="/attendance" className="link-btn">
              Attendance <ArrowRight size={14} aria-hidden />
            </Link>
            {valid && (
              <Link to={`/schedule?date=${date}`} className="link-btn">
                That day’s timetable <ArrowRight size={14} aria-hidden />
              </Link>
            )}
            <Link to="/growth" className="link-btn">
              Progress <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <section className="cu-days" aria-label="Choose a missed day" data-reveal>
        <div className="cu-day-list" role="radiogroup" aria-label="Days you missed classes">
          {days.slice(0, 8).map((d) => {
            const s = recoverySummary(d.date, state)
            return (
              <button key={d.date} role="radio" aria-checked={d.date === date} className="cu-day" onClick={() => go({ date: d.date, step: 'classes' })}>
                <strong>{fmtDay(parse(d.date))}</strong>
                <span className="subtle">
                  {statusLabel(d.status)} · {d.periods} class{d.periods === 1 ? '' : 'es'}
                </span>
                <span className="cu-day-bar" aria-hidden>
                  <i style={{ transform: `scaleX(${s.total ? s.ratio : 0})` }} />
                </span>
              </button>
            )
          })}
        </div>
        <label className="cu-day-other">
          <span className="label">Another day</span>
          <input type="date" className="input" min="2026-04-01" max={iso(TODAY)} value={valid ? date : ''} onChange={(e) => e.target.value && go({ date: e.target.value, step: 'classes' })} />
        </label>
      </section>

      {!valid ? (
        <div className="card section">
          <Empty icon={<AlertTriangle size={22} />} title="We couldn’t read that date" action={<button className="btn btn-primary" onClick={() => go({ date: fullDays[0]?.date ?? iso(TODAY) })}>Go to your latest missed day</button>}>
            Pick a day from the list or the date field.
          </Empty>
        </div>
      ) : !record || record.missed.length === 0 ? (
        <div className="card section">
          <Empty icon={<CheckCircle2 size={22} />} title={!record ? 'No school that day' : 'Nothing to catch up'} action={fullDays[0] && <button className="btn btn-secondary" onClick={() => go({ date: fullDays[0].date })}>Open {fmtDay(parse(fullDays[0].date))}</button>}>
            {!record ? 'It was a weekend, holiday or a day outside the term.' : 'Attendance shows you attended every period that day.'}
          </Empty>
        </div>
      ) : (
        <>
          <nav className="cu-steps section" aria-label="Catch Me Up steps">
            {steps.map((s, i) => (
              <button key={s.id} className="cu-steptab" aria-current={step === s.id ? 'step' : undefined} onClick={() => go({ step: s.id })}>
                <span className="cu-steptab-n">{i + 1}</span>
                <span>
                  <strong style={{ display: 'block' }}>{s.label}</strong>
                  <span className="subtle">{s.meta}</span>
                </span>
              </button>
            ))}
          </nav>

          <div ref={panelRef} className="cu-panel">
            {step === 'classes' && (
              <section aria-label="Missed classes">
                {sum!.missingRecords + sum!.missingNotes > 0 && (
                  <p className="notice notice-neutral" style={{ marginBottom: 12 }}>
                    <FileQuestion size={16} aria-hidden />
                    <span>
                      Some information is incomplete: {sum!.missingRecords > 0 && `${sum!.missingRecords} class${sum!.missingRecords > 1 ? 'es have' : ' has'} no record`}
                      {sum!.missingRecords > 0 && sum!.missingNotes > 0 && ' and '}
                      {sum!.missingNotes > 0 && `${sum!.missingNotes} without notes`}. We show what teachers posted and nothing more.
                    </span>
                  </p>
                )}
                {sum!.classes.every((c) => !c.record) && (
                  <p className="notice notice-warn" style={{ marginBottom: 12 }}>
                    <AlertTriangle size={16} aria-hidden /> No class records were added for this day yet, so there’s no plan to build. Ask your class teacher what was covered.
                  </p>
                )}
                <div ref={listRef} className="cu-class-list">
                  {sum!.classes.map((c) => (
                    <ClassCard
                      key={c.period}
                      c={c}
                      open={open === c.period}
                      onToggle={() => {
                        flipClasses()
                        setOpen(open === c.period ? null : c.period)
                      }}
                    />
                  ))}
                </div>
                {sum!.total > 0 && (
                  <button className="btn btn-primary section" onClick={() => go({ step: 'plan' })}>
                    See my recovery plan <ArrowRight size={16} aria-hidden />
                  </button>
                )}
              </section>
            )}

            {step === 'plan' && (
              <section aria-label="Recovery plan" className="cu-plan-layout">
                <div>
                  <div className="row between wrap" style={{ marginBottom: 10 }}>
                    <h2 style={{ fontSize: 'var(--fs-md)' }}>Your recovery plan</h2>
                    <span className="subtle">Built from your records — ordered by deadline and upcoming tests</span>
                  </div>
                  <ProgressBar value={sum!.done} max={Math.max(sum!.total, 1)} label="Recovery progress" size="lg" />
                  {sum!.total === 0 ? (
                    <Empty icon={<CalendarX2 size={22} />} title="No plan for this day">There were no class records with notes or homework to recover.</Empty>
                  ) : (
                    <ol ref={planRef} className="cu-plan">
                      {sum!.plan.map((p) => (
                        <PlanRow key={p.id} item={p} onBefore={flipPlan} />
                      ))}
                    </ol>
                  )}
                </div>
                <aside className="card cu-next" aria-label="Next action">
                  {sum!.next ? (
                    <>
                      <span className="eyebrow">Next up</span>
                      <h3 style={{ marginTop: 4 }}>{sum!.next.title}</h3>
                      <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>{sum!.next.why}</p>
                      <p className="subtle row" style={{ gap: 6, marginTop: 8 }}>
                        <Timer size={14} aria-hidden /> {sum!.minutesLeft} min of work left in this plan
                      </p>
                      {sum!.next.kind === 'check' ? (
                        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => go({ step: 'check' })}>
                          Start knowledge check
                        </button>
                      ) : (
                        <Link className="btn btn-primary btn-block" style={{ marginTop: 12 }} to={sum!.next.assignmentId ? `/tasks?task=${sum!.next.assignmentId}` : sum!.next.resourceId ? `/library?resource=${sum!.next.resourceId}` : '/peer-help'}>
                          Start now
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="cu-complete">
                      <PartyPopper size={28} aria-hidden />
                      <h3>You’re caught up</h3>
                      <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>Every step for {fmtDay(parse(date))} is done. Keep an eye on Tasks for anything new.</p>
                      <Link to="/tasks" className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
                        Back to Tasks
                      </Link>
                    </div>
                  )}
                </aside>
              </section>
            )}

            {step === 'check' && (
              <section id="check" aria-label="Knowledge check" className="card">
                <h2 style={{ fontSize: 'var(--fs-md)', marginBottom: 12 }}>Knowledge check</h2>
                <KnowledgeCheck date={date} />
              </section>
            )}
          </div>
        </>
      )}
    </>
  )
}
