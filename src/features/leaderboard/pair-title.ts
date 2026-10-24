/**
 * The title of a two-model page — "A vs B", short enough for a SERP title.
 *
 * The page's `<title>` must stay within 60 characters including the brand
 * suffix (" — EvalLedger"), so the two names have a 47-character budget. Two
 * checkpoints of one line are named `DeepSeek V4.1-Flash 1017` and
 * `DeepSeek V4.1-Flash 0910`; printing both in full breaks the budget. When
 * the names share leading words, the second one is shortened to its
 * distinguishing suffix ("DeepSeek V4.1-Flash 1017 vs V4-Flash 0731").
 * Cross-vendor pairs share at most a vendor word, and short pairs are left
 * untouched — the compression is a budget fallback, not the house style.
 */
export const PAIR_TITLE_BUDGET = 47

export function pairTitle(
  a: string,
  b: string,
  connector: string,
  budget: number = PAIR_TITLE_BUDGET,
): string {
  const aClean = a.trim()
  const bClean = b.trim()
  const full = `${aClean} ${connector} ${bClean}`
  if (full.length <= budget) return full

  const aw = aClean.split(/\s+/)
  const bw = bClean.split(/\s+/)
  const limit = Math.min(aw.length - 1, bw.length - 1)
  let common = 0
  while (common < limit && aw[common].toLowerCase() === bw[common].toLowerCase()) {
    common += 1
  }
  if (common === 0) return full

  const compressed = `${aClean} ${connector} ${bw.slice(common).join(' ')}`
  return compressed.length < full.length ? compressed : full
}
