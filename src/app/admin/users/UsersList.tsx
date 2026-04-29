'use client'

/**
 * UsersList — client component
 *
 * Renders the users list with inline forms for:
 *   - Creating a new user
 *   - Editing a user's name
 *   - Resetting a user's password
 */

import { useState, useTransition } from 'react'
import { createUser, updateUserName, resetUserPassword } from './actions'
import { formatDistanceToNow } from 'date-fns'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  full_name: string | null
  is_admin: boolean
  created_at: string
}

interface Props {
  profiles: Profile[]
  currentUserId: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsersList({ profiles, currentUserId }: Props) {
  const [editing, setEditing]         = useState<string | null>(null) // user id or 'new'
  const [editName, setEditName]       = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState<string | null>(null) // user id showing pw reset
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  function openEdit(p: Profile) {
    setEditing(p.id)
    setEditName(p.full_name ?? '')
    setShowPassword(null)
    setError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setShowPassword(null)
    setError(null)
    setSuccess(null)
  }

  function handleSaveName(userId: string) {
    if (!editName.trim()) { setError('Name is required'); return }
    startTransition(async () => {
      try {
        await updateUserName(userId, editName)
        setEditing(null)
        setError(null)
      } catch (e: any) { setError(e.message) }
    })
  }

  function handleResetPassword(userId: string) {
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    startTransition(async () => {
      try {
        await resetUserPassword(userId, newPassword)
        setNewPassword('')
        setShowPassword(null)
        setSuccess('Password updated')
        setTimeout(() => setSuccess(null), 3000)
      } catch (e: any) { setError(e.message) }
    })
  }

  function handleCreateUser() {
    if (!newUserForm.email.trim())     { setError('Email is required'); return }
    if (!newUserForm.full_name.trim()) { setError('Name is required'); return }
    if (newUserForm.password.length < 8) { setError('Password must be at least 8 characters'); return }

    startTransition(async () => {
      try {
        await createUser(newUserForm)
        setEditing(null)
        setNewUserForm({ email: '', password: '', full_name: '' })
        setError(null)
      } catch (e: any) { setError(e.message) }
    })
  }

  return (
    <div>
      {/* ── User rows ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">
        {profiles.map(p => (
          <div
            key={p.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
          >
            {editing === p.id ? (
              // ── Edit panel ──────────────────────────
              <div>
                {/* Name edit */}
                <div className="mb-3">
                  <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                               font-mono text-sm text-zinc-200
                               focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Password reset toggle */}
                {showPassword === p.id ? (
                  <div className="mb-3">
                    <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
                      New password
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                                   font-mono text-sm text-zinc-200 placeholder-zinc-600
                                   focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                      <button
                        onClick={() => handleResetPassword(p.id)}
                        disabled={isPending}
                        className="px-3 py-2 rounded-md bg-zinc-700 text-zinc-200
                                   font-mono text-xs hover:bg-zinc-600
                                   disabled:opacity-50 transition-colors"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowPassword(p.id); setNewPassword('') }}
                    className="font-mono text-[10px] text-zinc-500 hover:text-zinc-300
                               underline underline-offset-2 mb-3 block transition-colors"
                  >
                    Reset password
                  </button>
                )}

                {error && <p className="font-mono text-xs text-red-400 mb-3">{error}</p>}
                {success && <p className="font-mono text-xs text-green-400 mb-3">{success}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveName(p.id)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-md bg-amber-500 text-black
                               font-mono text-xs font-semibold
                               hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isPending}
                    className="px-4 py-2 rounded-md border border-zinc-700 text-zinc-400
                               font-mono text-xs hover:border-zinc-500 hover:text-zinc-200
                               disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // ── User row ────────────────────────────
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-white font-medium">
                      {p.full_name ?? '—'}
                    </p>
                    {/* Role badge */}
                    <span className={`
                      font-mono text-[10px] px-2 py-0.5 rounded border
                      ${p.is_admin
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                      }
                    `}>
                      {p.is_admin ? 'admin' : 'user'}
                    </span>
                    {/* "You" indicator */}
                    {p.id === currentUserId && (
                      <span className="font-mono text-[10px] text-zinc-600">you</span>
                    )}
                  </div>
                  <p className="text-zinc-600 text-xs font-mono mt-0.5">
                    Joined {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Edit button — don't show for yourself to avoid accidental lockout */}
                {p.id !== currentUserId && (
                  <button
                    onClick={() => openEdit(p)}
                    className="font-mono text-[10px] px-3 py-1.5 rounded
                               border border-zinc-700 text-zinc-400
                               hover:border-zinc-500 hover:text-zinc-200
                               transition-colors duration-150 shrink-0"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── New user form ──────────────────────────── */}
        {editing === 'new' && (
          <div className="bg-zinc-900 border border-amber-500/30 rounded-lg p-4">
            <p className="font-mono text-xs text-amber-400/70 uppercase tracking-widest mb-4">
              New user
            </p>

            <div className="mb-3">
              <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">Full name</label>
              <input type="text" value={newUserForm.full_name}
                onChange={e => setNewUserForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Maria García"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                           font-mono text-sm text-zinc-200 placeholder-zinc-600
                           focus:outline-none focus:border-zinc-500 transition-colors" />
            </div>

            <div className="mb-3">
              <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" value={newUserForm.email}
                onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                placeholder="maria@example.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                           font-mono text-sm text-zinc-200 placeholder-zinc-600
                           focus:outline-none focus:border-zinc-500 transition-colors" />
            </div>

            <div className="mb-4">
              <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" value={newUserForm.password}
                onChange={e => setNewUserForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                           font-mono text-sm text-zinc-200 placeholder-zinc-600
                           focus:outline-none focus:border-zinc-500 transition-colors" />
              <p className="font-mono text-[10px] text-zinc-600 mt-1">
                Share this with the user — they can change it after logging in
              </p>
            </div>

            {error && <p className="font-mono text-xs text-red-400 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button onClick={handleCreateUser} disabled={isPending}
                className="px-4 py-2 rounded-md bg-amber-500 text-black font-mono text-xs font-semibold
                           hover:bg-amber-400 disabled:opacity-50 transition-colors">
                {isPending ? 'Creating...' : 'Create user'}
              </button>
              <button onClick={cancelEdit} disabled={isPending}
                className="px-4 py-2 rounded-md border border-zinc-700 text-zinc-400 font-mono text-xs
                           hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add user button ───────────────────────────── */}
      {editing === null && (
        <button
          onClick={() => { setEditing('new'); setError(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg w-full justify-center
                     border border-dashed border-zinc-700 text-zinc-400
                     hover:border-amber-500/50 hover:text-amber-400
                     font-mono text-sm transition-colors duration-150"
        >
          + Create user
        </button>
      )}
    </div>
  )
}
