import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { ENTRY_TYPES, RANKINGS, STATUSES, STATUS_LABELS, DEADLINE_FIELDS, PAPER_VISIBLE_STATUSES, STATUS_ORDER } from '../lib/constants'
import { checkDuplicate } from '../lib/utils'
import { useCreateEntry, useUpdateEntry, useEntries } from '../hooks/useEntries'

const EMPTY = {
  name: '', type: 'Conference', url: '', theme: '', ranking: 'Unranked',
  status: 'idea', abstract_deadline: '', full_paper_deadline: '',
  notification_date: '', camera_ready_deadline: '', conference_date: '',
  location: '', paper_title: '', paper_authors: '', paper_abstract: '',
  paper_draft_link: '', notes: '', tags: '',
}

// Defined OUTSIDE EntryForm so React never re-mounts it on state changes
function Field({ label, name, required, errors, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  )
}

function inputClass(errors, key) {
  return `w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-colors ${
    errors[key]
      ? 'border-red-400 dark:border-red-600'
      : 'border-gray-200 dark:border-gray-700'
  }`
}

export default function EntryForm({ entry }) {
  const isEdit = !!entry
  const navigate = useNavigate()
  const { data: allEntries = [] } = useEntries()
  const create = useCreateEntry()
  const update = useUpdateEntry()

  const [form, setForm] = useState(() => {
    if (!entry) return EMPTY
    return { ...EMPTY, ...entry, tags: (entry.tags || []).join(', ') }
  })

  const [errors, setErrors] = useState({})
  const [duplicate, setDuplicate] = useState(null)

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  useEffect(() => {
    if (form.name.trim().length > 2) {
      setDuplicate(checkDuplicate(allEntries, form.name, isEdit ? entry.id : null))
    } else {
      setDuplicate(null)
    }
  }, [form.name])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.type) errs.type = 'Type is required'
    if (!form.ranking) errs.ranking = 'Ranking is required'
    if (!form.status) errs.status = 'Status is required'
    if (form.url && !/^https?:\/\//.test(form.url)) {
      errs.url = 'URL must start with http:// or https://'
    }
    DEADLINE_FIELDS.forEach(({ key }) => {
      if (form[key] && !/^\d{4}-\d{2}-\d{2}$/.test(form[key])) {
        errs[key] = 'Invalid date format'
      }
    })
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      ...(STATUS_ORDER[form.status] < STATUS_ORDER['submitted'] ? {
        paper_title: '', paper_authors: '', paper_abstract: '', paper_draft_link: '',
      } : {}),
    }
    DEADLINE_FIELDS.forEach(({ key }) => { if (!payload[key]) payload[key] = null })

    if (isEdit) {
      await update.mutateAsync({ id: entry.id, data: payload, prevStatus: entry.status })
      navigate(`/entries/${entry.id}`)
    } else {
      const created = await create.mutateAsync(payload)
      navigate(`/entries/${created.id}`)
    }
  }

  const loading = create.isPending || update.isPending
  const showPaperFields = PAPER_VISIBLE_STATUSES.includes(form.status)
  const ic = (key) => inputClass(errors, key)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {duplicate && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-300">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <p className="text-sm">
            A similar entry "<strong>{duplicate.name}</strong>" already exists. Are you sure you want to create a duplicate?
          </p>
        </div>
      )}

      {/* Basic Info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" name="name" required errors={errors}>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. EMNLP 2026"
              className={ic('name')}
            />
          </Field>

          <Field label="Type" name="type" required errors={errors}>
            <select value={form.type} onChange={e => set('type', e.target.value)} className={ic('type')}>
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Ranking" name="ranking" required errors={errors}>
            <select value={form.ranking} onChange={e => set('ranking', e.target.value)} className={ic('ranking')}>
              {RANKINGS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Status" name="status" required errors={errors}>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={ic('status')}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="URL (CFP / Journal Page)" name="url" errors={errors}>
              <input
                type="url"
                value={form.url}
                onChange={e => set('url', e.target.value)}
                placeholder="https://..."
                className={ic('url')}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Theme / Topics of Interest" name="theme" errors={errors}>
              <textarea
                value={form.theme}
                onChange={e => set('theme', e.target.value)}
                rows={2}
                placeholder="NLP, machine learning, computer vision..."
                className={ic('theme')}
              />
            </Field>
          </div>

          <Field label="Location (City, Country)" name="location" errors={errors}>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Abu Dhabi, UAE"
              className={ic('location')}
            />
          </Field>

          <Field label="Tags (comma-separated)" name="tags" errors={errors}>
            <input
              type="text"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="nlp, generation, safety"
              className={ic('tags')}
            />
          </Field>
        </div>
      </section>

      {/* Key Dates */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Key Dates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEADLINE_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label} name={key} errors={errors}>
              <input
                type="date"
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                className={ic(key)}
              />
            </Field>
          ))}
        </div>
      </section>

      {/* Paper Details */}
      {showPaperFields && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Paper Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Paper Title" name="paper_title" errors={errors}>
                <input
                  type="text"
                  value={form.paper_title}
                  onChange={e => set('paper_title', e.target.value)}
                  placeholder="Full paper title"
                  className={ic('paper_title')}
                />
              </Field>
            </div>
            <Field label="Authors" name="paper_authors" errors={errors}>
              <input
                type="text"
                value={form.paper_authors}
                onChange={e => set('paper_authors', e.target.value)}
                placeholder="Author 1, Author 2, ..."
                className={ic('paper_authors')}
              />
            </Field>
            <Field label="Link to Draft" name="paper_draft_link" errors={errors}>
              <input
                type="url"
                value={form.paper_draft_link}
                onChange={e => set('paper_draft_link', e.target.value)}
                placeholder="https://overleaf.com/..."
                className={ic('paper_draft_link')}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Abstract" name="paper_abstract" errors={errors}>
                <textarea
                  value={form.paper_abstract}
                  onChange={e => set('paper_abstract', e.target.value)}
                  rows={4}
                  placeholder="Paper abstract..."
                  className={ic('paper_abstract')}
                />
              </Field>
            </div>
          </div>
        </section>
      )}

      {/* Notes */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Notes</h3>
        <Field label="Notes (Markdown supported)" name="notes" errors={errors}>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={6}
            placeholder="Add notes, links, observations... (Markdown supported)"
            className={ic('notes')}
          />
        </Field>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Entry'}
        </button>
      </div>
    </form>
  )
}
