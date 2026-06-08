import { format, isToday, isTomorrow } from 'date-fns'
import type { FreeSlot } from './calendar'

export const formatTime = (ms: number) => format(new Date(ms), 'HH:mm')

export function slotRange(slot: FreeSlot): string {
  return `${formatTime(slot.start)} – ${formatTime(slot.end)}`
}

export function dueLabel(ms: number | null): string | null {
  if (ms == null) return null
  const d = new Date(ms)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE d MMM')
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h <= 11) return 'Good morning'
  if (h >= 12 && h <= 17) return 'Good afternoon'
  if (h >= 18 && h <= 22) return 'Good evening'
  return 'Still up'
}
