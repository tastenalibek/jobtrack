import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { MapPin, GripVertical, Kanban } from 'lucide-react'
import { fetchMyApplications, updateApplicationStage } from '../api/applications'
import { AppStatusBadge } from '../components/StatusBadge'
import { useToast } from '../context/toast'
import type { Application, KanbanStage } from '../types'

const COLUMNS: { id: KanbanStage; label: string; accent: string; bg: string; dot: string }[] = [
  { id: 'applied',   label: 'Applied',   accent: 'text-slate-700 dark:text-slate-300',   bg: 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-600',         dot: 'bg-slate-400' },
  { id: 'interview', label: 'Interview', accent: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700',  dot: 'bg-violet-500' },
  { id: 'offer',     label: 'Offer',     accent: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700', dot: 'bg-emerald-500' },
  { id: 'rejected',  label: 'Rejected',  accent: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',              dot: 'bg-red-400' },
]

function DraggableCard({ app, isDragging }: { app: Application; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: app.id })
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3.5 shadow-sm transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-700'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners} {...attributes}
          className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">{app.job?.title ?? '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{app.job?.company}</p>
          {app.job?.location && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-1.5">
              <MapPin className="w-3 h-3" />{app.job.location}
            </span>
          )}
          <div className="mt-2 flex items-center justify-between">
            <AppStatusBadge status={app.status} />
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {new Date(app.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ column, apps, activeId }: {
  column: typeof COLUMNS[number]; apps: Application[]; activeId: number | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col min-w-[240px] flex-1">
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border mb-3 ${column.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dot}`} />
          <span className={`text-sm font-semibold ${column.accent}`}>{column.label}</span>
        </div>
        <span className={`text-xs font-bold ${column.accent} opacity-60 bg-white/60 dark:bg-black/20 rounded-full w-5 h-5 flex items-center justify-center`}>
          {apps.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl p-2 transition-all space-y-2 ${
          isOver
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-300 dark:border-indigo-600 scale-[1.01]'
            : 'bg-slate-50/50 dark:bg-slate-800/30 border border-transparent'
        }`}
      >
        {apps.map((app) => (
          <DraggableCard key={app.id} app={app} isDragging={activeId === app.id} />
        ))}
        {apps.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-600 rounded-lg">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export default function BoardPage() {
  const qc = useQueryClient()
  const { error } = useToast()
  const [activeId, setActiveId] = useState<number | null>(null)

  const { data: appsRaw = [], isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => fetchMyApplications(),
  })
  const apps: Application[] = Array.isArray(appsRaw) ? appsRaw : []
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeApp = apps.find((a) => a.id === activeId) ?? null

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as number)

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const appId = active.id as number
    const newStage = over.id as KanbanStage
    const app = apps.find((a) => a.id === appId)
    if (!app || app.stage === newStage) return

    qc.setQueryData<Application[]>(['my-applications'], (old = []) =>
      old.map((a) => (a.id === appId ? { ...a, stage: newStage } : a))
    )
    try {
      await updateApplicationStage(appId, newStage)
      qc.invalidateQueries({ queryKey: ['my-applications'] })
    } catch {
      qc.invalidateQueries({ queryKey: ['my-applications'] })
      error('Failed to update stage. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mb-6" />
        <div className="flex gap-4">
          {COLUMNS.map((c) => (
            <div key={c.id} className="flex-1 min-w-[240px]">
              <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse mb-3" />
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Kanban className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kanban Board</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Drag cards to track your application progress.</p>
      </div>

      {apps.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Kanban className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No applications yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Apply to jobs and track your progress here.</p>
            <a href="/jobs" className="mt-3 inline-block text-sm text-indigo-600 font-medium hover:underline">
              Browse open positions →
            </a>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col.id}
                column={col}
                apps={apps.filter((a) => (a.stage ?? 'applied') === col.id)}
                activeId={activeId}
              />
            ))}
          </div>
          <DragOverlay>
            {activeApp ? <DraggableCard app={activeApp} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
