import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, BookOpen, Check, CheckCircle2, ClipboardList, GripVertical, Pencil, Plus, Search, Tags, Trash2, AlertCircle, Clock } from 'lucide-react'
import { useApp, uid } from '../state/store'
import { subjects, subjectById, type SubjectId } from '../data/school'
import { categoryPalette, type Assignment, type Priority, type Todo } from '../data/tasks'
import { resources } from '../data/library'
import { TODAY, daysUntil, fmtDay, iso, parse, relDay } from '../lib/date'
import { isOverdue, recentTaskRecord } from '../lib/insights'
import { Drawer, Modal } from '../components/overlay'
import { Empty, Field, PageHeader, SubjectBadge, Tabs } from '../components/ui'
import { Ring } from '../components/charts/charts'
import { useToast } from '../components/toast'

const prioBadge: Record<Priority, string> = { high: 'badge-danger', medium: 'badge-warn', low: 'badge' }
const prioRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
const statusBadge = { pending: 'badge-info', submitted: 'badge-primary', graded: 'badge-ok' }

function DueLabel({ due, done }: { due?: string; done?: boolean }) {
  if (!due) return <span>No due date</span>
  const n = daysUntil(due)
  if (!done && n < 0)
    return (
      <span className="badge badge-danger">
        <AlertCircle aria-hidden /> Overdue · {fmtDay(parse(due))}
      </span>
    )
  if (!done && n <= 1)
    return (
      <span className="badge badge-warn">
        <Clock aria-hidden /> Due {relDay(due).toLowerCase()}
      </span>
    )
  return <span>Due {fmtDay(parse(due))}</span>
}

/* ───────── Assignments ───────── */
function AssignmentDrawer({ a, onClose }: { a: Assignment | null; onClose: () => void }) {
  const { update } = useApp()
  const toast = useToast()
  const s = a ? subjectById(a.subject)! : null
  const res = a?.resourceId ? resources.find((r) => r.id === a.resourceId) : null
  const submit = () => {
    if (!a) return
    update((st) => ({ ...st, assignments: st.assignments.map((x) => (x.id === a.id ? { ...x, status: 'submitted', submittedOn: iso(TODAY) } : x)) }))
    toast(`Marked “${a.title}” as submitted on this device. Hand in your work as your teacher asks.`)
  }
  const undo = () => {
    if (!a) return
    update((st) => ({ ...st, assignments: st.assignments.map((x) => (x.id === a.id ? { ...x, status: 'pending', submittedOn: undefined } : x)) }))
  }
  return (
    <Drawer
      open={!!a}
      onClose={onClose}
      title={a?.title ?? ''}
      description={s ? `${s.name} · ${s.teacher}` : ''}
      footer={
        a?.status === 'pending' ? (
          <button className="btn btn-primary" onClick={submit}>
            <Check size={16} aria-hidden /> Mark as submitted
          </button>
        ) : a?.status === 'submitted' && a.submittedOn === iso(TODAY) ? (
          <button className="btn btn-secondary" onClick={undo}>
            Undo submission
          </button>
        ) : undefined
      }
    >
      {a && s && (
        <div className="stack">
          <div className="row wrap" style={{ gap: 8 }}>
            <span className={`badge ${statusBadge[a.status]}`}>{a.status[0].toUpperCase() + a.status.slice(1)}</span>
            <span className={`badge ${prioBadge[a.priority]}`}>{a.priority} priority</span>
            <DueLabel due={a.due} done={a.status !== 'pending'} />
          </div>
          <p>{a.details}</p>
          {a.submittedOn && (
            <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              Submitted {fmtDay(parse(a.submittedOn))} — {a.submittedOn <= a.due ? 'on time' : 'after the due date'}.
            </p>
          )}
          {a.status === 'submitted' && <p className="notice notice-info">Waiting for your teacher to grade this.</p>}
          {a.grade && (
            <div className="card-flat">
              <div className="row between">
                <strong>Grade</strong>
                <span className="num" style={{ fontSize: 'var(--fs-lg)' }}>
                  {a.grade}
                </span>
              </div>
              {a.teacherNote && <p className="muted" style={{ marginTop: 6, fontSize: 'var(--fs-sm)' }}>“{a.teacherNote}” — {s.teacher}</p>}
            </div>
          )}
          {res && (
            <Link to={`/library?resource=${res.id}`} className="card-flat row" style={{ textDecoration: 'none', color: 'var(--text)' }}>
              <BookOpen size={18} aria-hidden />
              <span style={{ flex: 1 }}>
                <strong style={{ display: 'block' }}>Helpful resource</strong>
                <span className="subtle">{res.title}</span>
              </span>
            </Link>
          )}
          {isOverdue(a) && <p className="notice notice-warn"><AlertCircle size={16} aria-hidden /> It’s past the due date. Submitting late is still better than not at all — and it’s okay to ask your teacher for help.</p>}
          <p className="subtle">Teacher-set assignments can’t be deleted. Status changes here are a prototype and aren’t sent to your teacher.</p>
        </div>
      )}
    </Drawer>
  )
}

