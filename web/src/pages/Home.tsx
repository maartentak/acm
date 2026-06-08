import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, Sparkles } from 'lucide-react'
import { completedToday, useStore } from '../store'
import { isStuck, type Task } from '../types'
import { greeting } from '../lib/time'
import GradientHeader from '../components/GradientHeader'
import TaskRow from '../components/TaskRow'

function headline(done: number, open: number, stuck: number): string {
  if (done >= 3) return `You've finished ${done} today — you're on a roll.`
  if (done > 0) return `${done} done already. Keep the momentum going.`
  if (stuck > 0) return "A few things are stuck. Let's make one of them tiny."
  if (open === 0) return 'Your list is clear. Add the next thing when you’re ready.'
  return 'One small start is all today needs.'
}

export default function Home() {
  const navigate = useNavigate()
  const tasks = useStore((s) => s.tasks)
  const quickAdd = useStore((s) => s.quickAdd)
  const toggleComplete = useStore((s) => s.toggleComplete)
  const [draft, setDraft] = useState('')

  const { active, stuck, done } = useMemo(() => {
    const act = tasks
      .filter((t) => t.status !== 'DONE')
      .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || b.lastTouchedAt - a.lastTouchedAt)
    return {
      active: act,
      stuck: act.filter((t: Task) => isStuck(t)),
      done: completedToday(tasks),
    }
  }, [tasks])

  const submit = () => {
    quickAdd(draft)
    setDraft('')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-5 pb-28 pt-5 safe-top"
    >
      <GradientHeader eyebrow={`${greeting()} · News for you`} headline={headline(done, active.length, stuck.length)} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile value={done} label="Done today" color="text-success" />
        <StatTile value={active.length} label="On your plate" color="text-accent" />
      </div>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Add a task — just brain-dump it"
        className="mt-4 w-full rounded-2xl border border-ink-border bg-ink-card px-4 py-3.5 text-[15px] text-on-ink outline-none placeholder:text-on-ink-faint focus:border-accent"
      />

      {stuck.length > 0 && (
        <section className="mt-7">
          <SectionHeader title="Stuck · let's unstick one" trailing={`${stuck.length}`} />
          <div className="mt-3 space-y-3">
            <AnimatePresence initial={false}>
              {stuck.map((t) => (
                <div key={`stuck-${t.id}`} className="rounded-2xl bg-warning/10 p-1">
                  <div className="flex items-center gap-1.5 px-3 pt-2 text-[11px] text-warning">
                    <Sparkles size={13} /> You've been putting this off — tap to break it down
                  </div>
                  <TaskRow task={t} onToggle={() => toggleComplete(t.id)} onClick={() => navigate(`/task/${t.id}`)} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      <section className="mt-7">
        <SectionHeader title="Your tasks" trailing={`${active.length} open`} />
        <div className="mt-3 space-y-3">
          {active.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl bg-ink-card p-5">
              <CheckCheck className="text-success" />
              <div>
                <p className="font-medium text-on-ink">All clear</p>
                <p className="text-sm text-on-ink-muted">Nothing open right now. Add the next thing when you’re ready.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {active.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={() => toggleComplete(t.id)} onClick={() => navigate(`/task/${t.id}`)} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>
    </motion.div>
  )
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl bg-ink-card p-4">
      <p className={`text-3xl font-semibold ${color}`}>{value}</p>
      <p className="text-sm text-on-ink-muted">{label}</p>
    </div>
  )
}

function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-on-ink-muted">{title}</h2>
      {trailing && <span className="text-[11px] text-on-ink-faint">{trailing}</span>}
    </div>
  )
}
