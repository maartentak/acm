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
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3.5 rounded-card bg-espresso p-4 shadow-bento"
    >
      <CompletionCheck checked={task.status === 'DONE'} onToggle={onToggle} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[15px] font-medium ${
            task.status === 'DONE' ? 'text-sand-soft line-through' : 'text-sand'
          }`}
        >
          {task.title}
        </p>
        <div className="label-mono mt-1.5 flex flex-wrap items-center gap-3 text-[10px] font-semibold">
          {stuck && (
            <span className="flex items-center gap-1 text-orange">
              <Sparkles size={12} /> Stuck
            </span>
          )}
          {task.estimatedMinutes != null && (
            <span className="flex items-center gap-1 text-sand-soft">
              <Clock size={12} /> {task.estimatedMinutes}m
            </span>
          )}
          <span className="flex items-center gap-1 text-sand-soft">
            <Zap size={12} /> {ENERGY_LABEL[task.energy]}
          </span>
        </div>
      </div>
      {task.subtasks.length > 0 && (
        <ProgressRing progress={progress} size={34} stroke={4} label />
      )}
    </motion.div>
  )
}
