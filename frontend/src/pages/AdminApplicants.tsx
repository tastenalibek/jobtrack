import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Mail, User } from 'lucide-react'
import { fetchJobApplicants, updateApplicationStatus } from '../api/applications'
import { adminFetchJobs } from '../api/jobs'
import { AppStatusBadge } from '../components/StatusBadge'
import { useToast } from '../context/toast'
import type { AppStatus } from '../types'

const STATUSES: AppStatus[] = ['pending', 'reviewed', 'accepted', 'rejected']

export default function AdminApplicantsPage() {
  const { id } = useParams<{ id: string }>()
  const jobId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error } = useToast()

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['job-applicants', jobId],
    queryFn: () => fetchJobApplicants(jobId),
    enabled: !isNaN(jobId),
  })

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: adminFetchJobs,
  })

  const job = jobs.find((j) => j.id === jobId)

  const statusMut = useMutation({
    mutationFn: ({ appId, status }: { appId: number; status: string }) =>
      updateApplicationStatus(appId, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['job-applicants', jobId] })
      qc.invalidateQueries({ queryKey: ['admin-jobs'] })
      success(`Status updated to "${vars.status}".`)
    },
    onError: () => error('Failed to update status.'),
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/jobs')}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Manage Jobs
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {job ? `Applicants — ${job.title}` : 'Applicants'}
        </h1>
        {job && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{job.company}{job.location ? ` · ${job.location}` : ''}</p>}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center shadow-sm">
          <p className="text-slate-400 dark:text-slate-500">No applicants yet for this position.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div key={app.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{app.user_name ?? 'Unknown'}</p>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="w-3 h-3" />{app.user_email ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <AppStatusBadge status={app.status} />
                  <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {app.cover_letter && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cover Letter</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{app.cover_letter}</p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Update status:</span>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={app.status === s || statusMut.isPending}
                    onClick={() => statusMut.mutate({ appId: app.id, status: s })}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      app.status === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                    } disabled:opacity-50`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
