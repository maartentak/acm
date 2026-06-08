import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface Props {
  checked: boolean
  onToggle: () => void
  size?: number
}

/**
 * A circular checkbox that springs and fills with green when completed — the
 * little hit of satisfaction that makes finishing feel good. Buzzes on devices
 * that support vibration.
 */
export default function CompletionCheck({ checked, onToggle, size = 28 }: Props) {
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!checked && 'vibrate' in navigator) navigator.vibrate(15)
    onToggle()
  }
  return (
    <motion.button
      type="button"
      onClick={handle}
      aria-pressed={checked}
      animate={{ scale: checked ? 1.08 : 1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 ${
        checked ? 'border-orange bg-orange' : 'border-sand-soft bg-transparent'
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
    </motion.button>
  )
}
