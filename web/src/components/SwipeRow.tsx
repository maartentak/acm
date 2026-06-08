import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Check, Moon } from 'lucide-react'
import { useRef, type ReactNode } from 'react'

interface Props {
  onComplete: () => void
  onSnooze: () => void
  children: ReactNode
}

const TRIGGER = 100 // px past which a swipe fires its action

/**
 * Wraps a task row with swipe gestures: drag right to complete, drag left to
 * snooze 24h. The action affordance fades in behind the card as you drag.
 * Framer cancels the click that follows a real drag, so taps still open the task.
 */
export default function SwipeRow({ onComplete, onSnooze, children }: Props) {
  const x = useMotionValue(0)
  const completeOpacity = useTransform(x, [12, 80], [0, 1])
  const snoozeOpacity = useTransform(x, [-80, -12], [1, 0])
  // Guard so the click that follows a drag never opens the task.
  const didDrag = useRef(false)

  return (
    <motion.div layout exit={{ opacity: 0, scale: 0.95 }} className="relative">
      {/* Swipe right → complete (revealed on the left) */}
      <motion.div
        style={{ opacity: completeOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center rounded-card bg-ink pl-6 text-white"
      >
        <Check size={20} strokeWidth={2.5} />
        <span className="label-mono ml-2 text-[11px] font-semibold">Done</span>
      </motion.div>

      {/* Swipe left → snooze (revealed on the right) */}
      <motion.div
        style={{ opacity: snoozeOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-card bg-fill pr-6 text-ink"
      >
        <span className="label-mono mr-2 text-[11px] font-semibold">Snooze 24h</span>
        <Moon size={20} />
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        style={{ x, touchAction: 'pan-y' }}
        onDragStart={() => {
          didDrag.current = true
        }}
        onDragEnd={(_, info) => {
          const { offset, velocity } = info
          if (offset.x > TRIGGER || velocity.x > 600) onComplete()
          else if (offset.x < -TRIGGER || velocity.x < -600) onSnooze()
          window.setTimeout(() => {
            didDrag.current = false
          }, 60)
        }}
        onClickCapture={(e) => {
          if (didDrag.current) {
            e.stopPropagation()
            didDrag.current = false
          }
        }}
        className="relative"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
