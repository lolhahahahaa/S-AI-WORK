import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Award, Check, ChevronRight, Lock, Plus, X } from 'lucide-react'
import { useApp } from '../state/store'
import { student, subjects, skills } from '../data/school'
import { resources } from '../data/library'
import { badges, creditSummary, profileStrength, recentTaskRecord } from '../lib/insights'
import { PageHeader, ProgressBar, SubjectBadge } from '../components/ui'
import { Avatar } from '../components/shell'
import { useToast } from '../components/toast'

const avatarColors = ['#f8e1d4', '#dce9d8', '#e0ecfa', '#f5ebc6', '#e9e3f6']
const goalIdeas = ['Improve in Social Science', 'Finish homework a day early', 'Read one book a month', 'Join a new club', 'Speak up more in class']

function TagEditor({ label, values, onChange, suggestions, max = 8 }: { label: string; values: string[]; onChange: (v: string[]) => void; suggestions?: string[]; max?: number }) {
  const [draft, setDraft] = useState('')
  const id = label.toLowerCase().replace(/\W+/g, '-')
  const add = (v: string) => {
    const t = v.trim()
    if (!t || values.includes(t) || values.length >= max) return
    onChange([...values, t])
    setDraft('')
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="row wrap" style={{ gap: 6 }}>
        {values.map((v) => (
          <span key={v} className="badge badge-primary" style={{ height: 30, paddingRight: 4 }}>
            {v}
            <button className="icon-btn icon-btn-sm" style={{ width: 22, height: 22, color: 'inherit' }} onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <form
        className="row"
        style={{ gap: 6 }}
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          add(draft)
        }}
      >
        <input id={id} className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type and press Add" maxLength={40} disabled={values.length >= max} />
        <button className="btn btn-secondary" type="submit" disabled={!draft.trim() || values.length >= max}>
          <Plus size={14} aria-hidden /> Add
        </button>
      </form>
      {suggestions && (
        <div className="row wrap" style={{ gap: 6 }}>
          {suggestions
            .filter((s) => !values.includes(s))
            .slice(0, 4)
            .map((s) => (
              <button key={s} className="chip" style={{ minHeight: 28, fontSize: 'var(--fs-xs)' }} onClick={() => add(s)}>
                <Plus size={12} aria-hidden /> {s}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const { state, update } = useApp()
  const toast = useToast()
  const ps = profileStrength(state)
  const cr = creditSummary(state)
  const rec = recentTaskRecord(state.assignments)
  const earned = badges(state).filter((b) => b.earned)
  const [bio, setBio] = useState(state.profile.bio)
  const setProfile = (p: Partial<typeof state.profile>) => update((s) => ({ ...s, profile: { ...s.profile, ...p } }))
  const finished = Object.values(state.progress).filter((p) => p.progress >= 100).length

  return (
    <>
      <PageHeader title="Profile" description="Your school details, interests and progress. Only the information needed is shown here." />
      <section className="card profile-hero" data-reveal>
        <Avatar size={84} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 'var(--fs-xl)' }}>{student.name}</h2>
          <p className="muted">
            Grade {student.grade} · Section {student.section} · Roll no. {student.rollNo} · {student.house}
          </p>
          <p className="subtle">
            {state.prefs.schoolName} · Academic year {student.academicYear} · Class teacher {student.classTeacher}
          </p>
          <div className="row" style={{ gap: 6, marginTop: 10 }} role="radiogroup" aria-label="Avatar colour">
            {avatarColors.map((c) => (
              <button key={c} role="radio" aria-checked={state.profile.avatarColor === c} aria-label={`Avatar colour ${c}`} onClick={() => setProfile({ avatarColor: c })} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: state.profile.avatarColor === c ? '2.5px solid var(--text)' : '1px solid var(--border-strong)' }} />
            ))}
          </div>
        </div>
        <div className="profile-strength">
          <div className="row between">
            <strong>Profile strength</strong>
            <span className="num">{ps.percent}%</span>
          </div>
          <ProgressBar value={ps.percent} label="Profile strength" />
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 4, fontSize: 'var(--fs-sm)' }}>
            {ps.items.map((i) => (
              <li key={i.id} className="row" style={{ gap: 6, color: i.done ? 'var(--text-2)' : 'var(--text)' }}>
                {i.done ? <Check size={14} style={{ color: 'var(--ok)' }} aria-label="Done" /> : <span className="dot" style={{ background: 'var(--border-strong)' }} aria-label="To do" />}
                {i.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid grid-2 section">
        <section className="card stack" data-reveal aria-labelledby="about-h">
          <h2 id="about-h" style={{ fontSize: 'var(--fs-md)' }}>
            About me
          </h2>
          <form
            className="field"
            onSubmit={(e) => {
              e.preventDefault()
              setProfile({ bio: bio.trim() })
              toast('Bio saved.')
            }}
          >
            <label htmlFor="bio">Short bio</label>
            <textarea id="bio" className="textarea" maxLength={240} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. I love football and building small websites. I’m working on my map skills." />
            <div className="row between">
              <span className="hint">{bio.length}/240 · at least 20 characters for profile strength</span>
              <button className="btn btn-secondary btn-sm" type="submit" disabled={bio.trim() === state.profile.bio}>
                Save bio
              </button>
            </div>
          </form>
          <TagEditor label="Learning goals" values={state.profile.goals} onChange={(goals) => setProfile({ goals })} suggestions={goalIdeas} max={5} />
          <TagEditor label="Clubs & activities" values={state.profile.clubs} onChange={(clubs) => setProfile({ clubs })} suggestions={['Coding club', 'Football', 'Debate', 'Art club', 'Music']} />
          <TagEditor label="Interests" values={state.profile.interests} onChange={(interests) => setProfile({ interests })} suggestions={['Space', 'Drawing', 'Cricket', 'Reading', 'Robotics']} />
        </section>

        <div className="stack">
          <section className="card" data-reveal aria-labelledby="subj-h">
            <h2 id="subj-h" style={{ fontSize: 'var(--fs-md)' }}>
              Subjects
            </h2>
            <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
              {subjects.map((s) => (
                <li key={s.id} className="list-row">
                  <SubjectBadge short={s.short} tint={s.tint} />
                  <div className="list-row-main">
                    <div className="list-row-title">{s.name}</div>
                    <div className="list-row-meta">{s.teacher}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="card" data-reveal aria-labelledby="prog-h">
            <div className="card-head">
              <h2 id="prog-h" style={{ fontSize: 'var(--fs-md)' }}>
                Progress & achievements
              </h2>
              <Link to="/growth" className="link-btn">
                Growth <ChevronRight size={14} aria-hidden />
              </Link>
            </div>
            <dl className="profile-stats">
              <div>
                <dt>Credits</dt>
                <dd className="num">{cr.total}</dd>
                <dd className="subtle">{cr.level.name}</dd>
              </div>
              <div>
                <dt>On-time tasks</dt>
                <dd className="num">
                  {rec.onTime}/{rec.total}
                </dd>
              </div>
              <div>
                <dt>Resources done</dt>
                <dd className="num">
                  {finished}/{resources.length}
                </dd>
              </div>
            </dl>
            <h3 style={{ fontSize: 'var(--fs-sm)', margin: '12px 0 8px' }}>Badges</h3>
            <div className="row wrap" style={{ gap: 6 }}>
              {earned.map((b) => (
                <span key={b.id} className="badge badge-ok" style={{ height: 28 }}>
                  <Award aria-hidden /> {b.name}
                </span>
              ))}
            </div>
            <h3 style={{ fontSize: 'var(--fs-sm)', margin: '14px 0 8px' }}>Skills</h3>
            <div className="stack" style={{ gap: 8 }}>
              {skills.map((s) => (
                <div key={s.id}>
                  <div className="row between" style={{ fontSize: 'var(--fs-sm)' }}>
                    <span>{s.label}</span>
                    <span className="subtle">{s.value}/5</span>
                  </div>
                  <ProgressBar value={s.value} max={5} label={s.label} />
                </div>
              ))}
            </div>
          </section>
          <p className="notice notice-neutral" data-reveal>
            <Lock size={16} aria-hidden /> Address, phone numbers and medical details are kept by the school office and aren’t shown in the portal.
          </p>
        </div>
      </div>
    </>
  )
}
