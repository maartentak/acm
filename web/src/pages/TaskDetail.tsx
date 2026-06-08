import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Loader2, Moon, Pencil, Sparkles, Trash2, Zap } from 'lucide-react'
import { useStore } from '../store'
import { ENERGY_LABEL, subtaskProgress } from '../types'
import CompletionCheck from '../components/CompletionCheck'
import PrimaryButton from '../components/PrimaryButton'
import ProgressRing from '../components/ProgressRing'

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const task = useStore((s) => s.tasks.find((t) => t.id === id))
  const { breakDown, toggleSubtask, toggleComplete, postpone, deleteTask } = useStore()
  const [breaking, setBreaking] = useState(false)

  if (!task) {
    return (
      <div className="px-5 pt-8 safe-top">
        <IconButton onClick={() => navigate(-1)} aria="Back">
          <ArrowLeft size={20} />
        </IconButton>
        <p className="mt-8 text-on-ink-muted">This task no longer exists.</p>
      </div>
    )
  }

  const progress = subtaskProgress(task)

  const handleBreakDown = async () => {
    setBreaking(true)
    // A brief beat so the "thinking" feels intentional, not jarring.
    await new Promise((r) => setTimeout(r, 450))
    breakDown(task.id)
    setBreaking(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="px-5 pb-12 pt-6 safe-top"
    >
      <div className="flex items-center justify-between">
        <IconButton onClick={() => navigate(-1)} aria="Back">
          <ArrowLeft size={20} />
        </IconButton>
        <div className="flex gap-2.5">
          <IconButton onClick={() => navigate(`/task/${task.id}/edit`)} aria="Edit">
            <Pencil size={18} />
          </IconButton>
          <IconButton
            onClick={() => {
              deleteTask(task.id)
              navigate('/')
            }}
            aria="Delete"
          >
            <Trash2 size={18} />
          </IconButton>
        </div>
      </div>

      <h1
        className={`mt-5 text-3xl font-semibold leading-tight ${
          task.status === 'DONE' ? 'text-on-ink-muted line-through' : 'text-on-ink'
        }`}
      >
        {task.title}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip icon={<Zap size={13} />}>{ENERGY_LABEL[task.energy]}</Chip>
        {task.estimatedMinutes != null && <Chip icon={<Clock size={13} />}>{task.estimatedMinutes} min</Chip>}
        {task.postponedCount > 0 && <Chip icon={<Moon size={13} />}>Put off {task.postponedCount}×</Chip>}
      </div>

      {task.notes && <p className="mt-4 text-[15px] leading-relaxed text-on-ink-muted">{task.notes}</p>}

      {/* Break it down */}
      <div className="mt-6 rounded-3xl bg-ink-card p-5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="text-accent-bright" size={22} />
          <h2 className="text-lg font-semibold text-on-ink">Make it doable</h2>
          {task.subtasks.length > 0 && (
            <div className="ml-auto">
              <ProgressRing progress={progress} size={40} color={progress >= 1 ? '#3ddc97' : '#2f6bff'} label />
            </div>
          )}
        </div>

        {task.subtasks.length === 0 && (
          <p className="mt-2 text-sm text-on-ink-muted">
            Stuck or staring at it? Let Momentum split this into tiny, obvious steps you can just start.
          </p>
        )}

        <div className="mt-4 space-y-1">
          <AnimatePresence initial={false}>
            {task.subtasks.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                className="flex items-center gap-3.5 py-2"
              >
                <CompletionCheck checked={sub.done} onToggle={() => toggleSubtask(task.id, sub.id)} />
                <span className={`text-[15px] ${sub.done ? 'text-on-ink-muted line-through' : 'text-on-ink'}`}>
                  {sub.title}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4">
          {breaking ? (
            <div className="flex items-center gap-3 py-2 text-on-ink-muted">
              <Loader2 className="animate-spin text-accent-bright" size={20} />
              <span className="text-sm">Breaking it down…</span>
            </div>
          ) : (
            <PrimaryButton onClick={handleBreakDown} icon={<Sparkles size={18} />}>
              {task.subtasks.length > 0 ? 'Break it down again' : 'Break it down for me'}
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="mt-7">
        <PrimaryButton onClick={() => toggleComplete(task.id)}>
          {task.status === 'DONE' ? 'Mark as not done' : 'Complete task'}
        </PrimaryButton>
        <button
          onClick={() => postpone(task.id)}
          className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm text-on-ink-muted"
        >
          <Moon size={16} /> Not today — push to tomorrow
        </button>
      </div>
    </motion.div>
  )
}

function IconButton({ children, onClick, aria }: { children: React.ReactNode; onClick: () => void; aria: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-card text-on-ink active:bg-ink-elevated"
    >
      {children}
    </button>
  )
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-ink-card px-3 py-1.5 text-[11px] text-on-ink-muted">
      {icon}
      {children}
    </span>
  )
}
