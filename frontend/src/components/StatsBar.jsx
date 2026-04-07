import { isThisMonth, parseISO, isPast } from 'date-fns'
import { BarChart3, Clock, Send, CheckCircle } from 'lucide-react'
import { getNearestDeadline } from '../lib/utils'

export default function StatsBar({ entries }) {
  const total = entries.length

  const upcomingThisMonth = entries.filter(e => {
    const d = getNearestDeadline(e)
    return d && isThisMonth(d.date)
  }).length

  const submitted = entries.filter(e =>
    ['submitted', 'under-review', 'revision-requested', 'revision-submitted',
     'accepted', 'camera-ready', 'presented-published'].includes(e.status)
  ).length

  const accepted = entries.filter(e =>
    ['accepted', 'camera-ready', 'presented-published'].includes(e.status)
  ).length

  const rejected = entries.filter(e => e.status === 'rejected').length
  const decided = accepted + rejected
  const acceptanceRate = decided > 0 ? Math.round((accepted / decided) * 100) : null

  const stats = [
    {
      label: 'Total Entries',
      value: total,
      icon: BarChart3,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950',
    },
    {
      label: 'Deadlines This Month',
      value: upcomingThisMonth,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      label: 'Papers Submitted',
      value: submitted,
      icon: Send,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: 'Acceptance Rate',
      value: acceptanceRate !== null ? `${acceptanceRate}%` : '—',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
      sub: decided > 0 ? `${accepted}/${decided} decided` : 'No decisions yet',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg, sub }) => (
        <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
