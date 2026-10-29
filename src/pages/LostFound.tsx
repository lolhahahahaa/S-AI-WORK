import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, ImagePlus, Info, Loader2, Lock, MapPin, PackageSearch, Plus, Search, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { useApp, uid } from '../state/store'
import { campusLocations, itemCategories, itemColours, type Claim, type ClaimStatus, type ItemCategory, type ItemReport } from '../data/community'
import { TODAY, fmtDay, iso, parse, relDay } from '../lib/date'
import { matchesFor, readPhoto } from '../lib/lostfound'
import { useFlip } from '../lib/motion'
import { ItemArt } from '../components/ItemArt'
import { Modal } from '../components/overlay'
import { Empty, Field, PageHeader, PrototypeTag, Tabs } from '../components/ui'
import { useToast } from '../components/toast'

const catLabel = (c: ItemCategory) => itemCategories.find((x) => x.id === c)!.label
const claimLabel: Record<ClaimStatus, string> = { submitted: 'Claim submitted', verifying: 'Awaiting verification', approved: 'Approved — collect from office', returned: 'Returned', rejected: 'Not verified' }
const claimTone: Record<ClaimStatus, string> = { submitted: 'badge-info', verifying: 'badge-warn', approved: 'badge-ok', returned: 'badge-ok', rejected: 'badge-danger' }

function statusOf(r: ItemReport, claims: Claim[]) {
  if (r.status === 'returned') return { label: 'Returned', tone: 'badge-ok' }
  if (r.status === 'closed') return { label: 'Closed', tone: '' }
  const c = claims.find((x) => x.reportId === r.id && x.status !== 'rejected')
  if (c) return { label: claimLabel[c.status], tone: claimTone[c.status] }
  return { label: r.kind === 'found' ? 'Available' : 'Still looking', tone: 'badge-primary' }
}

