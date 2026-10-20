/**
 * Price formatting for the release series.
 *
 * The site-wide `formatPrice` (leaderboard table, compare page) keeps a fixed
 * number of decimals per magnitude. That reads badly for the sub-dollar
 * rates this series quotes — `$0.300` and `$0.0060` look like typos — so the
 * fact sheet uses its own formatter: same precision, no trailing zeros.
 */

/** Trim trailing zeros but keep at least two decimals ("0.300" → "0.30"). */
function trimZeros(value: string): string {
  if (!value.includes('.')) return value
  const [int, dec] = value.split('.')
  const trimmed = (dec ?? '').replace(/0+$/, '')
  return `${int}.${trimmed.padEnd(Math.max(trimmed.length, 2), '0')}`
}

/** USD per 1M tokens, e.g. `$10.00`, `$0.30`, `$0.006`. */
export function formatReleasePrice(n: number): string {
  if (n >= 100) return `$${n.toFixed(0)}`
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${trimZeros(n.toFixed(3))}`
  return `$${trimZeros(n.toFixed(4))}`
}
