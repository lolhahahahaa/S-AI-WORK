// Study Buddy's scripted, rules-based replies. This is NOT an AI model and
// makes no clinical judgements; concerning messages always route to people.
import { resources } from '../data/library'
import { exams, subjectById } from '../data/school'
import { daysUntil, fmtDay, parse, addDays, TODAY } from './date'
import type { Assignment } from '../data/tasks'

export interface BuddyReply {
  text: string
  tone?: 'care' | 'urgent'
  link?: { label: string; to: string }
}

const has = (msg: string, words: string[]) => words.some((w) => msg.includes(w))

const URGENT = ['kill myself', 'suicide', 'suicidal', 'end my life', 'hurt myself', 'harm myself', 'self harm', 'self-harm', 'want to die', 'wanna die', "don't want to live", 'dont want to live', 'cut myself', 'no reason to live', 'better off without me', 'someone is hurting me', 'being abused', 'abuse', 'not safe at home', 'unsafe at home']
const DISTRESS = ['stress', 'anxious', 'anxiety', 'worried', 'worry', 'overwhelm', 'scared', 'nervous', "can't sleep", 'cant sleep', 'sad', 'lonely', 'alone', 'panic', 'pressure', 'cry', 'upset', 'hopeless', 'bullied', 'bully', 'tired of everything', 'feel low', 'feeling low', 'feeling down']

const topicMap: { words: string[]; id: string }[] = [
  { words: ['polynomial', 'degree', 'remainder theorem', 'zeros'], id: 'math-poly-notes' },
  { words: ['rational', 'irrational', 'number system', 'real number'], id: 'math-ns-notes' },
  { words: ['matter', 'evaporation', 'chromatography', 'separation', 'mixture', 'filtration', 'distillation'], id: 'sci-matter-notes' },
  { words: ['atom', 'molecule', 'formula'], id: 'sci-atoms-practice' },
  { words: ['essay', 'paragraph', 'writing'], id: 'eng-essay-notes' },
  { words: ['tense', 'grammar'], id: 'eng-grammar-practice' },
  { words: ['himalaya', 'plateau', 'physical feature', 'map work', 'plains', 'geography'], id: 'sst-physical-notes' },
  { words: ['democracy', 'election', 'civics'], id: 'sst-democracy-notes' },
  { words: ['letter', 'पत्र', 'hindi'], id: 'hin-letter-notes' },
  { words: ['html', 'web page', 'webpage', 'html tag'], id: 'comp-html-notes' },
  { words: ['spreadsheet', 'excel', 'sum(', 'average'], id: 'comp-sheet-video' },
]

export function urgentReply(): BuddyReply {
  return {
    tone: 'urgent',
    text:
      'Thank you for telling me. What you’re feeling matters, and you deserve support from a real person right now — not a demo chatbot.\n\n' +
      '• Please talk to a trusted adult today: a parent or family member, your class teacher, or the school counsellor.\n' +
      '• If you are in danger or might hurt yourself right now, call 112 (India’s emergency number).\n' +
      '• You can also call Tele-MANAS on 14416 or 1-800-891-4416 — a free, 24/7 mental-health helpline from the Government of India.\n\n' +
      'You don’t have to go through this alone.',
  }
}

