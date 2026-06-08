import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import { Bell, CalendarCheck, CalendarDays, Check, ExternalLink, Flower2, ListChecks } from 'lucide-react'
import { useStore } from '../store'
import {
  freeSlotsInWindow,
  matchSlots,
  sampleDay,
  slotMinutes,
  type SlotSuggestion,
} from '../lib/calendar'
import { createEvent, fetchBusy, fetchGoogleTasks, isGoogleConfigured, requestAccessToken } from '../lib/google'
import { notificationsSupported, requestNotificationPermission } from '../lib/notifications'
import { slotRange } from '../lib/time'
import GradientHeader from '../components/GradientHeader'
import PrimaryButton from '../components/PrimaryButton'

const TOKENS_KEY = 'momentum-gcal-tokens'
const loadTokens = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || '[]')
  } catch {
    return []
  }
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function dayLabel(ms: number): string {
  const d = new Date(ms)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE d MMM')
}
const dayKey = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export default function Calendar() {
  const navigate = useNavigate()
  const tasks = useStore((s) => s.tasks)
  const demoConnected = useStore((s) => s.calendarConnected)
  const connectDemo = useStore((s) => s.connectCalendar)
  const disconnectDemo = useStore((s) => s.disconnectCalendar)
  const scheduleTask = useStore((s) => s.scheduleTask)
  const remindersEnabled = useStore((s) => s.remindersEnabled)
  const setRemindersEnabled = useStore((s) => s.setRemindersEnabled)
  const availability = useStore((s) => s.availability)
  const setAvailability = useStore((s) => s.setAvailability)
  const importGoogleTasks = useStore((s) => s.importGoogleTasks)

  const googleReady = isGoogleConfigured()
  const [tokens, setTokens] = useState<string[]>(loadTokens)
  const [busy, setBusy] = useState<{ start: number; end: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scheduledLink, setScheduledLink] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const connected = demoConnected || tokens.length > 0

  const doImport = async () => {
    setImporting(true)
    setNotice(null)
    setError(null)
    try {
      const all = (await Promise.all(tokens.map((t) => fetchGoogleTasks(t)))).flat()
      const n = importGoogleTasks(all)
      setNotice(n > 0 ? `Imported ${n} task${n > 1 ? 's' : ''} from Google Tasks` : 'No new Google Tasks to import')
    } catch {
      setError('Couldn’t read Google Tasks. Reconnect, and make sure the Tasks API is enabled in your Google project.')
    } finally {
      setImporting(false)
    }
  }

  const loadBusy = useCallback(async () => {
    if (tokens.length === 0) {
      setBusy(demoConnected ? sampleDay() : [])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const from = Date.now()
      const to = from + 8 * 24 * 60 * 60 * 1000
      const all = await Promise.all(tokens.map((t) => fetchBusy(t, from, to)))
      setBusy(all.flat())
    } catch {
      setError('Could not read your calendar — the sign-in may have expired. Reconnect below.')
      setBusy([])
    } finally {
      setLoading(false)
    }
  }, [tokens, demoConnected])

  useEffect(() => {
    loadBusy()
  }, [loadBusy])

  const connectGoogle = async (selectAccount: boolean) => {
    try {
      const token = await requestAccessToken(selectAccount)
      setTokens((prev) => {
        const next = [...prev, token]
        localStorage.setItem(TOKENS_KEY, JSON.stringify(next))
        return next
      })
    } catch {
      setError('Google sign-in was cancelled or failed.')
    }
  }

  const disconnect = () => {
    localStorage.removeItem(TOKENS_KEY)
    setTokens([])
    disconnectDemo()
    setBusy([])
  }

  const toggleReminders = async () => {
    if (remindersEnabled) return setRemindersEnabled(false)
    const granted = await requestNotificationPermission()
    setRemindersEnabled(granted)
    if (!granted) setError('Notifications are blocked. Enable them in your browser settings.')
  }

  const handleSchedule = async (suggestion: SlotSuggestion) => {
    const task = suggestion.task
    if (!task) return
    const durationMin = Math.min(task.estimatedMinutes ?? 30, slotMinutes(suggestion.slot))
    const start = suggestion.slot.start
    const end = start + durationMin * 60_000

    if (tokens.length > 0) {
      try {
        const link = await createEvent(tokens[0], task.title, start, end, 'Scheduled by Momentum')
        setScheduledLink(link || null)
      } catch {
        setError('Scheduled locally, but couldn’t write to Google Calendar. Reconnect to grant calendar access.')
      }
    }
    scheduleTask(task.id, start)
    loadBusy()
  }

  const suggestions = useMemo(
    () => (connected ? matchSlots(freeSlotsInWindow(busy, availability), tasks) : []),
    [connected, busy, availability, tasks],
  )

  // Keep the list focused: all of today/tomorrow, plus any later slot with a task.
  const visible = useMemo(() => {
    const twoDays = dayKey(Date.now()) + 2 * 24 * 60 * 60 * 1000
    return suggestions.filter((s) => s.slot.start < twoDays || s.task)
  }, [suggestions])

  const grouped = useMemo(() => {
    const map = new Map<number, SlotSuggestion[]>()
    for (const s of visible) {
      const k = dayKey(s.slot.start)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(s)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [visible])

  const waiting = useMemo(
    () => tasks.filter((t) => t.status !== 'DONE' && t.scheduledAt == null).length,
    [tasks],
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pb-28 pt-5 safe-top">
      <GradientHeader
        eyebrow="Your day"
        headline={connected ? `${visible.filter((s) => s.task).length} fits across your free time.` : 'Connect your calendars to find time.'}
      />

      {error && <p className="mt-3 rounded-control bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>}
      {notice && <p className="mt-3 rounded-control bg-orange/15 px-4 py-2.5 text-sm font-medium text-amber">{notice}</p>}
      {scheduledLink && (
        <a
          href={scheduledLink}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-2 rounded-control bg-espresso px-4 py-2.5 text-sm text-sand"
        >
          <Check size={16} className="text-orange" /> Added to Google Calendar
          <ExternalLink size={14} className="ml-auto text-sand-soft" />
        </a>
      )}

      {!connected ? (
        <div className="mt-5 rounded-card bg-espresso p-6 shadow-bento">
          <CalendarDays className="text-orange" size={34} />
          <h2 className="mt-4 text-lg font-medium text-sand">Connect Google Calendar</h2>
          <p className="mt-2 text-sm text-sand-soft">
            Link your work and personal calendars. Momentum reads your free/busy times to find pockets where a task fits —
            and can drop the one you pick straight into your calendar.
          </p>
          <div className="mt-5 space-y-3">
            {googleReady ? (
              <>
                <PrimaryButton onClick={() => connectGoogle(false)} icon={<CalendarDays size={18} />}>
                  Connect a Google account
                </PrimaryButton>
                <p className="label-mono text-center text-[10px] font-semibold text-sand-soft">
                  Add a second account after the first
                </p>
              </>
            ) : (
              <>
                <PrimaryButton onClick={connectDemo} icon={<CalendarDays size={18} />}>
                  Try it with demo data
                </PrimaryButton>
                <p className="label-mono text-center text-[10px] font-semibold text-sand-soft">
                  Set VITE_GOOGLE_CLIENT_ID for real sign-in
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <AvailabilityCard
            startHour={availability.startHour}
            endHour={availability.endHour}
            weekdays={availability.weekdays}
            onChange={setAvailability}
          />

          <ReminderToggle enabled={remindersEnabled} supported={notificationsSupported()} onToggle={toggleReminders} />

          {tokens.length > 0 && (
            <button
              onClick={doImport}
              disabled={importing}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-espresso-2 px-6 py-3.5 text-[15px] font-semibold text-sand disabled:opacity-50"
            >
              <ListChecks size={18} className="text-orange" />
              {importing ? 'Importing…' : 'Import from Google Tasks'}
            </button>
          )}

          <div className="mt-6 flex items-center justify-between">
            <h2 className="label-mono text-[11px] font-semibold text-ink-soft">Opportunities in your week</h2>
            <span className="label-mono text-[11px] font-semibold text-ink-soft/70">{waiting} waiting</span>
          </div>

          <div className="mt-3 space-y-5">
            {loading && <div className="rounded-card bg-espresso p-5 text-sm text-sand-soft shadow-bento">Reading your calendar…</div>}

            {!loading && grouped.length === 0 && (
              <div className="flex items-center gap-3 rounded-card bg-espresso p-5 shadow-bento">
                <CalendarCheck className="text-sand-soft" />
                <div>
                  <p className="font-medium text-sand">No open slots</p>
                  <p className="text-sm text-sand-soft">Either you're booked, or widen your available hours above.</p>
                </div>
              </div>
            )}

            {grouped.map(([day, items]) => (
              <div key={day}>
                <p className="label-mono mb-2 text-[10px] font-semibold text-ink-soft">{dayLabel(day)}</p>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((s) => (
                      <SlotCard key={s.slot.start} suggestion={s} onOpen={(id) => navigate(`/task/${id}`)} onSchedule={() => handleSchedule(s)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            <div className="label-mono flex items-center justify-center gap-4 pt-1 text-[10px] font-semibold text-ink-soft/70">
              {googleReady && (
                <button onClick={() => connectGoogle(true)} className="underline">
                  Add account
                </button>
              )}
              <button onClick={disconnect} className="underline">
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}

function SlotCard({
  suggestion,
  onOpen,
  onSchedule,
}: {
  suggestion: SlotSuggestion
  onOpen: (id: string) => void
  onSchedule: () => void
}) {
  const { slot, task } = suggestion
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-card bg-espresso p-4 shadow-bento"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-medium text-sand">{slotRange(slot)}</span>
        <span className="label-mono text-[10px] font-semibold text-sand-soft">{slotMinutes(slot)} min free</span>
      </div>

      {task ? (
        <>
          <button onClick={() => onOpen(task.id)} className="mt-3 w-full rounded-control bg-espresso-2 p-3.5 text-left">
            <p className="label-mono text-[10px] font-semibold text-orange">Good fit</p>
            <p className="mt-1 text-[15px] font-medium text-sand">{task.title}</p>
            {task.estimatedMinutes != null && <p className="text-sm text-sand-soft">~{task.estimatedMinutes} min</p>}
          </button>
          <div className="mt-3">
            <PrimaryButton onClick={onSchedule}>Schedule it here</PrimaryButton>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-center gap-2.5 text-sm text-sand-soft">
          <Flower2 size={18} className="text-orange" />
          Open time — rest, or pick anything small.
        </div>
      )}
    </motion.div>
  )
}

function AvailabilityCard({
  startHour,
  endHour,
  weekdays,
  onChange,
}: {
  startHour: number
  endHour: number
  weekdays: number[]
  onChange: (patch: { startHour?: number; endHour?: number; weekdays?: number[] }) => void
}) {
  const toggleDay = (i: number) => {
    const next = weekdays.includes(i) ? weekdays.filter((d) => d !== i) : [...weekdays, i]
    onChange({ weekdays: next })
  }
  const hours = Array.from({ length: 25 }, (_, h) => h)
  return (
    <div className="mt-5 rounded-card bg-espresso p-5 shadow-bento">
      <p className="label-mono text-[10px] font-semibold text-orange">When I'm available</p>
      <div className="mt-3 flex items-center gap-3">
        <HourSelect value={startHour} options={hours.slice(0, 24)} onChange={(v) => onChange({ startHour: v })} />
        <span className="text-sand-soft">to</span>
        <HourSelect value={endHour} options={hours.slice(1)} onChange={(v) => onChange({ endHour: v })} />
      </div>
      <div className="mt-4 flex gap-2">
        {WEEKDAYS.map((d, i) => {
          const on = weekdays.includes(i)
          return (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`h-9 w-9 rounded-full text-[13px] font-semibold transition-colors ${
                on ? 'bg-orange text-white' : 'bg-espresso-2 text-sand-soft'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HourSelect({ value, options, onChange }: { value: number; options: number[]; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-control bg-espresso-2 px-3 py-2 text-[15px] font-medium text-sand outline-none"
    >
      {options.map((h) => (
        <option key={h} value={h} className="text-ink">
          {String(h).padStart(2, '0')}:00
        </option>
      ))}
    </select>
  )
}

function ReminderToggle({ enabled, supported, onToggle }: { enabled: boolean; supported: boolean; onToggle: () => void }) {
  if (!supported) return null
  return (
    <button onClick={onToggle} className="mt-3 flex w-full items-center gap-3 rounded-card bg-espresso p-4 text-left shadow-bento">
      <Bell size={20} className={enabled ? 'text-orange' : 'text-sand-soft'} />
      <div className="flex-1">
        <p className="text-[15px] font-medium text-sand">Slot reminders</p>
        <p className="text-sm text-sand-soft">
          {enabled ? 'On — a nudge when a slot starts.' : 'Get a nudge when a scheduled slot begins.'}
        </p>
      </div>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-orange' : 'bg-espresso-2'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}
