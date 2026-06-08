import { motion } from 'framer-motion'
import { Clock, Sparkles, Zap } from 'lucide-react'
import { ENERGY_LABEL, isStuck, subtaskProgress, type Task } from '../types'
import CompletionCheck from './CompletionCheck'
import ProgressRing from './ProgressRing'

interface Props {
  task: Task
  onToggle: () => void
  onClick: () => void
}

export default function TaskRow({ task, onToggle, onClick }: Props) {
  const stuck = isStuck(task)
  const progress = subtaskProgress(task)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3.5 rounded-2xl bg-ink-card p-4 active:bg-ink-elevated"
    >
      <CompletionCheck checked={task.status === 'DONE'} onToggle={onToggle} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[15px] font-medium ${
            task.status === 'DONE' ? 'text-on-ink-muted line-through' : 'text-on-ink'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
          {stuck && (
            <span className="flex items-center gap-1 text-warning">
              <Sparkles size={12} /> Stuck
            </span>
          )}
          {task.estimatedMinutes != null && (
            <span className="flex items-center gap-1 text-on-ink-muted">
              <Clock size={12} /> {task.estimatedMinutes}m
            </span>
          )}
          <span className="flex items-center gap-1 text-on-ink-muted">
            <Zap size={12} /> {ENERGY_LABEL[task.energy]}
          </span>
        </div>
      </div>
      {task.subtasks.length > 0 && (
        <div className="relative">
          <ProgressRing progress={progress} size={34} stroke={4} label />
        </div>
      )}
    </motion.div>
  )
}
