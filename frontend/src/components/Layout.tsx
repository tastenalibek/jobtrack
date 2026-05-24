import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import {
  LayoutDashboard, Briefcase, FileText, ShieldCheck, LogOut, Users,
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => { logout(); navigate('/login') }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Dark sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">JobTrack</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {isAdmin ? 'Overview' : 'Menu'}
          </p>

          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>

          <NavLink to="/jobs" className={navClass}>
            <Briefcase className="w-4 h-4" />
            {isAdmin ? 'Browse Jobs' : 'Job Listings'}
          </NavLink>

          {!isAdmin && (
            <NavLink to="/applications" className={navClass}>
              <FileText className="w-4 h-4" />
              My Applications
            </NavLink>
          )}

          {isAdmin && (
            <>
              <p className="px-3 pt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Admin
              </p>
              <NavLink to="/admin/jobs" className={navClass}>
                <Briefcase className="w-4 h-4" />
                Manage Jobs
              </NavLink>
              <NavLink to="/admin/users" className={navClass}>
                <Users className="w-4 h-4" />
                Manage Users
              </NavLink>
              <NavLink to="/admin" end className={navClass}>
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-indigo-400">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — light */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
