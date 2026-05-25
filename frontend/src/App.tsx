import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Applications from './pages/Applications'
import Board from './pages/Board'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AdminJobs from './pages/AdminJobs'
import AdminApplicants from './pages/AdminApplicants'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function Guard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="applications" element={<Applications />} />
            <Route path="board" element={<Board />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<AdminGuard><Admin /></AdminGuard>} />
            <Route path="admin/jobs" element={<AdminGuard><AdminJobs /></AdminGuard>} />
            <Route path="admin/users" element={<AdminGuard><Admin /></AdminGuard>} />
            <Route path="admin/jobs/:id/applicants" element={<AdminGuard><AdminApplicants /></AdminGuard>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