function AssignmentsTab() {
  const { state } = useApp()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<'pending' | 'submitted' | 'graded' | 'all'>('pending')
  const [q, setQ] = useState('')
  const [subject, setSubject] = useState<SubjectId | 'all'>('all')
  const [sort, setSort] = useState<'due' | 'priority' | 'subject'>('due')
  const openId = params.get('task')
  const open = state.assignments.find((a) => a.id === openId) ?? null

  const list = useMemo(() => {
    const out = state.assignments.filter((a) => (status === 'all' || a.status === status) && (subject === 'all' || a.subject === subject) && a.title.toLowerCase().includes(q.toLowerCase()))
    return out.sort((a, b) => (sort === 'due' ? (status === 'pending' ? a.due.localeCompare(b.due) : b.due.localeCompare(a.due)) : sort === 'priority' ? prioRank[a.priority] - prioRank[b.priority] : a.subject.localeCompare(b.subject)))
  }, [state.assignments, status, subject, q, sort])

  const counts = { pending: 0, submitted: 0, graded: 0, all: state.assignments.length }
  state.assignments.forEach((a) => counts[a.status]++)

  return (
    <>
      <div className="toolbar">
        <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Status">
          {(['pending', 'submitted', 'graded', 'all'] as const).map((s) => (
            <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)} <span className="subtle" style={{ color: 'inherit', opacity: 0.7 }}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <div className="search">
            <Search size={16} aria-hidden />
            <label htmlFor="a-search" className="sr-only">Search assignments</label>
            <input id="a-search" className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="sr-only" htmlFor="a-subj">Subject</label>
          <select id="a-subj" className="select" value={subject} onChange={(e) => setSubject(e.target.value as SubjectId | 'all')}>
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="a-sort">Sort by</label>
          <select id="a-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="due">Sort: due date</option>
            <option value="priority">Sort: priority</option>
            <option value="subject">Sort: subject</option>
          </select>
        </div>
      </div>
      {list.length === 0 ? (
        <Empty icon={<ClipboardList size={22} />} title={q || subject !== 'all' ? 'No matching assignments' : status === 'pending' ? 'Nothing pending' : 'Nothing here yet'}>
          {q || subject !== 'all' ? 'Try a different search or subject.' : status === 'pending' ? 'You’re all caught up. Nice work!' : undefined}
        </Empty>
      ) : (
        <ul className="list card" style={{ listStyle: 'none', margin: 0, padding: '4px 16px' }}>
          {list.map((a) => {
            const s = subjectById(a.subject)!
            return (
              <li key={a.id}>
                <button className="list-row task-row" onClick={() => setParams({ task: a.id })}>
                  <SubjectBadge short={s.short} tint={s.tint} />
                  <span className="list-row-main">
                    <span className="list-row-title" style={{ display: 'block' }}>{a.title}</span>
                    <span className="list-row-meta">
                      <span>{s.name}</span>
                      <DueLabel due={a.due} done={a.status !== 'pending'} />
                      {a.grade && <span>Grade {a.grade}</span>}
                    </span>
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    {a.status === 'pending' && a.priority === 'high' && <span className="badge badge-danger hide-mobile">High</span>}
                    <span className={`badge ${statusBadge[a.status]}`}>{a.status[0].toUpperCase() + a.status.slice(1)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <AssignmentDrawer
        a={open}
        onClose={() => {
          params.delete('task')
          setParams(params, { replace: true })
        }}
      />
    </>
  )
}

/* ───────── To-dos ───────── */
interface TodoDraft {
  title: string
  categoryId: string
  due: string
  priority: Priority
  subject: string
  notes: string
}

function TodoForm({ initial, onSave, onCancel }: { initial?: Todo; onSave: (t: TodoDraft) => void; onCancel: () => void }) {
  const { state } = useApp()
  const [d, setD] = useState<TodoDraft>({
    title: initial?.title ?? '',
    categoryId: initial?.categoryId ?? state.categories[0]?.id ?? '',
    due: initial?.due ?? '',
    priority: initial?.priority ?? 'medium',
    subject: initial?.subject ?? '',
    notes: initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!d.title.trim()) errs.title = 'Give your to-do a short title.'
    else if (d.title.length > 80) errs.title = 'Keep the title under 80 characters.'
    if (!d.categoryId) errs.category = 'Choose a category.'
    if (d.due && !initial && d.due < iso(TODAY)) errs.due = 'Pick today or a later date.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSave({ ...d, title: d.title.trim() })
  }
  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field id="td-title" label="Title" error={errors.title} className="full">
          <input id="td-title" data-autofocus className="input" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'td-title-err' : undefined} maxLength={100} />
        </Field>
        <Field id="td-cat" label="Category" error={errors.category}>
          <select id="td-cat" className="select" value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: e.target.value })}>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="td-prio" label="Priority">
          <select id="td-prio" className="select" value={d.priority} onChange={(e) => setD({ ...d, priority: e.target.value as Priority })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
        <Field id="td-due" label="Due date (optional)" error={errors.due}>
          <input id="td-due" type="date" className="input" value={d.due} min={initial ? undefined : iso(TODAY)} onChange={(e) => setD({ ...d, due: e.target.value })} aria-invalid={!!errors.due} />
        </Field>
        <Field id="td-subj" label="Subject (optional)">
          <select id="td-subj" className="select" value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })}>
            <option value="">None</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="td-notes" label="Notes (optional)" className="full">
          <textarea id="td-notes" className="textarea" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
        </Field>
      </div>
      <div className="modal-foot">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initial ? 'Save changes' : 'Add to-do'}
        </button>
      </div>
    </form>
  )
}

