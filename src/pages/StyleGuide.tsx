import { useState, type ReactNode } from 'react'
import { AlertCircle, Bell, CheckCircle2, Headphones, Inbox, Plus, Timer } from 'lucide-react'
import { Drawer, Modal } from '../components/overlay'
import { Empty, Field, Insight, PageHeader, ProgressBar, Segmented, Stars, StatCard, Switch, Tabs, PrototypeTag, SubjectBadge } from '../components/ui'
import { ChartCard, ColumnChart } from '../components/charts/charts'
import { DayTimeline } from '../components/agenda'
import { TODAY } from '../lib/date'
import { subjects } from '../data/school'

const colorTokens = ['--bg', '--bg-sunk', '--surface', '--text', '--text-2', '--text-3', '--border', '--primary', '--primary-soft', '--sage', '--peach', '--sky', '--butter', '--lilac', '--ok', '--warn', '--danger', '--info', '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6']
const typeScale = [
  ['--fs-2xl', 'Page title', 'h1'],
  ['--fs-xl', 'Large heading', 'h2'],
  ['--fs-lg', 'Section title', 'h2'],
  ['--fs-md', 'Card title', 'h3'],
  ['--fs-base', 'Body text — DM Sans, comfortable to read', 'p'],
  ['--fs-sm', 'Supporting text and metadata', 'p'],
  ['--fs-xs', 'Labels and badges', 'p'],
]
const spaces = ['--s-1', '--s-2', '--s-3', '--s-4', '--s-5', '--s-6', '--s-8', '--s-10', '--s-12']
const radii = ['--r-sm', '--r-md', '--r-lg', '--r-xl', '--r-pill']
const shadows = ['--shadow-1', '--shadow-2', '--shadow-3']

