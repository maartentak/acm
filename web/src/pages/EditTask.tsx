import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useStore } from '../store'
import { ENERGY_LABEL, type EnergyLevel } from '../types'
import PrimaryButton from '../components/PrimaryButton'

const SIZE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Not sure' },
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '2 hr+' },
]

const DAY = 1000 * 60 * 60 * 24

export default function EditTask() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = useStore((s) => (id ? s.tasks.find((t) => t.id === id) : undefined))
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [energy, setEnergy] = useState<EnergyLevel>(existing?.energy ?? 'MEDIUM')
  const [size, setSize] = useState<number | null>(existing?.estimatedMinutes ?? null)
  const [due, setDue] = useState<number | null>(existing?.dueAt ?? null)

  const whenOptions: { value: number | null; label: string }[] = [
    { value: null, label: 'Someday' },
    { value: startOfDay(Date.now()), label: 'Today' },
    { value: startOfDay(Date.now() + DAY), label: 'Tomorrow' },
    { value: startOfDay(Date.now() + 7 * DAY), label: 'Next week' },
  ]

  const save = () => {
    if (!title.trim()) return
    if (existing) {
      updateTask(existing.id, { title: title.trim(), notes: notes.trim(), energy, estimatedMinutes: size, dueAt: due })
    } else {
      addTask({ title, notes, energy, estimatedMinutes: size, dueAt: due })
    }
    navigate(-1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="px-5 pb-12 pt-6 safe-top"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-on-ink">{existing ? 'Edit task' : 'New task'}</h1>
        <button
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-card text-on-ink active:bg-ink-elevated"
        >
          <X size={20} />
        </button>
      </div>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        className="mt-6 w-full rounded-2xl border border-ink-border bg-ink-card px-4 py-3.5 text-[15px] text-on-ink outline-none placeholder:text-on-ink-faint focus:border-accent"
      />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes, context, links… (optional)"
        rows={3}
        className="mt-3 w-full resize-none rounded-2xl border border-ink-border bg-ink-card px-4 py-3.5 text-[15px] text-on-ink outline-none placeholder:text-on-ink-faint focus:border-accent"
      />

      <Group title="Energy needed">
        {(Object.keys(ENERGY_LABEL) as EnergyLevel[]).map((lvl) => (
          <Chip key={lvl} selected={energy === lvl} onClick={() => setEnergy(lvl)} grow>
            {ENERGY_LABEL[lvl]}
          </Chip>
        ))}
      </Group>

      <Group title="Rough size">
        {SIZE_OPTIONS.map((o) => (
          <Chip key={o.label} selected={size === o.value} onClick={() => setSize(o.value)}>
            {o.label}
          </Chip>
        ))}
      </Group>

      <Group title="When">
        {whenOptions.map((o) => (
          <Chip key={o.label} selected={sameDay(due, o.value)} onClick={() => setDue(o.value)}>
            {o.label}
          </Chip>
        ))}
      </Group>

      <div className="mt-9">
        <PrimaryButton onClick={save} disabled={!title.trim()}>
          {existing ? 'Save changes' : 'Add task'}
        </PrimaryButton>
      </div>
    </motion.div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-on-ink-muted">{title}</h2>
      <div className="mt-2.5 flex flex-wrap gap-2.5">{children}</div>
    </div>
  )
}

function Chip({
  children,
  selected,
  onClick,
  grow,
}: {
  children: React.ReactNode
  selected: boolean
  onClick: () => void
  grow?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${grow ? 'flex-1' : ''} ${
        selected
          ? 'bg-accent text-white'
          : 'border border-ink-border bg-ink-card text-on-ink-muted'
      }`}
    >
      {children}
    </button>
  )
}

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function sameDay(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return a === b
  return startOfDay(a) === startOfDay(b)
}
