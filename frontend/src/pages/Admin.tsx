import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Users, FileText, Shield, Trash2, Crown } from 'lucide-react'
import { fetchStats } from '../api/jobs'
import { fetchAdminUsers, deleteUser, updateUserRole } from '../api/admin'
import { useAuthStore } from '../store/auth'

export default function Admin() {
  const currentUser = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'user' | 'admin' }) => updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Remove user "${name}"? This action cannot be undone.`)) {
      deleteMut.mutate(id)
    }
  }

  const handleRoleToggle = (id: number, current: 'user' | 'admin') => {
    roleMut.mutate({ id, role: current === 'admin' ? 'user' : 'admin' })
  }

  const cards = [
    { label: 'Total Jobs',    value: stats?.total_jobs ?? 0,         icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Open Jobs',     value: stats?.open_jobs ?? 0,          icon: Briefcase, color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Applications',  value: stats?.total_applications ?? 0, icon: FileText,  color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Total Users',   value: users.length,                   icon: Users,     color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Platform overview and user management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
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
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Users</h2>
          <span className="text-sm text-gray-400">{users.length} total</span>
        </div>
        <div className="divide-y divide-gray-100">
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id
            return (
              <div key={u.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-600">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    {isSelf && <span className="text-xs text-gray-400">(you)</span>}
                  </div>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{u.job_count} jobs</span>
                  <button
                    disabled={isSelf || roleMut.isPending}
                    onClick={() => handleRoleToggle(u.id, u.role)}
                    title={isSelf ? 'Cannot change your own role' : `Make ${u.role === 'admin' ? 'user' : 'admin'}`}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      u.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {u.role === 'admin' && <Crown className="w-3 h-3" />}
                    {u.role}
                  </button>
                  <button
                    disabled={isSelf || deleteMut.isPending}
                    onClick={() => handleDelete(u.id, u.name)}
                    title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
