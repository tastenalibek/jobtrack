export type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected'

export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface Job {
  id: number
  company: string
  position: string
  location: string
  salary: string
  status: JobStatus
  url: string
  notes: string
  applied_at: string
  created_at: string
  updated_at: string
}

export interface JobPayload {
  company: string
  position: string
  location?: string
  salary?: string
  status?: JobStatus
  url?: string
  notes?: string
  applied_at?: string
}

export interface Stats {
  total: number
  by_status: Partial<Record<JobStatus, number>>
  this_week: number
  this_month: number
}
