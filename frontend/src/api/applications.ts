import api from './client'
import type { Application } from '../types'

export const applyToJob = async (jobId: number, coverLetter: string): Promise<Application> => {
  const { data } = await api.post<Application>(`/jobs/${jobId}/apply`, { cover_letter: coverLetter })
  return data
}

export const fetchMyApplications = async (): Promise<Application[]> => {
  const { data } = await api.get<Application[]>('/applications')
  return data
}

export const fetchJobApplicants = async (jobId: number): Promise<Application[]> => {
  const { data } = await api.get<Application[]>(`/admin/jobs/${jobId}/applicants`)
  return data
}

export const updateApplicationStatus = async (id: number, status: string): Promise<Application> => {
  const { data } = await api.put<Application>(`/admin/applications/${id}/status`, { status })
  return data
}
