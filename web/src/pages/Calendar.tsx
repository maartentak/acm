import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CalendarCheck, Flower2 } from 'lucide-react'
import { useStore } from '../store'
import { freeSlots, matchSlots, slotMinutes } from '../lib/calendar'
import { slotRange } from '../lib/time'
import GradientHeader from '../components/GradientHeader'
import PrimaryButton from '../components/PrimaryButton'

export default function Calendar() {
  const navigate = useNavigate()
  const tasks = useStore((s) => s.tasks)
  const connected = useStore((s) => s.calendarConnected)
  const connectCalendar = useStore((s) => s.connectCalendar)
  const scheduleTask = useStore((s) => s.scheduleTask)

  const suggestions = useMemo(() => (connected ? matchSlots(freeSlots(), tasks) : []), [connected, tasks])
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
        headline={connected ? `${suggestions.length} openings to make progress.` : 'Connect your calendars to find time.'}
      />

      {!connected ? (
        <div className="mt-5 rounded-3xl bg-ink-card p-6">
          <CalendarDays className="text-accent" size={34} />
          <h2 className="mt-4 text-lg font-semibold text-on-ink">Connect Google Calendar</h2>
          <p className="mt-2 text-sm text-on-ink-muted">
            Link your work and personal calendars. Momentum reads only your free/busy times to spot pockets
            where you can actually get things done.
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={connectCalendar} icon={<CalendarDays size={18} />}>
              Connect calendars
            </PrimaryButton>
          </div>
          <p className="mt-3 text-center text-[11px] text-on-ink-faint">
            Demo mode — generates a realistic day. Real Google sign-in is documented in the README.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-on-ink-muted">
              Opportunities in your day
            </h2>
            <span className="text-[11px] text-on-ink-faint">{waiting} tasks waiting</span>
          </div>

          <div className="mt-3 space-y-3">
            {suggestions.length === 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-ink-card p-5">
                <CalendarCheck className="text-on-ink-muted" />
                <div>
                  <p className="font-medium text-on-ink">No open slots right now</p>
                  <p className="text-sm text-on-ink-muted">Your day is packed. Time will appear here as it frees up.</p>
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
          </div>
        </>
      )}
    </motion.div>
  )
}
