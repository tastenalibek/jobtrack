import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search, MapPin, DollarSign, Users, ExternalLink,
  CheckCircle, X, BriefcaseIcon,
} from 'lucide-react'
import { fetchJobs } from '../api/jobs'
import { applyToJob } from '../api/applications'
import { JobTypeBadge } from '../components/StatusBadge'
import { useToast } from '../context/toast'
import type { Job, JobType } from '../types'

const JOB_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'remote', label: 'Remote' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    setLoading(true)
    try {
      await applyToJob(job.id, coverLetter)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50 dark:bg-slate-700 dark:text-white placeholder:text-slate-400"
          />
          <div className="flex gap-3 mt-4">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button onClick={handleApply} disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-500/25 transition-colors">
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const LOGO_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-violet-500 to-violet-600',
  'from-blue-500 to-blue-600',
  'from-teal-500 to-teal-600',
  'from-orange-500 to-orange-600',
  'from-rose-500 to-rose-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
]

function JobCard({ job, onApply }: { job: Job; onApply: (j: Job) => void }) {
  const navigate = useNavigate()
  const initials = job.company.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const grad = LOGO_COLORS[job.company.charCodeAt(0) % LOGO_COLORS.length]

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-700 transition-all group cursor-pointer shadow-sm"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1 text-[15px]">
            {job.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
        </div>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-slate-300 hover:text-indigo-500 transition-colors shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <JobTypeBadge type={job.type as JobType} />
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-600">
            <MapPin className="w-3 h-3" />{job.location}
          </span>
        )}
        {job.salary && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-600">
            <DollarSign className="w-3 h-3" />{job.salary}
          </span>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
      )}

      <div className="flex items-center justify-between pt-3.5 border-t border-slate-50 dark:border-slate-700">
        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <Users className="w-3.5 h-3.5" />
          {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
        </span>
        {job.has_applied ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            Applied
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onApply(job) }}
            className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  const [applyingTo, setApplyingTo] = useState<Job | null>(null)

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', q, type, location],
    queryFn: () => fetchJobs({ q: q || undefined, type: type || undefined, location: location || undefined }),
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Listings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, company, or description…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location…"
            className="w-full sm:w-44 pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="py-2.5 px-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-white"
        >
          {JOB_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 animate-pulse h-52 shadow-sm" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BriefcaseIcon className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No jobs found matching your filters.</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onApply={setApplyingTo} />
          ))}
        </div>
      )}

      {applyingTo && <ApplyModal job={applyingTo} onClose={() => setApplyingTo(null)} />}
    </div>
  )
}
