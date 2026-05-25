import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, MapPin, DollarSign, Calendar, Trash2 } from 'lucide-react'
import { fetchMyApplications, withdrawApplication } from '../api/applications'
import { AppStatusBadge, JobTypeBadge, KanbanStageBadge } from '../components/StatusBadge'
import { useToast } from '../context/toast'
import type { AppStatus } from '../types'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '',         label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

export default function ApplicationsPage() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null)

  const { data: appsRaw, isLoading } = useQuery({
    queryKey: ['my-applications', statusFilter],
    queryFn: () => fetchMyApplications(statusFilter || undefined),
  })
  const apps = Array.isArray(appsRaw) ? appsRaw : []

  const handleWithdraw = async (id: number, title: string) => {
    if (!confirm(`Withdraw your application for "${title}"? This cannot be undone.`)) return
    setWithdrawingId(id)
    try {
      await withdrawApplication(id)
      qc.invalidateQueries({ queryKey: ['my-applications'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      success('Application withdrawn.')
    } catch {
      error('Failed to withdraw application.')
    } finally {
      setWithdrawingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
              statusFilter === value
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-24 shadow-sm" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">
            {statusFilter ? `No ${statusFilter} applications` : 'No applications yet'}
          </p>
          {!statusFilter && (
            <>
              <p className="text-slate-400 text-sm mt-1">Browse job listings and hit Apply Now to get started.</p>
              <a href="/jobs" className="mt-4 inline-block text-sm text-indigo-600 font-medium hover:underline">
                Browse open positions →
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 shadow-sm">
          {apps.map((app) => (
            <div key={app.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-slate-900 truncate">{app.job?.title ?? '—'}</p>
                  {app.job?.type && <JobTypeBadge type={app.job.type} />}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{app.job?.company}</span>
                  {app.job?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{app.job.location}
                    </span>
                  )}
                  {app.job?.salary && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />{app.job.salary}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <KanbanStageBadge stage={app.stage ?? 'applied'} />
                <AppStatusBadge status={app.status as AppStatus} />
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
                <button
                  disabled={withdrawingId === app.id}
                  onClick={() => handleWithdraw(app.id, app.job?.title ?? 'this job')}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Withdraw application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
