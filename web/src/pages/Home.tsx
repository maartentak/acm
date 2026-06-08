import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { addDays, isSameDay, startOfWeek } from 'date-fns'
import { CheckCheck, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store'
import { isStuck, type Task } from '../types'
import { greeting } from '../lib/time'
import GradientHeader from '../components/GradientHeader'
import TaskRow from '../components/TaskRow'

type Tab = 'todo' | 'done' | 'pending'

function subline(done: number, open: number, stuck: number): string {
  if (done >= 3) return `${done} done today — you're on a roll.`
  if (done > 0) return `${done} done. Keep the momentum going.`
  if (stuck > 0) return "Let's make one stuck thing tiny."
  if (open === 0) return 'Your list is clear.'
  return "Let's make progress today."
}

export default function Home() {
  const navigate = useNavigate()
  const tasks = useStore((s) => s.tasks)
  const quickAdd = useStore((s) => s.quickAdd)
  const toggleComplete = useStore((s) => s.toggleComplete)
  const [draft, setDraft] = useState('')
  const [tab, setTab] = useState<Tab>('todo')

  const { todo, done, pending, doneToday } = useMemo(() => {
    const active = tasks.filter((t) => t.status !== 'DONE')
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return {
      todo: active.sort(
        (a, b) =>
          Number(isStuck(b)) - Number(isStuck(a)) ||
          (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) ||
          b.lastTouchedAt - a.lastTouchedAt,
      ),
      done: tasks.filter((t) => t.status === 'DONE').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
      pending: active.filter((t) => t.scheduledAt != null).sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0)),
      doneToday: tasks.filter((t) => t.status === 'DONE' && (t.completedAt ?? 0) >= start.getTime()).length,
    }
  }, [tasks])

  const stuckCount = useMemo(() => todo.filter((t: Task) => isStuck(t)).length, [todo])
  const list = tab === 'todo' ? todo : tab === 'done' ? done : pending

  const submit = () => {
    quickAdd(draft)
    setDraft('')
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'todo', label: 'To do', count: todo.length },
    { id: 'done', label: 'Completed', count: done.length },
    { id: 'pending', label: 'Pending', count: pending.length },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pt-screen pb-screen-nav">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <GradientHeader title={`${greeting()} 🖐`} subline={subline(doneToday, todo.length, stuckCount)} />
        </div>
        <button
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-ink shadow-soft active:bg-fill"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <WeekStrip />

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        aria-label="Add a task"
        placeholder="Add a task — just brain-dump it"
        className="mt-6 w-full rounded-control border border-line bg-card px-4 py-4 text-[15px] text-ink shadow-soft outline-none placeholder:text-ink-faint focus:border-ink"
      />

      <SegTabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="mt-5 space-y-3">
        {list.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <AnimatePresence initial={false}>
            {list.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleComplete(t.id)} onClick={() => navigate(`/task/${t.id}`)} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}

function WeekStrip() {
  const today = new Date()
  const monday = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <div className="mt-6 flex items-stretch justify-between gap-1.5 rounded-card border border-line bg-card p-2.5 shadow-soft">
      {days.map((d, i) => {
        const on = isSameDay(d, today)
        return (
          <div
            key={i}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-[18px] py-2.5 ${on ? 'bg-fill' : ''}`}
          >
            <span className={`label-mono text-[9px] font-semibold ${on ? 'text-ink-soft' : 'text-ink-faint'}`}>{wd[i]}</span>
            <span className={`tnum font-display text-[18px] font-medium leading-none ${on ? 'text-ink' : 'text-ink-faint'}`}>
              {d.getDate()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SegTabs({ tabs, active, onChange }: { tabs: { id: Tab; label: string; count: number }[]; active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="mt-7 flex gap-1 rounded-full border border-line bg-card p-1 shadow-soft">
      {tabs.map((t) => {
        const on = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-[13px] font-medium transition-colors ${
              on ? 'bg-ink text-white' : 'text-ink-soft'
            }`}
          >
            {t.label}
            <span className={`tnum font-mono text-[10px] ${on ? 'text-white/70' : 'text-ink-faint'}`}>{t.count}</span>
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const copy =
    tab === 'done'
      ? { t: 'Nothing completed yet', s: 'Tick something off and it’ll land here.' }
      : tab === 'pending'
        ? { t: 'Nothing scheduled', s: 'Schedule a task on the Calendar tab to see it here.' }
        : { t: 'All clear', s: 'Add the next thing when you’re ready.' }
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-card p-5 shadow-soft">
      <CheckCheck className="text-ink" size={22} />
      <div>
        <p className="font-medium text-ink">{copy.t}</p>
        <p className="text-sm text-ink-soft">{copy.s}</p>
      </div>
    </div>
  )
}
