import type { AppStatus, JobType, KanbanStage } from '../types'

const appConfig: Record<AppStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
  reviewed: { label: 'Reviewed', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' },
}

const typeConfig: Record<JobType, { label: string; className: string }> = {
  'full-time':  { label: 'Full-time',  className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700' },
  'part-time':  { label: 'Part-time',  className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' },
  'remote':     { label: 'Remote',     className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700' },
  'contract':   { label: 'Contract',   className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700' },
  'internship': { label: 'Internship', className: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700' },
}

const stageConfig: Record<KanbanStage, { label: string; className: string }> = {
  applied:   { label: 'Applied',   className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' },
  interview: { label: 'Interview', className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700' },
  offer:     { label: 'Offer',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' },
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

export function KanbanStageBadge({ stage }: { stage: KanbanStage }) {
  const { label, className } = stageConfig[stage] ?? stageConfig.applied
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}
