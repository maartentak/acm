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
realistic demo provider that computes genuine free slots. Add the two optional
secrets below to light up real Google Calendar and LLM-powered breakdown.

## Optional configuration

Copy `.env.example` and fill in what you want:

| Variable | Where | Effect |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | client (`.env.local`) | Enables real Google sign-in on the Calendar screen. Unset → demo data. |
| `ANTHROPIC_API_KEY` | server (host dashboard) | Enables LLM task breakdown via `/api/breakdown`. Unset → offline heuristic. |

Both features **degrade gracefully** — the app is fully functional without either.

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

## LLM-powered breakdown

Already wired. The Break-it-down button calls `breakDownTaskSmart()`
(`src/lib/breakdown.ts`), which POSTs to the serverless function
`api/breakdown.ts`. That function calls **Claude (`claude-haiku-4-5`)** with an
ADHD-tuned prompt and returns `{ steps: [...] }` — Haiku keeps the tap fast and
cheap; bump it to a larger model in `api/breakdown.ts` if you want richer steps. The `ANTHROPIC_API_KEY` lives
**only server-side** — it's never in the browser bundle. If the key is unset or
the call fails/times out, the client silently falls back to the offline
heuristic, so the feature always works.

To run the function locally, use `vercel dev` (or deploy). Under plain
`npm run dev` the `/api` route 404s and the offline fallback kicks in — which is
exactly the intended behavior.

## Connecting real Google Calendar

Already wired (`src/lib/google.ts`), gated behind `VITE_GOOGLE_CLIENT_ID`. One-time setup:

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project and **enable the Google Calendar API**.
2. Configure the **OAuth consent screen** and add yourself as a test user; the
   only scope needed is `.../auth/calendar.readonly`.
3. Create an **OAuth client ID → Web application**. Add your origin (e.g.
   `http://localhost:5173` and your deployed URL) to *Authorized JavaScript
   origins*.
4. Put the client ID in `.env.local` as `VITE_GOOGLE_CLIENT_ID` and rebuild.

The Calendar screen then offers real Google sign-in (connect work *and* personal
accounts — it accumulates free/busy across both). Momentum requests only the
**read-only free/busy** scope; it never reads event details or writes anything.
`computeFreeSlots()` / `matchSlots()` are shared by the demo and real providers,
so the matching logic is identical either way.

## Reminders & notifications

The Calendar screen has a **Slot reminders** toggle. When on (and you grant
notification permission), `useReminders()` fires a notification the moment a
task's scheduled slot begins, via the service worker — working while the app is
open or backgrounded. Each task is reminded once.

**Limitation:** delivery when the app is *fully closed* needs **Web Push**
(VAPID keys + a push server that stores subscriptions and sends pushes). That
requires a backend with persistence, so it's intentionally left as a follow-up —
the local reminder covers the common "I'm using my phone/laptop" case,
especially on Android where the installed PWA stays warm.

## Deploying

**Vercel is the recommended target** because it serves the static SPA *and* runs
the `/api/breakdown` serverless function with no extra config. `vercel.json` is
already set up (Vite framework + SPA rewrite that excludes `/api`).

1. Import the repo in Vercel and set the **Root Directory** to `web/`.
2. Add environment variables: `ANTHROPIC_API_KEY` (for LLM breakdown) and, if
   using Google, `VITE_GOOGLE_CLIENT_ID`.
3. Deploy. (CLI equivalent: `cd web && vercel`.)

Then open the deployed HTTPS URL on your phone and **Add to Home Screen** to
install it.

> Static-only hosts (GitHub Pages, plain Cloudflare Pages, Netlify without
> functions) work too, but the `/api/breakdown` endpoint won't exist there, so
> breakdown uses the offline heuristic. Configure a catch-all rewrite to
> `index.html` for client-side routing, and serve over HTTPS so the service
> worker activates. Netlify/Cloudflare can host the function too if you port
> `api/breakdown.ts` to their function format.

## Notes

The native Android version that kicked off the project is parked at the repo root
(`/app`, `/settings.gradle.kts`, …) and is no longer the focus.
