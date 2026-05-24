import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { adminFetchJobs, adminCreateJob, adminUpdateJob, adminDeleteJob } from '../api/jobs'
import { JobTypeBadge } from '../components/StatusBadge'
import type { Job, JobPayload, JobType } from '../types'
import { useNavigate } from 'react-router-dom'

const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'remote', 'contract', 'internship']

const EMPTY: JobPayload = {
  title: '', company: '', location: '', salary: '',
  type: 'full-time', description: '', url: '', is_open: true,
}

function JobFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: JobPayload & { id?: number }
  onClose: () => void
  onSave: (payload: JobPayload, id?: number) => Promise<void>
}) {
  const [form, setForm] = useState<JobPayload>({
    title: initial.title,
    company: initial.company,
    location: initial.location ?? '',
    salary: initial.salary ?? '',
    type: initial.type ?? 'full-time',
    description: initial.description ?? '',
    url: initial.url ?? '',
    is_open: initial.is_open ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof JobPayload, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      setError('Title and company are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSave(form, initial.id)
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{initial.id ? 'Edit Job' : 'Post New Job'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {(['title', 'company', 'location', 'salary', 'url'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field}{field === 'title' || field === 'company' ? ' *' : ''}
              </label>
              <input
                value={form[field] as string}
                onChange={(e) => set(field, e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-gray-700">Open for applications</span>
            <button onClick={() => set('is_open', !form.is_open)} className="text-indigo-600 hover:text-indigo-800">
              {form.is_open
                ? <ToggleRight className="w-8 h-8" />
                : <ToggleLeft className="w-8 h-8 text-gray-400" />}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Post Job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminJobsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [modal, setModal] = useState<(JobPayload & { id?: number }) | null>(null)

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: adminFetchJobs,
  })

  const createMut = useMutation({
    mutationFn: (p: JobPayload) => adminCreateJob(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-jobs'] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: JobPayload }) => adminUpdateJob(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-jobs'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminDeleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const handleSave = async (payload: JobPayload, id?: number) => {
    if (id) {
      await updateMut.mutateAsync({ id, payload })
    } else {
      await createMut.mutateAsync(payload)
    }
  }

  const handleDelete = (job: Job) => {
    if (confirm(`Delete "${job.title}" at ${job.company}? This will also remove all applications.`)) {
      deleteMut.mutate(job.id)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <button
          onClick={() => setModal(EMPTY)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Post Job
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400">No jobs posted yet. Click Post Job to add one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                  <JobTypeBadge type={job.type} />
                  {!job.is_open && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Closed</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <button
                  onClick={() => navigate(`/admin/jobs/${job.id}/applicants`)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  {job.applicant_count}
                </button>
                <button
                  onClick={() => setModal({ ...job })}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(job)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <JobFormModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
