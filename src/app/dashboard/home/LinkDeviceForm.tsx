'use client'

import { useState, useTransition } from 'react'
import { linkDevice } from './actions'

export default function LinkDeviceForm() {
  const [code, setCode]           = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isPending, start]        = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const result = await linkDevice(code)
      if (!result.success) setError(result.error)
      // On success, revalidatePath in the action triggers a server re-render
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-2">
          Pairing code
        </label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-3
                     font-mono text-lg text-zinc-200 placeholder-zinc-700
                     tracking-widest text-center
                     focus:outline-none focus:border-amber-500/50 transition-colors"
        />
        <p className="font-mono text-[10px] text-zinc-600 mt-2 text-center">
          Shown on your display during setup
        </p>
      </div>

      {error && (
        <p className="font-mono text-xs text-red-400 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || code.trim().length === 0}
        className="w-full py-3 rounded-md bg-amber-500 text-black
                   font-mono text-sm font-semibold
                   hover:bg-amber-400 disabled:opacity-50
                   transition-colors duration-150"
      >
        {isPending ? 'Linking…' : 'Link display'}
      </button>
    </form>
  )
}
