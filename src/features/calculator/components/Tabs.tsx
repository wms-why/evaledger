import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  node: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

/**
 * Lightweight tabs primitive — buttons only, no animation, accessible.
 * We don't pull in @radix-ui/react-tabs because the project doesn't have it.
 */
export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]
  return (
    <div className={cn('w-full', className)}>
      <div role="tablist" className="inline-flex rounded-lg border border-border bg-bg-alt p-1">
        {tabs.map((t) => {
          const isActive = t.id === activeId
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(t.id)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-fg-2 hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" className="mt-4">
        {active.node}
      </div>
    </div>
  )
}