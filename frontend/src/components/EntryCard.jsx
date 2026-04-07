import { Link } from 'react-router-dom'
import { ExternalLink, MapPin, Calendar, Tag } from 'lucide-react'
import { parseISO, format } from 'date-fns'
import StatusBadge from './StatusBadge'
import CountdownTimer from './CountdownTimer'
import { getNearestDeadline, fmtDate } from '../lib/utils'
import { RANKING_COLORS } from '../lib/constants'

export default function EntryCard({ entry }) {
  const nearest = getNearestDeadline(entry)

  const typeColor = {
    Conference: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950',
    Journal: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950',
    Workshop: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950',
  }[entry.type] || 'text-gray-600 bg-gray-100'

  return (
    <Link
      to={`/entries/${entry.id}`}
      className="group block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md dark:hover:shadow-indigo-950/20 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${typeColor}`}>
              {entry.type}
            </span>
            <span className={`text-xs font-medium ${RANKING_COLORS[entry.ranking] || 'text-gray-500'}`}>
              {entry.ranking}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
            {entry.name}
          </h3>
        </div>
        {entry.url && (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-shrink-0 text-gray-400 hover:text-indigo-500 transition-colors mt-0.5"
            title="Open CFP/journal page"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Status */}
      <div className="mb-3">
        <StatusBadge status={entry.status} />
      </div>

      {/* Nearest deadline countdown */}
      {nearest ? (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">{nearest.label}</span>
            <CountdownTimer dateStr={nearest.date.toISOString().split('T')[0]} compact />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {format(nearest.date, 'MMM d, yyyy')}
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-600 mb-3">No upcoming deadlines</p>
      )}

      {/* Footer metadata */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-gray-100 dark:border-gray-800">
        {entry.location && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={11} />
            {entry.location}
          </span>
        )}
        {entry.conference_date && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={11} />
            {fmtDate(entry.conference_date)}
          </span>
        )}
        {entry.tags?.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Tag size={11} />
            {entry.tags.slice(0, 2).join(', ')}
            {entry.tags.length > 2 && ` +${entry.tags.length - 2}`}
          </span>
        )}
      </div>
    </Link>
  )
}
