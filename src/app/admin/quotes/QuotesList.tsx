'use client'

/**
 * QuotesList — client component
 *
 * Renders the full quotes management UI:
 *   - List of existing quotes with toggle, edit, delete
 *   - Inline add / edit form (shown/hidden via local state)
 *
 * Receives the quotes array from the server component (page.tsx) as a prop
 * so the initial render is fast with no client-side fetching.
 * All mutations go through Server Actions in actions.ts.
 */

import { useState, useTransition } from 'react'
import {
  createQuote,
  updateQuote,
  toggleQuoteActive,
  deleteQuote,
  type QuoteFormData,
} from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Quote {
  id: string
  body_en: string
  body_es: string
  author: string
  is_active: boolean
  created_at: string
}

interface Props {
  quotes: Quote[]
}

// ── Empty form state ───────────────────────────────────────────────────────────

const emptyForm: QuoteFormData = {
  body_en:   '',
  body_es:   '',
  author:    '',
  is_active: true,
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuotesList({ quotes }: Props) {
  // Which quote is being edited (null = none, 'new' = add form)
  const [editing, setEditing]   = useState<string | null>(null)
  const [form, setForm]         = useState<QuoteFormData>(emptyForm)
  const [error, setError]       = useState<string | null>(null)

  // useTransition lets us show a pending state while a Server Action runs
  // without blocking the UI — isPending is true while the action is in flight
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setForm(emptyForm)
    setEditing('new')
    setError(null)
  }

  function openEdit(q: Quote) {
    setForm({ body_en: q.body_en, body_es: q.body_es, author: q.author, is_active: q.is_active })
    setEditing(q.id)
    setError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setError(null)
  }

  function handleSave() {
    // Basic validation
    if (!form.body_en.trim() || !form.body_es.trim() || !form.author.trim()) {
      setError('All fields are required')
      return
    }

    startTransition(async () => {
      try {
        if (editing === 'new') {
          await createQuote(form)
        } else if (editing) {
          await updateQuote(editing, form)
        }
        setEditing(null)
        setError(null)
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong')
      }
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await toggleQuoteActive(id, !current)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this quote? This cannot be undone.')) return
    startTransition(async () => {
      try {
        await deleteQuote(id)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div>

      {/* ── Quote rows ──────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">
        {quotes.length === 0 && editing !== 'new' && (
          <div className="border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-500 font-mono text-sm">No quotes yet</p>
          </div>
        )}

        {quotes.map(q => (
          <div key={q.id}>
            {editing === q.id ? (
              // ── Edit form ─────────────────────────
              <QuoteForm
                form={form}
                onChange={setForm}
                onSave={handleSave}
                onCancel={cancelEdit}
                isPending={isPending}
                error={error}
              />
            ) : (
              // ── Quote row ─────────────────────────
              <div className={`
                bg-zinc-900 border rounded-lg p-4 transition-colors duration-150
                ${q.is_active ? 'border-zinc-800' : 'border-zinc-800/50 opacity-50'}
              `}>
                {/* Quote body — EN */}
                <p className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  "{q.body_en}"
                </p>

                {/* Quote body — ES (dimmer) */}
                <p className="font-mono text-xs text-zinc-500 leading-relaxed mt-1 whitespace-pre-wrap">
                  "{q.body_es}"
                </p>

                {/* Author */}
                <p className="font-mono text-xs text-green-500 mt-2">
                  — {q.author}
                </p>

                {/* Meta + actions row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Language badges */}
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded
                                   bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    EN
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded
                                   bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ES
                  </span>

                  {/* Active badge */}
                  <span className={`
                    font-mono text-[10px] px-2 py-0.5 rounded border
                    ${q.is_active
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                    }
                  `}>
                    {q.is_active ? 'active' : 'disabled'}
                  </span>

                  {/* Actions — pushed to the right */}
                  <div className="ml-auto flex items-center gap-2">
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggle(q.id, q.is_active)}
                      disabled={isPending}
                      className="font-mono text-[10px] px-2 py-1 rounded
                                 border border-zinc-700 text-zinc-400
                                 hover:border-zinc-500 hover:text-zinc-200
                                 disabled:opacity-40 transition-colors duration-150"
                    >
                      {q.is_active ? 'Disable' : 'Enable'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(q)}
                      disabled={isPending}
                      className="font-mono text-[10px] px-2 py-1 rounded
                                 border border-zinc-700 text-zinc-400
                                 hover:border-zinc-500 hover:text-zinc-200
                                 disabled:opacity-40 transition-colors duration-150"
                    >
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={isPending}
                      className="font-mono text-[10px] px-2 py-1 rounded
                                 border border-red-900/50 text-red-500/70
                                 hover:border-red-700 hover:text-red-400
                                 disabled:opacity-40 transition-colors duration-150"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── Add form ────────────────────────────────── */}
        {editing === 'new' && (
          <QuoteForm
            form={form}
            onChange={setForm}
            onSave={handleSave}
            onCancel={cancelEdit}
            isPending={isPending}
            error={error}
          />
        )}
      </div>

      {/* ── Add button ──────────────────────────────── */}
      {editing === null && (
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg
                     border border-dashed border-zinc-700 text-zinc-400
                     hover:border-amber-500/50 hover:text-amber-400
                     font-mono text-sm transition-colors duration-150 w-full
                     justify-center"
        >
          + Add quote
        </button>
      )}
    </div>
  )
}

// ── QuoteForm ─────────────────────────────────────────────────────────────────

/**
 * Shared form used for both adding and editing a quote.
 * Extracted as a separate component to avoid repeating the JSX twice.
 */

interface FormProps {
  form: QuoteFormData
  onChange: (f: QuoteFormData) => void
  onSave: () => void
  onCancel: () => void
  isPending: boolean
  error: string | null
}

function QuoteForm({ form, onChange, onSave, onCancel, isPending, error }: FormProps) {
  // Helper to update one field without replacing the whole form object
  function set(field: keyof QuoteFormData, value: string | boolean) {
    onChange({ ...form, [field]: value })
  }

  return (
    <div className="bg-zinc-900 border border-amber-500/30 rounded-lg p-4">

      <p className="font-mono text-xs text-amber-400/70 uppercase tracking-widest mb-4">
        Quote
      </p>

      {/* English body */}
      <div className="mb-3">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          English text
        </label>
        <textarea
          value={form.body_en}
          onChange={e => set('body_en', e.target.value)}
          rows={3}
          placeholder="It always seems impossible until it's done."
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                     font-mono text-xs text-zinc-200 placeholder-zinc-600
                     focus:outline-none focus:border-zinc-500
                     resize-none transition-colors duration-150"
        />
      </div>

      {/* Spanish body */}
      <div className="mb-3">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          Spanish text
        </label>
        <textarea
          value={form.body_es}
          onChange={e => set('body_es', e.target.value)}
          rows={3}
          placeholder="Siempre parece imposible hasta que se hace."
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                     font-mono text-xs text-zinc-200 placeholder-zinc-600
                     focus:outline-none focus:border-zinc-500
                     resize-none transition-colors duration-150"
        />
      </div>

      {/* Author */}
      <div className="mb-4">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          Author
        </label>
        <input
          type="text"
          value={form.author}
          onChange={e => set('author', e.target.value)}
          placeholder="Nelson Mandela"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                     font-mono text-xs text-zinc-200 placeholder-zinc-600
                     focus:outline-none focus:border-zinc-500
                     transition-colors duration-150"
        />
        <p className="font-mono text-[10px] text-zinc-600 mt-1">
          Will be stored and displayed in uppercase automatically
        </p>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => set('is_active', !form.is_active)}
          className={`
            w-8 h-4.5 rounded-full border relative transition-colors duration-150
            ${form.is_active ? 'bg-amber-600/80 border-amber-500' : 'bg-zinc-800 border-zinc-700'}
          `}
        >
          <span className={`
            absolute top-0.5 w-3 h-3 rounded-full transition-all duration-150
            ${form.is_active ? 'left-4 bg-amber-300' : 'left-0.5 bg-zinc-500'}
          `} />
        </button>
        <span className="font-mono text-xs text-zinc-400">
          {form.is_active ? 'Active — will appear in rotation' : 'Disabled — skipped in rotation'}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="font-mono text-xs text-red-400 mb-3">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={isPending}
          className="px-4 py-2 rounded-md bg-amber-500 text-black
                     font-mono text-xs font-semibold
                     hover:bg-amber-400 disabled:opacity-50
                     transition-colors duration-150"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-md border border-zinc-700 text-zinc-400
                     font-mono text-xs
                     hover:border-zinc-500 hover:text-zinc-200
                     disabled:opacity-50 transition-colors duration-150"
        >
          Cancel
        </button>
      </div>

    </div>
  )
}
