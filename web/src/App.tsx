import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import TaskDetail from './pages/TaskDetail'
import EditTask from './pages/EditTask'
import Calendar from './pages/Calendar'

export default function App() {
  const location = useLocation()
  const showNav = location.pathname === '/' || location.pathname.startsWith('/calendar')

  return (
    <div className="mx-auto min-h-full w-full max-w-md">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/new" element={<EditTask />} />
          <Route path="/task/:id/edit" element={<EditTask />} />
        </Routes>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </div>
  )
}