/* ───────── Report form ───────── */
function ReportForm({ initialKind, onDone }: { initialKind: 'lost' | 'found'; onDone: (r: ItemReport) => void }) {
  const [f, setF] = useState({ kind: initialKind, category: '' as ItemCategory | '', name: '', description: '', colours: [] as string[], date: iso(TODAY), location: '', verifyQuestion: '' })
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState<'photo' | 'save' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const sensitive = f.category === 'id'
  const onPhoto = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setErrors((e) => ({ ...e, photo: 'Choose an image file (JPG or PNG).' }))
    if (file.size > 6_000_000) return setErrors((e) => ({ ...e, photo: 'That photo is over 6 MB. Try a smaller one.' }))
    setBusy('photo')
    try {
      setPhoto(await readPhoto(file))
      setErrors((e) => ({ ...e, photo: '' }))
    } catch {
      setErrors((e) => ({ ...e, photo: 'We couldn’t read that image. Try another photo.' }))
    } finally {
      setBusy(null)
    }
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!f.category) errs.category = 'Choose what kind of item it is.'
    if (f.name.trim().length < 3) errs.name = 'Give the item a short name.'
    if (f.description.trim().length < 10) errs.description = 'Describe it in a few more words (at least 10 characters).'
    if (!f.colours.length) errs.colours = 'Pick at least one colour.'
    if (!f.date || f.date > iso(TODAY) || f.date < '2026-04-01') errs.date = 'Pick a date this term, not in the future.'
    if (!f.location) errs.location = 'Choose roughly where.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`lf-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    setBusy('save')
    await new Promise((r) => setTimeout(r, 350))
    setBusy(null)
    onDone({ id: `LF-${Math.floor(300 + Math.random() * 600)}`, kind: f.kind, category: f.category as ItemCategory, name: f.name.trim(), description: f.description.trim(), colours: f.colours, date: f.date, location: f.location, photo, status: 'open', reportedBy: 'me', verifyQuestion: f.kind === 'found' ? f.verifyQuestion.trim() || 'Describe something only the owner would know about it.' : undefined })
  }
  const inv = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `lf-${k}-err` : undefined })
  return (
    <form onSubmit={submit} noValidate>
      <div className="segmented" role="radiogroup" aria-label="Report type" style={{ marginBottom: 16 }}>
        {(['lost', 'found'] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={f.kind === k} aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })} style={f.kind === k ? { background: 'var(--surface)', boxShadow: 'var(--shadow-1)' } : undefined}>
            I {k} something
          </button>
        ))}
      </div>
      <div className="form-grid">
        <Field id="lf-category" label="Item type" error={errors.category}>
          <select id="lf-category" className="select" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as ItemCategory })} {...inv('category')} data-autofocus>
            <option value="">Choose…</option>
            {itemCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="lf-name" label="Item name" error={errors.name}>
          <input id="lf-name" className="input" value={f.name} maxLength={50} placeholder="e.g. Steel water bottle" onChange={(e) => setF({ ...f, name: e.target.value })} {...inv('name')} />
        </Field>
        {sensitive && (
          <p className="notice notice-warn full">
            <Lock size={16} aria-hidden /> ID cards go straight to the school office. Don’t type the name or number on the card — only the office sees those details.
          </p>
        )}
        <Field id="lf-description" label="Description" hint="Size, brand, stickers, damage — anything visible." error={errors.description} className="full">
          <textarea id="lf-description" className="textarea" value={f.description} maxLength={240} onChange={(e) => setF({ ...f, description: e.target.value })} {...inv('description')} />
        </Field>
        <div className="field full">
          <span className="label" id="lf-colours-l">
            Colours
          </span>
          <div className="row wrap" style={{ gap: 6 }} role="group" aria-labelledby="lf-colours-l" id="lf-colours" tabIndex={-1}>
            {itemColours.map((c) => (
              <button key={c} type="button" className="chip" style={{ minHeight: 30 }} aria-pressed={f.colours.includes(c)} onClick={() => setF({ ...f, colours: f.colours.includes(c) ? f.colours.filter((x) => x !== c) : [...f.colours, c] })}>
                {c}
              </button>
            ))}
          </div>
          {errors.colours && (
            <span className="error" role="alert">
              {errors.colours}
            </span>
          )}
        </div>
        <Field id="lf-date" label={f.kind === 'lost' ? 'Date lost' : 'Date found'} error={errors.date}>
          <input id="lf-date" type="date" className="input" min="2026-04-01" max={iso(TODAY)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} {...inv('date')} />
        </Field>
        <Field id="lf-location" label="Approximate place" error={errors.location}>
          <select id="lf-location" className="select" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} {...inv('location')}>
            <option value="">Choose…</option>
            {campusLocations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <div className="field full">
          <span className="label">Photo (optional)</span>
          <div className="lf-upload">
            {photo ? <img src={photo} alt="Preview of the uploaded item" className="item-art item-art-md" /> : <div className="item-art item-art-md lf-upload-empty">{busy === 'photo' ? <Loader2 className="spin" size={22} /> : <ImagePlus size={22} />}</div>}
            <div className="stack" style={{ gap: 6 }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                {photo ? 'Change photo' : 'Add a photo'}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
              {photo && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhoto(null)}>
                  <Trash2 size={14} aria-hidden /> Remove
                </button>
              )}
              <span className="hint">Photos stay in this browser and are resized to save space.</span>
              {errors.photo && <span className="error" role="alert">{errors.photo}</span>}
            </div>
          </div>
        </div>
        {f.kind === 'found' && (
          <Field id="lf-verify" label="Question to check the owner (optional)" hint="Only the office sees the answer. e.g. “What’s written inside the lid?”" className="full">
            <input id="lf-verify" className="input" value={f.verifyQuestion} onChange={(e) => setF({ ...f, verifyQuestion: e.target.value })} />
          </Field>
        )}
      </div>
      <div className="modal-foot">
        <button type="submit" className="btn btn-primary" disabled={!!busy}>
          {busy === 'save' ? (
            <>
              <Loader2 size={16} className="spin" aria-hidden /> Saving…
            </>
          ) : (
            'Submit report'
          )}
        </button>
      </div>
    </form>
  )
}

