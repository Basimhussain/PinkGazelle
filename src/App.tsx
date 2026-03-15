import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { ToastProvider } from './components/shared/Toast'
import { LoginPage } from './pages/LoginPage'
import { InviteAcceptPage } from './pages/InviteAcceptPage'
import { AdminOverviewPage } from './pages/admin/OverviewPage'
import { NewProjectPage } from './pages/admin/NewProjectPage'
import { ProjectPage } from './pages/admin/ProjectPage'
import { ClientDashboardPage } from './pages/client/DashboardPage'

function AuthGuard({ role, children }: { role: 'admin' | 'client'; children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuthStore()
  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-tertiary)' }}>Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (profile?.role !== role) return <Navigate to={profile?.role === 'admin' ? '/admin' : '/client'} replace />
  return <>{children}</>
}

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite" element={<InviteAcceptPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AuthGuard role="admin"><AdminOverviewPage /></AuthGuard>} />
          <Route path="/admin/projects" element={<AuthGuard role="admin"><AdminOverviewPage /></AuthGuard>} />
          <Route path="/admin/projects/new" element={<AuthGuard role="admin"><NewProjectPage /></AuthGuard>} />
          <Route path="/admin/projects/:id" element={<AuthGuard role="admin"><ProjectPage /></AuthGuard>} />

          {/* Client Routes */}
          <Route path="/client" element={<AuthGuard role="client"><ClientDashboardPage /></AuthGuard>} />

          {/* Default: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
