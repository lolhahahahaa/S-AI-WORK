import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { AppProvider } from './state/store'
import { ToastProvider } from './components/toast'
import { FocusProvider } from './components/dock'
import { AppShell } from './components/shell'
import { Empty } from './components/ui'

// Each page is its own chunk so the first load stays small.
const Home = lazy(() => import('./pages/Home'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Buddy = lazy(() => import('./pages/Buddy'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Library = lazy(() => import('./pages/Library'))
const Growth = lazy(() => import('./pages/Growth'))
const Events = lazy(() => import('./pages/Events'))
const GatePass = lazy(() => import('./pages/GatePass'))
const Feedback = lazy(() => import('./pages/Feedback'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const StyleGuide = lazy(() => import('./pages/StyleGuide'))
const CatchUp = lazy(() => import('./pages/CatchUp'))
const LostFound = lazy(() => import('./pages/LostFound'))
const PeerHelp = lazy(() => import('./pages/PeerHelp'))
const SupportAlerts = lazy(() => import('./pages/SupportAlerts'))
const Explore = lazy(() => import('./pages/Explore'))

function PageLoading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading page">
      <div className="skeleton" style={{ height: 34, width: 260 }} />
      <div className="skeleton" style={{ height: 16, width: '50%' }} />
      <div className="skeleton" style={{ height: 220 }} />
    </div>
  )
}

function NotFound() {
  return (
    <Empty icon={<Compass size={22} />} title="Page not found" action={<Link to="/" className="btn btn-primary">Go home</Link>}>
      That address doesn’t match a page in the portal.
    </Empty>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <FocusProvider>
          <BrowserRouter>
            <AppShell>
              <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/buddy" element={<Buddy />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/library" element={<Library />} />
                <Route path="/growth" element={<Growth />} />
                <Route path="/analytics" element={<Navigate to="/growth" replace />} />
                <Route path="/events" element={<Events />} />
                <Route path="/gate-pass" element={<GatePass />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/catch-up" element={<CatchUp />} />
                <Route path="/lost-found" element={<LostFound />} />
                <Route path="/peer-help" element={<PeerHelp />} />
                <Route path="/support-alerts" element={<SupportAlerts />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </AppShell>
          </BrowserRouter>
        </FocusProvider>
      </ToastProvider>
    </AppProvider>
  )
}