/* ───────── Item detail + claim ───────── */
function ItemDetail({ r, onBack }: { r: ItemReport; onBack: () => void }) {
  const { state, update } = useApp()
  const toast = useToast()
  const [answer, setAnswer] = useState('')
  const [err, setErr] = useState('')
  const claim = state.claims.find((c) => c.reportId === r.id && c.status !== 'rejected')
  const rejected = state.claims.find((c) => c.reportId === r.id && c.status === 'rejected')
  const st = statusOf(r, state.claims)
  const canSee = claim && (claim.status === 'approved' || claim.status === 'returned')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (answer.trim().length < 4) return setErr('Give the office something to check — at least a few words.')
    update((s) => ({ ...s, claims: [...s.claims, { id: uid('claim'), reportId: r.id, answer: answer.trim(), createdAt: iso(TODAY), status: 'verifying' }] }))
    toast('Claim sent to the school office for verification (demo — nobody is notified).', 'info')
    setAnswer('')
  }
  return (
    <article className="lf-detail card" data-flip-id={`card-${r.id}`}>
      <button className="link-btn" onClick={onBack} style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} aria-hidden /> All items
      </button>
      <div className="lf-detail-grid">
        <div data-flip-id={`art-${r.id}`}>
          <ItemArt category={r.category} colours={r.colours} photo={r.photo} alt={r.name} size="lg" />
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className={`badge ${st.tone}`}>{st.label}</span>
            <span className="badge badge-outline">{catLabel(r.category)}</span>
            <span className="subtle">{r.id}</span>
          </div>
          <h2>{r.name}</h2>
          <p>{r.category === 'id' ? 'School ID card. Name and photo hidden for privacy.' : r.description}</p>
          <p className="list-row-meta">
            <span className="row" style={{ gap: 4 }}>
              <MapPin size={14} aria-hidden /> {r.location}
            </span>
            <span className="row" style={{ gap: 4 }}>
              <Clock size={14} aria-hidden /> {r.kind === 'found' ? 'Found' : 'Lost'} {relDay(r.date).toLowerCase()}
            </span>
            <span>Colours: {r.colours.join(', ')}</span>
          </p>
          <div className="card-flat">
            <strong className="row" style={{ gap: 6 }}>
              <Lock size={14} aria-hidden /> Identifying details
            </strong>
            <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>
              {canSee ? r.privateDetail ?? 'No extra details recorded.' : 'Hidden until the office verifies the owner, so nobody can claim it just by reading them.'}
            </p>
          </div>
          {r.kind === 'found' && r.status === 'open' && r.reportedBy !== 'me' && !claim && (
            <form className="stack" style={{ gap: 8 }} onSubmit={submit} noValidate>
              <h3>Is this yours?</h3>
              {rejected && <p className="notice notice-danger"><XCircle size={16} aria-hidden /> Your earlier claim couldn’t be verified. You can try again with more detail, or visit the office.</p>}
              <Field id={`claim-${r.id}`} label={r.verifyQuestion ?? 'Describe something only the owner would know.'} hint="Only office staff see your answer." error={err}>
                <textarea id={`claim-${r.id}`} className="textarea" style={{ minHeight: 72 }} value={answer} onChange={(e) => setAnswer(e.target.value)} aria-invalid={!!err} />
              </Field>
              <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
                <ShieldCheck size={16} aria-hidden /> Request this item
              </button>
            </form>
          )}
          {claim && <ClaimTracker c={claim} />}
        </div>
      </div>
    </article>
  )
}

