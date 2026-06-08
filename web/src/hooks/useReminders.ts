import { useEffect } from 'react'
import { useStore } from '../store'
import { showReminder } from '../lib/notifications'

const CHECK_INTERVAL = 30_000
// Fire if we're at or just past the slot start (don't nag about long-past slots).
const FIRE_WINDOW = 5 * 60_000

/**
 * Watches scheduled tasks and fires a notification when a slot's start time
 * arrives, while the app is open or backgrounded. Each task is reminded once.
 */
export function useReminders() {
  const remindersEnabled = useStore((s) => s.remindersEnabled)

  useEffect(() => {
    if (!remindersEnabled) return

    const check = () => {
      const { tasks, markReminded } = useStore.getState()
      const now = Date.now()
      for (const t of tasks) {
        if (t.status === 'DONE' || t.scheduledAt == null || t.notifiedAt != null) continue
        if (now >= t.scheduledAt && now <= t.scheduledAt + FIRE_WINDOW) {
          markReminded(t.id)
          showReminder('Time to start', t.title)
        }
      }
    }

    check()
    const id = setInterval(check, CHECK_INTERVAL)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [remindersEnabled])
}
