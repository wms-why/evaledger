import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { filterModels, groupModelsByVendor } from '../model-select'
import type { LeaderboardModel, Vendor } from '../types'
import { VENDOR_LABEL_KEY } from '../vendors'

export interface ModelSelectProps {
  /** Models the user may pick — the caller decides what is in play. */
  models: readonly LeaderboardModel[]
  /** Called with the picked model; the popover closes afterwards. */
  onSelect: (model: LeaderboardModel) => void
  /** Trigger copy, e.g. “Add model”. */
  label: string
  /** Trigger copy while disabled, e.g. “Max 5 models”. Falls back to `label`. */
  disabledLabel?: string
  disabled?: boolean
  /** Search-box placeholder. Defaults to the shared picker copy. */
  searchPlaceholder?: string
  /** Empty-state copy when nothing matches the query. */
  emptyLabel?: string
  align?: 'start' | 'center' | 'end'
  className?: string
}

/**
 * Searchable model picker.
 *
 * Opened from a small trigger, it shows a search box and one section per
 * vendor, in the canonical order defined by the leaderboard's vendor list.
 * Filtering covers the model name, id, version, kind, and both the vendor slug
 * and its localized name, so “anthropic opus” finds Claude Opus in English and
 * “智谱” finds GLM in Chinese.
 *
 * The trigger, combobox input, and listbox implement the
 * [combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):
 * ↑/↓ move the active option, Enter picks it, Esc closes. Focus stays in the
 * search input; the active option is exposed through `aria-activedescendant`.
 */
export function ModelSelect({
  models,
  onSelect,
  label,
  disabledLabel,
  disabled = false,
  searchPlaceholder,
  emptyLabel,
  align = 'start',
  className,
}: ModelSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '') || 'model-select'
  const listboxId = `${baseId}-listbox`
  const isDisabled = disabled || models.length === 0

  const vendorLabel = useCallback(
    (vendor: Vendor) => t(VENDOR_LABEL_KEY[vendor]),
    [t],
  )

  const filtered = useMemo(
    () => filterModels(models, query, vendorLabel),
    [models, query, vendorLabel],
  )
  const groups = useMemo(() => groupModelsByVendor(filtered), [filtered])

  const optionId = useCallback((id: string) => `${baseId}-option-${id}`, [baseId])
  const groupLabelId = useCallback(
    (vendor: Vendor) => `${baseId}-group-${vendor}`,
    [baseId],
  )

  function close() {
    setOpen(false)
    setQuery('')
    setActiveId(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      close()
      return
    }
    if (isDisabled) return
    setOpen(true)
    setQuery('')
    setActiveId(filterModels(models, '', vendorLabel)[0]?.id ?? null)
  }

  function choose(model: LeaderboardModel) {
    onSelect(model)
    close()
  }

  function handleQueryChange(next: string) {
    setQuery(next)
    setActiveId(filterModels(models, next, vendorLabel)[0]?.id ?? null)
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    // Never pick an option in the middle of an IME composition.
    if (event.nativeEvent.isComposing) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (filtered.length === 0) return
      const current = filtered.findIndex((model) => model.id === activeId)
      const next =
        event.key === 'ArrowDown'
          ? current < 0
            ? 0
            : Math.min(filtered.length - 1, current + 1)
          : current < 0
            ? filtered.length - 1
            : Math.max(0, current - 1)
      setActiveId(filtered[next].id)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const model = filtered.find((entry) => entry.id === activeId) ?? filtered[0]
      if (model) choose(model)
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (filtered.length === 0) return
      event.preventDefault()
      setActiveId((event.key === 'Home' ? filtered[0] : filtered[filtered.length - 1]).id)
    }
  }

  // Keep the active option valid when the query or candidate list changes.
  useEffect(() => {
    if (!open) return
    if (activeId && filtered.some((model) => model.id === activeId)) return
    setActiveId(filtered[0]?.id ?? null)
  }, [open, filtered, activeId])

  // Follow the keyboard through the scroll container.
  useEffect(() => {
    if (!open || !activeId) return
    document.getElementById(optionId(activeId))?.scrollIntoView({ block: 'nearest' })
  }, [open, activeId, optionId])

  const triggerLabel = isDisabled
    ? disabledLabel ?? (models.length === 0 ? t('leaderboard.modelSelect.exhausted') : label)
    : label

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[12px] text-fg-2 transition-colors',
            'hover:border-fg-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border disabled:hover:text-fg-2',
            open && 'border-fg-3 text-foreground',
            className,
          )}
        >
          <Plus size={13} aria-hidden />
          <span>{triggerLabel}</span>
          <ChevronDown
            size={13}
            aria-hidden
            className={cn('text-fg-3 transition-transform duration-150', open && 'rotate-180')}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={6}
        role="presentation"
        className="w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          searchRef.current?.focus()
        }}
      >
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search
              size={14}
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3"
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeId ? optionId(activeId) : undefined}
              aria-label={searchPlaceholder ?? t('leaderboard.modelSelect.search')}
              placeholder={searchPlaceholder ?? t('leaderboard.modelSelect.search')}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="model-select-search w-full text-foreground placeholder:text-fg-3"
            />
          </div>
        </div>

        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="max-h-[min(26rem,55vh)] overflow-y-auto overscroll-contain p-1.5"
        >
          {groups.length === 0 ? (
            <p className="px-2 py-6 text-center text-[12px] text-fg-3">
              {emptyLabel ?? t('leaderboard.modelSelect.empty')}
            </p>
          ) : (
            groups.map((group) => (
              <div
                key={group.vendor}
                role="group"
                aria-labelledby={groupLabelId(group.vendor)}
                className="py-1 first:pt-0 last:pb-0"
              >
                <div
                  id={groupLabelId(group.vendor)}
                  className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-3"
                >
                  {vendorLabel(group.vendor)}
                </div>
                <div role="presentation" className="space-y-0.5">
                  {group.models.map((model) => {
                    const active = model.id === activeId
                    return (
                      <div
                        key={model.id}
                        id={optionId(model.id)}
                        role="option"
                        aria-selected={active}
                        title={model.displayName}
                        onMouseEnter={() => setActiveId(model.id)}
                        onClick={() => choose(model)}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                          active ? 'bg-soft text-foreground' : 'text-fg-2',
                        )}
                      >
                        <span className="truncate">{model.displayName}</span>
                        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-fg-3">
                          {model.version}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
