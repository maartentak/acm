import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: ReactNode
  className?: string
}

/** Primary call to action: a solid black pill that presses in when tapped. */
export default function PrimaryButton({ children, onClick, disabled, icon, className = '' }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30 ${className}`}
    >
      {icon}
      {children}
    </motion.button>
  )
}
