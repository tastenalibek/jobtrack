import type { JobStatus } from '../types'

const config: Record<JobStatus, { label: string; className: string }> = {
  applied:   { label: 'Applied',   className: 'bg-blue-100 text-blue-700' },
  interview: { label: 'Interview', className: 'bg-yellow-100 text-yellow-700' },
  offer:     { label: 'Offer',     className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }: { status: JobStatus }) {
  const { label, className } = config[status] ?? config.applied
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
