import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// ── Layout ──────────────────────────────────────────────
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'

// ── Auth ─────────────────────────────────────────────────
import AuthPage from './pages/auth/AuthPage'

// ── Career Twin ──────────────────────────────────────────
import CareerTwinPage from './pages/career-twin/CareerTwinPage'

// ── Interview ────────────────────────────────────────────
import InterviewLandingPage from './pages/interview/InterviewLandingPage'
import InterviewSetupPage from './pages/interview/InterviewSetupPage'
import InterviewPermissionsPage from './pages/interview/InterviewPermissionsPage'
import InterviewSessionPage from './pages/interview/InterviewSessionPage'

// ── Dashboard ────────────────────────────────────────────
import DashboardPage from './pages/dashboard/DashboardPage'

// ── Reports ──────────────────────────────────────────────
import ReportsPage from './pages/reports/ReportsPage'

// ── Progress ─────────────────────────────────────────────
import ProgressPage from './pages/progress/ProgressPage'

// ── Settings ─────────────────────────────────────────────
import SettingsPage from './pages/settings/SettingsPage'

// ── Workspace ────────────────────────────────────────────
import MentorPage from './pages/mentor/MentorPage'
import AdminPage from './pages/admin/AdminPage'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────── */}
      <Route path="/auth" element={<AuthPage />} />

      {/* ── Interview Setup, Permissions & Active Session (fullscreen proctored, no navbar/sidebar) ───── */}
      <Route
        path="/interview/setup"
        element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>}
      />
      <Route
        path="/interview/permissions"
        element={<ProtectedRoute><InterviewPermissionsPage /></ProtectedRoute>}
      />
      <Route
        path="/interview/:sessionId/permissions"
        element={<ProtectedRoute><InterviewPermissionsPage /></ProtectedRoute>}
      />
      <Route
        path="/interview/:sessionId"
        element={<ProtectedRoute><InterviewSessionPage /></ProtectedRoute>}
      />

      {/* ── Main App Shell (sidebar + topbar) ───────────── */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"               element={<DashboardPage />} />
        <Route path="/career-twin"             element={<CareerTwinPage />} />
        <Route path="/onboarding"              element={<CareerTwinPage />} />
        <Route path="/practice/interviews"     element={<InterviewLandingPage />} />
        <Route path="/reports"                 element={<ReportsPage />} />
        <Route path="/reports/:sessionId"      element={<ReportsPage />} />
        <Route path="/progress"                element={<ProgressPage />} />
        <Route path="/mentor"                  element={<MentorPage />} />
        <Route path="/admin"                   element={<AdminPage />} />
        <Route path="/settings"                element={<SettingsPage />} />
      </Route>

      {/* ── Default redirects ────────────────────────────── */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

