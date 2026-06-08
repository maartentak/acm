import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  eyebrow: string
  headline: string
}

/**
 * The signature hero: a dark espresso "bento" panel with a warm orange glow, a
 * mono eyebrow label, and a large Inter headline that cross-fades as it changes.
 */
export default function GradientHeader({ eyebrow, headline }: Props) {
  return (
    <div className="relative overflow-hidden rounded-card bg-espresso p-6 shadow-bento">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(420px circle at 82% 8%, rgba(249,115,22,0.35), transparent 60%)',
        }}
      />
      <div className="relative">
        <p className="label-mono text-[11px] font-semibold text-orange">{eyebrow}</p>
        <AnimatePresence mode="wait">
          <motion.h1
            key={headline}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="mt-3 max-w-[18ch] text-3xl font-medium leading-[1.08] tracking-tight text-sand"
          >
            {headline}
          </motion.h1>
        </AnimatePresence>
      </div>
    </div>
  )
}
