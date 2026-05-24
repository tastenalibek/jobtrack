import api from './client'
import type { AdminUser } from '../types'

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const { data } = await api.get<AdminUser[]>('/admin/users')
  return data
}

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/admin/users/${id}`)
}

export const updateUserRole = async (id: number, role: 'user' | 'admin'): Promise<void> => {
  await api.put(`/admin/users/${id}/role`, { role })
}

export const fetchAdminJobs = async () => {
  const { data } = await api.get('/admin/jobs')
  return data
}
