import { useQuery } from '@tanstack/react-query'
import { Briefcase, Users, FileText, TrendingUp } from 'lucide-react'
import { fetchStats } from '../api/jobs'
import { fetchMyApplications } from '../api/applications'
import { fetchAdminUsers } from '../api/admin'
import { useAuthStore } from '../store/auth'
import { AppStatusBadge } from '../components/StatusBadge'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })
  const { data: myApps = [] } = useQuery({
    queryKey: ['my-applications'],
    queryFn: fetchMyApplications,
    enabled: !isAdmin,
  })
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    enabled: isAdmin,
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {isAdmin ? 'Here\'s an overview of your platform' : 'Here\'s your job search progress'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isAdmin ? (
          <>
            {[
              { label: 'Total Jobs',    value: stats?.total_jobs ?? 0,         icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Open Jobs',     value: stats?.open_jobs ?? 0,          icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Applications',  value: stats?.total_applications ?? 0, icon: FileText,   color: 'text-blue-600',  bg: 'bg-blue-50' },
              { label: 'Total Users',   value: users.length,                    icon: Users,      color: 'text-purple-600',bg: 'bg-purple-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { label: 'Open Jobs',      value: stats?.open_jobs ?? 0,      icon: Briefcase,  color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'My Applications',value: stats?.my_applications ?? 0,icon: FileText,   color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'Accepted',        value: myApps.filter(a => a.status === 'accepted').length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Pending Review',  value: myApps.filter(a => a.status === 'pending').length,  icon: Users, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Recent activity */}
      {!isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
          </div>
          {myApps.length === 0 ? (
            <div className="p-10 text-center">
              <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">You haven't applied to any jobs yet.</p>
              <a href="/jobs" className="mt-3 inline-block text-sm text-indigo-600 font-medium hover:underline">
                Browse open positions →
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myApps.slice(0, 6).map((app) => (
                <div key={app.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.job?.title}</p>
                    <p className="text-xs text-gray-500">{app.job?.company} · {app.job?.location || 'Remote'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AppStatusBadge status={app.status} />
                    <span className="text-xs text-gray-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
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
