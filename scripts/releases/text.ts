/**
 * Pure text helpers for the release scraper.
 *
 * No IO, no browser — everything here is unit-tested in
 * `scripts/releases/__tests__/text.node.test.ts`.
 */

/** Collapse every whitespace run (spaces, tabs, newlines) into one space. */
export function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

/**
 * Normalize a scraped block of text: strip trailing spaces, drop blank-line
 * runs, and keep paragraph breaks (so headings stay readable in the draft).
 */
export function normalizeBlock(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
}

/**
 * Pull an `YYYY-MM-DD` date out of a scraped date string.
 *
 * Handles the shapes we actually see in the wild:
 *   "2026-09-10", "2026/09/10", "2026.09.10", "2026年9月10日",
 *   "September 10, 2026", "10 September 2026", "Sep 10, 2026",
 *   "2026-09-10T08:30:00Z", "发布于 2026-09-10 08:30".
 *
 * Returns null when nothing date-like is present — a page without a publish
 * date is normal (vendor pricing pages don't carry one), so "no date" must
 * not be an error.
 */
export function parsePublishedAt(input: string | null | undefined): string | null {
  if (!input) return null
  const text = input.replace(/[ \s]+/g, ' ').trim()
  if (!text) return null

  // 2026-09-10 / 2026/09/10 / 2026.09.10 (also inside an ISO timestamp).
  const numeric = text.match(/(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/)
  if (numeric) {
    return toIsoDate(numeric[1]!, numeric[2]!, numeric[3]!)
  }

  // September 10, 2026 / Sep 10 2026
  const mdy = text.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/)
  if (mdy) {
    const month = MONTHS[mdy[1]!.toLowerCase()]
    if (month) return toIsoDate(mdy[3]!, String(month), mdy[2]!)
  }

  // 10 September 2026
  const dmy = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/)
  if (dmy) {
    const month = MONTHS[dmy[2]!.toLowerCase()]
    if (month) return toIsoDate(dmy[3]!, String(month), dmy[1]!)
  }

  return null
}

function toIsoDate(year: string, month: string, day: string): string | null {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Cut a long body down to `maxChars`, marking that it happened.
 *
 * The scraped text is reference material for the human, not an article — a
 * truncated copy is still enough to write the "What shipped" list from.
 */
export function truncateText(
  input: string,
  maxChars: number,
): { text: string; truncated: boolean } {
  if (maxChars <= 0 || input.length <= maxChars) {
    return { text: input, truncated: false }
  }
  return {
    text: `${input.slice(0, maxChars)}\n\n[… 原文过长，已截断 …]`,
    truncated: true,
  }
}

/**
 * Build a Markdown fence long enough to contain `input` verbatim.
 *
 * The scraped text is embedded in a fenced code block so MDX never tries to
 * parse it as JSX. A plain ``` fence breaks when the text itself contains
 * ``` — so we always use one backtick more than the longest run inside.
 */
export function buildFence(input: string): string {
  let longest = 0
  for (const match of input.matchAll(/`+/g)) {
    longest = Math.max(longest, match[0].length)
  }
  return '`'.repeat(Math.max(3, longest + 1))
}

/**
 * Escape the few characters MDX treats as markup.
 *
 * Only used for text that lands *outside* the code fence (heading lists,
 * metadata lines). Inside the fence nothing needs escaping.
 */
export function escapeMdxText(input: string): string {
  return input.replace(/([<{}])/g, '\\$1')
}
