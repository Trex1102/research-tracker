import { Search, X, SlidersHorizontal } from 'lucide-react'
import { STATUSES, STATUS_LABELS, ENTRY_TYPES, RANKINGS } from '../lib/constants'

export default function FilterBar({ filters, onChange }) {
  const { search, status, type, ranking } = filters

  const update = (key, val) => onChange({ ...filters, [key]: val })
  const clear = () => onChange({ search: '', status: '', type: '', ranking: '' })
  const hasFilters = search || status || type || ranking

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search entries…"
          value={search}
          onChange={e => update('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
        />
        {search && (
          <button onClick={() => update('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={status}
          onChange={e => update('status', e.target.value)}
          className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={type}
          onChange={e => update('type', e.target.value)}
          className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          {ENTRY_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={ranking}
          onChange={e => update('ranking', e.target.value)}
          className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Rankings</option>
          {RANKINGS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-sm px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-red-200 dark:hover:border-red-800 transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
