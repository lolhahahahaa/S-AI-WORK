import type { SubjectId } from './school'

export type TaskStatus = 'pending' | 'submitted' | 'graded'
export type Priority = 'low' | 'medium' | 'high'

export interface Assignment {
  id: string
  kind: 'assignment'
  subject: SubjectId
  title: string
  details: string
  due: string
  status: TaskStatus
  priority: Priority
  submittedOn?: string
  grade?: string
  teacherNote?: string
  resourceId?: string
}

export interface Todo {
  id: string
  kind: 'todo'
  title: string
  categoryId: string
  due?: string
  done: boolean
  priority: Priority
  subject?: SubjectId
  notes?: string
}

export interface TodoCategory {
  id: string
  name: string
  color: string
}

export const defaultCategories: TodoCategory[] = [
  { id: 'revision', name: 'Revision', color: '#4f9a72' },
  { id: 'clubs', name: 'Clubs', color: '#d0844f' },
  { id: 'reading', name: 'Reading', color: '#c9a227' },
  { id: 'personal', name: 'Personal', color: '#4968d5' },
]

export const categoryPalette = ['#4968d5', '#4f9a72', '#d0844f', '#8b6cc7', '#c9a227', '#4aa3b5', '#c2577a']

// Teacher-set assignments (sample). Students can mark them submitted in the demo,
// but cannot delete them — they belong to the class, not the student.
export const defaultAssignments: Assignment[] = [
  { id: 'a1', kind: 'assignment', subject: 'math', title: 'Exercise 2.3 — Polynomials', details: 'Questions 1–5 in your notebook. Show working for division of polynomials.', due: '2026-10-29', status: 'pending', priority: 'high', resourceId: 'math-poly-notes' },
  { id: 'a2', kind: 'assignment', subject: 'sci', title: 'Lab record: Separation of mixtures', details: 'Write up the chromatography and filtration experiments with diagrams.', due: '2026-10-30', status: 'pending', priority: 'medium', resourceId: 'sci-matter-notes' },
  { id: 'a3', kind: 'assignment', subject: 'eng', title: 'Essay: A person who inspires me', details: '250–300 words. Plan in paragraphs: introduction, two qualities with examples, conclusion.', due: '2026-11-02', status: 'pending', priority: 'medium' },
  { id: 'a4', kind: 'assignment', subject: 'sst', title: 'Map work: Physical features of India', details: 'Mark the major mountain ranges, plateaus and plains on the outline map.', due: '2026-10-27', status: 'pending', priority: 'high', resourceId: 'sst-physical-notes' },
  { id: 'a5', kind: 'assignment', subject: 'hin', title: 'पत्र लेखन — औपचारिक पत्र', details: 'Formal letter to the principal requesting a library period extension.', due: '2026-10-26', status: 'submitted', priority: 'medium', submittedOn: '2026-10-25' },
  { id: 'a6', kind: 'assignment', subject: 'comp', title: 'HTML practice: my profile page', details: 'Use headings, a list and one image with alt text.', due: '2026-10-23', status: 'graded', priority: 'medium', submittedOn: '2026-10-22', grade: '18/20', teacherNote: 'Clean structure. Add a page title next time.' },
  { id: 'a7', kind: 'assignment', subject: 'math', title: 'Number systems worksheet', details: 'Rational and irrational numbers, Q1–12.', due: '2026-10-16', status: 'graded', priority: 'medium', submittedOn: '2026-10-15', grade: '17/20', teacherNote: 'Good. Recheck Q9 on rationalising denominators.' },
  { id: 'a8', kind: 'assignment', subject: 'sci', title: 'Atoms & molecules — quiz corrections', details: 'Correct and explain each wrong answer.', due: '2026-10-14', status: 'graded', priority: 'low', submittedOn: '2026-10-15', grade: '9/10' },
  { id: 'a9', kind: 'assignment', subject: 'eng', title: 'Reading log: chapters 4–5', details: 'Summary and two questions you would ask the author.', due: '2026-10-12', status: 'graded', priority: 'low', submittedOn: '2026-10-11', grade: 'A' },
  { id: 'a10', kind: 'assignment', subject: 'sst', title: 'Notes for class debate on democracy', details: 'One argument for and one against, with an example each.', due: '2026-10-09', status: 'graded', priority: 'medium', submittedOn: '2026-10-09', grade: 'B+' },
  { id: 'a11', kind: 'assignment', subject: 'hin', title: 'कविता सारांश', details: 'Summary of the poem in your own words.', due: '2026-10-07', status: 'graded', priority: 'low', submittedOn: '2026-10-08', grade: 'B' },
  { id: 'a12', kind: 'assignment', subject: 'comp', title: 'Spreadsheet basics', details: 'Create a budget sheet using SUM and AVERAGE.', due: '2026-10-05', status: 'graded', priority: 'low', submittedOn: '2026-10-03', grade: '19/20' },
  { id: 'a13', kind: 'assignment', subject: 'math', title: 'Linear equations practice', details: 'Exercise 4.2, all questions.', due: '2026-10-01', status: 'graded', priority: 'low', submittedOn: '2026-09-30', grade: '16/20' },
]

export const defaultTodos: Todo[] = [
  { id: 't1', kind: 'todo', title: 'Revise Polynomials notes before the test', categoryId: 'revision', due: '2026-10-31', done: false, priority: 'high', subject: 'math' },
  { id: 't2', kind: 'todo', title: 'Football drills with the house team', categoryId: 'clubs', due: '2026-10-29', done: false, priority: 'medium' },
  { id: 't3', kind: 'todo', title: 'Read 20 pages of my library book', categoryId: 'reading', done: false, priority: 'low' },
  { id: 't4', kind: 'todo', title: 'Return library book', categoryId: 'personal', due: '2026-10-27', done: true, priority: 'low' },
]
