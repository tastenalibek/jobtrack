import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, MapPin, DollarSign, Users, ExternalLink, CheckCircle, X } from 'lucide-react'
import { fetchJobs } from '../api/jobs'
import { applyToJob } from '../api/applications'
import { JobTypeBadge } from '../components/StatusBadge'
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
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    setLoading(true)
    setError('')
    try {
      await applyToJob(job.id, coverLetter)
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['my-applications'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      onClose()
    } catch {
      setError('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Apply to {job.title}</h2>
            <p className="text-sm text-gray-500">{job.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover letter <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={5}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell us why you're a great fit for this role…"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-3 mt-4">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
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

function JobCard({ job, onApply }: { job: Job; onApply: (j: Job) => void }) {
  const initials = job.company.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500', 'bg-rose-500']
  const color = colors[job.company.charCodeAt(0) % colors.length]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {job.title}
          </h3>
          <p className="text-sm text-gray-500">{job.company}</p>
        </div>
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer"
            className="text-gray-300 hover:text-indigo-500 transition-colors shrink-0">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <JobTypeBadge type={job.type as JobType} />
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-3 h-3" />{job.location}
          </span>
        )}
        {job.salary && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <DollarSign className="w-3 h-3" />{job.salary}
          </span>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Users className="w-3.5 h-3.5" />
          {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
        </span>
        {job.has_applied ? (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            Applied
          </span>
        ) : (
          <button
            onClick={() => onApply(job)}
            className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
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
        <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
        <p className="text-gray-500 text-sm mt-1">{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, company, or description…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="py-2.5 px-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
        >
          {JOB_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-52" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No jobs found matching your filters.</p>
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

function Briefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  )
}
