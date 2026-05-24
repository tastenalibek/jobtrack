import api from './client'
import type { Job, JobPayload, Stats } from '../types'

export const fetchJobs = async (status?: string, q?: string): Promise<Job[]> => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (q) params.q = q
  const { data } = await api.get<Job[]>('/jobs', { params })
  return data
}

export const fetchJob = async (id: number): Promise<Job> => {
  const { data } = await api.get<Job>(`/jobs/${id}`)
  return data
}

export const createJob = async (payload: JobPayload): Promise<Job> => {
  const { data } = await api.post<Job>('/jobs', payload)
  return data
}

export const updateJob = async (id: number, payload: JobPayload): Promise<Job> => {
  const { data } = await api.put<Job>(`/jobs/${id}`, payload)
  return data
}

export const deleteJob = async (id: number): Promise<void> => {
  await api.delete(`/jobs/${id}`)
}

export const fetchStats = async (): Promise<Stats> => {
  const { data } = await api.get<Stats>('/stats')
  return data
}
