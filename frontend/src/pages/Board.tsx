import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { Plus, Building2, MapPin, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { fetchJobs, updateJob, createJob, deleteJob } from '../api/jobs'
import JobForm from '../components/JobForm'
import StatusBadge from '../components/StatusBadge'
import type { Job, JobPayload, JobStatus } from '../types'

const COLUMNS: { status: JobStatus; label: string; color: string; header: string }[] = [
  { status: 'applied',   label: 'Applied',   color: 'border-blue-400',   header: 'bg-blue-50 text-blue-700' },
  { status: 'interview', label: 'Interview', color: 'border-yellow-400', header: 'bg-yellow-50 text-yellow-700' },
  { status: 'offer',     label: 'Offer',     color: 'border-green-400',  header: 'bg-green-50 text-green-700' },
  { status: 'rejected',  label: 'Rejected',  color: 'border-red-400',    header: 'bg-red-50 text-red-700' },
]

function JobCard({ job, onEdit, onDelete }: { job: Job; onEdit: (j: Job) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing select-none transition-opacity ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{job.position}</p>
        <div className="flex gap-1 shrink-0">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(job)}
            className="p-1 text-gray-300 hover:text-indigo-500 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(job.id)}
            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <Building2 className="w-3 h-3" />
        <span>{job.company}</span>
      </div>
      {job.location && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="w-3 h-3" />
          <span>{job.location}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{job.applied_at}</span>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="text-indigo-400 hover:text-indigo-600"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

function Column({
  status, label, color, header, jobs, onEdit, onDelete,
}: {
  status: JobStatus; label: string; color: string; header: string
  jobs: Job[]; onEdit: (j: Job) => void; onDelete: (id: number) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col min-w-0 w-72 shrink-0">
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg mb-2 ${header}`}>
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs font-medium opacity-70">{jobs.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg border-2 border-dashed p-2 space-y-2 min-h-48 transition-colors ${
          isOver ? `${color} bg-gray-50` : 'border-gray-200'
        }`}
      >
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

export default function Board() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [activeJob, setActiveJob] = useState<Job | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => fetchJobs() })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: JobPayload }) => updateJob(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const addMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const handleDragStart = (e: DragStartEvent) => {
    const job = jobs.find((j) => j.id === e.active.id)
    if (job) setActiveJob(job)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveJob(null)
    const { active, over } = e
    if (!over) return
    const job = jobs.find((j) => j.id === active.id)
    if (!job || job.status === over.id) return
    updateMutation.mutate({ id: job.id, payload: { ...job, status: over.id as JobStatus } })
  }

  const jobsByStatus = (status: JobStatus) => jobs.filter((j) => j.status === status)

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Loading…</div>

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">Drag cards to update status</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              {...col}
              jobs={jobsByStatus(col.status)}
              onEdit={setEditJob}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob && (
            <div className="bg-white rounded-lg border border-indigo-300 shadow-lg p-3 w-64 rotate-2 opacity-90">
              <p className="text-sm font-semibold text-gray-900">{activeJob.position}</p>
              <p className="text-xs text-gray-500">{activeJob.company}</p>
              <div className="mt-2">
                <StatusBadge status={activeJob.status} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
