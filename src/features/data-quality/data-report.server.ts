/**
 * The correction-report data layer — pure functions over an R2 bucket.
 *
 * A correction report is **one file**: a JSON object per report, under the
 * `data-reports/` prefix of the bucket. It is not a row and it is not a
 * table — see the "Where data lives" rule in AGENTS.md.
 *
 * No `cloudflare:workers` import and no React: the bucket handle is passed
 * in, so the workers test pool can drive it against a local R2.
 */
import {
  DATA_REPORT_KINDS,
  DATA_REPORT_STATUSES,
  DETAIL_MAX,
  EMAIL_MAX,
  SOURCE_URL_MAX,
  isDataReportKind,
  isDataReportStatus,
  type DataReportKind,
  type DataReportStatus,
} from './data-report.shared'

/** Every report object lives under this prefix of the bucket. */
export const REPORT_PREFIX = 'data-reports/'

/** How many keys one R2 listing call returns. */
const LIST_PAGE = 1000

/** Fixed width so the id sorts as a timestamp (13 digits until the year 2286). */
const ID_WIDTH = 13

export interface CreateDataReportInput {
  /** The model the report is about — optional (a site-wide report is fine). */
  modelId?: string | null
  kind: string
  detail: string
  sourceUrl?: string | null
  email?: string | null
}

export type CreateDataReportResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'kind' | 'detail' }

/** What one report file holds. */
interface StoredReport {
  id: string
  modelId: string | null
  kind: DataReportKind
  detail: string
  sourceUrl: string | null
  email: string | null
  status: DataReportStatus
  createdAt: number
  updatedAt: number
}

/** One row as the admin console renders it. */
export interface DataReportRow {
  id: string
  modelId: string | null
  kind: string
  detail: string
  sourceUrl: string | null
  email: string | null
  status: string
  /** ISO timestamp — when the report was filed. */
  createdAt: string
  /** ISO timestamp — when the report was last re-triaged. */
  updatedAt: string
}

/** Trim an optional free-text field; empty becomes null. */
function optional(value: string | null | undefined, max: number): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

/** The object key a report id lives at. */
export function reportKey(id: string): string {
  return `${REPORT_PREFIX}${id}.json`
}

/**
 * A report id that sorts chronologically.
 *
 * The timestamp comes first at a fixed width, so R2's lexicographic key
 * order *is* the filing order — and the id still names its own key, so a
 * triage action can rewrite a report without listing the bucket first. The
 * uuid behind it keeps two reports filed in the same millisecond apart.
 */
function newReportId(now: number): string {
  return `${String(now).padStart(ID_WIDTH, '0')}-${crypto.randomUUID()}`
}

/**
 * Record a correction report.
 *
 * The report is stored as it was written: nothing is corrected, nothing is
 * summarised, the reporter's own words and their source link are what a
 * triager reads.
 */
export async function createDataReport(
  bucket: R2Bucket,
  input: CreateDataReportInput,
  now: number,
): Promise<CreateDataReportResult> {
  if (!isDataReportKind(input.kind)) return { ok: false, reason: 'kind' }
  const kind: DataReportKind = input.kind
  const detail = (input.detail ?? '').trim()
  if (!detail || detail.length > DETAIL_MAX) return { ok: false, reason: 'detail' }
  const id = newReportId(now)
  const record: StoredReport = {
    id,
    modelId: optional(input.modelId, 120),
    kind,
    detail,
    sourceUrl: optional(input.sourceUrl, SOURCE_URL_MAX),
    email: optional(input.email, EMAIL_MAX),
    status: 'open',
    createdAt: now,
    updatedAt: now,
  }
  await bucket.put(reportKey(id), JSON.stringify(record), {
    httpMetadata: { contentType: 'application/json' },
  })
  return { ok: true, id }
}

/**
 * Every report key, newest first.
 *
 * The listing is paged through the cursor so the count is exact, not capped
 * at one page. R2 returns keys in lexicographic order and the id leads with
 * its timestamp, so ascending keys are oldest-first — reversed here.
 */
async function listReportKeys(bucket: R2Bucket): Promise<string[]> {
  const keys: string[] = []
  let cursor: string | undefined
  for (;;) {
    const listed = await bucket.list({ prefix: REPORT_PREFIX, limit: LIST_PAGE, cursor })
    for (const object of listed.objects) keys.push(object.key)
    if (!listed.truncated) break
    cursor = listed.cursor
  }
  return keys.reverse()
}

/** Read one report file. A missing or unreadable file is not a report. */
async function readReport(bucket: R2Bucket, key: string): Promise<DataReportRow | null> {
  const object = await bucket.get(key)
  if (!object) return null
  let record: StoredReport
  try {
    record = await object.json<StoredReport>()
  } catch {
    return null
  }
  return {
    id: record.id,
    modelId: record.modelId ?? null,
    kind: record.kind,
    detail: record.detail,
    sourceUrl: record.sourceUrl ?? null,
    email: record.email ?? null,
    status: record.status,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
  }
}

/** Newest first, paginated. */
export async function listDataReports(
  bucket: R2Bucket,
  p: { page: number; pageSize: number },
): Promise<{ rows: DataReportRow[]; total: number }> {
  const keys = await listReportKeys(bucket)
  const total = keys.length
  const slice = keys.slice(p.page * p.pageSize, p.page * p.pageSize + p.pageSize)
  const rows = await Promise.all(slice.map((key) => readReport(bucket, key)))
  return { rows: rows.filter((row): row is DataReportRow => row !== null), total }
}

/**
 * Move a report through triage.
 *
 * The status vocabulary is closed: an unknown status is a programming error,
 * not a value to store. A report that is no longer there is left alone —
 * triaging a deleted report is not an error the triager can act on.
 */
export async function setDataReportStatus(
  bucket: R2Bucket,
  id: string,
  status: DataReportStatus,
  now: number,
): Promise<void> {
  if (!isDataReportStatus(status)) throw new Error(`invalid status: ${status}`)
  const key = reportKey(id)
  const object = await bucket.get(key)
  if (!object) return
  const record = await object.json<StoredReport>()
  await bucket.put(
    key,
    JSON.stringify({ ...record, status, updatedAt: now } satisfies StoredReport),
    { httpMetadata: { contentType: 'application/json' } },
  )
}

/** The kinds and statuses this module accepts (re-exported for convenience). */
export { DATA_REPORT_KINDS, DATA_REPORT_STATUSES }
export type { DataReportKind, DataReportStatus }
