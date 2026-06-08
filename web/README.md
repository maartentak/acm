# Momentum (web / PWA)

A living task list for ADHD brains — the **active version** of the project, built
as an installable Progressive Web App so it runs on phone *and* desktop from a
single URL.

Two ideas most task apps miss:

1. **Break it down.** Tasks you keep avoiding (postponed a couple of times, or
   untouched for days) get flagged as *stuck*. One tap on **Break it down for
   me** splits the task into 3–6 tiny, concrete "just start" steps — the first is
   always a 2-minute physical action, because momentum comes from *starting*.
2. **Find the time.** Connect your work + personal Google calendars; Momentum
   reads your free/busy times and surfaces the real pockets in your day where a
   waiting task actually fits, matched to the energy you tend to have then.

Dark, minimal, modern, with smooth Framer Motion animations and satisfying,
haptic task completion.

## Run it

```bash
cd web
npm install
npm run dev      # http://localhost:5173
# or a production build + local preview:
npm run build && npm run preview
```

Everything works with **no accounts and no keys**: tasks persist locally
(localStorage), the breakdown engine runs offline, and the calendar uses a
realistic demo provider that computes genuine free slots.

### Install to your home screen

`npm run build` emits a service worker + web manifest. Serve `dist/` over HTTPS
and the browser will offer **Add to Home Screen** — it then opens full-screen,
works offline, and (on Android) can show push notifications.

## Stack

- **React + TypeScript + Vite**
- **Tailwind CSS** for the design system (colours/typography in `tailwind.config.js`)
- **Framer Motion** for transitions, the springy check-off, and staggered step reveals
- **Zustand** (+ persist) for state, saved to localStorage
- **vite-plugin-pwa** for installability/offline

```
src/
├─ types.ts            domain model + "isStuck" logic
├─ store.ts            Zustand store (the single source of truth)
├─ lib/
│  ├─ breakdown.ts     offline ADHD-tuned step generator
│  ├─ calendar.ts      free-slot detection + task↔slot matching
│  └─ time.ts          formatting helpers
├─ components/         GradientHeader, TaskRow, CompletionCheck, ProgressRing, …
└─ pages/              Home, TaskDetail, EditTask, Calendar
```

## Upgrading "Break it down" to an LLM

`breakDownTask(task)` in `src/lib/breakdown.ts` is a pure function returning
`string[]`. Swap its body for a `fetch` to your model endpoint (keep the same
return shape) and nothing else changes. A good prompt mirrors the heuristic:
3–6 steps, first step tiny and physical, concrete verbs, no vague "decide".

## Connecting real Google Calendar

The app already talks to the calendar through `src/lib/calendar.ts`; only the
data source needs swapping.

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project, enable the **Google Calendar API**, configure the OAuth consent
   screen, and create a **Web OAuth client** with this app's origin as an
   authorized JavaScript origin/redirect.
2. Add **Google Identity Services** and sign the user in with the
   `calendar.readonly` scope (do this for each account — work and personal).
3. Replace `sampleDay()` with a call to the Calendar `freebusy` endpoint and keep
   `freeSlots()` / `matchSlots()` exactly as they are — they already turn busy
   blocks into free slots and match tasks to them.

Because only `calendar.ts` knows where the data comes from, the UI is untouched.

## Deploying

Any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages). It's an SPA,
so configure a catch-all rewrite to `index.html` for client-side routes, and
serve over HTTPS so the PWA/service worker activates.

## Notes

The native Android version that kicked off the project is parked at the repo root
(`/app`, `/settings.gradle.kts`, …) and is no longer the focus.
