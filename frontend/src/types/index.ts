export interface User {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  job_count: number
  created_at: string
}

export type JobType = 'full-time' | 'part-time' | 'remote' | 'contract' | 'internship'

export interface Job {
  id: number
  posted_by: number
  title: string
  company: string
  location: string
  salary: string
  type: JobType
  description: string
  url: string
  is_open: boolean
  created_at: string
  updated_at: string
  applicant_count: number
  has_applied: boolean
}

export interface JobPayload {
  title: string
  company: string
  location?: string
  salary?: string
  type?: JobType
  description?: string
  url?: string
  is_open?: boolean
}

export type AppStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected'

export interface Application {
  id: number
  job_id: number
  user_id: number
  cover_letter: string
  status: AppStatus
  created_at: string
  updated_at: string
  job?: Pick<Job, 'id' | 'title' | 'company' | 'location' | 'salary' | 'type'>
  user_name?: string
  user_email?: string
}

export interface Stats {
  total_jobs: number
  open_jobs: number
  total_applications: number
  my_applications: number
}
