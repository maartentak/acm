import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import TaskDetail from './pages/TaskDetail'
import EditTask from './pages/EditTask'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import { useReminders } from './hooks/useReminders'
import { useGoogleTaskSync } from './hooks/useGoogleTaskSync'
import { useRollover } from './hooks/useRollover'

export default function App() {
  const location = useLocation()
  const showNav = location.pathname === '/' || location.pathname.startsWith('/calendar')
  useReminders()
  useGoogleTaskSync()
  useRollover()

  return (
    <div className="mx-auto min-h-full w-full max-w-md">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/new" element={<EditTask />} />
          <Route path="/task/:id/edit" element={<EditTask />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </div>
  )
}
