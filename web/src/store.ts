import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EnergyLevel, Task } from './types'
import { breakDownTask } from './lib/breakdown'
import { DEFAULT_AVAILABILITY, type Availability } from './lib/calendar'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const DAY = 1000 * 60 * 60 * 24

export interface NewTaskInput {
  title: string
  notes?: string
  energy?: EnergyLevel
  estimatedMinutes?: number | null
  dueAt?: number | null
}

interface MomentumState {
  tasks: Task[]
  calendarConnected: boolean
  remindersEnabled: boolean
  availability: Availability

  quickAdd: (title: string) => void
  addTask: (input: NewTaskInput) => string
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
  postpone: (id: string) => void
  scheduleTask: (id: string, startMillis: number) => void

  breakDown: (id: string) => void
  setSubtasks: (id: string, titles: string[]) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void

  connectCalendar: () => void
  disconnectCalendar: () => void

  setRemindersEnabled: (enabled: boolean) => void
  markReminded: (id: string) => void

  setAvailability: (patch: Partial<Availability>) => void
}

const newSubtasks = (titles: string[]) =>
  titles.map((title) => ({ id: uid(), title, done: false }))

function freshTask(input: NewTaskInput): Task {
  const now = Date.now()
  return {
    id: uid(),
    title: input.title.trim(),
    notes: input.notes?.trim() ?? '',
    status: 'TODO',
    energy: input.energy ?? 'MEDIUM',
    estimatedMinutes: input.estimatedMinutes ?? null,
    dueAt: input.dueAt ?? null,
    scheduledAt: null,
    createdAt: now,
    lastTouchedAt: now,
    completedAt: null,
    postponedCount: 0,
    notifiedAt: null,
    subtasks: [],
  }
}

export const useStore = create<MomentumState>()(
  persist(
    (set, get) => ({
      tasks: [],
      calendarConnected: false,
      remindersEnabled: false,
      availability: DEFAULT_AVAILABILITY,

      quickAdd: (title) => {
        const clean = title.trim()
        if (!clean) return
        set((s) => ({ tasks: [freshTask({ title: clean }), ...s.tasks] }))
      },

      addTask: (input) => {
        const task = freshTask(input)
        set((s) => ({ tasks: [task, ...s.tasks] }))
        return task.id
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, lastTouchedAt: Date.now() } : t,
          ),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      toggleComplete: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t
            const done = t.status !== 'DONE'
            return {
              ...t,
              status: done ? 'DONE' : 'TODO',
              completedAt: done ? Date.now() : null,
              lastTouchedAt: Date.now(),
            }
          }),
        })),

      postpone: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  postponedCount: t.postponedCount + 1,
                  dueAt: Date.now() + DAY,
                  lastTouchedAt: Date.now(),
                }
              : t,
          ),
        })),

      scheduleTask: (id, startMillis) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, scheduledAt: startMillis, notifiedAt: null, lastTouchedAt: Date.now() }
              : t,
          ),
        })),

      breakDown: (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return
        get().setSubtasks(id, breakDownTask(task))
      },

      setSubtasks: (id, titles) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, subtasks: newSubtasks(titles), lastTouchedAt: Date.now() } : t,
          ),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((sub) =>
                    sub.id === subtaskId ? { ...sub, done: !sub.done } : sub,
                  ),
                  lastTouchedAt: Date.now(),
                }
              : t,
          ),
        })),

      connectCalendar: () => set({ calendarConnected: true }),
      disconnectCalendar: () => set({ calendarConnected: false }),

      setRemindersEnabled: (enabled) => set({ remindersEnabled: enabled }),
      markReminded: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, notifiedAt: Date.now() } : t)),
        })),

      setAvailability: (patch) =>
        set((s) => ({ availability: { ...s.availability, ...patch } })),
    }),
    { name: 'momentum' },
  ),
)

/** Convenience selectors. */
export const completedToday = (tasks: Task[]) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return tasks.filter((t) => t.status === 'DONE' && (t.completedAt ?? 0) >= start.getTime()).length
}
