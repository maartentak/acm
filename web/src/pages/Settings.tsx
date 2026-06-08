import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ListX, RotateCcw, Unplug, ShieldCheck } from 'lucide-react'
import { useStore } from '../store'

const TOKENS_KEY = 'momentum-gcal-tokens'

export default function Settings() {
  const navigate = useNavigate()
  const taskCount = useStore((s) => s.tasks.length)
  const clearTasks = useStore((s) => s.clearTasks)
  const resetApp = useStore((s) => s.resetApp)
  const disconnectCalendar = useStore((s) => s.disconnectCalendar)

  const onClearTasks = () => {
    if (
      window.confirm(
        `Clear all ${taskCount} task${taskCount === 1 ? '' : 's'} from Momentum?\n\nThis only clears them here — your Google Tasks stay safe and are NOT deleted in Google.`,
      )
    ) {
      clearTasks()
      navigate('/')
    }
  }

  const onDisconnect = () => {
    localStorage.removeItem(TOKENS_KEY)
    disconnectCalendar()
    window.alert('Disconnected Google Calendar & Tasks from this device.')
  }

  const onReset = () => {
    if (window.confirm('Start completely fresh?\n\nThis clears all tasks and settings on this device and disconnects Google. Your Google data is not deleted.')) {
      localStorage.removeItem(TOKENS_KEY)
      resetApp()
      navigate('/')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="px-5 pt-screen pb-screen"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card text-ink shadow-soft active:bg-fill"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-[22px] font-normal tracking-tight text-ink">Settings</h1>
      </div>

      <h2 className="label-mono mt-8 text-[11px] font-semibold text-ink-soft">Start fresh</h2>
      <div className="mt-3 space-y-3">
        <Row
          icon={<ListX size={20} />}
          title="Clear all tasks"
          body={`Remove all ${taskCount} task${taskCount === 1 ? '' : 's'} from Momentum. Your Google Tasks stay safe.`}
          onClick={onClearTasks}
        />
        <Row
          icon={<Unplug size={20} />}
          title="Disconnect Google"
          body="Sign out of Google Calendar & Tasks on this device."
          onClick={onDisconnect}
        />
        <Row
          icon={<RotateCcw size={20} />}
          title="Start completely fresh"
          body="Clear all tasks and settings, and disconnect Google."
          danger
          onClick={onReset}
        />
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-card border border-line bg-card p-4 shadow-soft">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-ink" />
        <p className="text-sm leading-relaxed text-ink-soft">
          Your tasks and Google connection are stored only on <span className="text-ink">this device</span> — there's no
          server. Sharing the app's link is safe: other people get an empty app and never see your data.
        </p>
      </div>
    </motion.div>
  )
}

function Row({
  icon,
  title,
  body,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  title: string
  body: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-card border border-line bg-card p-4 text-left shadow-soft active:bg-fill"
    >
      <span className={danger ? 'text-danger' : 'text-ink'}>{icon}</span>
      <div className="flex-1">
        <p className={`text-[15px] font-medium ${danger ? 'text-danger' : 'text-ink'}`}>{title}</p>
        <p className="text-sm text-ink-soft">{body}</p>
      </div>
    </button>
  )
}