export function respond(raw: string, ctx: { mode: 'study' | 'wellbeing'; assignments: Assignment[] }): BuddyReply {
  const msg = raw.toLowerCase().trim()

  if (has(msg, URGENT)) return urgentReply()

  if (has(msg, ['talk to someone', 'real person', 'counsellor', 'counselor', 'teacher', 'trusted adult', 'human'])) {
    return {
      tone: 'care',
      text: 'That’s a really good step. A trusted adult — a parent, your class teacher or the school counsellor — can listen properly and help in ways I can’t. The “Talk to a real person” panel shows how to reach them. If it’s hard to start the conversation, you could simply say: “Can I talk to you about something that’s been bothering me?”',
    }
  }

  if (has(msg, ['breath', 'calm down', 'relax'])) {
    return {
      tone: 'care',
      text: 'Let’s try box breathing together:\n\n1. Breathe in slowly for 4 counts.\n2. Hold for 4.\n3. Breathe out for 4.\n4. Hold for 4.\n\nRepeat 4 times. It’s okay if your mind wanders — just come back to counting. How do you feel now?',
    }
  }

  if (has(msg, DISTRESS)) {
    const exam = has(msg, ['exam', 'test'])
    return {
      tone: 'care',
      text:
        (exam ? 'Feeling nervous before tests is really common — it often means you care about doing well. ' : 'Thanks for sharing that. It sounds like a lot right now, and that’s okay to feel. ') +
        'A few things that sometimes help:\n\n• Name one small next step (like 15 minutes on one topic) instead of the whole pile.\n• Take a short break — water, a walk, a stretch.\n• Keep sleep as a priority; tired brains remember less.\n\n' +
        'If this feeling stays or gets heavier, please talk to a trusted adult or the school counsellor. Would you like to try a breathing exercise or make a small plan?',
    }
  }

  if (has(msg, ['plan', 'revise', 'revision', 'exam', 'test', 'prepare', 'timetable'])) {
    const upcoming = exams.filter((e) => daysUntil(e.date) >= 0).slice(0, 3)
    // Non-overlapping windows: revise for each test between the previous test and this one.
    let from = TODAY
    const lines = upcoming.map((e) => {
      const s = subjectById(e.subject)!
      const to = addDays(parse(e.date), -1)
      const range = fmtDay(from) === fmtDay(to) ? fmtDay(to) : `${fmtDay(from)} – ${fmtDay(to)}`
      from = parse(e.date)
      return `• ${range}: ${s.name} (test ${fmtDay(parse(e.date))}) — ${e.syllabus}. Two 25-minute sessions a day, then a practice sheet.`
    })
    return {
      text: `Here’s a gentle plan for your next tests:\n\n${lines.join('\n')}\n\nKeep evenings after 9 pm free to rest, and swap a session for a walk if you’re tired. You can start a focus timer from the Focus button.`,
      link: { label: 'See test dates', to: '/schedule?view=month' },
    }
  }

  if (has(msg, ['homework', 'organis', 'organiz', 'too much', 'task', 'assignment', 'deadline', 'procrastinat'])) {
    const pending = ctx.assignments.filter((a) => a.status === 'pending').sort((a, b) => a.due.localeCompare(b.due))
    if (!pending.length) return { text: 'You have no pending assignments right now. Nice! Maybe pick one revision topic for 20 minutes.' }
    const first = pending[0]
    return {
      text: `Let’s make it smaller. Your pending assignments, by due date:\n\n${pending.map((a) => `• ${a.title} — ${daysUntil(a.due) < 0 ? 'overdue' : `due ${fmtDay(parse(a.due))}`}`).join('\n')}\n\nStart with “${first.title}”. Just do the first 10 minutes — starting is the hardest part. If something is overdue, it’s okay to ask your teacher for help.`,
      link: { label: 'Open tasks', to: '/tasks' },
    }
  }

  if (has(msg, ['focus', 'concentrat', 'distract'])) {
    return {
      text: 'Try this: put your phone in another room, pick one task, and run a 25-minute focus timer with a 5-minute break. Ambient sound can help block distractions — open the Focus player in the corner.',
    }
  }

  for (const t of topicMap) {
    if (has(msg, t.words)) {
      const r = resources.find((x) => x.id === t.id)!
      const body = r.sections?.slice(0, 2).map((s) => `• ${s.heading}: ${s.body}`).join('\n') ?? r.summary
      return {
        text: `Here’s a quick summary of “${r.title}”:\n\n${body}\n\nWant to test yourself? The library has notes and practice for this chapter.`,
        link: { label: `Open ${r.title}`, to: `/library?resource=${r.id}` },
      }
    }
  }

  if (/^(hi|hello|hey|namaste)\b/.test(msg)) {
    return ctx.mode === 'wellbeing'
      ? { tone: 'care', text: 'Hi. This is a calm space. You can tell me how you’re feeling, try a breathing exercise, or find a real person to talk to.' }
      : { text: 'Hi! I can help with revision plans, quick topic summaries, organising homework, or staying focused. What are you working on?' }
  }

  if (has(msg, ['thank'])) return { text: 'You’re welcome. You’re doing better than you think.' }

  return {
    text: 'I’m a prototype with a limited set of pre-written replies, so I may not understand that. You can ask me to:\n\n• make a revision plan\n• explain a topic (try “polynomials” or “physical features of India”)\n• organise your homework\n• help you calm down or find someone to talk to',
  }
}
