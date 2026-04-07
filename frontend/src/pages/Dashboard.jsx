import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, Inbox } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useEntries } from '../hooks/useEntries'
import EntryCard from '../components/EntryCard'
import StatsBar from '../components/StatsBar'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'
import { getNearestDeadline, exportToCSV } from '../lib/utils'

export default function Dashboard() {
  const { data: entries = [], isLoading, error } = useEntries()
  const [filters, setFilters] = useState({ search: '', status: '', type: '', ranking: '' })

  const filtered = useMemo(() => {
    let result = [...entries]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.theme?.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q)) ||
        e.location?.toLowerCase().includes(q)
      )
    }
    if (filters.status) result = result.filter(e => e.status === filters.status)
    if (filters.type) result = result.filter(e => e.type === filters.type)
    if (filters.ranking) result = result.filter(e => e.ranking === filters.ranking)

    // Sort by nearest deadline (nulls last), then by name
    result.sort((a, b) => {
      const da = getNearestDeadline(a)
      const db = getNearestDeadline(b)
      if (da && db) return da.date - db.date
      if (da) return -1
      if (db) return 1
      return a.name.localeCompare(b.name)
    })

    return result
  }, [entries, filters])

  if (isLoading) return <LoadingSpinner />
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500">Failed to load entries: {error.message}</p>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              onClick={() => exportToCSV(entries)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
          <Link
            to="/entries/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>New Entry</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {entries.length > 0 && <StatsBar entries={entries} />}

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Inbox size={28} className="text-gray-400" />
          </div>
          {entries.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No entries yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
                Start tracking your conference and journal submissions.
              </p>
              <Link
                to="/entries/new"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Create your first entry
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your filters or search query.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
