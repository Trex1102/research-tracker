export const ENTRY_TYPES = ['Conference', 'Journal', 'Workshop']

export const RANKINGS = ['A*', 'A', 'B', 'C', 'Unranked']

export const STATUSES = [
  'idea',
  'topic-decided',
  'literature-review',
  'experiment-ongoing',
  'paper-writing',
  'submitted',
  'under-review',
  'revision-requested',
  'revision-submitted',
  'accepted',
  'camera-ready',
  'presented-published',
  'rejected',
  'dropped',
]

export const STATUS_LABELS = {
  'idea': 'Idea',
  'topic-decided': 'Topic Decided',
  'literature-review': 'Literature Review',
  'experiment-ongoing': 'Experiment Ongoing',
  'paper-writing': 'Paper Writing',
  'submitted': 'Submitted',
  'under-review': 'Under Review',
  'revision-requested': 'Revision Requested',
  'revision-submitted': 'Revision Submitted',
  'accepted': 'Accepted',
  'camera-ready': 'Camera Ready',
  'presented-published': 'Presented / Published',
  'rejected': 'Rejected',
  'dropped': 'Dropped',
}

export const STATUS_COLORS = {
  'idea': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
  'topic-decided': { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-400' },
  'literature-review': { bg: 'bg-cyan-50 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-400' },
  'experiment-ongoing': { bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-400' },
  'paper-writing': { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-400' },
  'submitted': { bg: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  'under-review': { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-400' },
  'revision-requested': { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-400' },
  'revision-submitted': { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
  'accepted': { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  'camera-ready': { bg: 'bg-teal-50 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-400' },
  'presented-published': { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'rejected': { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  'dropped': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
}

// Statuses where paper details should be shown
export const PAPER_VISIBLE_STATUSES = [
  'submitted', 'under-review', 'revision-requested', 'revision-submitted',
  'accepted', 'camera-ready', 'presented-published',
]

// Index for comparison
export const STATUS_ORDER = Object.fromEntries(STATUSES.map((s, i) => [s, i]))

export const DEADLINE_FIELDS = [
  { key: 'abstract_deadline', label: 'Abstract Deadline' },
  { key: 'full_paper_deadline', label: 'Full Paper Deadline' },
  { key: 'notification_date', label: 'Notification Date' },
  { key: 'camera_ready_deadline', label: 'Camera-Ready Deadline' },
  { key: 'conference_date', label: 'Conference / Publication Date' },
]

export const RANKING_COLORS = {
  'A*': 'text-yellow-600 dark:text-yellow-400 font-semibold',
  'A': 'text-indigo-600 dark:text-indigo-400 font-semibold',
  'B': 'text-blue-600 dark:text-blue-400',
  'C': 'text-slate-600 dark:text-slate-400',
  'Unranked': 'text-gray-500 dark:text-gray-500',
}
