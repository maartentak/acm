import { motion } from 'framer-motion'
import { CalendarDays, Home, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tab = (active: boolean) =>
    `flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
      active ? 'text-orange' : 'text-sand-soft'
    }`

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-5 safe-bottom">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full bg-espresso px-7 py-2.5 shadow-bento">
        <button className={tab(pathname === '/')} onClick={() => navigate('/')} aria-label="Today">
          <Home size={24} />
        </button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/new')}
          aria-label="Add task"
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange text-white shadow-lift"
        >
          <Plus size={26} />
        </motion.button>

        <button
          className={tab(pathname.startsWith('/calendar'))}
          onClick={() => navigate('/calendar')}
          aria-label="Calendar"
        >
          <CalendarDays size={24} />
        </button>
      </div>
    </div>
  )
}
