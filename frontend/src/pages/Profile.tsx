import { useState } from 'react'
import { User, Lock, Mail, Calendar, Shield } from 'lucide-react'
import { updateProfile } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { useToast } from '../context/toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { success, error } = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [nameLoading, setNameLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handleSaveName = async () => {
    if (!name.trim() || name === user?.name) return
    setNameLoading(true)
    try {
      const updated = await updateProfile({ name: name.trim() })
      updateUser(updated)
      success('Name updated successfully.')
    } catch {
      error('Failed to update name.')
    } finally {
      setNameLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return
    if (newPassword !== confirmPassword) {
      error('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      error('New password must be at least 8 characters.')
      return
    }
    setPwLoading(true)
    try {
      await updateProfile({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      success('Password changed successfully.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      error(msg ?? 'Failed to change password.')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account information</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-5">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Account Info
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <Shield className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Role</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Member since</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-5">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Display Name
          </h2>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Full name</label>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your full name"
            />
            <button
              onClick={handleSaveName}
              disabled={nameLoading || !name.trim() || name === user?.name}
              className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {nameLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            Change Password
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
