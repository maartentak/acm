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
      <GradientHeader
        eyebrow={`${greeting()} · News for you`}
        headline={headline(done, active.length, stuck.length)}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile value={done} label="Done today" />
        <StatTile value={active.length} label="On your plate" />
      </div>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Add a task — just brain-dump it"
        className="mt-4 w-full rounded-control border border-line bg-paper px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-ink-soft/70 focus:border-orange"
      />

      {stuck.length > 0 && (
        <section className="mt-7">
          <SectionHeader title="Stuck · let's unstick one" trailing={`${stuck.length}`} />
          <div className="mt-3 space-y-3">
            <AnimatePresence initial={false}>
              {stuck.map((t) => (
                <div key={`stuck-${t.id}`} className="rounded-card bg-orange/15 p-1.5">
                  <div className="label-mono flex items-center gap-1.5 px-3 pt-1.5 pb-1 text-[10px] font-semibold text-amber">
                    <Sparkles size={12} /> Putting this off — tap to break it down
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
            <div className="flex items-center gap-3 rounded-card bg-espresso p-5 shadow-bento">
              <CheckCheck className="text-orange" />
              <div>
                <p className="font-medium text-sand">All clear</p>
                <p className="text-sm text-sand-soft">Nothing open right now. Add the next thing when you’re ready.</p>
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

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-card bg-espresso p-5 shadow-bento">
      <p className="text-4xl font-medium tracking-tight text-orange">{value}</p>
      <p className="label-mono mt-1 text-[10px] font-semibold text-sand-soft">{label}</p>
    </div>
  )
}

function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="label-mono text-[11px] font-semibold text-ink-soft">{title}</h2>
      {trailing && <span className="label-mono text-[11px] font-semibold text-ink-soft/70">{trailing}</span>}
    </div>
  )
}
