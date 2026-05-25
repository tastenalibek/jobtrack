import api from './client'
import type { User } from '../types'

export const updateProfile = async (payload: {
  name?: string
  current_password?: string
  new_password?: string
}): Promise<User> => {
  const { data } = await api.put<User>('/me', payload)
  return data
}