function ClaimTracker({ c }: { c: Claim }) {
  const { state, update } = useApp()
  const order: ClaimStatus[] = ['submitted', 'verifying', 'approved', 'returned']
  const at = order.indexOf(c.status)
  const set = (status: ClaimStatus) => update((s) => ({ ...s, claims: s.claims.map((x) => (x.id === c.id ? { ...x, status } : x)), reports: status === 'returned' ? s.reports.map((r) => (r.id === c.reportId ? { ...r, status: 'returned' } : r)) : s.reports }))
  return (
    <div className="card-flat">
      <strong>Claim status</strong>
      <ol className="stepper" style={{ marginTop: 8 }}>
        {order.map((s, i) => (
          <li key={s} data-state={c.status === 'rejected' && i === 2 ? 'declined' : i <= at ? 'done' : i === at + 1 ? 'current' : 'idle'}>
            <span>
              <strong style={{ display: 'block', fontSize: 'var(--fs-xs)' }}>{['Sent', 'Office checks', 'Approved', 'Collected'][i]}</strong>
            </span>
          </li>
        ))}
      </ol>
      <p className="subtle" style={{ marginTop: 8 }}>
        {c.status === 'verifying' && 'The office compares your answer with the item. Bring your ID card if asked.'}
        {c.status === 'approved' && 'Verified. Collect it from the school office before 3 pm with your ID card.'}
        {c.status === 'returned' && 'Collected. Glad it found its way back.'}
        {c.status === 'rejected' && 'The office couldn’t match your answer to the item.'}
      </p>
      {state.prefs.role === 'student' && c.status === 'verifying' && (
        <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
          <span className="prototype-tag">Prototype</span>
          <button className="btn btn-sm btn-secondary" onClick={() => set('approved')}>Simulate office approval</button>
          <button className="btn btn-sm btn-ghost" onClick={() => set('rejected')}>Simulate rejection</button>
        </div>
      )}
      {state.prefs.role === 'student' && c.status === 'approved' && (
        <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => set('returned')}>
          I’ve collected it
        </button>
      )}
    </div>
  )
}

