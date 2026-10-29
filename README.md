# [School Name] Portal — frontend prototype

A school ERP/LMS portal for students in Grades 6–12, built as an interactive, frontend-only prototype. Sample student: Aarav Sharma, Grade 9B, academic year 2026–27.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (normally http://localhost:5173).

Other scripts: `npm run build` (typecheck + production build), `npm run lint` (oxlint), `npm run preview`.

## What's real and what's demo

- **No backend.** Everything runs in the browser. Preferences, tasks, RSVPs, gate passes, ratings and feedback are saved to `localStorage` on this device only. Nothing is sent anywhere.
- **Fixed demo date:** Wednesday 28 October 2026, 10:35 am (`src/lib/date.ts`). All data, charts and insights are anchored to it.
- **Sample data** lives in `src/data/`. Every chart and insight sentence is derived from it in `src/lib/insights.ts`, so they always agree.
- **Study Buddy** uses scripted, rules-based replies (`src/lib/buddy.ts`). It isn't an AI model or a counsellor. Chat and mood check-ins are kept in memory only and are never written to storage.
- **Suggestions** on Home come from simple rules (upcoming test, due or overdue task, lowest subject, attendance below target, voluntary low mood, unanswered event).
- **Gate pass approvals** are simulated. The QR-style pattern is decorative and can't be scanned.
- **Roles** (Student / Parent / Teacher / Admin) are prototype views from the account menu, not real sign-in or access control. Private wellbeing data is never shown to the other roles.
- **Ambient sound** is generated with the Web Audio API. No recorded tracks are included and no music service is connected.
- **External help:** the only external contacts are Tele-MANAS (14416 / 1-800-891-4416, Ministry of Health & Family Welfare) and India's 112 emergency number. School counsellor details are blank placeholders until an admin enters verified ones in Settings → School.

## Connected modules (v2)

- **Catch Me Up** (`/catch-up`, Home card): pick a missed day → see each missed class (teacher-posted notes, homework, announcements, deadline changes, honest gaps) → a prioritised recovery plan with reasons and effort → knowledge check. Homework steps update Tasks; reading steps update the library and credits. Built from `src/data/catchup.ts` + attendance; logic in `src/lib/catchup.ts`.
- **Lost & Found** (`/lost-found`): report lost/found items with photo upload (resized in-browser), explained text-based matching (`src/lib/lostfound.ts` — not image recognition), and a claim flow where identifying details stay hidden until the office approves. Staff roles get an Office review tab.
- **Peer Help Exchange** (`/peer-help`): pick topics you need/offer and your free school slots; see suggested classmates with the reason, request sessions (contact details are blocked), accept invitations; teachers approve sessions and confirm participation. No private messaging.
- **Support alerts** (`/support-alerts`, Teacher/Admin only): three visible rules over a fictional roster, an explanation of what's known and missing, and human-review actions (review, check-in, mentor, follow-up, resolve, dismiss with reason). Never shown to students or parents; hiding the page is not real security.
- **Portal map** (`/explore`): interactive 3D layered model of the portal (React Three Fiber, lazy-loaded) with a camera push-in from behind a cover panel, drag-to-rotate, layer focus, scroll-driven separate/reassemble, a pinned horizontal Catch Me Up walkthrough, a scroll-drawn system diagram, Lenis smooth scrolling (this page only) and a 2D fallback when WebGL or motion is unavailable.

## Motion system

Tokens in `src/lib/motion.ts` (durations, easings, staggers) plus helpers: `useFlip` (GSAP Flip layout morphs: class card → recap, item card → detail, alert row → review, peer card → request form) and `useClipReveal` (step panels). Route changes use the View Transitions API via React Router's `viewTransition` (the Catch Me Up card and its progress ring morph into the Catch Me Up header). A once-per-session opening sequence (`src/components/Intro.tsx`) never blocks input. Everything respects reduced motion (OS or Settings).

## Rebranding for another school

Go to Settings → School branding. Name, initials, logo and accent colour apply across the whole app. All colours are CSS tokens in `src/styles/tokens.css`; the Style Guide page (`/style-guide`) renders the live tokens and components.

## Structure

```
src/
  App.tsx              routes (each page lazy-loaded)
  state/store.tsx      persisted demo state + session-only wellbeing state
  data/                sample datasets (school, attendance, tasks, campus, library)
  lib/                 dates, insights, suggestions, Study Buddy rules, audio, motion
  components/          shell, overlays, UI primitives, charts, agenda, focus dock
  pages/               one file per destination
  styles/              tokens, base, components, pages, responsive
```
