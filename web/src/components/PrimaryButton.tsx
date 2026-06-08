import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: ReactNode
  className?: string
}

/** The primary call to action: a glowing blue pill that presses in when tapped. */
export default function PrimaryButton({ children, onClick, disabled, icon, className = '' }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-bright px-6 text-[15px] font-semibold text-white shadow-lg shadow-accent/25 transition-opacity disabled:opacity-40 ${className}`}
    >
      {icon}
      {children}
    </motion.button>
  )
}
