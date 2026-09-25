import { Link } from '@tanstack/react-router'

/** TokenCalculator wordmark — coin-stack mark + "TokenCalculator". `compact` renders the mark only. */
export function Logo({
  size = 17,
  compact = false,
  asLink = true,
}: {
  size?: number
  compact?: boolean
  /** Wrap in a locale-aware link to the home route. Disable for in-app brand marks (e.g. workspace sidebar). */
  asLink?: boolean
}) {
  const content = (
    <span
      className="inline-flex items-center gap-2 font-semibold tracking-[-0.02em] text-foreground"
      style={{ fontSize: size }}
    >
      <svg
        width={size + 4}
        height={size + 4}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
        <path d="M5 5.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
        <path d="M5 11.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
      </svg>
      {!compact && <span>TokenCalculator</span>}
    </span>
  )

  if (!asLink) return content

  return (
    <Link to="/{-$locale}" aria-label="TokenCalculator" className="shrink-0">
      {content}
    </Link>
  )
}