function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState(categoryPalette[3])
  const [err, setErr] = useState('')
  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Enter a category name.')
    if (state.categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) return setErr('You already have that category.')
    update((s) => ({ ...s, categories: [...s.categories, { id: uid('cat'), name: name.trim(), color }] }))
    setName('')
    setErr('')
  }
  return (
    <Modal open={open} onClose={onClose} title="Categories" description="Organise your personal to-dos with your own categories and colours.">
      <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
        {state.categories.map((c) => {
          const used = state.todos.filter((t) => t.categoryId === c.id).length
          return (
            <li key={c.id} className="list-row">
              <span className="dot" style={{ background: c.color, width: 14, height: 14 }} aria-hidden />
              <span className="list-row-main">
                {c.name} <span className="subtle">· {used} to-do{used === 1 ? '' : 's'}</span>
              </span>
              <button className="icon-btn icon-btn-sm" disabled={used > 0 || state.categories.length <= 1} title={used > 0 ? 'Move or delete its to-dos first' : undefined} aria-label={`Delete category ${c.name}${used > 0 ? ' (in use)' : ''}`} onClick={() => update((s) => ({ ...s, categories: s.categories.filter((x) => x.id !== c.id) }))} style={{ opacity: used > 0 ? 0.4 : 1 }}>
                <Trash2 size={16} />
              </button>
            </li>
          )
        })}
      </ul>
      <form onSubmit={add} className="stack" style={{ gap: 10 }} noValidate>
        <Field id="cat-name" label="New category" error={err}>
          <input id="cat-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Music practice" aria-invalid={!!err} />
        </Field>
        <div className="field">
          <span className="label" id="cat-col">Colour</span>
          <div className="row wrap" role="radiogroup" aria-labelledby="cat-col" style={{ gap: 8 }}>
            {categoryPalette.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: '50%', border: color === c ? '3px solid var(--text)' : '2px solid var(--surface)', background: c, boxShadow: '0 0 0 1px var(--border-strong)' }} />
            ))}
          </div>
        </div>
        <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
          <Plus size={16} aria-hidden /> Add category
        </button>
      </form>
    </Modal>
  )
}

