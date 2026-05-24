import api from './client'
import type { Job, JobPayload, Stats } from '../types'

export const fetchJobs = async (params?: { q?: string; type?: string; location?: string }): Promise<Job[]> => {
  const { data } = await api.get<Job[]>('/jobs', { params })
  return data
}

export const fetchJob = async (id: number): Promise<Job> => {
  const { data } = await api.get<Job>(`/jobs/${id}`)
  return data
}

export const fetchStats = async (): Promise<Stats> => {
  const { data } = await api.get<Stats>('/stats')
  return data
}

// Admin job management
export const adminFetchJobs = async (): Promise<Job[]> => {
  const { data } = await api.get<Job[]>('/admin/jobs')
  return data
}

export const adminCreateJob = async (payload: JobPayload): Promise<Job> => {
  const { data } = await api.post<Job>('/admin/jobs', payload)
  return data
}

export const adminUpdateJob = async (id: number, payload: JobPayload): Promise<Job> => {
  const { data } = await api.put<Job>(`/admin/jobs/${id}`, payload)
  return data
}

export const adminDeleteJob = async (id: number): Promise<void> => {
  await api.delete(`/admin/jobs/${id}`)
}
