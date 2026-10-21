/**
 * The vocabulary of the correction-report intake.
 *
 * Kept in its own module (no DB, no React) because the public form, the
 * server fns and the admin console all need the same lists — and the admin
 * console is a client component.
 */

/** What the reporter says is wrong. */
export const DATA_REPORT_KINDS = [
  'stale-price',
  'wrong-version',
  'inconsistent-score',
  'other',
] as const

export type DataReportKind = (typeof DATA_REPORT_KINDS)[number]

/** Where a report sits in the triage. */
export const DATA_REPORT_STATUSES = ['open', 'accepted', 'rejected'] as const

export type DataReportStatus = (typeof DATA_REPORT_STATUSES)[number]

/** Longest detail we accept — a paragraph, not an essay. */
export const DETAIL_MAX = 2000

/** Longest optional source URL. */
export const SOURCE_URL_MAX = 500

/** Longest optional contact address. */
export const EMAIL_MAX = 200

export function isDataReportKind(value: unknown): value is DataReportKind {
  return typeof value === 'string' && (DATA_REPORT_KINDS as readonly string[]).includes(value)
}

export function isDataReportStatus(value: unknown): value is DataReportStatus {
  return typeof value === 'string' && (DATA_REPORT_STATUSES as readonly string[]).includes(value)
}

/**
 * i18n key for a report kind. The keys live in the dictionary; this module
 * only maps the wire value to the key.
 */
export const REPORT_KIND_I18N_KEY: Record<DataReportKind, string> = {
  'stale-price': 'dataQuality.report.kindStalePrice',
  'wrong-version': 'dataQuality.report.kindWrongVersion',
  'inconsistent-score': 'dataQuality.report.kindInconsistentScore',
  other: 'dataQuality.report.kindOther',
}
