import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { parseISO, format, isPast, differenceInDays } from 'date-fns'
import { useEntries } from '../hooks/useEntries'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import CountdownTimer from '../components/CountdownTimer'
import { DEADLINE_FIELDS } from '../lib/constants'
import { getUrgency, URGENCY_COLORS, URGENCY_BAR_COLORS } from '../lib/utils'

function getUrgencyLabel(date) {
  if (isPast(date)) return 'Past'
  const days = differenceInDays(date, new Date())
  if (days < 7) return `${days}d left`
  if (days < 30) return `${days}d left`
  return `${days}d left`
}

export default function Timeline() {
  const { data: entries = [], isLoading } = useEntries()

  // Flatten all deadlines across all entries
  const events = useMemo(() => {
    const all = []
    entries.forEach(entry => {
      DEADLINE_FIELDS.forEach(({ key, label }) => {
        if (entry[key]) {
          const date = parseISO(entry[key])
          all.push({ entry, date, label, key })
        }
      })
    })
    return all.sort((a, b) => a.date - b.date)
  }, [entries])

  // Group by month
  const grouped = useMemo(() => {
    const groups = {}
    events.forEach(event => {
      const monthKey = format(event.date, 'MMMM yyyy')
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(event)
    })
    return Object.entries(groups)
  }, [events])

  if (isLoading) return <LoadingSpinner />

  if (events.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timeline</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">All your deadlines in one place.</p>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No deadlines yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Add dates to your entries to see them here.</p>
          <Link to="/entries/new" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            Create entry
          </Link>
        </div>
      </div>
    )
  }

  // Urgency legend
  const legend = [
    { label: '>30 days', color: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
    { label: '15–30 days', color: 'bg-yellow-400', text: 'text-yellow-700 dark:text-yellow-400' },
    { label: '7–15 days', color: 'bg-orange-400', text: 'text-orange-700 dark:text-orange-400' },
    { label: '<7 days', color: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
    { label: 'Past', color: 'bg-gray-300 dark:bg-gray-600', text: 'text-gray-500' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{events.length} deadline events</p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 flex-wrap">
          {legend.map(({ label, color, text }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className={`text-xs ${text}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {grouped.map(([month, monthEvents]) => {
          const hasFuture = monthEvents.some(e => !isPast(e.date))
          const isPastMonth = monthEvents.every(e => isPast(e.date))
          return (
            <div key={month}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className={`text-sm font-semibold ${isPastMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>
                  {month}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <span className="text-xs text-gray-400">{monthEvents.length} events</span>
              </div>

              <div className="space-y-2">
                {monthEvents.map((event, idx) => {
                  const urgency = getUrgency(event.date)
                  const past = isPast(event.date)
                  return (
                    <Link
                      key={`${event.entry.id}-${event.key}-${idx}`}
                      to={`/entries/${event.entry.id}`}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                        past
                          ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800/50 opacity-60'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                      }`}
                    >
                      {/* Urgency dot */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${URGENCY_BAR_COLORS[urgency]}`} />

                      {/* Date */}
                      <div className="w-16 flex-shrink-0 text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                          {format(event.date, 'd')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{format(event.date, 'EEE')}</p>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{event.label}</span>
                          <span className="text-xs text-gray-300 dark:text-gray-700">·</span>
                          <StatusBadge status={event.entry.status} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.entry.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{event.entry.type} · {event.entry.ranking}</p>
                      </div>

                      {/* Countdown */}
                      <div className="flex-shrink-0">
                        {past ? (
                          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">Past</span>
                        ) : (
                          <CountdownTimer dateStr={event.date.toISOString().split('T')[0]} compact />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
