import { useQuery } from '@tanstack/react-query'
import { Briefcase, Users, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchStats } from '../api/jobs'
import { fetchMyApplications } from '../api/applications'
import { fetchAdminUsers } from '../api/admin'
import { useAuthStore } from '../store/auth'
import { AppStatusBadge, KanbanStageBadge } from '../components/StatusBadge'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })
  const { data: myAppsRaw } = useQuery({
    queryKey: ['my-applications', ''],
    queryFn: () => fetchMyApplications(),
    enabled: !isAdmin,
  })
  const myApps = Array.isArray(myAppsRaw) ? myAppsRaw : []
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    enabled: isAdmin,
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {isAdmin ? 'Here\'s an overview of your platform' : 'Here\'s your job search progress'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isAdmin ? (
          <>
            {[
              { label: 'Total Jobs',    value: stats?.total_jobs ?? 0,         icon: Briefcase,  color: 'text-indigo-600',  bg: 'bg-indigo-600',  light: 'bg-indigo-50' },
              { label: 'Open Jobs',     value: stats?.open_jobs ?? 0,          icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50' },
              { label: 'Applications',  value: stats?.total_applications ?? 0, icon: FileText,   color: 'text-blue-600',    bg: 'bg-blue-500',    light: 'bg-blue-50' },
              { label: 'Total Users',   value: users.length,                   icon: Users,      color: 'text-violet-600',  bg: 'bg-violet-500',  light: 'bg-violet-50' },
            ].map(({ label, value, icon: Icon, color, light }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">{label}</span>
                  <div className={`w-9 h-9 ${light} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { label: 'Open Jobs',       value: stats?.open_jobs ?? 0,       icon: Briefcase,  color: 'text-indigo-600',  light: 'bg-indigo-50' },
              { label: 'My Applications', value: stats?.my_applications ?? 0, icon: FileText,   color: 'text-blue-600',    light: 'bg-blue-50' },
              { label: 'Accepted',        value: myApps.filter(a => a.status === 'accepted').length, icon: TrendingUp, color: 'text-emerald-600', light: 'bg-emerald-50' },
              { label: 'Pending Review',  value: myApps.filter(a => a.status === 'pending').length,  icon: Users,      color: 'text-amber-600',   light: 'bg-amber-50' },
            ].map(({ label, value, icon: Icon, color, light }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">{label}</span>
                  <div className={`w-9 h-9 ${light} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Applications</h2>
            <Link to="/applications" className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {myApps.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No applications yet</p>
              <Link to="/jobs" className="mt-3 inline-block text-sm text-indigo-600 font-medium hover:underline">
                Browse open positions →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {myApps.slice(0, 6).map((app) => (
                <div key={app.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{app.job?.title}</p>
                    <p className="text-xs text-slate-500">{app.job?.company}{app.job?.location ? ` · ${app.job.location}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <KanbanStageBadge stage={app.stage ?? 'applied'} />
                    <AppStatusBadge status={app.status} />
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Users</h2>
            <Link to="/admin/users" className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {users.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-400 text-sm">No users registered yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {users.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-600">{u.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      u.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>{u.role}</span>
                    <span className="text-xs text-slate-400">{u.job_count} app{u.job_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
