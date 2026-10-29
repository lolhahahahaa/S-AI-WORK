// Demo matching: compares the text fields of two reports. This is NOT image
// recognition — the reasons shown to the student are exactly what was scored.
import type { ItemReport } from '../data/community'
import { daysBetween, parse } from './date'

const STOP = new Set(['a', 'an', 'the', 'with', 'and', 'on', 'of', 'in', 'it', 'my', 'is', 'to', 'after', 'lost', 'found', 'near'])
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)))

export interface Match {
  report: ItemReport
  score: number
  label: 'Strong match' | 'Possible match'
  reasons: string[]
}

export function scoreMatch(a: ItemReport, b: ItemReport): Match | null {
  if (a.kind === b.kind || b.status !== 'open') return null
  const reasons: string[] = []
  let score = 0
  if (a.category === b.category) {
    score += 40
    reasons.push('Same type of item')
  }
  const colours = a.colours.filter((c) => b.colours.includes(c))
  if (colours.length) {
    score += 25
    reasons.push(`Same colour: ${colours.join(', ').toLowerCase()}`)
  }
  const shared = [...words(`${a.name} ${a.description}`)].filter((w) => words(`${b.name} ${b.description}`).has(w))
  if (shared.length) {
    score += Math.min(20, shared.length * 7)
    reasons.push(`Description mentions ${shared.slice(0, 3).map((w) => `“${w}”`).join(', ')}`)
  }
  if (a.location === b.location) {
    score += 10
    reasons.push(`Both near ${a.location}`)
  }
  const gap = Math.abs(daysBetween(parse(a.date), parse(b.date)))
  if (gap <= 3) {
    score += 5
    reasons.push(gap === 0 ? 'Same day' : `${gap} day${gap > 1 ? 's' : ''} apart`)
  }
  if (score < 45) return null
  return { report: b, score, label: score >= 70 ? 'Strong match' : 'Possible match', reasons }
}

export const matchesFor = (r: ItemReport, all: ItemReport[]) =>
  all
    .map((b) => scoreMatch(r, b))
    .filter((m): m is Match => !!m)
    .sort((x, y) => y.score - x.score)

/** Downscale a photo in the browser so it fits comfortably in local storage. */
export function readPhoto(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode'))
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
