/**
 * The correction-report data layer — pure functions over D1.
 *
 * A correction report is one row in `data_report`. It is operational intake
 * (like `feedback` / `waitlist`), not published site content: the fix a report
 * produces is still an edit to the price file. The report is stored as it was
 * written — nothing is corrected, nothing is summarised — so a triager reads
 * the reporter's own words and source link.
 *
 * No `cloudflare:workers` import and no React: the Drizzle handle is passed in,
 * so the workers test pool can drive it against a local D1.
 */
import { count, desc, eq } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { dataReport } from './data-report.schema'
import {
  DETAIL_MAX,
  EMAIL_MAX,
  SOURCE_URL_MAX,
  isDataReportKind,
  isDataReportStatus,
  type DataReportKind,
  type DataReportStatus,
} from './data-report.shared'

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

/** Record a correction report. */
export async function createDataReport(
  db: DB,
  input: CreateDataReportInput,
  now: number,
): Promise<CreateDataReportResult> {
  if (!isDataReportKind(input.kind)) return { ok: false, reason: 'kind' }
  const kind: DataReportKind = input.kind
  const detail = (input.detail ?? '').trim()
  if (!detail || detail.length > DETAIL_MAX) return { ok: false, reason: 'detail' }
  const id = crypto.randomUUID()
  await db.insert(dataReport).values({
    id,
    modelId: optional(input.modelId, 120),
    kind,
    detail,
    sourceUrl: optional(input.sourceUrl, SOURCE_URL_MAX),
    email: optional(input.email, EMAIL_MAX),
    status: 'open',
    createdAt: new Date(now),
    updatedAt: new Date(now),
  })
  return { ok: true, id }
}

/** Newest first, paginated. */
export async function listDataReports(
  db: DB,
  p: { page: number; pageSize: number },
): Promise<{ rows: DataReportRow[]; total: number }> {
  const listed = await db
    .select()
    .from(dataReport)
    .orderBy(desc(dataReport.createdAt), desc(dataReport.id))
    .limit(p.pageSize)
    .offset(p.page * p.pageSize)
  const [{ c }] = await db.select({ c: count() }).from(dataReport)
  const rows = listed.map((r) => ({
    id: r.id,
    modelId: r.modelId,
    kind: r.kind,
    detail: r.detail,
    sourceUrl: r.sourceUrl,
    email: r.email,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
  return { rows, total: Number(c) }
}

/**
 * Move a report through triage.
 *
 * The status vocabulary is closed: an unknown status is a programming error,
 * not a value to store. A report that is no longer there is left alone —
 * triaging a deleted report is not an error the triager can act on.
 */
export async function setDataReportStatus(
  db: DB,
  id: string,
  status: DataReportStatus,
  now: number,
): Promise<void> {
  if (!isDataReportStatus(status)) throw new Error(`invalid status: ${status}`)
  await db
    .update(dataReport)
    .set({ status, updatedAt: new Date(now) })
    .where(eq(dataReport.id, id))
}

/** The kinds and statuses this module accepts (re-exported for convenience). */
export { DATA_REPORT_KINDS, DATA_REPORT_STATUSES } from './data-report.shared'
export type { DataReportKind, DataReportStatus } from './data-report.shared'
