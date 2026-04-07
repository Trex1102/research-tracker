import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import { useEntries } from '../hooks/useEntries'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, Mail, Calendar, BarChart3 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { STATUS_LABELS, STATUSES } from '../lib/constants'

export default function Profile() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: entries = [] } = useEntries()
  const updateProfile = useUpdateProfile()

  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)

  const displayName = profile?.full_name || user?.user_metadata?.full_name || ''

  const handleEdit = () => {
    setName(displayName)
    setEditing(true)
  }

  const handleSave = async () => {
    await updateProfile.mutateAsync({ full_name: name.trim() })
    setEditing(false)
  }

  if (isLoading) return <LoadingSpinner />

  // Status breakdown
  const statusBreakdown = STATUSES.map(s => ({
    status: s,
    label: STATUS_LABELS[s],
    count: entries.filter(e => e.status === s).length,
  })).filter(s => s.count > 0)

  const joinDate = user?.created_at ? format(parseISO(user.created_at), 'MMMM d, yyyy') : '—'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account details.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-2xl font-bold flex-shrink-0">
            {displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button onClick={handleSave} disabled={updateProfile.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60">
                  {updateProfile.isPending ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {displayName || 'No name set'}
                </h2>
                <button onClick={handleEdit} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
              </div>
            )}
            <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Mail size={13} /> {user?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
              <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{entries.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total entries</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <Calendar size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{joinDate}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Member since</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      {statusBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Entries by Status</h3>
          <div className="space-y-2.5">
            {statusBreakdown.map(({ status, label, count }) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-36 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${Math.round((count / entries.length) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
