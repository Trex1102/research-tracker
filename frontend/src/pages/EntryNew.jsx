import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EntryForm from '../components/EntryForm'

export default function EntryNew() {
  const navigate = useNavigate()
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6"
      >
        <ChevronLeft size={16} /> Back
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Entry</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a new conference, journal, or workshop entry.</p>
      </div>
      <EntryForm />
    </div>
  )
}
