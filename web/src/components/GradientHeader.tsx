import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  eyebrow?: string
  title: string
  /** Serif-italic accent line that cross-fades as it changes. */
  subline?: string
}

/** A quiet, typographic page header — Nothing-OS calm: mono eyebrow, bold title,
 *  serif-italic accent line. No card, no colour — just hierarchy. */
export default function GradientHeader({ eyebrow, title, subline }: Props) {
  return (
    <div>
      {eyebrow && <p className="label-mono text-[11px] font-semibold text-ink-faint">{eyebrow}</p>}
      <h1 className="mt-1.5 font-display text-[30px] font-semibold leading-[1.1] tracking-tight text-ink">{title}</h1>
      {subline !== undefined && (
        <AnimatePresence mode="wait">
          <motion.p
            key={subline}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="mt-2 text-[17px] leading-relaxed text-ink-soft"
          >
            {subline}
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  )
}
