import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { GripVertical, X } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import { LEADERBOARD } from '../models'
import type { LeaderboardModel } from '../types'
import {
  MAX_COMPARE_MODELS,
  MIN_COMPARE_MODELS,
  moveCompareId,
} from '../compare-selection'
import { ModelSelect } from './ModelSelect'

/**
 * The model strip above the comparison table.
 *
 * Every selected model is a chip: drag the grip to reorder the columns (the
 * table follows the chip order), press ← / → on a focused grip to do the same
 * from the keyboard, and use the add/remove controls to change the line-up.
 *
 * The order is held locally while dragging and handed to the parent once the
 * pointer is released, so a drag only writes the URL once instead of on every
 * chip it passes over.
 */
export function CompareSelector({
  models,
  onChange,
}: {
  models: LeaderboardModel[]
  onChange: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  const idsKey = models.map((m) => m.id).join(',')
  const [order, setOrder] = useState<string[]>(() => models.map((m) => m.id))
  const orderRef = useRef(order)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)
  const dragged = useRef(false)

  // Re-sync when the URL changes (back/forward, add/remove, external link).
  useEffect(() => {
    const next = idsKey ? idsKey.split(',') : []
    orderRef.current = next
    setOrder(next)
  }, [idsKey])

  const modelsById = useMemo(
    () => new Map(LEADERBOARD.models.map((model) => [model.id, model])),
    [],
  )
  const selected = order
    .map((id) => modelsById.get(id))
    .filter((model): model is LeaderboardModel => !!model)
  const remaining = LEADERBOARD.models.filter((model) => !order.includes(model.id))
  const atMax = order.length >= MAX_COMPARE_MODELS

  function applyOrder(next: string[]) {
    orderRef.current = next
    setOrder(next)
  }

  function commit(next: string[]) {
    applyOrder(next)
    if (next.join(',') !== idsKey) onChange(next)
  }

  function addModel(id: string) {
    if (!id || orderRef.current.includes(id) || orderRef.current.length >= MAX_COMPARE_MODELS) return
    commit([...orderRef.current, id])
  }

  function removeModel(id: string) {
    if (orderRef.current.length <= MIN_COMPARE_MODELS) return
    commit(orderRef.current.filter((value) => value !== id))
  }

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    dragId.current = id
    dragged.current = false
    setDraggingId(id)
  }

  // Listen on window rather than the handle: re-ordering the chips mid-drag
  // re-renders React's keyed list, and pointer capture on a moved node dies.
  useEffect(() => {
    if (!draggingId) return

    function onPointerMove(event: PointerEvent) {
      const active = dragId.current
      if (!active) return
      const overId = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-compare-chip]')?.dataset.compareChip
      if (!overId || overId === active) return

      const current = orderRef.current
      const from = current.indexOf(active)
      const to = current.indexOf(overId)
      if (from < 0 || to < 0 || from === to) return

      const next = [...current]
      next.splice(from, 1)
      next.splice(to, 0, active)
      dragged.current = true
      applyOrder(next)
    }

    function finish(cancelled: boolean) {
      if (!dragId.current) return
      dragId.current = null
      setDraggingId(null)
      if (cancelled) {
        dragged.current = false
        applyOrder(idsKey ? idsKey.split(',') : [])
        return
      }
      if (!dragged.current) return
      dragged.current = false
      const next = orderRef.current
      if (next.join(',') !== idsKey) onChange(next)
    }

    const onPointerUp = () => finish(false)
    const onPointerCancel = () => finish(true)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [draggingId, idsKey, onChange])

  function onHandleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, id: string) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next = moveCompareId(orderRef.current, id, event.key === 'ArrowLeft' ? -1 : 1)
    if (next === orderRef.current) return
    commit(next)
  }

  return (
    <section
      aria-label={t('leaderboard.compare.selectedModels')}
      className="rounded-[14px] border border-border bg-card p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((model, index) => (
          <div
            key={model.id}
            data-compare-chip={model.id}
            className={cn(
              'inline-flex select-none items-center gap-1 rounded-full border border-border bg-bg-alt py-0.5 pl-0.5 pr-1.5 transition-shadow',
              draggingId === model.id && 'z-10 shadow-sm ring-2 ring-primary/50',
            )}
          >
            <span className="pl-1 text-[11px] tabular-nums text-fg-3">{index + 1}</span>
            <button
              type="button"
              aria-label={t('leaderboard.compare.reorderModel', { model: model.displayName })}
              aria-keyshortcuts="ArrowLeft ArrowRight"
              onPointerDown={(event) => beginDrag(event, model.id)}
              onKeyDown={(event) => onHandleKeyDown(event, model.id)}
              className="cursor-grab touch-none rounded-full p-1 text-fg-3 transition-colors hover:bg-card hover:text-fg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing"
            >
              <GripVertical size={14} aria-hidden />
            </button>
            <span className="text-[13px] font-medium text-foreground">{model.displayName}</span>
            <button
              type="button"
              aria-label={t('leaderboard.compare.removeModel', { model: model.displayName })}
              disabled={order.length <= MIN_COMPARE_MODELS}
              onClick={() => removeModel(model.id)}
              className="rounded-full p-1 text-fg-3 transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <X size={13} aria-hidden />
            </button>
          </div>
        ))}

        <ModelSelect
          models={remaining}
          onSelect={(model) => addModel(model.id)}
          label={t('leaderboard.compare.addModel')}
          disabled={atMax || remaining.length === 0}
          disabledLabel={
            atMax
              ? t('leaderboard.compare.maxReached', { max: MAX_COMPARE_MODELS })
              : t('leaderboard.modelSelect.exhausted')
          }
        />
      </div>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-fg-3">
        <span className="inline-flex items-center gap-1">
          <GripVertical size={12} aria-hidden />
          {t('leaderboard.compare.reorderHint')}
        </span>
        <span className="tabular-nums">
          {t('leaderboard.compare.modelCount', {
            count: order.length,
            max: MAX_COMPARE_MODELS,
          })}
        </span>
      </p>
    </section>
  )
}
