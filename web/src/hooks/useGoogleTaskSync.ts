import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { readGoogleTokens, setGoogleTaskCompleted } from '../lib/google'

/**
 * Pushes completion changes of Google-linked tasks back to Google Tasks.
 *
 * Seeds the known done-state on mount (so no sync fires for unchanged tasks or
 * reloads), then syncs only genuine toggles during the session. Tries each
 * connected account's token until one accepts the patch.
 */
export function useGoogleTaskSync() {
  const tasks = useStore((s) => s.tasks)
  const stateRef = useRef<Map<string, boolean> | null>(null)

  useEffect(() => {
    const linked = tasks.filter((t) => t.googleTaskId && t.googleListId)

    if (stateRef.current === null) {
      stateRef.current = new Map(linked.map((t) => [t.googleTaskId!, t.status === 'DONE']))
      return
    }

    const map = stateRef.current
    const changes: { taskId: string; listId: string; done: boolean }[] = []
    for (const t of linked) {
      const id = t.googleTaskId!
      const done = t.status === 'DONE'
      if (!map.has(id)) {
        map.set(id, done) // newly imported — seed without syncing
        continue
      }
      if (map.get(id) !== done) changes.push({ taskId: id, listId: t.googleListId!, done })
    }
    if (changes.length === 0) return

    const tokens = readGoogleTokens()
    if (tokens.length === 0) return

    void (async () => {
      for (const c of changes) {
        for (const token of tokens) {
          try {
            await setGoogleTaskCompleted(token, c.listId, c.taskId, c.done)
            map.set(c.taskId, c.done)
            break
          } catch {
            // token may be expired or not own this task — try the next one
          }
        }
      }
    })()
  }, [tasks])
}
