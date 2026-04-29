'use client'

/**
 * AppsList — client component
 *
 * Renders the sortable app rotation list with:
 *   - Drag handles (dnd-kit) for reordering
 *   - Toggle switches for enabling/disabling apps
 *   - Gear icon linking to each app's config page
 *
 * Uses dnd-kit for accessible drag-and-drop.
 * Optimistic updates — the UI updates immediately, then the
 * server action runs in the background.
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Settings, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toggleApp, reorderApps } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppRow {
  id: string          // device_app id
  position: number
  isEnabled: boolean
  config: Record<string, any>
  appId: string       // app slug e.g. 'clock'
  appName: string
  hasConfig: boolean
}

interface Props {
  deviceId: string
  apps: AppRow[]
}

// ── AppsList ──────────────────────────────────────────────────────────────────

export default function AppsList({ deviceId, apps: initialApps }: Props) {
  // Local copy of apps — updated optimistically before server confirms
  const [apps, setApps]          = useState<AppRow[]>(initialApps)
  const [error, setError]        = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // dnd-kit sensors — PointerSensor for mouse/touch, KeyboardSensor for a11y
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ── Drag end handler ────────────────────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = apps.findIndex(a => a.id === active.id)
    const newIndex = apps.findIndex(a => a.id === over.id)

    // Optimistic update — move the item in local state immediately
    const reordered = arrayMove(apps, oldIndex, newIndex)
    setApps(reordered)

    // Persist to server in the background
    startTransition(async () => {
      try {
        await reorderApps(deviceId, reordered.map(a => a.id))
        setError(null)
      } catch (e: any) {
        // Revert on failure
        setApps(apps)
        setError(e.message)
      }
    })
  }

  // ── Toggle handler ──────────────────────────────────────────────────────────

  function handleToggle(deviceAppId: string, currentlyEnabled: boolean) {
    const newEnabled = !currentlyEnabled

    // Optimistic update
    setApps(prev =>
      prev.map(a => a.id === deviceAppId ? { ...a, isEnabled: newEnabled } : a)
    )

    startTransition(async () => {
      try {
        await toggleApp(deviceId, deviceAppId, newEnabled)
        setError(null)
      } catch (e: any) {
        // Revert on failure
        setApps(prev =>
          prev.map(a => a.id === deviceAppId ? { ...a, isEnabled: currentlyEnabled } : a)
        )
        setError(e.message)
      }
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-900/50
                        bg-red-950/20 font-mono text-xs text-red-400">
          {error}
        </div>
      )}

      {/*
        DndContext wraps the entire sortable list.
        closestCenter algorithm works best for vertical lists.
      */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/*
          SortableContext needs the list of ids in their current order
          and the strategy (vertical list in our case).
        */}
        <SortableContext
          items={apps.map(a => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {apps.map((app, index) => (
              <SortableAppRow
                key={app.id}
                app={app}
                index={index}
                isPending={isPending}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ── SortableAppRow ────────────────────────────────────────────────────────────

/**
 * Individual sortable row — uses useSortable from dnd-kit.
 * The transform and transition styles are applied to animate
 * the row while dragging and when it snaps into place.
 */

interface RowProps {
  app: AppRow
  index: number
  isPending: boolean
  onToggle: (id: string, currentlyEnabled: boolean) => void
}

function SortableAppRow({ app, index, isPending, onToggle }: RowProps) {
  const {
    attributes,   // aria attributes for accessibility
    listeners,    // drag event listeners — attached to the handle only
    setNodeRef,   // ref to attach to the row's DOM element
    transform,    // current drag transform (x/y offset while dragging)
    transition,   // CSS transition string for smooth snap-back
    isDragging,   // true while this row is being dragged
  } = useSortable({ id: app.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-zinc-900 border rounded-lg px-3 py-3
        flex items-center gap-3
        transition-colors duration-150
        ${isDragging
          ? 'border-amber-500/30 bg-zinc-800 shadow-lg shadow-black/50 z-10'
          : app.isEnabled
            ? 'border-zinc-800'
            : 'border-zinc-800/50 opacity-50'
        }
      `}
    >
      {/* ── Drag handle ───────────────────────────── */}
      {/*
        listeners and attributes go on the handle, not the whole row.
        This way clicking the toggle or gear doesn't start a drag.
      */}
      <button
        {...attributes}
        {...listeners}
        className="text-zinc-700 hover:text-zinc-500 cursor-grab
                   active:cursor-grabbing shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* ── Position number ───────────────────────── */}
      <span className="font-mono text-xs text-zinc-600 w-4 shrink-0 select-none">
        {app.isEnabled ? index + 1 : '—'}
      </span>

      {/* ── App name + config summary ─────────────── */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-zinc-200 truncate">
          {app.appName}
        </p>
        <ConfigSummary appId={app.appId} config={app.config} />
      </div>

      {/* ── Gear icon — links to config page ─────── */}
      {app.hasConfig && (
        <Link
          href={`/dashboard/apps/${app.appId}`}
          className="text-zinc-700 hover:text-amber-400
                     transition-colors duration-150 shrink-0 p-1"
          aria-label={`Configure ${app.appName}`}
        >
          <Settings size={15} />
        </Link>
      )}

      {/* ── Toggle ────────────────────────────────── */}
      <button
        onClick={() => onToggle(app.id, app.isEnabled)}
        disabled={isPending}
        aria-label={app.isEnabled ? 'Disable app' : 'Enable app'}
        className={`
          relative w-9 h-5 rounded-full border shrink-0
          transition-colors duration-150
          disabled:opacity-40
          ${app.isEnabled
            ? 'bg-amber-600/70 border-amber-500/70'
            : 'bg-zinc-800 border-zinc-700'
          }
        `}
      >
        <span className={`
          absolute top-0.5 w-3.5 h-3.5 rounded-full
          transition-all duration-150
          ${app.isEnabled
            ? 'left-[18px] bg-amber-300'
            : 'left-0.5 bg-zinc-600'
          }
        `} />
      </button>
    </div>
  )
}

// ── ConfigSummary ─────────────────────────────────────────────────────────────

function ConfigSummary({
  appId,
  config,
}: {
  appId: string
  config: Record<string, any>
}) {
  if (!config || Object.keys(config).length === 0) return null

  let summary: string | null = null

  switch (appId) {
    case 'clock':
    case 'clock_date':
    case 'word_clock':
      if (config.timezone) {
        const fmt = config.format ? ` · ${config.format}` : ''
        summary = `${config.timezone}${fmt}`
      }
      break
    case 'three_city_clock':
      const cities = [config.city1, config.city2, config.city3].filter(Boolean)
      if (cities.length > 0) summary = cities.join(' · ')
      break
    case 'weather':
    case 'weather_3day':
      if (config.city) summary = `${config.city} · ${config.unit ?? '°C'}`
      break
    case 'countdown':
      const events = config.enabled_events ?? []
      if (events.length > 0) summary = `${events.length} event${events.length !== 1 ? 's' : ''}`
      break
    case 'national_flag':
      const countries = config.countries ?? []
      if (countries.length > 0) summary = countries.slice(0, 4).join(', ') + (countries.length > 4 ? '…' : '')
      break
    case 'birthday':
    case 'happy_birthday':
      summary = 'On birthday only'
      break
    case 'quotes':
      summary = 'Dynamic duration'
      break
  }

  if (!summary) return null

  return (
    <p className="font-mono text-[10px] text-zinc-600 mt-0.5 truncate">
      {summary}
    </p>
  )
}
