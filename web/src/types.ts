export type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type TaskStatus = 'TODO' | 'DONE'

export const ENERGY_LABEL: Record<EnergyLevel, string> = {
  LOW: 'Low energy',
  MEDIUM: 'Some focus',
  HIGH: 'Deep focus',
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes: string
  status: TaskStatus
  energy: EnergyLevel
  estimatedMinutes: number | null
  dueAt: number | null
  scheduledAt: number | null
  createdAt: number
  lastTouchedAt: number
  completedAt: number | null
  postponedCount: number
  /** When we last fired a reminder for this task's scheduled slot (null = none). */
  notifiedAt: number | null
  /** Hidden until this time (snooze); reappears once now passes it. */
  snoozedUntil: number | null
  /** Set when a planned task's day passed undone and it rolled back to backlog. */
  rolledOverAt: number | null
  /** Link back to Google Tasks for two-way completion sync (null = not imported). */
  googleTaskId: string | null
  googleListId: string | null
  subtasks: Subtask[]
}

const DAY = 1000 * 60 * 60 * 24

export function startOfDayMs(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** The day a task is planned for (from its time or its due date), or null. */
export function plannedDay(task: Task): number | null {
  if (task.scheduledAt != null) return startOfDayMs(task.scheduledAt)
  if (task.dueAt != null) return startOfDayMs(task.dueAt)
  return null
}

/** A task is "scheduled" if it has a time or a day and isn't done. */
export function isScheduled(task: Task): boolean {
  return task.status !== 'DONE' && (task.scheduledAt != null || task.dueAt != null)
}

export function subtaskProgress(task: Task): number {
  if (task.subtasks.length === 0) return 0
  return task.subtasks.filter((s) => s.done).length / task.subtasks.length
}

export function daysSinceTouched(task: Task, now = Date.now()): number {
  return Math.floor((now - task.lastTouchedAt) / DAY)
}

/** Snoozed tasks are temporarily hidden until their snooze time passes. */
export function isSnoozed(task: Task, now = Date.now()): boolean {
  return task.snoozedUntil != null && task.snoozedUntil > now
}

/**
 * "Stuck" tasks are the ones an ADHD brain tends to avoid: postponed a couple of
 * times, or sitting untouched for days, and not yet finished being broken down.
 */
export function isStuck(task: Task, now = Date.now()): boolean {
  if (task.status === 'DONE') return false
  const stale = daysSinceTouched(task, now) >= 3
  const avoided = task.postponedCount >= 2
  return (stale || avoided) && subtaskProgress(task) < 1
}
