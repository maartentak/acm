import { useEffect } from 'react'
import { useStore } from '../store'

const HOUR = 60 * 60 * 1000

/**
 * Sweeps planned-but-undone tasks back to the backlog once their day has passed.
 * Runs on app open, hourly, and when the tab regains focus.
 */
export function useRollover() {
  useEffect(() => {
    const run = () => useStore.getState().rollOverStale()
    run()
    const id = setInterval(run, HOUR)
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
