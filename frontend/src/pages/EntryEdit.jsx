import { ChevronLeft } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useEntry } from '../hooks/useEntries'
import EntryForm from '../components/EntryForm'
import LoadingSpinner from '../components/LoadingSpinner'

export default function EntryEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: entry, isLoading, error } = useEntry(id)

  if (isLoading) return <LoadingSpinner />
  if (error || !entry) return (
    <div className="p-8 text-center">
      <p className="text-red-500">Entry not found.</p>
      <Link to="/dashboard" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">Back to dashboard</Link>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6"
      >
        <ChevronLeft size={16} /> Back
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Entry</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{entry.name}</p>
      </div>
      <EntryForm entry={entry} />
    </div>
  )
}