/* ───────── Office review (staff roles) ───────── */
function OfficeQueue() {
  const { state, update } = useApp()
  const toast = useToast()
  const queue = state.claims.filter((c) => c.status === 'verifying' || c.status === 'approved')
  const set = (c: Claim, status: ClaimStatus) => {
    update((s) => ({ ...s, claims: s.claims.map((x) => (x.id === c.id ? { ...x, status } : x)), reports: status === 'returned' ? s.reports.map((r) => (r.id === c.reportId ? { ...r, status: 'returned' } : r)) : s.reports }))
    toast(`Claim ${status === 'approved' ? 'approved' : status === 'rejected' ? 'not verified' : 'marked returned'} (demo).`, 'info')
  }
  if (!queue.length) return <Empty icon={<ShieldCheck size={22} />} title="No claims to review">Claims students submit appear here for the office to verify.</Empty>
  return (
    <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {queue.map((c) => {
        const r = state.reports.find((x) => x.id === c.reportId)!
        return (
          <li key={c.id} className="card lf-review">
            <ItemArt category={r.category} colours={r.colours} photo={r.photo} alt={r.name} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row wrap" style={{ gap: 6 }}>
                <strong>{r.name}</strong>
                <span className={`badge ${claimTone[c.status]}`}>{claimLabel[c.status]}</span>
              </div>
              <div className="grid grid-2" style={{ marginTop: 8, gap: 8 }}>
                <div className="card-flat">
                  <span className="subtle">On record (office only)</span>
                  <p style={{ fontSize: 'var(--fs-sm)' }}>{r.privateDetail ?? '—'}</p>
                </div>
                <div className="card-flat">
                  <span className="subtle">Claimant’s answer · student in 9B</span>
                  <p style={{ fontSize: 'var(--fs-sm)' }}>{c.answer}</p>
                </div>
              </div>
              <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                {c.status === 'verifying' ? (
                  <>
                    <button className="btn btn-sm btn-primary" onClick={() => set(c, 'approved')}>Approve</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => set(c, 'rejected')}>Can’t verify</button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-primary" onClick={() => set(c, 'returned')}>Mark as returned</button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ───────── Page ───────── */
export default function LostFound() {
  const { state, update } = useApp()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const isStaff = state.prefs.role === 'teacher' || state.prefs.role === 'admin'
  const tab = (params.get('tab') as 'browse' | 'mine' | 'office') ?? (isStaff ? 'office' : 'browse')
  const openId = params.get('item')
  const [cat, setCat] = useState<ItemCategory | 'all'>('all')
  const [q, setQ] = useState('')
  const [form, setForm] = useState<null | 'lost' | 'found'>(null)
  const [created, setCreated] = useState<ItemReport | null>(null)
  const scope = useRef<HTMLDivElement>(null)
  const capture = useFlip(scope, openId)
  const found = useMemo(() => state.reports.filter((r) => r.kind === 'found' && (cat === 'all' || r.category === cat) && `${r.name} ${r.description} ${r.location}`.toLowerCase().includes(q.toLowerCase())), [state.reports, cat, q])
  const mine = state.reports.filter((r) => r.reportedBy === 'me')
  const open = state.reports.find((r) => r.id === openId)
  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p)
  }
  const openItem = (id: string | null) => {
    capture()
    setParam('item', id)
  }

  return (
    <>
      <PageHeader
        eyebrow="School services"
        title="Lost & Found"
        description="Report something lost or found, see likely matches, and claim your things back through the school office."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setForm('found')}>
              <Plus size={16} aria-hidden /> I found something
            </button>
            <button className="btn btn-primary" onClick={() => setForm('lost')}>
              <PackageSearch size={16} aria-hidden /> I lost something
            </button>
          </>
        }
      />
      <Tabs
        idBase="lf"
        label="Lost and found sections"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        tabs={[
          { id: 'browse', label: 'Found items', count: state.reports.filter((r) => r.kind === 'found' && r.status === 'open').length },
          { id: 'mine', label: 'My reports & matches', count: mine.length },
          ...(isStaff ? [{ id: 'office' as const, label: 'Office review', count: state.claims.filter((c) => c.status === 'verifying').length }] : []),
        ]}
      />
      <div id="lf-panel" role="tabpanel" style={{ marginTop: 'var(--s-5)' }} ref={scope}>
        {tab === 'browse' &&
          (open ? (
            <ItemDetail r={open} onBack={() => openItem(null)} />
          ) : (
            <>
              <div className="toolbar">
                <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Category">
                  <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All</button>
                  {itemCategories.filter((c) => state.reports.some((r) => r.kind === 'found' && r.category === c.id)).map((c) => (
                    <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="toolbar-right">
                  <div className="search">
                    <Search size={16} aria-hidden />
                    <label htmlFor="lf-q" className="sr-only">Search found items</label>
                    <input id="lf-q" className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
                  </div>
                </div>
              </div>
              {found.length === 0 ? (
                <Empty icon={<PackageSearch size={22} />} title="Nothing matches" action={<button className="btn btn-primary" onClick={() => setForm('lost')}>Report it as lost</button>}>
                  If you’ve lost it, report it — we’ll show you likely matches as items are handed in.
                </Empty>
              ) : (
                <ul className="lf-grid">
                  {found.map((r) => {
                    const st = statusOf(r, state.claims)
                    return (
                      <li key={r.id}>
                        <button className="lf-card" data-flip-id={`card-${r.id}`} onClick={() => openItem(r.id)} aria-label={`${r.name}, ${st.label}. Open details`}>
                          <span data-flip-id={`art-${r.id}`} style={{ display: 'block' }}>
                            <ItemArt category={r.category} colours={r.colours} photo={r.photo} alt={r.name} />
                          </span>
                          <span className="lf-card-body">
                            <span className={`badge ${st.tone}`}>{st.label}</span>
                            <strong>{r.name}</strong>
                            <span className="subtle">
                              {r.location} · {relDay(r.date)}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          ))}

        {tab === 'mine' &&
          (mine.length === 0 ? (
            <Empty icon={<PackageSearch size={22} />} title="You haven’t reported anything" action={<button className="btn btn-primary" onClick={() => setForm('lost')}>Report a lost item</button>} />
          ) : (
            <div className="stack">
              <p className="notice notice-info">
                <Info size={16} aria-hidden />
                <span>
                  <strong>How matching works:</strong> we compare item type, colours, words in the description, place and date. “Strong match” means several of these agree; “Possible match” means a few do. It’s a hint, not proof — and it doesn’t look at photos.
                </span>
              </p>
              {mine.map((r) => {
                const ms = matchesFor(r, state.reports)
                const st = statusOf(r, state.claims)
                return (
                  <section key={r.id} className="card lf-mine" aria-label={r.name}>
                    <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
                      <ItemArt category={r.category} colours={r.colours} photo={r.photo} alt={r.name} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row wrap" style={{ gap: 6 }}>
                          <span className="badge badge-outline">{r.kind === 'lost' ? 'Lost' : 'Found'}</span>
                          <span className={`badge ${st.tone}`}>{st.label}</span>
                        </div>
                        <h3 style={{ marginTop: 4 }}>{r.name}</h3>
                        <p className="subtle">
                          {r.location} · {fmtDay(parse(r.date))} · {r.id}
                        </p>
                      </div>
                      {r.status === 'open' && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            update((s) => ({ ...s, reports: s.reports.map((x) => (x.id === r.id ? { ...x, status: 'closed' } : x)) }))
                            toast('Report closed.', 'ok', { label: 'Undo', run: () => update((s) => ({ ...s, reports: s.reports.map((x) => (x.id === r.id ? { ...x, status: 'open' } : x)) })) })
                          }}
                        >
                          {r.kind === 'lost' ? 'I found it' : 'Close report'}
                        </button>
                      )}
                    </div>
                    {r.status === 'open' && (
                      <div style={{ marginTop: 14 }}>
                        <h4 style={{ marginBottom: 8 }}>{ms.length ? `${ms.length} possible match${ms.length > 1 ? 'es' : ''}` : 'No matches yet'}</h4>
                        {ms.length === 0 ? (
                          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>We’ll keep checking as new items are reported. You can also ask at the office.</p>
                        ) : (
                          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8 }}>
                            {ms.map((m) => (
                              <li key={m.report.id} className="lf-match">
                                <ItemArt category={m.report.category} colours={m.report.colours} photo={m.report.photo} alt={m.report.name} size="sm" />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className="row wrap" style={{ gap: 6 }}>
                                    <strong>{m.report.name}</strong>
                                    <span className={`badge ${m.label === 'Strong match' ? 'badge-ok' : 'badge-info'}`}>{m.label}</span>
                                  </div>
                                  <p className="subtle">
                                    {m.report.kind === 'found' ? 'Found' : 'Lost'} {fmtDay(parse(m.report.date))} · {m.report.location}
                                  </p>
                                  <ul className="lf-reasons">
                                    {m.reasons.map((x) => (
                                      <li key={x}>
                                        <CheckCircle2 size={13} aria-hidden /> {x}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {m.report.kind === 'found' && (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                      setParams({ tab: 'browse', item: m.report.id })
                                    }}
                                  >
                                    View & claim
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          ))}

        {tab === 'office' && isStaff && <OfficeQueue />}
      </div>

      <Modal open={!!form && !created} onClose={() => setForm(null)} title={form === 'found' ? 'Report a found item' : 'Report a lost item'} description="Reports are saved in this browser for the demo. In a real school they’d go to the office.">
        {form && (
          <ReportForm
            initialKind={form}
            onDone={(r) => {
              update((s) => ({ ...s, reports: [r, ...s.reports] }))
              setCreated(r)
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!created}
        onClose={() => {
          setCreated(null)
          setForm(null)
        }}
        title="Report saved"
        footer={
          <button
            className="btn btn-primary"
            onClick={() => {
              setCreated(null)
              setForm(null)
              setParams({ tab: 'mine' })
            }}
          >
            View my reports & matches
          </button>
        }
      >
        {created && (
          <div className="row" style={{ gap: 14 }}>
            <ItemArt category={created.category} colours={created.colours} photo={created.photo} alt={created.name} size="sm" />
            <p>
              <strong>{created.name}</strong> ({created.id}) is listed. {matchesFor(created, state.reports).length ? `We found ${matchesFor(created, state.reports).length} possible match(es) already.` : 'No matches yet — we’ll show them as items are reported.'}
            </p>
          </div>
        )}
      </Modal>
      <p className="subtle section" style={{ marginTop: 'var(--s-6)' }}>
        <PrototypeTag>Demo matching</PrototypeTag> Matching uses the text you enter, not image recognition. Reports and claims stay in this browser.
      </p>
    </>
  )
}
