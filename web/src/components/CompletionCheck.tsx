import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface Props {
  checked: boolean
  onToggle: () => void
  size?: number
}

/**
 * A circular checkbox that springs and fills with black when completed, with a
 * haptic tick. The visual circle is `size`, but the tappable button is 44×44 to
 * meet the touch-target guideline.
 */
export default function CompletionCheck({ checked, onToggle, size = 26 }: Props) {
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!checked && 'vibrate' in navigator) navigator.vibrate(15)
    onToggle()
  }
  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={checked}
      aria-label={checked ? 'Mark as not done' : 'Mark as done'}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
    >
      <motion.span
        animate={{ scale: checked ? 1.08 : 1 }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className={`flex items-center justify-center rounded-full border-2 ${
          checked ? 'border-ink bg-ink' : 'border-ink-faint bg-transparent'
        }`}
        style={{ width: size, height: size }}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Check size={size * 0.62} strokeWidth={3} className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  )
}
