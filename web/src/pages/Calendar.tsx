import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarCheck, CalendarDays, Flower2 } from 'lucide-react'
import { useStore } from '../store'
import { computeFreeSlots, freeSlots, matchSlots, slotMinutes, type FreeSlot } from '../lib/calendar'
import { isGoogleConfigured, requestAccessToken, fetchBusy } from '../lib/google'
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

export default function Calendar() {
  const navigate = useNavigate()
  const tasks = useStore((s) => s.tasks)
  const demoConnected = useStore((s) => s.calendarConnected)
  const connectDemo = useStore((s) => s.connectCalendar)
  const disconnectDemo = useStore((s) => s.disconnectCalendar)
  const scheduleTask = useStore((s) => s.scheduleTask)
  const remindersEnabled = useStore((s) => s.remindersEnabled)
  const setRemindersEnabled = useStore((s) => s.setRemindersEnabled)

  const googleReady = isGoogleConfigured()
  const [tokens, setTokens] = useState<string[]>(loadTokens)
  const [slots, setSlots] = useState<FreeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connected = demoConnected || tokens.length > 0

  const loadBusy = useCallback(async () => {
    if (tokens.length === 0) {
      setSlots(demoConnected ? freeSlots() : [])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const from = Date.now()
      const to = from + 2 * 24 * 60 * 60 * 1000
      const all = await Promise.all(tokens.map((t) => fetchBusy(t, from, to)))
      setSlots(computeFreeSlots(all.flat()))
    } catch {
      setError('Could not read your calendar. The token may have expired — reconnect.')
      setSlots([])
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
    setSlots([])
  }

  const toggleReminders = async () => {
    if (remindersEnabled) {
      setRemindersEnabled(false)
      return
    }
    const granted = await requestNotificationPermission()
    setRemindersEnabled(granted)
    if (!granted) setError('Notifications are blocked. Enable them in your browser settings.')
  }

  const suggestions = useMemo(() => (connected ? matchSlots(slots, tasks) : []), [connected, slots, tasks])
  const waiting = useMemo(
    () => tasks.filter((t) => t.status !== 'DONE' && t.scheduledAt == null).length,
    [tasks],
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-5 pb-28 pt-5 safe-top"
    >
      <GradientHeader
        eyebrow="Your day"
        headline={
          connected
            ? `${suggestions.length} openings to make progress.`
            : 'Connect your calendars to find time.'
        }
      />

      {error && (
        <p className="mt-3 rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
      )}

      {!connected ? (
        <div className="mt-5 rounded-3xl bg-ink-card p-6">
          <CalendarDays className="text-accent" size={34} />
          <h2 className="mt-4 text-lg font-semibold text-on-ink">Connect Google Calendar</h2>
          <p className="mt-2 text-sm text-on-ink-muted">
            Link your work and personal calendars. Momentum reads only your free/busy times to spot
            pockets where you can actually get things done.
          </p>
          <div className="mt-5 space-y-3">
            {googleReady ? (
              <>
                <PrimaryButton onClick={() => connectGoogle(false)} icon={<CalendarDays size={18} />}>
                  Connect a Google account
                </PrimaryButton>
                <p className="text-center text-[11px] text-on-ink-faint">
                  You can connect a second (work or personal) account after the first.
                </p>
              </>
            ) : (
              <>
                <PrimaryButton onClick={connectDemo} icon={<CalendarDays size={18} />}>
                  Try it with demo data
                </PrimaryButton>
                <p className="text-center text-[11px] text-on-ink-faint">
                  Demo mode — generates a realistic day. Set <code>VITE_GOOGLE_CLIENT_ID</code> to
                  enable real Google sign-in (see README).
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <ReminderToggle
            enabled={remindersEnabled}
            supported={notificationsSupported()}
            onToggle={toggleReminders}
          />

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-on-ink-muted">
              Opportunities in your day
            </h2>
            <span className="text-[11px] text-on-ink-faint">{waiting} tasks waiting</span>
          </div>

          <div className="mt-3 space-y-3">
            {loading && (
              <div className="rounded-2xl bg-ink-card p-5 text-sm text-on-ink-muted">
                Reading your calendar…
              </div>
            )}

            {!loading && suggestions.length === 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-ink-card p-5">
                <CalendarCheck className="text-on-ink-muted" />
                <div>
                  <p className="font-medium text-on-ink">No open slots right now</p>
                  <p className="text-sm text-on-ink-muted">
                    Your day is packed. Time will appear here as it frees up.
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {suggestions.map(({ slot, task }) => (
                <motion.div
                  key={slot.start}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-2xl bg-ink-card p-4"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-medium text-on-ink">{slotRange(slot)}</span>
                    <span className="text-sm text-on-ink-muted">· {slotMinutes(slot)} min free</span>
                  </div>

                  {task ? (
                    <>
                      <button
                        onClick={() => navigate(`/task/${task.id}`)}
                        className="mt-3 w-full rounded-2xl bg-ink-elevated p-3.5 text-left"
                      >
                        <p className="text-[11px] font-semibold text-accent">Good fit</p>
                        <p className="mt-0.5 text-[15px] font-medium text-on-ink">{task.title}</p>
                        {task.estimatedMinutes != null && (
                          <p className="text-sm text-on-ink-muted">~{task.estimatedMinutes} min</p>
                        )}
                      </button>
                      <div className="mt-3">
                        <PrimaryButton onClick={() => scheduleTask(task.id, slot.start)}>
                          Schedule it here
                        </PrimaryButton>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 flex items-center gap-2.5 text-sm text-on-ink-muted">
                      <Flower2 size={18} className="text-success" />
                      Open time — rest, or pick anything small.
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-on-ink-faint">
              {googleReady && (
                <button onClick={() => connectGoogle(true)} className="underline">
                  Connect another account
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

function ReminderToggle({
  enabled,
  supported,
  onToggle,
}: {
  enabled: boolean
  supported: boolean
  onToggle: () => void
}) {
  if (!supported) return null
  return (
    <button
      onClick={onToggle}
      className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-ink-card p-4 text-left"
    >
      <Bell size={20} className={enabled ? 'text-accent' : 'text-on-ink-muted'} />
      <div className="flex-1">
        <p className="text-[15px] font-medium text-on-ink">Slot reminders</p>
        <p className="text-sm text-on-ink-muted">
          {enabled ? 'On — you’ll get a nudge when a slot starts.' : 'Get a nudge when a scheduled slot begins.'}
        </p>
      </div>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? 'bg-accent' : 'bg-ink-border'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}
