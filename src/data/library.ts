import type { SubjectId } from './school'

export type ResourceType = 'notes' | 'video' | 'practice'

export interface Question {
  q: string
  options: string[]
  answer: number
  why: string
}

export interface Resource {
  id: string
  subject: SubjectId
  chapter: string
  type: ResourceType
  title: string
  minutes: number
  summary: string
  /** Notes: short sections. Video: an outline of what the sample video would cover. */
  sections?: { heading: string; body: string }[]
  questions?: Question[]
}

export interface Chapter {
  subject: SubjectId
  name: string
}

export const chapters: Chapter[] = [
  { subject: 'math', name: 'Number systems' },
  { subject: 'math', name: 'Polynomials' },
  { subject: 'sci', name: 'Matter in our surroundings' },
  { subject: 'sci', name: 'Atoms and molecules' },
  { subject: 'eng', name: 'Writing skills' },
  { subject: 'eng', name: 'Grammar' },
  { subject: 'sst', name: 'Physical features of India' },
  { subject: 'sst', name: 'What is democracy?' },
  { subject: 'hin', name: 'पत्र लेखन' },
  { subject: 'comp', name: 'HTML basics' },
  { subject: 'comp', name: 'Spreadsheets' },
]

export const resources: Resource[] = [
  {
    id: 'math-ns-notes', subject: 'math', chapter: 'Number systems', type: 'notes', title: 'Rational and irrational numbers', minutes: 8,
    summary: 'How to tell rational from irrational numbers, with decimal expansions.',
    sections: [
      { heading: 'Rational numbers', body: 'A number is rational if it can be written as p/q, where p and q are integers and q ≠ 0. Their decimal expansions either end (0.25) or repeat (0.333…).' },
      { heading: 'Irrational numbers', body: 'Irrational numbers cannot be written as p/q. Their decimals never end and never repeat — for example √2 and π.' },
      { heading: 'Quick check', body: 'If a decimal stops or settles into a repeating block, it is rational. √n is irrational whenever n is not a perfect square.' },
    ],
  },
  {
    id: 'math-ns-practice', subject: 'math', chapter: 'Number systems', type: 'practice', title: 'Number systems — quick practice', minutes: 6,
    summary: 'Three questions to check your understanding.',
    questions: [
      { q: 'Which of these is irrational?', options: ['0.75', '√9', '√5', '2/3'], answer: 2, why: '5 is not a perfect square, so √5 is irrational. √9 = 3.' },
      { q: '0.121212… is', options: ['Rational', 'Irrational', 'Neither', 'Not a real number'], answer: 0, why: 'It repeats the block "12", so it can be written as 12/99.' },
      { q: 'Between any two rational numbers there is', options: ['No other number', 'Exactly one rational', 'Infinitely many rationals', 'Only irrationals'], answer: 2, why: 'You can always take the average, then repeat — there are infinitely many.' },
    ],
  },
  {
    id: 'math-poly-notes', subject: 'math', chapter: 'Polynomials', type: 'notes', title: 'Polynomials: degree and zeros', minutes: 10,
    summary: 'Degree, types of polynomials and how to find zeros.',
    sections: [
      { heading: 'Degree', body: 'The degree is the highest power of the variable. 3x² + 2x − 5 has degree 2, so it is quadratic.' },
      { heading: 'Zeros', body: 'A zero of p(x) is a value of x that makes p(x) = 0. For x − 4, the zero is 4.' },
      { heading: 'Remainder theorem', body: 'When p(x) is divided by (x − a), the remainder is p(a). This saves long division when you only need the remainder.' },
    ],
  },
  {
    id: 'math-poly-video', subject: 'math', chapter: 'Polynomials', type: 'video', title: 'Dividing polynomials step by step', minutes: 12,
    summary: 'A walkthrough of long division with polynomials.',
    sections: [
      { heading: '0:00 — Setting up', body: 'Write both polynomials in descending powers. Fill gaps with 0 terms.' },
      { heading: '3:10 — First step', body: 'Divide the leading terms, multiply back, subtract.' },
      { heading: '7:40 — Checking', body: 'Use dividend = divisor × quotient + remainder.' },
    ],
  },
  {
    id: 'math-poly-practice', subject: 'math', chapter: 'Polynomials', type: 'practice', title: 'Polynomials — test warm-up', minutes: 8,
    summary: 'Warm-up questions for Periodic Test 2.',
    questions: [
      { q: 'What is the degree of 4x³ − x + 7?', options: ['1', '2', '3', '7'], answer: 2, why: 'The highest power of x is 3.' },
      { q: 'The zero of 2x − 6 is', options: ['−3', '3', '6', '2'], answer: 1, why: '2x − 6 = 0 gives x = 3.' },
      { q: 'Remainder when x² + 1 is divided by (x − 2)?', options: ['1', '3', '5', '0'], answer: 2, why: 'p(2) = 4 + 1 = 5.' },
    ],
  },
  {
    id: 'sci-matter-notes', subject: 'sci', chapter: 'Matter in our surroundings', type: 'notes', title: 'States of matter and separation', minutes: 9,
    summary: 'Solids, liquids, gases and common separation methods.',
    sections: [
      { heading: 'States of matter', body: 'Particles in solids are tightly packed, liquids flow, and gases spread to fill their container.' },
      { heading: 'Evaporation', body: 'Evaporation happens at the surface below boiling point and causes cooling — which is why sweating cools you.' },
      { heading: 'Separating mixtures', body: 'Filtration removes insoluble solids, chromatography separates dyes, and distillation separates liquids with different boiling points.' },
    ],
  },
  {
    id: 'sci-matter-video', subject: 'sci', chapter: 'Matter in our surroundings', type: 'video', title: 'Chromatography in the lab', minutes: 7,
    summary: 'What the chromatography experiment should look like.',
    sections: [
      { heading: '0:00 — Materials', body: 'Filter paper strip, ink dot, a glass of water.' },
      { heading: '2:30 — Observation', body: 'Water rises and carries dyes different distances.' },
    ],
  },
  {
    id: 'sci-atoms-practice', subject: 'sci', chapter: 'Atoms and molecules', type: 'practice', title: 'Atoms and molecules check', minutes: 5,
    summary: 'Three quick questions.',
    questions: [
      { q: 'The chemical formula of water is', options: ['H₂O', 'HO₂', 'H₂O₂', 'OH'], answer: 0, why: 'Two hydrogen atoms and one oxygen atom.' },
      { q: 'Which law says mass is neither created nor destroyed in a reaction?', options: ['Constant proportions', 'Conservation of mass', 'Multiple proportions', 'Avogadro’s law'], answer: 1, why: 'The law of conservation of mass.' },
      { q: 'An atom is', options: ['Always visible', 'The smallest unit of an element', 'A mixture', 'A compound'], answer: 1, why: 'Atoms are the smallest units of an element.' },
    ],
  },
  {
    id: 'eng-essay-notes', subject: 'eng', chapter: 'Writing skills', type: 'notes', title: 'Planning a short essay', minutes: 6,
    summary: 'A simple four-paragraph structure.',
    sections: [
      { heading: 'Plan first', body: 'Spend two minutes listing your main point and two supporting examples.' },
      { heading: 'Structure', body: 'Introduction → point one with example → point two with example → conclusion that links back.' },
      { heading: 'Check', body: 'Read it once for meaning and once for spelling and punctuation.' },
    ],
  },
  {
    id: 'eng-grammar-practice', subject: 'eng', chapter: 'Grammar', type: 'practice', title: 'Tenses practice', minutes: 5,
    summary: 'Choose the correct tense.',
    questions: [
      { q: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1, why: 'Simple present, third person singular takes "goes".' },
      { q: 'By next year, I ___ my course.', options: ['finish', 'will have finished', 'finished', 'am finishing'], answer: 1, why: 'Future perfect for an action completed before a future time.' },
      { q: 'They ___ football when it started raining.', options: ['play', 'were playing', 'have played', 'plays'], answer: 1, why: 'Past continuous for an action interrupted in the past.' },
    ],
  },
  {
    id: 'sst-physical-notes', subject: 'sst', chapter: 'Physical features of India', type: 'notes', title: 'The six physical divisions', minutes: 10,
    summary: 'A map-friendly overview for your map work and test.',
    sections: [
      { heading: 'The six divisions', body: 'The Himalayan mountains, the Northern Plains, the Peninsular Plateau, the Indian Desert, the Coastal Plains and the Islands.' },
      { heading: 'Himalayas', body: 'Three parallel ranges: the Himadri (Greater), the Himachal (Lesser) and the Shiwaliks (Outer).' },
      { heading: 'Peninsular Plateau', body: 'Made of old crystalline rocks. Two parts: the Central Highlands and the Deccan Plateau, edged by the Western and Eastern Ghats.' },
    ],
  },
  {
    id: 'sst-physical-practice', subject: 'sst', chapter: 'Physical features of India', type: 'practice', title: 'Physical features practice', minutes: 6,
    summary: 'Prepare for map work and the test.',
    questions: [
      { q: 'The outermost range of the Himalayas is the', options: ['Himadri', 'Himachal', 'Shiwaliks', 'Purvachal'], answer: 2, why: 'The Shiwaliks are the outer range.' },
      { q: 'The Deccan Plateau is part of the', options: ['Northern Plains', 'Peninsular Plateau', 'Coastal Plains', 'Indian Desert'], answer: 1, why: 'It forms the southern part of the Peninsular Plateau.' },
      { q: 'Lakshadweep is a group of', options: ['Coral islands', 'Volcanic islands', 'River islands', 'Mountain peaks'], answer: 0, why: 'Lakshadweep is made of coral deposits.' },
    ],
  },
  {
    id: 'sst-democracy-notes', subject: 'sst', chapter: 'What is democracy?', type: 'notes', title: 'Features of democracy', minutes: 7,
    summary: 'Key features with examples.',
    sections: [
      { heading: 'Rule by elected representatives', body: 'Final decisions are made by people the citizens elect.' },
      { heading: 'Free and fair elections', body: 'People get a real choice and can change those in power.' },
      { heading: 'Rule of law and rights', body: 'Government works within the limits of the constitution and respects citizens’ rights.' },
    ],
  },
  {
    id: 'hin-letter-notes', subject: 'hin', chapter: 'पत्र लेखन', type: 'notes', title: 'औपचारिक पत्र का प्रारूप', minutes: 6,
    summary: 'Format of a formal letter in Hindi.',
    sections: [
      { heading: 'क्रम', body: 'प्रेषक का पता → दिनांक → प्राप्तकर्ता → विषय → संबोधन → मुख्य भाग → समापन → हस्ताक्षर।' },
      { heading: 'ध्यान दें', body: 'विषय छोटा और स्पष्ट रखें। भाषा विनम्र हो।' },
    ],
  },
  {
    id: 'comp-html-notes', subject: 'comp', chapter: 'HTML basics', type: 'notes', title: 'Structure of an HTML page', minutes: 8,
    summary: 'Tags you need for your first page.',
    sections: [
      { heading: 'Skeleton', body: 'Every page has <html>, <head> (with a <title>) and <body>.' },
      { heading: 'Content tags', body: 'Use <h1>–<h6> for headings, <p> for paragraphs, <ul>/<li> for lists and <img alt="…"> for images.' },
      { heading: 'Accessibility', body: 'Always write alt text that describes the image for people who cannot see it.' },
    ],
  },
  {
    id: 'comp-sheet-video', subject: 'comp', chapter: 'Spreadsheets', type: 'video', title: 'SUM, AVERAGE and cell references', minutes: 9,
    summary: 'Formulas used in the budget assignment.',
    sections: [
      { heading: '0:00 — Cells', body: 'Rows are numbers, columns are letters; B3 is column B, row 3.' },
      { heading: '3:00 — Formulas', body: '=SUM(B2:B8) adds a range; =AVERAGE(B2:B8) finds the mean.' },
    ],
  },
]

export const typeLabels: Record<ResourceType, string> = { notes: 'Notes', video: 'Video', practice: 'Practice' }

// Sample progress the student already has before they touch anything.
export const defaultProgress: Record<string, { progress: number; lastOpened: string }> = {
  'math-ns-notes': { progress: 100, lastOpened: '2026-10-14' },
  'math-poly-notes': { progress: 60, lastOpened: '2026-10-27' },
  'sci-matter-notes': { progress: 100, lastOpened: '2026-10-20' },
  'comp-html-notes': { progress: 100, lastOpened: '2026-10-21' },
  'eng-essay-notes': { progress: 30, lastOpened: '2026-10-25' },
}
