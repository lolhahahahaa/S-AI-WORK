import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, CheckCircle2, ClipboardCheck, FileText, PlayCircle, Search, Timer, Video, XCircle } from 'lucide-react'
import { useApp, type PersistedState } from '../state/store'
import { chapters, resources, typeLabels, type Resource, type ResourceType } from '../data/library'
import { subjects, subjectById, type SubjectId } from '../data/school'
import { TODAY, iso, relDay } from '../lib/date'
import { Drawer } from '../components/overlay'
import { Empty, PageHeader, ProgressBar, SubjectBadge } from '../components/ui'
import { useFocus } from '../components/dock'
import { useToast } from '../components/toast'

const typeIcon: Record<ResourceType, typeof FileText> = { notes: FileText, video: Video, practice: ClipboardCheck }

function setProgress(update: (fn: (s: PersistedState) => PersistedState) => void, id: string, value: number) {
  update((s) => ({ ...s, progress: { ...s.progress, [id]: { progress: Math.max(s.progress[id]?.progress ?? 0, value), lastOpened: iso(TODAY) } } }))
}

function Practice({ r, onDone }: { r: Resource; onDone: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const qs = r.questions ?? []
  const done = Object.keys(answers).length === qs.length
  const score = qs.filter((q, i) => answers[i] === q.answer).length
  useEffect(() => {
    if (done) onDone(score)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="stack">
      {qs.map((q, i) => {
        const picked = answers[i]
        return (
          <fieldset key={i} className="card-flat" style={{ margin: 0 }}>
            <legend className="sr-only">Question {i + 1}</legend>
            <p style={{ fontWeight: 700 }}>
              {i + 1}. {q.q}
            </p>
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              {q.options.map((o, j) => {
                const isPicked = picked === j
                const show = picked !== undefined
                const correct = j === q.answer
                return (
                  <button key={j} className="quiz-opt" disabled={show} data-state={show ? (correct ? 'correct' : isPicked ? 'wrong' : 'idle') : 'idle'} onClick={() => setAnswers({ ...answers, [i]: j })}>
                    {show && correct && <CheckCircle2 size={16} aria-label="Correct answer" />}
                    {show && isPicked && !correct && <XCircle size={16} aria-label="Your answer, incorrect" />}
                    {o}
                  </button>
                )
              })}
            </div>
            {picked !== undefined && (
              <p className="muted" style={{ marginTop: 8, fontSize: 'var(--fs-sm)' }} role="status">
                {picked === q.answer ? 'Correct! ' : 'Not quite. '}
                {q.why}
              </p>
            )}
          </fieldset>
        )
      })}
      {done && (
        <div className="notice notice-ok" role="status">
          <CheckCircle2 size={18} aria-hidden /> You scored {score} of {qs.length}. {score === qs.length ? 'Brilliant!' : 'Review the explanations and try the notes again.'}
        </div>
      )}
    </div>
  )
}

function ResourceDrawer({ r, onClose }: { r: Resource | null; onClose: () => void }) {
  const { state, update } = useApp()
  const toast = useToast()
  const focus = useFocus()
  useEffect(() => {
    if (r) setProgress(update, r.id, 10)
  }, [r, update])
  const s = r ? subjectById(r.subject)! : null
  const p = r ? state.progress[r.id]?.progress ?? 0 : 0
  const complete = () => {
    if (!r) return
    setProgress(update, r.id, 100)
    toast(`Finished “${r.title}”. +5 credits`)
  }
  return (
    <Drawer
      open={!!r}
      onClose={onClose}
      title={r?.title ?? ''}
      description={r && s ? `${s.name} · ${r.chapter} · ${typeLabels[r.type]} · ${r.minutes} min` : ''}
      footer={
        r && (
          <>
            <button className="btn btn-ghost" onClick={() => focus.setOpen(true)}>
              <Timer size={16} aria-hidden /> Focus timer
            </button>
            {r.type !== 'practice' &&
              (p >= 100 ? (
                <span className="badge badge-ok" style={{ height: 40, padding: '0 14px' }}>
                  <CheckCircle2 aria-hidden /> Completed
                </span>
              ) : (
                <button className="btn btn-primary" onClick={complete}>
                  <CheckCircle2 size={16} aria-hidden /> Mark as {r.type === 'video' ? 'watched' : 'read'}
                </button>
              ))}
          </>
        )
      }
    >
      {r && (
        <div className="stack">
          <span className="prototype-tag" style={{ alignSelf: 'flex-start' }}>Sample resource</span>
          {r.type === 'video' && (
            <div className="video-placeholder" role="img" aria-label="Video preview not available in this prototype">
              <PlayCircle size={40} aria-hidden />
              <strong>Video not included in this prototype</strong>
              <span className="subtle">Your school’s real lesson video would play here. Below is what it covers.</span>
            </div>
          )}
          {r.type !== 'practice' && (
            <article className="reader">
              {r.sections?.map((sec) => (
                <section key={sec.heading}>
                  <h3>{sec.heading}</h3>
                  <p>{sec.body}</p>
                </section>
              ))}
            </article>
          )}
          {r.type === 'practice' && (
            <Practice
              r={r}
              onDone={(score) => {
                setProgress(update, r.id, 100)
                toast(`Practice complete: ${score}/${r.questions?.length}. +5 credits`)
              }}
            />
          )}
        </div>
      )}
    </Drawer>
  )
}

export default function Library() {
  const { state } = useApp()
  const focus = useFocus()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [type, setType] = useState<ResourceType | 'all'>('all')
  const subject = (params.get('subject') as SubjectId | null) ?? 'all'
  const openId = params.get('resource')
  const open = resources.find((r) => r.id === openId) ?? null

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: k !== 'resource' })
  }

  const inProgress = Object.entries(state.progress)
    .filter(([, v]) => v.progress > 0 && v.progress < 100)
    .sort((a, b) => b[1].lastOpened.localeCompare(a[1].lastOpened))
    .map(([id, v]) => ({ r: resources.find((x) => x.id === id)!, ...v }))
    .filter((x) => x.r)

  const filtered = useMemo(
    () => resources.filter((r) => (subject === 'all' || r.subject === subject) && (type === 'all' || r.type === type) && `${r.title} ${r.chapter} ${r.summary}`.toLowerCase().includes(q.toLowerCase())),
    [subject, type, q],
  )
  const visibleSubjects = subjects.filter((s) => subject === 'all' || s.id === subject)
  const completed = Object.values(state.progress).filter((p) => p.progress >= 100).length

  return (
    <>
      <PageHeader
        title="Study Library"
        description="Notes, videos and practice sheets for every subject — organised by chapter."
        actions={
          <button className="btn btn-secondary" onClick={() => focus.setOpen(true)}>
            <Timer size={16} aria-hidden /> Start a focus session
          </button>
        }
      />

      {inProgress.length > 0 && (
        <section aria-labelledby="cont-h" data-reveal>
          <h2 id="cont-h" style={{ fontSize: 'var(--fs-md)', marginBottom: 12 }}>
            Continue where you left off
          </h2>
          <div className="grid grid-3">
            {inProgress.slice(0, 3).map(({ r, progress, lastOpened }) => {
              const s = subjectById(r.subject)!
              const Icon = typeIcon[r.type]
              return (
                <button key={r.id} className="stat" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setParam('resource', r.id)}>
                  <div className="row" style={{ gap: 10 }}>
                    <SubjectBadge short={s.short} tint={s.tint} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{r.title}</div>
                      <div className="subtle row" style={{ gap: 4 }}>
                        <Icon size={13} aria-hidden /> {typeLabels[r.type]} · opened {relDay(lastOpened).toLowerCase()}
                      </div>
                    </div>
                  </div>
                  <ProgressBar value={progress} label={`${r.title} progress`} />
                  <span className="subtle">{progress}% done</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="section" aria-label="Browse" data-reveal>
        <div className="toolbar">
          <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Subject">
            <button className="chip" aria-pressed={subject === 'all'} onClick={() => setParam('subject', null)}>
              All subjects
            </button>
            {subjects.map((s) => (
              <button key={s.id} className="chip" aria-pressed={subject === s.id} onClick={() => setParam('subject', s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar">
          <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Resource type">
            {(['all', 'notes', 'video', 'practice'] as const).map((t) => (
              <button key={t} className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
                {t === 'all' ? 'All types' : typeLabels[t]}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <div className="search">
              <Search size={16} aria-hidden />
              <label htmlFor="lib-q" className="sr-only">Search the library</label>
              <input id="lib-q" className="input" placeholder="Search topics" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <span className="subtle hide-mobile">{completed} completed</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <Empty icon={<BookOpen size={22} />} title="No resources match" action={<button className="btn btn-secondary" onClick={() => { setQ(''); setType('all'); setParam('subject', null) }}>Clear filters</button>}>
              {subject !== 'all' && type !== 'all' ? `There are no ${typeLabels[type as ResourceType].toLowerCase()} for ${subjectById(subject)?.name} yet. Your teacher may add some later.` : 'Try another search term.'}
            </Empty>
          </div>
        ) : (
          <div className="stack">
            {visibleSubjects.map((s) => {
              const list = filtered.filter((r) => r.subject === s.id)
              if (!list.length) return null
              return (
                <section key={s.id} className="card" aria-labelledby={`lib-${s.id}`}>
                  <div className="card-head">
                    <h3 id={`lib-${s.id}`} className="row" style={{ gap: 10 }}>
                      <SubjectBadge short={s.short} tint={s.tint} size={32} /> {s.name}
                    </h3>
                    <span className="subtle">{s.teacher}</span>
                  </div>
                  {chapters
                    .filter((c) => c.subject === s.id)
                    .map((c) => {
                      const items = list.filter((r) => r.chapter === c.name)
                      if (!items.length) return null
                      return (
                        <div key={c.name} className="chapter">
                          <h4 className="chapter-title">{c.name}</h4>
                          <ul className="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {items.map((r) => {
                              const Icon = typeIcon[r.type]
                              const p = state.progress[r.id]?.progress ?? 0
                              return (
                                <li key={r.id}>
                                  <button className="list-row task-row" onClick={() => setParam('resource', r.id)}>
                                    <span className="stat-icon" style={{ background: 'var(--bg-sunk)' }} aria-hidden>
                                      <Icon size={17} />
                                    </span>
                                    <span className="list-row-main">
                                      <span className="list-row-title" style={{ display: 'block' }}>{r.title}</span>
                                      <span className="list-row-meta">
                                        <span>{typeLabels[r.type]}</span>
                                        <span>{r.minutes} min</span>
                                        <span className="hide-mobile">{r.summary}</span>
                                      </span>
                                    </span>
                                    {p >= 100 ? (
                                      <span className="badge badge-ok">
                                        <CheckCircle2 aria-hidden /> Done
                                      </span>
                                    ) : p > 0 ? (
                                      <span className="badge badge-info">{p}%</span>
                                    ) : null}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    })}
                </section>
              )
            })}
          </div>
        )}
      </section>
      <ResourceDrawer r={open} onClose={() => setParam('resource', null)} />
    </>
  )
}
