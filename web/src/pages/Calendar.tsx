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
import { formatTime, slotRange } from '../lib/time'
import { isScheduled, plannedDay, type Task } from '../types'
import GradientHeader from '../components/GradientHeader'
import PrimaryButton from '../components/PrimaryButton'
import CompletionCheck from '../components/CompletionCheck'

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
  const toggleComplete = useStore((s) => s.toggleComplete)
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
  const waiting = useMemo(() => tasks.filter((t) => t.status !== 'DONE' && t.scheduledAt == null).length, [tasks])

  // Agenda: scheduled tasks grouped by day (today onward), soonest first.
  const agenda = useMemo(() => {
    const today = dayKey(Date.now())
    const scheduled = tasks
      .filter((t) => isScheduled(t) && (plannedDay(t) ?? 0) >= today)
      .sort((a, b) => (plannedDay(a) ?? 0) - (plannedDay(b) ?? 0) || (a.scheduledAt ?? Infinity) - (b.scheduledAt ?? Infinity))
    const map = new Map<number, Task[]>()
    for (const t of scheduled) {
      const k = plannedDay(t)!
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(t)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [tasks])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pt-screen pb-screen-nav">
      <GradientHeader
        eyebrow="Your day"
        title={connected ? `${visible.filter((s) => s.task).length} fits across your free time` : 'Find time for your tasks'}
        subline={connected ? undefined : 'Connect your calendars to begin.'}
      />

      {error && (
        <p role="alert" className="mt-4 rounded-control bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p aria-live="polite" className="mt-4 rounded-control border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-soft">
          {notice}
        </p>
      )}
      {scheduledLink && (
        <a
          href={scheduledLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-2 rounded-control border border-line bg-card px-4 py-2.5 text-sm text-ink shadow-soft"
        >
          <Check size={16} className="text-ink" /> Added to Google Calendar
          <ExternalLink size={14} className="ml-auto text-ink-faint" />
        </a>
      )}

      {agenda.length > 0 && (
        <section className="mt-6">
          <h2 className="label-mono text-[11px] font-semibold text-ink-soft">Your schedule</h2>
          <div className="mt-3 space-y-5">
            {agenda.map(([day, items]) => (
              <div key={day}>
                <p className="label-mono mb-2 text-[10px] font-semibold text-ink-faint">{dayLabel(day)}</p>
                <div className="space-y-2.5">
                  {items.map((t) => (
                    <AgendaItem
                      key={t.id}
                      task={t}
                      onToggle={() => toggleComplete(t.id)}
                      onOpen={() => navigate(`/task/${t.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!connected ? (
        <div className="mt-6 rounded-card border border-line bg-card p-6 shadow-soft">
          <CalendarDays className="text-ink" size={32} strokeWidth={1.6} />
          <h2 className="mt-4 text-lg font-semibold text-ink">Connect Google Calendar</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Momentum reads your free/busy times to find pockets where a task fits — and can drop the one you pick straight
            into your calendar.
          </p>
          <div className="mt-5 space-y-3">
            {googleReady ? (
              <>
                <PrimaryButton onClick={() => connectGoogle(false)} icon={<CalendarDays size={18} />}>
                  Connect a Google account
                </PrimaryButton>
                <p className="label-mono text-center text-[10px] font-semibold text-ink-faint">Add a second account after the first</p>
              </>
            ) : (
              <>
                <PrimaryButton onClick={connectDemo} icon={<CalendarDays size={18} />}>
                  Try it with demo data
                </PrimaryButton>
                <p className="label-mono text-center text-[10px] font-semibold text-ink-faint">Set VITE_GOOGLE_CLIENT_ID for real sign-in</p>
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-line bg-card px-6 py-3.5 text-[15px] font-medium text-ink shadow-soft disabled:opacity-50"
            >
              <ListChecks size={18} />
              {importing ? 'Importing…' : 'Import from Google Tasks'}
            </button>
          )}

          <div className="mt-7 flex items-center justify-between">
            <h2 className="label-mono text-[11px] font-semibold text-ink-soft">Opportunities in your week</h2>
            <span className="label-mono text-[11px] font-semibold text-ink-faint">{waiting} waiting</span>
          </div>

          <div className="mt-3 space-y-5">
            {loading && <div className="rounded-card border border-line bg-card p-5 text-sm text-ink-soft shadow-soft">Reading your calendar…</div>}

            {!loading && grouped.length === 0 && (
              <div className="flex items-center gap-3 rounded-card border border-line bg-card p-5 shadow-soft">
                <CalendarCheck className="text-ink-faint" />
                <div>
                  <p className="font-medium text-ink">No open slots</p>
                  <p className="text-sm text-ink-soft">Either you're booked, or widen your available hours above.</p>
                </div>
              </div>
            )}

            {grouped.map(([day, items]) => (
              <div key={day}>
                <p className="label-mono mb-2 text-[10px] font-semibold text-ink-faint">{dayLabel(day)}</p>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((s) => (
                      <SlotCard key={s.slot.start} suggestion={s} onOpen={(id) => navigate(`/task/${id}`)} onSchedule={() => handleSchedule(s)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            <div className="label-mono flex items-center justify-center gap-4 pt-1 text-[10px] font-semibold text-ink-faint">
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

function AgendaItem({ task, onToggle, onOpen }: { task: Task; onToggle: () => void; onOpen: () => void }) {
  const time = task.scheduledAt != null ? formatTime(task.scheduledAt) : 'All day'
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-3 rounded-card border border-line bg-card py-3 pl-4 pr-3 shadow-soft active:bg-fill"
    >
      <span className="tnum w-14 shrink-0 font-display text-[14px] text-ink">{time}</span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{task.title}</span>
      <CompletionCheck checked={task.status === 'DONE'} onToggle={onToggle} size={24} />
    </div>
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
      className="rounded-card border border-line bg-card p-4 shadow-soft"
    >
      <div className="flex items-baseline gap-2">
        <span className="tnum font-display text-[16px] font-medium text-ink">{slotRange(slot)}</span>
        <span className="label-mono text-[10px] font-semibold text-ink-faint">{slotMinutes(slot)} min free</span>
      </div>

      {task ? (
        <>
          <button onClick={() => onOpen(task.id)} className="mt-3 w-full rounded-control bg-fill p-3.5 text-left">
            <p className="label-mono text-[10px] font-semibold text-ink-soft">Good fit</p>
            <p className="mt-1 text-[15px] font-medium text-ink">{task.title}</p>
            {task.estimatedMinutes != null && <p className="text-sm text-ink-soft">~{task.estimatedMinutes} min</p>}
          </button>
          <div className="mt-3">
            <PrimaryButton onClick={onSchedule}>Schedule it here</PrimaryButton>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-center gap-2.5 text-sm text-ink-soft">
          <Flower2 size={18} className="text-ink" />
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
    <div className="mt-5 rounded-card border border-line bg-card p-5 shadow-soft">
      <p className="label-mono text-[10px] font-semibold text-ink-soft">When I'm available</p>
      <div className="mt-3 flex items-center gap-3">
        <HourSelect label="Available from" value={startHour} options={hours.slice(0, 24)} onChange={(v) => onChange({ startHour: v })} />
        <span className="text-ink-soft">to</span>
        <HourSelect label="Available until" value={endHour} options={hours.slice(1)} onChange={(v) => onChange({ endHour: v })} />
      </div>
      <div className="mt-4 flex justify-between">
        {WEEKDAYS.map((d, i) => {
          const on = weekdays.includes(i)
          const full = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]
          return (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              aria-pressed={on}
              aria-label={full}
              className={`h-10 w-10 rounded-full text-[13px] font-medium transition-colors ${
                on ? 'bg-ink text-white' : 'bg-fill text-ink-faint'
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

function HourSelect({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      className="tnum rounded-control bg-fill px-3 py-2.5 font-display text-[15px] text-ink outline-none"
    >
      {options.map((h) => (
        <option key={h} value={h} className="font-sans text-ink">
          {String(h).padStart(2, '0')}:00
        </option>
      ))}
    </select>
  )
}

function ReminderToggle({ enabled, supported, onToggle }: { enabled: boolean; supported: boolean; onToggle: () => void }) {
  if (!supported) return null
  return (
    <button onClick={onToggle} className="mt-3 flex w-full items-center gap-3 rounded-card border border-line bg-card p-4 text-left shadow-soft">
      <Bell size={20} className={enabled ? 'text-ink' : 'text-ink-faint'} />
      <div className="flex-1">
        <p className="text-[15px] font-medium text-ink">Slot reminders</p>
        <p className="text-sm text-ink-soft">{enabled ? 'On — a nudge when a slot starts.' : 'Get a nudge when a scheduled slot begins.'}</p>
      </div>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-ink' : 'bg-fill'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}
