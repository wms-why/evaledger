/**
 * Number formatters for the calculator landing pages.
 *
 * The site publishes prices as USD per 1M tokens. These helpers turn a
 * registry number into the exact string a sentence quotes, so the same rate
 * is never spelled two ways in two places (the failure that produced the
 * old "$0.006/M vs $0.003/M" cache-price contradiction).
 *
 * Rules:
 *  - a rate of 1 or more keeps at most two decimals, with trailing zeros
 *    dropped ($2, $3.96, $52.50 → "52.5");
 *  - a rate below 1 keeps two decimals ($0.30, $0.20);
 *  - a rate below 0.10 keeps three ($0.006, $0.044);
 *  - a rate below 0.01 keeps four ($0.0060 → "0.006").
 */

/** Drop trailing zeros from a decimal string ("1.00" → "1", "2.50" → "2.5"). */
function trimZeros(value: string): string {
  if (!value.includes('.')) return value
  return value.replace(/0+$/, '').replace(/\.$/, '')
}

/** A per-1M rate, as written in the copy: `2`, `3.96`, `0.30`, `0.006`. */
export function formatRate(n: number): string {
  if (n >= 1) return Number.isInteger(n) ? String(n) : n.toFixed(2)
  if (n >= 0.1) return n.toFixed(2)
  if (n >= 0.01) return trimZeros(n.toFixed(3))
  return trimZeros(n.toFixed(4))
}

/** A per-1M rate with its currency sign: `$0.30`. */
export function formatMoney(n: number): string {
  return `$${formatRate(n)}`
}

/** A percentage, rounded to a whole number: `98`. */
export function formatPct(fraction: number): string {
  return String(Math.round(fraction * 100))
}

/**
 * A multiple, one decimal: `8.3`.
 *
 * Used for "how many times cheaper" claims — always the ratio of two
 * registry prices, never a number typed by hand. A whole number keeps no
 * decimal (`20`, not `20.0`).
 */
export function formatTimes(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/**
 * A token amount expressed in millions: `2.5M`, `500K`.
 *
 * `millions` is the number of MILLIONS of tokens (2.5 = 2.5M tokens).
 */
export function formatTokenAmount(millions: number): string {
  if (millions >= 1) return `${trimZeros(millions.toFixed(2))}M`
  return `${Math.round(millions * 1000)}K`
}

/** Cents for a dollar amount, rounded: `$0.02` → `2`. */
export function formatCents(dollars: number): string {
  return String(Math.round(dollars * 100))
}
