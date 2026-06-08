import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  eyebrow: string
  headline: string
}

/**
 * The signature hero panel: a deep-blue gradient wash with a soft glow, an
 * eyebrow label and a large motivating headline that cross-fades as it changes.
 */
export default function GradientHeader({ eyebrow, headline }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-[#13234f] via-accent-deep to-[#0b1020]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(520px circle at 25% 20%, rgba(92,141,255,0.45), transparent 60%)',
        }}
      />
      <div className="relative">
        <p className="text-[13px] font-semibold tracking-wide text-white/70">{eyebrow}</p>
        <AnimatePresence mode="wait">
          <motion.h1
            key={headline}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="mt-3 max-w-[18ch] text-3xl font-semibold leading-tight text-white"
          >
            {headline}
          </motion.h1>
        </AnimatePresence>
      </div>
    </div>
  )
}
