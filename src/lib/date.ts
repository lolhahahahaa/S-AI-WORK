// The prototype runs against a fixed "demo today" so that every dataset,
// chart and insight stays consistent no matter when the app is opened.
export const TODAY = new Date(2026, 9, 28) // Wed 28 Oct 2026
export const NOW_MINUTES = 10 * 60 + 35 // 10:35 — mid-morning on the demo day

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const startOfWeek = (d: Date) => {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - day)
  return x
}

export const sameDay = (a: Date, b: Date) => iso(a) === iso(b)

export const daysBetween = (from: Date, to: Date) =>
  Math.round((parse(iso(to)).getTime() - parse(iso(from)).getTime()) / 86400000)

export const daysUntil = (s: string) => daysBetween(TODAY, parse(s))

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', o)
export const fmtDay = (d: Date) => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(d)
export const fmtLong = (d: Date) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d)
export const fmtShort = (d: Date) => fmt({ day: 'numeric', month: 'short' }).format(d)
export const fmtMonth = (d: Date) => fmt({ month: 'long', year: 'numeric' }).format(d)
export const fmtMonthShort = (d: Date) => fmt({ month: 'short' }).format(d)
export const weekdayShort = (d: Date) => fmt({ weekday: 'short' }).format(d)

export const relDay = (s: string) => {
  const n = daysUntil(s)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 1 && n < 7) return `In ${n} days`
  if (n < -1 && n > -7) return `${-n} days ago`
  return fmtShort(parse(s))
}

export const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`
}

export const greetingFor = (minutes: number) =>
  minutes < 12 * 60 ? 'Good morning' : minutes < 17 * 60 ? 'Good afternoon' : 'Good evening'