function TodosTab({ onAdd }: { onAdd: () => void }) {
  const { state, update } = useApp()
  const toast = useToast()
  const [cat, setCat] = useState<string>('all')
  const [showDone, setShowDone] = useState(true)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState<Todo | null>(null)
  const [manage, setManage] = useState(false)
  const dragId = useRef<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const list = state.todos.filter((t) => (cat === 'all' || t.categoryId === cat) && (showDone || !t.done))

  const move = (id: string, dir: -1 | 1) => {
    update((s) => {
      const arr = [...s.todos]
      const i = arr.findIndex((t) => t.id === id)
      const j = i + dir
      if (j < 0 || j >= arr.length) return s
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...s, todos: arr }
    })
  }
  const dropOn = (targetId: string) => {
    const from = dragId.current
    setOver(null)
    if (!from || from === targetId) return
    update((s) => {
      const arr = [...s.todos]
      const item = arr.splice(arr.findIndex((t) => t.id === from), 1)[0]
      arr.splice(arr.findIndex((t) => t.id === targetId), 0, item)
      return { ...s, todos: arr }
    })
  }

  return (
    <>
      <div className="toolbar">
        <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Category">
          <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
            All
          </button>
          {state.categories.map((c) => (
            <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              <span className="dot" style={{ background: c.color }} aria-hidden /> {c.name}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <label className="check" style={{ minHeight: 0 }}>
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed
          </label>
          <button className="btn btn-ghost btn-sm" onClick={() => setManage(true)}>
            <Tags size={14} aria-hidden /> Categories
          </button>
        </div>
      </div>
      {list.length === 0 ? (
        <Empty icon={<CheckCircle2 size={22} />} title="No to-dos here" action={<button className="btn btn-primary" onClick={onAdd}><Plus size={16} aria-hidden /> Add a to-do</button>}>
          Add personal reminders — revision, clubs, reading or anything else.
        </Empty>
      ) : (
        <ul className="list card" style={{ listStyle: 'none', margin: 0, padding: '4px 16px' }} aria-label="Personal to-dos. Drag to reorder, or use the move buttons.">
          {list.map((t) => {
            const c = state.categories.find((x) => x.id === t.categoryId)
            const idx = state.todos.findIndex((x) => x.id === t.id)
            return (
              <li
                key={t.id}
                className="list-row todo-row"
                draggable
                data-over={over === t.id}
                onDragStart={(e) => {
                  dragId.current = t.id
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOver(t.id)
                }}
                onDragLeave={() => setOver(null)}
                onDrop={() => dropOn(t.id)}
                style={{ opacity: t.done ? 0.65 : 1 }}
              >
                <GripVertical size={16} className="drag-handle hide-mobile" aria-hidden />
                <input
                  type="checkbox"
                  className="todo-check"
                  checked={t.done}
                  aria-label={`Mark “${t.title}” ${t.done ? 'not done' : 'done'}`}
                  onChange={() => {
                    update((s) => ({ ...s, todos: s.todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }))
                    if (!t.done) toast('Nice — to-do completed.')
                  }}
                />
                <div className="list-row-main">
                  <div className="list-row-title" style={{ textDecoration: t.done ? 'line-through' : undefined }}>
                    {t.title}
                  </div>
                  <div className="list-row-meta">
                    {c && (
                      <span className="row" style={{ gap: 5 }}>
                        <span className="dot" style={{ background: c.color }} aria-hidden /> {c.name}
                      </span>
                    )}
                    <DueLabel due={t.due} done={t.done} />
                    {t.subject && <span>{subjectById(t.subject)?.name}</span>}
                    {t.priority === 'high' && !t.done && <span className="badge badge-danger">High</span>}
                  </div>
                </div>
                <div className="row todo-actions" style={{ gap: 2 }}>
                  <button className="icon-btn icon-btn-sm" onClick={() => move(t.id, -1)} disabled={idx === 0} aria-label={`Move “${t.title}” up`}>
                    <ArrowUp size={15} />
                  </button>
                  <button className="icon-btn icon-btn-sm" onClick={() => move(t.id, 1)} disabled={idx === state.todos.length - 1} aria-label={`Move “${t.title}” down`}>
                    <ArrowDown size={15} />
                  </button>
                  <button className="icon-btn icon-btn-sm" onClick={() => setEditing(t)} aria-label={`Edit “${t.title}”`}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn icon-btn-sm" onClick={() => setDeleting(t)} aria-label={`Delete “${t.title}”`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit to-do">
        {editing && (
          <TodoForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(d) => {
              update((s) => ({ ...s, todos: s.todos.map((x) => (x.id === editing.id ? { ...x, ...d, due: d.due || undefined, subject: (d.subject || undefined) as SubjectId | undefined } : x)) }))
              setEditing(null)
              toast('To-do updated.')
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this to-do?"
        description={deleting ? `“${deleting.title}” will be removed from this device.` : ''}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleting(null)} data-autofocus>
              Keep it
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                update((s) => ({ ...s, todos: s.todos.filter((x) => x.id !== deleting!.id) }))
                setDeleting(null)
                toast('To-do deleted.')
              }}
            >
              <Trash2 size={16} aria-hidden /> Delete
            </button>
          </>
        }
      >
        <span />
      </Modal>
      <CategoryManager open={manage} onClose={() => setManage(false)} />
    </>
  )
}

export default function Tasks() {
  const { state, update } = useApp()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as 'assignments' | 'todos') ?? 'assignments'
  const [adding, setAdding] = useState(false)
  const rec = recentTaskRecord(state.assignments)
  const pending = state.assignments.filter((a) => a.status === 'pending').length
  const openTodos = state.todos.filter((t) => !t.done).length
  const setTab = (t: 'assignments' | 'todos') => setParams(t === 'assignments' ? {} : { tab: t }, { replace: true })
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Assignments from your teachers, and your own to-do list — kept separate so nothing gets mixed up."
        actions={
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden /> Add to-do
          </button>
        }
      />
      <section className="card task-summary" data-reveal aria-label="Recent record">
        <Ring value={rec.onTime} max={rec.total} size={84} stroke={10} label={`${rec.onTime}/${rec.total}`} color="var(--ok)" />
        <div>
          <strong>
            You completed {rec.onTime} of your {rec.total} recent tasks on time.
          </strong>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 2 }}>
            {rec.late} handed in late{rec.missing ? `, ${rec.missing} still to hand in` : ''}. Starting a day early is usually enough to stay on track.
          </p>
        </div>
      </section>
      <div className="section" style={{ marginTop: 'var(--s-6)' }}>
        <Tabs
          idBase="tasks"
          label="Task type"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'assignments', label: 'School assignments', count: pending },
            { id: 'todos', label: 'My to-dos', count: openTodos },
          ]}
        />
        <div id="tasks-panel" role="tabpanel" aria-labelledby={`tasks-tab-${tab}`} style={{ marginTop: 'var(--s-4)' }}>
          {tab === 'assignments' ? <AssignmentsTab /> : <TodosTab onAdd={() => setAdding(true)} />}
        </div>
      </div>
      <Modal open={adding} onClose={() => setAdding(false)} title="New to-do" description="Personal to-dos are just for you — teachers don’t see them.">
        <TodoForm
          onCancel={() => setAdding(false)}
          onSave={(d) => {
            update((s) => ({ ...s, todos: [{ id: uid('t'), kind: 'todo', done: false, ...d, due: d.due || undefined, subject: (d.subject || undefined) as SubjectId | undefined }, ...s.todos] }))
            setAdding(false)
            setTab('todos')
            toast('To-do added.')
          }}
        />
      </Modal>
    </>
  )
}
