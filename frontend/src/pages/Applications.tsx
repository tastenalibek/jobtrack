import { useQuery } from '@tanstack/react-query'
import { FileText, MapPin, DollarSign, Calendar } from 'lucide-react'
import { fetchMyApplications } from '../api/applications'
import { AppStatusBadge, JobTypeBadge } from '../components/StatusBadge'

export default function ApplicationsPage() {
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: fetchMyApplications,
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 text-sm mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''} submitted</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No applications yet</p>
          <p className="text-gray-400 text-sm mt-1">Browse job listings and hit Apply Now to get started.</p>
          <a href="/jobs" className="mt-4 inline-block text-sm text-indigo-600 font-medium hover:underline">
            Browse open positions →
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {apps.map((app) => (
            <div key={app.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">{app.job?.title ?? '—'}</p>
                  {app.job?.type && <JobTypeBadge type={app.job.type} />}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{app.job?.company}</span>
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

              <div className="flex items-center gap-4 shrink-0">
                <AppStatusBadge status={app.status} />
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
