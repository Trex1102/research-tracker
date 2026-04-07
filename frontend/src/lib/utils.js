import { differenceInDays, differenceInHours, differenceInMinutes, isPast, parseISO, format } from 'date-fns'
import { DEADLINE_FIELDS } from './constants'

/**
 * Get the nearest upcoming deadline date from an entry.
 */
export function getNearestDeadline(entry) {
  const now = new Date()
  const dates = DEADLINE_FIELDS
    .map(f => entry[f.key] ? { key: f.key, label: f.label, date: parseISO(entry[f.key]) } : null)
    .filter(Boolean)
    .filter(d => !isPast(d.date))
    .sort((a, b) => a.date - b.date)
  return dates[0] || null
}

/**
 * Get all deadlines (past + future) sorted ascending.
 */
export function getAllDeadlines(entry) {
  return DEADLINE_FIELDS
    .map(f => entry[f.key] ? { key: f.key, label: f.label, date: parseISO(entry[f.key]) } : null)
    .filter(Boolean)
    .sort((a, b) => a.date - b.date)
}

/**
 * Get urgency level based on days remaining.
 */
export function getUrgency(date) {
  if (!date) return 'none'
  if (isPast(date)) return 'past'
  const days = differenceInDays(date, new Date())
  if (days < 7) return 'critical'
  if (days < 15) return 'high'
  if (days < 30) return 'medium'
  return 'low'
}

export const URGENCY_COLORS = {
  past: 'text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500',
  critical: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
  high: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400',
  low: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
  none: 'text-gray-400',
}

export const URGENCY_BAR_COLORS = {
  past: 'bg-gray-300 dark:bg-gray-600',
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
  none: 'bg-gray-300',
}

/**
 * Format a countdown as "Xd Yh Zm" or "Overdue".
 */
export function formatCountdown(date) {
  if (!date) return null
  if (isPast(date)) return 'Overdue'
  const days = differenceInDays(date, new Date())
  const hours = differenceInHours(date, new Date()) % 24
  const minutes = differenceInMinutes(date, new Date()) % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * Format date as "Jan 15, 2026"
 */
export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

/**
 * Export entries array to CSV and trigger download.
 */
export function exportToCSV(entries) {
  const headers = [
    'Name', 'Type', 'URL', 'Ranking', 'Status', 'Theme/Topics',
    'Abstract Deadline', 'Full Paper Deadline', 'Notification Date',
    'Camera-Ready Deadline', 'Conference Date', 'Location',
    'Paper Title', 'Paper Authors', 'Paper Abstract', 'Paper Draft Link',
    'Tags', 'Notes', 'Created At', 'Updated At',
  ]

  const rows = entries.map(e => [
    e.name, e.type, e.url || '', e.ranking, e.status, e.theme || '',
    e.abstract_deadline || '', e.full_paper_deadline || '',
    e.notification_date || '', e.camera_ready_deadline || '',
    e.conference_date || '', e.location || '',
    e.paper_title || '', e.paper_authors || '',
    (e.paper_abstract || '').replace(/\n/g, ' '),
    e.paper_draft_link || '',
    (e.tags || []).join('; '), (e.notes || '').replace(/\n/g, ' '),
    e.created_at, e.updated_at,
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `research-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Check if a duplicate entry exists (same name, ignoring case, within same year).
 */
export function checkDuplicate(entries, name, currentId = null) {
  const normalized = name.trim().toLowerCase()
  return entries.find(e =>
    e.id !== currentId &&
    e.name.trim().toLowerCase() === normalized
  ) || null
}
