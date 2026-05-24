import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, TrendingUp, Calendar, CheckCircle, XCircle, Clock, Award } from 'lucide-react'
import { fetchStats, fetchJobs, createJob, deleteJob } from '../api/jobs'
import JobForm from '../components/JobForm'
import StatusBadge from '../components/StatusBadge'
import type { JobPayload } from '../types'

const statCards = [
  { key: 'total',      label: 'Total Applications', icon: TrendingUp,  color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'this_week',  label: 'This Week',           icon: Calendar,    color: 'text-blue-600',   bg: 'bg-blue-50' },
  { key: 'interview',  label: 'Interviews',           icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: 'offer',      label: 'Offers',               icon: Award,       color: 'text-green-600',  bg: 'bg-green-50' },
]

export default function Dashboard() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => fetchJobs() })

  const addMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const getStatValue = (key: string) => {
    if (!stats) return 0
    if (key === 'total') return stats.total
    if (key === 'this_week') return stats.this_week
    return stats.by_status?.[key as keyof typeof stats.by_status] ?? 0
  }

  const recentJobs = jobs.slice(0, 8)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your job search progress</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{getStatValue(key)}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { status: 'applied',   icon: TrendingUp,  color: 'text-blue-600',   bg: 'bg-blue-50' },
              { status: 'interview', icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { status: 'offer',     icon: Award,        color: 'text-green-600',  bg: 'bg-green-50' },
              { status: 'rejected',  icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50' },
            ] as const).map(({ status, icon: Icon, color, bg }) => (
              <div key={status} className={`${bg} rounded-lg p-3 flex items-center gap-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-xs text-gray-500 capitalize">{status}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.by_status?.[status] ?? 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Recent Applications</h2>
          <span className="text-xs text-gray-400">{jobs.length} total</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : recentJobs.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No applications yet. Add your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.position}</p>
                  <p className="text-xs text-gray-500 truncate">{job.company} {job.location && `· ${job.location}`}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-gray-400 hidden sm:block">{job.applied_at}</span>
                  <button
                    onClick={() => deleteMutation.mutate(job.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <JobForm
          onSubmit={(payload: JobPayload) => addMutation.mutateAsync(payload)}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
