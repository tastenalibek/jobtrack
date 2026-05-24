import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Trash2, Users, Briefcase, Crown, UserIcon } from 'lucide-react'
import { fetchAdminUsers, deleteUser, updateUserRole, fetchAdminJobs } from '../api/admin'
import { useAuthStore } from '../store/auth'
import StatusBadge from '../components/StatusBadge'
import type { AdminUser, JobStatus } from '../types'

export default function Admin() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  })

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: fetchAdminJobs,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'user' | 'admin' }) => updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const totalJobs = jobs.length
  const adminCount = users.filter((u: AdminUser) => u.role === 'admin').length

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Manage users and view platform data</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users',  value: users.length, icon: Users,    bg: 'bg-blue-50',   color: 'text-blue-600' },
          { label: 'Admins',       value: adminCount,   icon: Crown,    bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Total Jobs',   value: totalJobs,    icon: Briefcase,bg: 'bg-indigo-50', color: 'text-indigo-600' },
          { label: 'Regular Users',value: users.length - adminCount, icon: UserIcon, bg: 'bg-gray-50', color: 'text-gray-600' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{label}</span>
              <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Users</h2>
        </div>
        {loadingUsers ? (
          <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Jobs</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: AdminUser) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-indigo-700">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="text-xs text-gray-400">(you)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'admin' ? '👑 Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.job_count}</td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== currentUser?.id && (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => roleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u.id) }}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* All jobs table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">All Jobs ({totalJobs})</h2>
        </div>
        {loadingJobs ? (
          <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No jobs yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Position</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Company</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job: { id: number; position: string; company: string; status: JobStatus; user_name: string; user_email: string; applied_at: string }) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{job.position}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{job.company}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{job.user_name}</td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell text-xs">{job.applied_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
