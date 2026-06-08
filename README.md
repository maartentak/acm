# Momentum — a living task list for ADHD brains

Momentum is an Android app that helps you actually *finish* your never-ending
to-do list. It's built around two ideas that most task apps miss:

1. **Break it down.** When a task has been sitting too long — postponed a few
   times or untouched for days — Momentum flags it as *stuck* and offers a
   one-tap **Break it down** action that splits it into tiny, concrete, "just
   start" steps. The first step is always a 2-minute physical action, because
   for an ADHD brain momentum comes from *starting*, not from planning.

2. **Find the time.** Momentum connects to your **work and personal Google
   calendars**, reads your free/busy times, and surfaces the real pockets in
   your day where a waiting task would actually fit — matched to the energy you
   tend to have at that hour.

The design is dark, minimal and modern, with a deep-blue gradient hero, smooth
spring animations, satisfying haptic completion, and a calm, low-stimulation
layout — inspired by the reference mockups that kicked off the project.

---

## Status & how to build

This repository contains the complete Android Studio project. It was scaffolded
in a sandbox **without the Android SDK or access to Google's Maven repo**, so it
has not been compiled here — build it on your machine:

```bash
# Requires Android Studio (Koala/Ladybug+) or the Android SDK + JDK 17.
# 1. Open the project in Android Studio and let it sync, OR from the CLI:
echo "sdk.dir=/path/to/your/Android/sdk" > local.properties
./gradlew :app:assembleDebug
# 2. Install on a device/emulator (API 26+):
./gradlew :app:installDebug
```

Gradle will download the Android Gradle Plugin, AndroidX and Compose from
Google's Maven the first time — make sure you're online for that.

---

## What works out of the box

Everything runs **with no accounts and no API keys**:

- **Tasks**: quick brain-dump add, full create/edit (notes, energy level, rough
  size, when), complete, postpone, delete — all persisted locally with Room.
- **Break it down**: an offline, ADHD-tuned heuristic engine
  (`HeuristicBreakdownEngine`) generates 3–6 concrete steps per task, tailored
  to what the task looks like (email, call, write, clean, code, pay, …).
- **Stuck detection**: tasks you keep avoiding bubble up into a dedicated
  "let's unstick one" section on the home screen.
- **Calendar opportunities**: a realistic demo provider
  (`MockCalendarRepository`) generates a typical mixed work/personal day,
  computes the genuine free slots, and suggests which waiting task fits each one.
- **Motivation**: a reactive headline ("You've finished 3 today — you're on a
  roll"), done-today / on-your-plate stats, progress rings, and a satisfying
  springy, haptic check-off.

## Architecture

```
com.momentum
├─ data
│  ├─ local         Room: entities, DAO, database, type converters
│  ├─ repository    TaskRepository — the single source of truth for tasks
│  └─ calendar      CalendarRepository interface + MockCalendarRepository
├─ domain
│  ├─ model         Task, Subtask, EnergyLevel, TaskStatus (+ "isStuck" logic)
│  └─ breakdown     TaskBreakdownEngine + HeuristicBreakdownEngine
├─ ui
│  ├─ theme         dark color scheme, typography, shapes
│  ├─ components    reusable widgets (gradient header, task row, buttons, rings)
│  ├─ home          HomeScreen + HomeViewModel
│  ├─ detail        TaskDetailScreen + ViewModel (the Break-it-down screen)
│  ├─ edit          AddEditTaskScreen + ViewModel
│  └─ calendar      CalendarScreen + ViewModel (opportunities)
├─ AppContainer     hand-rolled DI — swap implementations in one place
├─ MomentumApp      Application
└─ MainActivity     Compose host
```

- **UI**: Jetpack Compose + Material 3, single-Activity, Compose Navigation.
- **State**: MVVM with `ViewModel` + `StateFlow`, unidirectional data flow.
- **Persistence**: Room (KSP). **DI**: a tiny manual `AppContainer` — no
  framework, easy to follow and swap.

Both "smart" features are behind interfaces specifically so they can be upgraded
without touching the UI:

## Upgrading "Break it down" to an LLM

`TaskBreakdownEngine` is a one-method interface. To use a cloud model instead of
the bundled heuristics, implement it and swap the wiring in
`AppContainer.breakdownEngine`:

```kotlin
val breakdownEngine: TaskBreakdownEngine = LlmBreakdownEngine(apiKey = BuildConfig.LLM_KEY)
```

A good prompt mirrors the heuristic's principles: 3–6 steps, first step tiny and
physical, concrete verbs, no vague "decide what to do".

## Connecting real Google Calendar

The app already talks to calendars through the `CalendarRepository` interface;
only the implementation needs swapping. To go live:

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project, enable the **Google Calendar API**, configure the OAuth consent
   screen, and create an **Android OAuth client** with your app's package name
   (`com.momentum`) and signing-certificate SHA-1.
2. Add **Credential Manager / Sign in with Google** and the Calendar API client
   libraries to `app/build.gradle.kts`.
3. Create `GoogleCalendarRepository : CalendarRepository` that signs the user in,
   lists their calendars (work + personal accounts), and returns free/busy via
   the Calendar `freebusy` endpoint — then keep `freeSlots()` exactly as the mock
   computes it (gaps between busy blocks within waking hours).
4. Swap `AppContainer.calendarRepository` to the new implementation.

Because only `AppContainer` references the concrete class, nothing else changes.

## Roadmap ideas

- Reminders/notifications for scheduled slots
- Streaks & gentle weekly review
- Two-way calendar write (block the slot you scheduled)
- Voice brain-dump capture (matching the mic affordance in the references)
