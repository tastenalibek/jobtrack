import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { fetchJobs, createJob, updateJob, deleteJob } from '../api/jobs'
import JobForm from '../components/JobForm'
import StatusBadge from '../components/StatusBadge'
import type { Job, JobPayload, JobStatus } from '../types'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

export default function Jobs() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', status, search],
    queryFn: () => fetchJobs(status || undefined, search || undefined),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['stats'] })
  }

  const addMutation = useMutation({ mutationFn: createJob, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: JobPayload }) => updateJob(id, payload),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteJob, onSuccess: invalidate })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} applications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or position…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                status === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No jobs found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Position</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Applied</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Salary</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{job.company}</td>
                  <td className="px-4 py-3 text-gray-700">{job.position}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{job.location || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={job.status as JobStatus} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{job.applied_at}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{job.salary || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer"
                          className="p-1 text-gray-300 hover:text-indigo-500">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => setEditJob(job)}
                        className="p-1 text-gray-300 hover:text-indigo-500">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(job.id)}
                        className="p-1 text-gray-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <JobForm
          onSubmit={(p: JobPayload) => addMutation.mutateAsync(p)}
          onClose={() => setShowForm(false)}
        />
      )}
      {editJob && (
        <JobForm
          initial={editJob}
          onSubmit={(p: JobPayload) => updateMutation.mutateAsync({ id: editJob.id, payload: p })}
          onClose={() => setEditJob(null)}
        />
      )}
    </div>
  )
}
