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
  subtasks: Subtask[]
}

const DAY = 1000 * 60 * 60 * 24

export function subtaskProgress(task: Task): number {
  if (task.subtasks.length === 0) return 0
  return task.subtasks.filter((s) => s.done).length / task.subtasks.length
}

export function daysSinceTouched(task: Task, now = Date.now()): number {
  return Math.floor((now - task.lastTouchedAt) / DAY)
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
