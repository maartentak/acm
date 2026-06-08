import type { EnergyLevel, Task } from '../types'
import { isStuck } from '../types'

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

export const slotMinutes = (slot: FreeSlot) => Math.round((slot.end - slot.start) / 60000)

function atHour(hour: number, minute = 0): number {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  // If that time already passed today, roll the whole sample day to tomorrow.
  if (d.getTime() < Date.now() - 12 * 3600_000) {
    d.setDate(d.getDate() + 1)
  }
  return d.getTime()
}

/** A representative day spread across the two connected calendars. */
export function sampleDay(): CalendarEvent[] {
  return [
    { title: 'Standup', start: atHour(9), end: atHour(9, 15), source: 'WORK' },
    { title: 'Design review', start: atHour(10, 30), end: atHour(11, 30), source: 'WORK' },
    { title: 'Lunch', start: atHour(12, 30), end: atHour(13), source: 'PERSONAL' },
    { title: '1:1 with manager', start: atHour(14), end: atHour(14, 30), source: 'WORK' },
    { title: 'School pickup', start: atHour(16, 30), end: atHour(17), source: 'PERSONAL' },
  ]
}

interface BusyInterval {
  start: number
  end: number
}

/**
 * Turn a list of busy intervals into the open gaps within waking hours. Shared
 * by the demo provider and the real Google Calendar provider — the only thing
 * that differs between them is where the busy intervals come from.
 */
export function computeFreeSlots(busy: BusyInterval[], wakeHour = 8, sleepHour = 20): FreeSlot[] {
  const dayStart = Math.max(Date.now(), atHour(wakeHour))
  const dayEnd = atHour(sleepHour)
  if (dayEnd <= dayStart) return []

  const sorted = busy
    .filter((e) => e.end > dayStart && e.start < dayEnd)
    .sort((a, b) => a.start - b.start)

  const slots: FreeSlot[] = []
  let cursor = dayStart
  for (const e of sorted) {
    if (e.start > cursor) slots.push({ start: cursor, end: e.start })
    cursor = Math.max(cursor, e.end)
  }
  if (cursor < dayEnd) slots.push({ start: cursor, end: dayEnd })

  return slots.filter((s) => slotMinutes(s) >= 15)
}

/** Demo free slots, derived from the sample day. */
export function freeSlots(): FreeSlot[] {
  return computeFreeSlots(sampleDay())
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
    .filter((t) => t.status !== 'DONE' && t.scheduledAt == null)
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
