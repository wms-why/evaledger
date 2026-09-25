import { cn } from '@/lib/utils'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  ariaLabel: string
  formatValue?: (v: number) => string
  className?: string
}

/**
 * Native `<input type="range">` styled to match the project's `kicker` / card
 * aesthetic. No animation library — keep it cheap and SSR-safe.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  ariaLabel,
  formatValue,
  className,
}: SliderProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        type="range"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-foreground"
      />
      <span className="min-w-[3.5em] text-right text-[13px] tabular-nums text-fg-2">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  )
}