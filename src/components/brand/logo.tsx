import { Link } from '@tanstack/react-router'

/** EvalLedger wordmark — coin-stack mark + "EvalLedger". `compact` renders the mark only. */
export function Logo({
  size = 17,
  compact = false,
  asLink = true,
}: {
  size?: number
  compact?: boolean
  /** Wrap in a locale-aware link to the home route. Disable only when the mark sits inside another link (e.g. the auth card). */
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
      {!compact && <span>EvalLedger</span>}
    </span>
  )

  if (!asLink) return content

  return (
    <Link
      to="/{-$locale}"
      aria-label="EvalLedger"
      className="shrink-0 transition-opacity hover:opacity-80"
      // 只把首页当“当前页”：/zh 是 /zh/* 的父路径，不加 exact 会在所有中文页命中
      activeOptions={{ exact: true }}
    >
      {content}
    </Link>
  )
}