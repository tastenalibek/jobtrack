import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, MapPin, DollarSign, ExternalLink, Users,
  CheckCircle, Calendar, X, Briefcase,
} from 'lucide-react'
import { fetchJob } from '../api/jobs'
import { applyToJob } from '../api/applications'
import { JobTypeBadge } from '../components/StatusBadge'
import { useToast } from '../context/toast'
import type { Job } from '../types'

function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    setLoading(true)
    try {
      await applyToJob(job.id, coverLetter)
      qc.invalidateQueries({ queryKey: ['job', job.id] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['my-applications'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      success(`Applied to ${job.title} at ${job.company}!`)
      onClose()
    } catch {
      error('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Apply to {job.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Cover letter <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={5}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell us why you're a great fit for this role…"
            className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:bg-slate-700 dark:text-white placeholder:text-slate-400"
          />
          <div className="flex gap-3 mt-4">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600">
              Cancel
            </button>
            <button onClick={handleApply} disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [applying, setApplying] = useState(false)

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', Number(id)],
    queryFn: () => fetchJob(Number(id)),
    enabled: !isNaN(Number(id)),
  })

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="p-8 text-center">
        <Briefcase className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">Job not found.</p>
        <button onClick={() => navigate('/jobs')} className="mt-3 text-indigo-600 text-sm hover:underline">
          Back to listings
        </button>
      </div>
    )
  }

  const initials = job.company.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500', 'bg-rose-500']
  const color = colors[job.company.charCodeAt(0) % colors.length]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-md`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{job.company}</p>
                </div>
                {!job.is_open && (
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-600">
                    Position Closed
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <JobTypeBadge type={job.type} />
                {job.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                    <MapPin className="w-3 h-3" />{job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                    <DollarSign className="w-3 h-3" />{job.salary}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                  <Users className="w-3 h-3" />{job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                  <Calendar className="w-3 h-3" />Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {job.description && (
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Description</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        )}

        <div className="p-6 flex items-center gap-3">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Original
            </a>
          )}
          {job.has_applied ? (
            <span className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">
              <CheckCircle className="w-4 h-4" />
              Already Applied
            </span>
          ) : job.is_open ? (
            <button
              onClick={() => setApplying(true)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
            >
              Apply Now
            </button>
          ) : null}
        </div>
      </div>

      {applying && <ApplyModal job={job} onClose={() => setApplying(false)} />}
    </div>
  )
}
