import type { AppStatus, JobType } from '../types'

const appConfig: Record<AppStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  reviewed: { label: 'Reviewed', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
}

const typeConfig: Record<JobType, { label: string; className: string }> = {
  'full-time':  { label: 'Full-time',  className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  'part-time':  { label: 'Part-time',  className: 'bg-purple-100 text-purple-700 border-purple-200' },
  'remote':     { label: 'Remote',     className: 'bg-teal-100 text-teal-700 border-teal-200' },
  'contract':   { label: 'Contract',   className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'internship': { label: 'Internship', className: 'bg-pink-100 text-pink-700 border-pink-200' },
}

export function AppStatusBadge({ status }: { status: AppStatus }) {
  const { label, className } = appConfig[status] ?? appConfig.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}

export function JobTypeBadge({ type }: { type: JobType }) {
  const { label, className } = typeConfig[type] ?? typeConfig['full-time']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}
