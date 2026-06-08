import type { EnergyLevel, Task } from '../types'
import { isSnoozed, isStuck } from '../types'

export type CalendarSource = 'WORK' | 'PERSONAL'

export interface CalendarEvent {
  title: string
  start: number
  end: number
  source: CalendarSource
}

export interface FreeSlot {
  start: number
  end: number
}

export interface SlotSuggestion {
  slot: FreeSlot
  task: Task | null
}

/** When you're willing to work: a daily window and which weekdays count. */
export interface Availability {
  startHour: number // 0–23, inclusive
  endHour: number // 1–24, exclusive
  weekdays: number[] // 0=Sun … 6=Sat
}

export const DEFAULT_AVAILABILITY: Availability = {
  startHour: 9,
  endHour: 21,
  weekdays: [0, 1, 2, 3, 4, 5, 6],
}

export const slotMinutes = (slot: FreeSlot) => Math.round((slot.end - slot.start) / 60000)

const DAY = 24 * 60 * 60 * 1000

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function atHourOn(dayStart: number, hour: number): number {
  return dayStart + hour * 60 * 60 * 1000
}

/**
 * Open gaps across the next `horizonDays`, clipped to the user's availability
 * window each day, with busy intervals subtracted. Shared by the demo and the
 * real Google provider — only the busy list differs.
 */
export function freeSlotsInWindow(
  busy: { start: number; end: number }[],
  availability: Availability,
  horizonDays = 7,
  now = Date.now(),
): FreeSlot[] {
  const slots: FreeSlot[] = []
  const today = startOfDay(now)

  for (let d = 0; d < horizonDays; d++) {
    const dayStart0 = today + d * DAY
    const weekday = new Date(dayStart0).getDay()
    if (!availability.weekdays.includes(weekday)) continue

    let windowStart = atHourOn(dayStart0, availability.startHour)
    const windowEnd = atHourOn(dayStart0, availability.endHour)
    if (d === 0) windowStart = Math.max(windowStart, now)
    if (windowEnd <= windowStart) continue

    const dayBusy = busy
      .filter((e) => e.end > windowStart && e.start < windowEnd)
      .sort((a, b) => a.start - b.start)

    let cursor = windowStart
    for (const e of dayBusy) {
      if (e.start > cursor) slots.push({ start: cursor, end: e.start })
      cursor = Math.max(cursor, e.end)
    }
    if (cursor < windowEnd) slots.push({ start: cursor, end: windowEnd })
  }

  return slots.filter((s) => slotMinutes(s) >= 15)
}

/** A representative day of demo events (today), spread across the two calendars. */
export function sampleDay(now = Date.now()): CalendarEvent[] {
  const today = startOfDay(now)
  const at = (h: number, m = 0) => atHourOn(today, h) + m * 60000
  return [
    { title: 'Standup', start: at(9), end: at(9, 15), source: 'WORK' },
    { title: 'Design review', start: at(10, 30), end: at(11, 30), source: 'WORK' },
    { title: 'Lunch', start: at(12, 30), end: at(13), source: 'PERSONAL' },
    { title: '1:1 with manager', start: at(14), end: at(14, 30), source: 'WORK' },
    { title: 'School pickup', start: at(16, 30), end: at(17), source: 'PERSONAL' },
  ]
}

/** Energy people typically have through the day — used as a soft preference. */
function energyForHour(millis: number): EnergyLevel {
  const hour = new Date(millis).getHours()
  if (hour >= 8 && hour <= 11) return 'HIGH'
  if (hour >= 13 && hour <= 15) return 'LOW'
  return 'MEDIUM'
}

/** Greedily place the best-fitting task into each slot, preferring an energy match. */
export function matchSlots(slots: FreeSlot[], tasks: Task[]): SlotSuggestion[] {
  const candidates = tasks
    .filter((t) => t.status !== 'DONE' && t.scheduledAt == null && !isSnoozed(t))
    .sort((a, b) => {
      const stuckDiff = Number(isStuck(b)) - Number(isStuck(a))
      if (stuckDiff !== 0) return stuckDiff
      return (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity)
    })

  const remaining = [...candidates]
  return slots.map((slot) => {
    const wanted = energyForHour(slot.start)
    const mins = slotMinutes(slot)
    let best: Task | null = null
    let bestScore = Infinity
    for (const t of remaining) {
      if ((t.estimatedMinutes ?? 15) > mins) continue
      const energyPenalty = t.energy === wanted ? 0 : 1
      const sizeGap = mins - (t.estimatedMinutes ?? 15)
      const score = energyPenalty * 1000 + sizeGap
      if (score < bestScore) {
        bestScore = score
        best = t
      }
    }
    if (best) remaining.splice(remaining.indexOf(best), 1)
    return { slot, task: best }
  })
}
