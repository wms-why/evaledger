import { dictionaries, translate, type Locale } from '@/features/i18n/locale'

/**
 * The i18n dictionaries, importable from a spec.
 *
 * The specs assert on the *real* copy rather than on hard-coded English
 * strings: a dictionary edit that breaks a page shows up as a failing test
 * instead of as a silently stale expectation.
 */
export const dict = (locale: Locale) => dictionaries[locale]

/** `t('en', 'leaderboard.home.h1')` → the English headline. */
export const t = (locale: Locale, key: string, params?: Record<string, string | number>) =>
  translate(dictionaries[locale], key, params)

export type { Locale }
