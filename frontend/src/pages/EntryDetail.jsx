import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit, Trash2, ExternalLink, ChevronLeft, Clock, MapPin, Tag } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEntry, useDeleteEntry } from '../hooks/useEntries'
import StatusBadge from '../components/StatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import LoadingSpinner from '../components/LoadingSpinner'
import { DEADLINE_FIELDS, RANKING_COLORS, PAPER_VISIBLE_STATUSES, STATUS_LABELS } from '../lib/constants'
import { getAllDeadlines, fmtDate, getUrgency, URGENCY_COLORS, URGENCY_BAR_COLORS } from '../lib/utils'
import { isPast } from 'date-fns'

export default function EntryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: entry, isLoading, error } = useEntry(id)
  const deleteEntry = useDeleteEntry()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <LoadingSpinner />
  if (error || !entry) return (
    <div className="p-8 text-center">
      <p className="text-red-500">Entry not found.</p>
      <Link to="/dashboard" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
        Back to dashboard
      </Link>
    </div>
  )

  const handleDelete = async () => {
    await deleteEntry.mutateAsync(id)
    navigate('/dashboard')
  }

  const showPaper = PAPER_VISIBLE_STATUSES.includes(entry.status)
  const allDeadlines = getAllDeadlines(entry)

  const Section = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{title}</h3>
      {children}
    </div>
  )

  const Row = ({ label, value }) => value ? (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  ) : null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className={`text-sm font-medium ${RANKING_COLORS[entry.ranking]}`}>{entry.ranking}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{entry.type}</span>
            {entry.location && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin size={12} /> {entry.location}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{entry.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StatusBadge status={entry.status} size="md" />
            {entry.url && (
              <a href={entry.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                CFP / Journal Page <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to={`/entries/${id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Edit size={15} /> Edit
          </Link>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              <Trash2 size={15} /> Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Confirm?</span>
              <button
                onClick={handleDelete}
                disabled={deleteEntry.isPending}
                className="px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Deadlines timeline */}
          {allDeadlines.length > 0 && (
            <Section title="Deadlines">
              <div className="space-y-3">
                {allDeadlines.map(({ key, label, date }) => {
                  const urgency = getUrgency(date)
                  const past = isPast(date)
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${URGENCY_BAR_COLORS[urgency]}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(date.toISOString().split('T')[0])}</span>
                            {!past && <CountdownTimer dateStr={date.toISOString().split('T')[0]} compact />}
                            {past && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Past</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Paper details */}
          {showPaper && (entry.paper_title || entry.paper_authors || entry.paper_abstract) && (
            <Section title="Paper Details">
              {entry.paper_title && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Title</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.paper_title}</p>
                </div>
              )}
              {entry.paper_authors && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Authors</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{entry.paper_authors}</p>
                </div>
              )}
              {entry.paper_draft_link && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Draft</p>
                  <a href={entry.paper_draft_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    Open draft <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {entry.paper_abstract && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Abstract</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{entry.paper_abstract}</p>
                </div>
              )}
            </Section>
          )}

          {/* Notes */}
          {entry.notes && (
            <Section title="Notes">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.notes}</ReactMarkdown>
              </div>
            </Section>
          )}

          {/* Status history */}
          {entry.status_history?.length > 0 && (
            <Section title="Status History">
              <div className="space-y-2">
                {[...entry.status_history].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500 text-xs flex-shrink-0">
                      {format(parseISO(h.timestamp), 'MMM d, yyyy HH:mm')}
                    </span>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-4">
          <Section title="Details">
            <Row label="Type" value={entry.type} />
            <Row label="Ranking" value={entry.ranking} />
            <Row label="Location" value={entry.location} />
            <Row label="Theme / Topics" value={entry.theme} />
            <Row label="Created" value={fmtDate(entry.created_at?.split('T')[0])} />
            <Row label="Updated" value={fmtDate(entry.updated_at?.split('T')[0])} />
          </Section>

          {entry.tags?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