function Block({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section className="card sg-block" data-reveal aria-labelledby={`sg-${title}`}>
      <h2 id={`sg-${title}`} style={{ fontSize: 'var(--fs-md)' }}>
        {title}
      </h2>
      {note && <p className="subtle" style={{ marginTop: 2 }}>{note}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  )
}

function Swatches({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div data-theme={theme} className="sg-theme" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <strong style={{ textTransform: 'capitalize' }}>{theme}</strong>
      <div className="sg-swatches">
        {colorTokens.map((t) => (
          <div key={t} className="sg-swatch">
            <span style={{ background: `var(${t})` }} />
            <code>{t}</code>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StyleGuide() {
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a')
  const [seg, setSeg] = useState<'x' | 'y'>('x')
  const [sw, setSw] = useState(true)
  const [stars, setStars] = useState(3)
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  return (
    <>
      <PageHeader eyebrow="Design system" title="Style Guide" description="The tokens and components the portal is built from. Everything here is the live component — change the accent or theme in Settings and this page updates too." />
      <div className="stack">
        <Block title="Colour tokens" note="Light and dark values side by side. Status colours are always paired with an icon or text.">
          <div className="grid grid-2">
            <Swatches theme="light" />
            <Swatches theme="dark" />
          </div>
        </Block>

        <div className="grid grid-2">
          <Block title="Typography" note="Nunito for headings and numbers, DM Sans for text.">
            <div className="stack" style={{ gap: 10 }}>
              {typeScale.map(([v, label, tag]) => {
                const T = tag as 'h1'
                return (
                  <div key={v} className="row between" style={{ gap: 12 }}>
                    <T style={{ fontSize: `var(${v})`, margin: 0 }}>{label}</T>
                    <code className="subtle">{v}</code>
                  </div>
                )
              })}
              <div className="row between">
                <span className="num" style={{ fontSize: 'var(--fs-num)' }}>
                  90.9%
                </span>
                <code className="subtle">.num</code>
              </div>
            </div>
          </Block>
          <Block title="Space, radius & elevation">
            <div className="stack" style={{ gap: 6 }}>
              {spaces.map((s) => (
                <div key={s} className="row" style={{ gap: 10 }}>
                  <code className="subtle" style={{ width: 52 }}>{s}</code>
                  <span style={{ height: 10, width: `var(${s})`, background: 'var(--primary)', borderRadius: 3 }} />
                </div>
              ))}
            </div>
            <div className="row wrap" style={{ gap: 12, marginTop: 16 }}>
              {radii.map((r) => (
                <div key={r} style={{ textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: `var(${r})`, border: '2px solid var(--primary)', background: 'var(--primary-soft)' }} />
                  <code className="subtle">{r}</code>
                </div>
              ))}
            </div>
            <div className="row wrap" style={{ gap: 16, marginTop: 16 }}>
              {shadows.map((s) => (
                <div key={s} style={{ width: 90, height: 56, borderRadius: 14, background: 'var(--surface)', boxShadow: `var(${s})`, display: 'grid', placeItems: 'center' }}>
                  <code className="subtle">{s}</code>
                </div>
              ))}
            </div>
          </Block>
        </div>

        <Block title="Buttons" note="Pressing scales to 0.97 for instant feedback. Disabled buttons are 50% opacity with a not-allowed cursor.">
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn-primary">
              <Plus size={16} aria-hidden /> Primary
            </button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-danger">Danger</button>
            <button className="btn btn-primary btn-sm">Small</button>
            <button className="btn btn-primary" disabled>
              Disabled
            </button>
            <button className="icon-btn bordered" aria-label="Icon button example">
              <Bell size={18} />
            </button>
            <button className="link-btn">Link button</button>
          </div>
        </Block>

        <div className="grid grid-2">
          <Block title="Inputs & validation">
            <div className="stack">
              <Field id="sg-ok" label="Label" hint="Hint text explains what to enter.">
                <input id="sg-ok" className="input" placeholder="Placeholder" />
              </Field>
              <Field id="sg-err" label="With an error" error="Give your to-do a short title.">
                <input id="sg-err" className="input" aria-invalid="true" defaultValue="" />
              </Field>
              <Field id="sg-sel" label="Select">
                <select id="sg-sel" className="select">
                  <option>Mathematics</option>
                  <option>Science</option>
                </select>
              </Field>
              <Field id="sg-dis" label="Disabled">
                <input id="sg-dis" className="input" disabled value="Managed by the school" />
              </Field>
              <div className="row wrap" style={{ gap: 16 }}>
                <Switch checked={sw} onChange={setSw} label="Example switch" />
                <Stars value={stars} onChange={setStars} label="Example rating" />
                <label className="check">
                  <input type="checkbox" defaultChecked /> Checkbox
                </label>
              </div>
            </div>
          </Block>
          <Block title="Navigation controls">
            <Tabs idBase="sg" label="Example tabs" value={tab} onChange={setTab} tabs={[{ id: 'a', label: 'All' }, { id: 'b', label: 'Notices', count: 3 }, { id: 'c', label: 'Social' }]} />
            <div style={{ marginTop: 16 }}>
              <Segmented label="Example segmented" value={seg} onChange={setSeg} options={[{ id: 'x', label: 'Day' }, { id: 'y', label: 'Month' }]} />
            </div>
            <div className="row wrap" style={{ gap: 6, marginTop: 16 }}>
              <button className="chip" aria-pressed="true">
                Selected chip
              </button>
              <button className="chip" aria-pressed="false">
                Chip
              </button>
            </div>
            <h3 style={{ fontSize: 'var(--fs-sm)', margin: '20px 0 8px' }}>Badges</h3>
            <div className="row wrap" style={{ gap: 6 }}>
              <span className="badge badge-ok">
                <CheckCircle2 aria-hidden /> Present
              </span>
              <span className="badge badge-warn">Late</span>
              <span className="badge badge-danger">
                <AlertCircle aria-hidden /> Overdue
              </span>
              <span className="badge badge-info">Pending</span>
              <span className="badge badge-primary">Now</span>
              <span className="badge badge-outline">Outline</span>
              <PrototypeTag />
            </div>
          </Block>
        </div>

        <div className="grid grid-3">
          <Block title="Stat card">
            <StatCard label="Attendance" value="90.9" unit="%" icon={<CheckCircle2 size={17} />} tint="var(--sage)" foot="Up 5.2 pts in Oct" />
          </Block>
          <Block title="Progress">
            <div className="stack">
              <ProgressBar value={64} label="Example progress" />
              <ProgressBar value={30} label="Example progress large" size="lg" color="var(--chart-5)" />
            </div>
            <div style={{ marginTop: 16 }}>
              <Insight>Insights sit under every chart in plain language.</Insight>
            </div>
          </Block>
          <Block title="Subject swatches">
            <div className="row wrap" style={{ gap: 8 }}>
              {subjects.map((s) => (
                <SubjectBadge key={s.id} short={s.short} tint={s.tint} />
              ))}
            </div>
          </Block>
        </div>

        <div className="grid grid-2">
          <Block title="Notification item">
            <ul className="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li className="list-row">
                <span className="dot" style={{ background: 'var(--primary)' }} aria-hidden />
                <div className="list-row-main">
                  <div className="list-row-title">Due tomorrow: Exercise 2.3</div>
                  <div className="list-row-meta">Tasks · Today</div>
                </div>
                <button className="btn btn-secondary btn-sm">Open</button>
              </li>
            </ul>
          </Block>
          <Block title="Calendar elements">
            <div className="week-strip" style={{ maxWidth: 380 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
                <button key={d} className="week-day" aria-pressed={i === 2}>
                  <span className="week-day-name">{d}</span>
                  <span className="week-day-num">{26 + i}</span>
                  <span className="week-day-dots" aria-hidden>
                    {i === 4 && <i style={{ background: 'var(--chart-3)' }} />}
                  </span>
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 3, marginTop: 14 }} aria-hidden>
              {['present', 'present', 'late', 'half', 'absent', 'holiday'].map((v, i) => (
                <span key={i} className="heat-cell" data-v={v} style={{ display: 'inline-block' }} />
              ))}
            </div>
          </Block>
        </div>

        <div className="grid grid-2">
          <Block title="Timeline">
            <DayTimeline date={TODAY} compact hidePast />
          </Block>
          <ChartCard title="Chart card" subtitle="Title, labels, values, insight and a table fallback." insight="Every chart has one plain-language insight computed from its data." table={{ head: ['Day', 'Value'], rows: [['Mon', 3], ['Tue', 5], ['Wed', 4]] }}>
            <ColumnChart data={[{ label: 'Mon', value: 3 }, { label: 'Tue', value: 5 }, { label: 'Wed', value: 4 }]} max={6} />
          </ChartCard>
        </div>

        <div className="grid grid-2">
          <Block title="Chat bubbles">
            <div className="stack" style={{ gap: 8 }}>
              <div className="bubble bubble-bot">Hi! What are you working on?</div>
              <div className="bubble bubble-me">Make me a revision plan</div>
              <div className="bubble bubble-bot bubble-care">Wellbeing replies use a calmer tone.</div>
            </div>
          </Block>
          <Block title="Music player & overlays">
            <div className="row wrap" style={{ gap: 10 }}>
              <span className="dock-mini">
                <span className="eq" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                24:12
                <span className="icon-btn icon-btn-sm" style={{ background: 'var(--bg-sunk)' }} aria-hidden>
                  <Headphones size={15} />
                </span>
              </span>
              <span className="dock-mini">
                <Timer size={16} aria-hidden /> Focus
              </span>
            </div>
            <div className="row wrap" style={{ gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setModal(true)}>
                Open modal
              </button>
              <button className="btn btn-secondary" onClick={() => setDrawer(true)}>
                Open drawer
              </button>
            </div>
          </Block>
        </div>

        <Block title="States" note="Empty, loading, error, success and disabled.">
          <div className="grid grid-3">
            <div className="card-flat">
              <Empty icon={<Inbox size={22} />} title="Nothing here yet">
                Helpful empty states say what to do next.
              </Empty>
            </div>
            <div className="card-flat stack" aria-busy="true" aria-label="Loading example">
              <div className="skeleton" style={{ height: 18, width: '60%' }} />
              <div className="skeleton" style={{ height: 12 }} />
              <div className="skeleton" style={{ height: 12, width: '80%' }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
            <div className="stack">
              <p className="notice notice-danger">
                <AlertCircle size={16} aria-hidden /> Couldn’t load this resource. Try again.
              </p>
              <p className="notice notice-ok">
                <CheckCircle2 size={16} aria-hidden /> Saved on this device.
              </p>
              <p className="notice notice-warn">
                <AlertCircle size={16} aria-hidden /> Heads-up messages are kind and specific.
              </p>
              <p className="notice notice-neutral">Focus rings use a 2.5px accent outline. Press Tab to see them. Reduced motion keeps fades but removes movement.</p>
            </div>
          </div>
        </Block>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Modal" description="Centred, traps focus, closes on Escape or backdrop." footer={<button className="btn btn-primary" onClick={() => setModal(false)}>Done</button>}>
        <p>Modals are for short, focused decisions.</p>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer" description="Slides in from the right; full width on phones.">
        <p>Drawers hold details without leaving the page.</p>
      </Drawer>
    </>
  )
}
