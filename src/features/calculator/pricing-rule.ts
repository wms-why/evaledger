/**
 * Localized rendering of the pricing rules `cost.ts` builds.
 *
 * `calculateCost` returns an `appliedRule` string in English (`standard`,
 * `promo (until 2026-12-31)`, `long-context ≥200,000 (×2 / ×1.5)`,
 * `peak hours`, `cached input`, …). Every surface that shows that rule to a
 * reader must localize it — the raw string is an internal format, not copy.
 *
 * This module is the single translator for those rules, so the calculator
 * card and the series ladder cannot drift apart.
 */

/** Translation function shape returned by `useTranslation()`. */
export type RuleTFn = (key: string, params?: Record<string, string | number>) => string

/**
 * Map an `appliedRule` string to a localized label. Combinations such as
 * `promo (until 2026-12-31) + cached input` are split on ` + `, translated
 * part by part, and joined back together. Unrecognised rules fall back to the
 * raw string.
 */
export function renderRuleKey(rule: string, t: RuleTFn, locale: string): string {
  if (!rule) return rule
  return rule
    .split(' + ')
    .map((part) => translateRulePart(part.trim(), t, locale))
    .join(' + ')
}

/** Translate a single rule (no ` + ` combination). */
function translateRulePart(rule: string, t: RuleTFn, locale: string): string {
  if (rule === 'standard') return t('calculator.ruleStandard')
  if (rule.startsWith('promo')) {
    // `promo (until 2026-12-31)` — the date must not swallow the closing paren.
    const date = rule.match(/until ([^)]+)/)?.[1]
    return date ? t('calculator.rulePromo', { date }) : rule
  }
  if (rule.startsWith('long-context')) {
    const n = rule.match(/≥([\d.,\s]+)/)?.[1]
    return n ? t('calculator.longContextLabel', { n: formatThreshold(n, locale) }) : rule
  }
  if (rule.startsWith('off-peak')) return t('calculator.offPeakLabel')
  if (rule.startsWith('peak')) return t('calculator.peakLabel')
  if (rule === 'cached input') return t('calculator.cachedInputLabel')
  const cacheWrite = rule.match(/^cache write \((.+)\)$/)?.[1]
  if (cacheWrite) return t('calculator.cacheWriteLabel', { window: cacheWrite })
  return rule
}

/**
 * Re-format a long-context threshold that was stringified with the browser
 * locale (`cost.ts` builds the rule string) so the page shows the app locale.
 */
function formatThreshold(raw: string, locale: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return raw.trim()
  const n = Number(digits)
  return Number.isFinite(n) ? n.toLocaleString(locale) : raw.trim()
}
