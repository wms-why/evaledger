/**
 * The correction-report data layer — pure functions over D1.
 *
 * A correction report is one row in `data_report`. It is operational intake
 * (like `feedback` / `waitlist`), not published site content: the fix a report
 * produces is still an edit to the price file. The report is stored as it was
 * written — nothing is corrected, nothing is summarised — so a triager reads
 * the reporter's own words and source link.
 *
 * Ownership goes through `@/db/scope` (`ownedBy` / `withOwner`) like every
 * other user-scoped table: an owner edit and an owner delete are guarded by
 * the same filter that lists the owner's rows. An anonymous report has
 * `user_id IS NULL` and therefore never matches an owner filter — anonymous
 * intake stays with the admin queue.
 *
 * No `cloudflare:workers` import and no React: the Drizzle handle is passed in,
 * so the workers test pool can drive it against a local D1.
 */
import { and, count, desc, eq } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { ownedBy, scopeFromUser, withOwner, type Scope } from '@/db/scope'
import { dataReport } from './data-report.schema'
import {
  DETAIL_MAX,
  EMAIL_MAX,
  OPEN_REPORT_LIMIT,
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
  /** The signed-in reporter, or null/undefined for an anonymous report. */
  userId?: string | null
}

export type CreateDataReportResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'kind' | 'detail' | 'limit' }

/** The fields a reporter may change while the report is still open. */
export interface EditDataReportInput {
  modelId?: string | null
  kind: string
  detail: string
  sourceUrl?: string | null
}

export type EditDataReportResult =
  | { ok: true }
  /** `locked`: the row is gone, not yours, or already triaged. */
  | { ok: false; reason: 'kind' | 'detail' | 'locked' }

/** One row as the admin console and "my reports" render it. */
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

/** Drizzle row → the shape the UI renders. */
function toRow(r: typeof dataReport.$inferSelect): DataReportRow {
  return {
    id: r.id,
    modelId: r.modelId,
    kind: r.kind,
    detail: r.detail,
    sourceUrl: r.sourceUrl,
    email: r.email,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
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
  const email = optional(input.email, EMAIL_MAX)
  const scope = input.userId ? scopeFromUser(input.userId) : null
  if (scope) {
    // COUNT→INSERT is not atomic, same honest trade-off as feedback: a
    // concurrent pair can briefly overshoot. The real governance is triage.
    const [{ c }] = await db
      .select({ c: count() })
      .from(dataReport)
      .where(and(ownedBy(dataReport, scope), eq(dataReport.status, 'open')))
    if (Number(c) >= OPEN_REPORT_LIMIT) return { ok: false, reason: 'limit' }
  }
  const id = crypto.randomUUID()
  const values = {
    id,
    modelId: optional(input.modelId, 120),
    kind,
    detail,
    sourceUrl: optional(input.sourceUrl, SOURCE_URL_MAX),
    email,
    status: 'open',
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }
  await db.insert(dataReport).values(scope ? withOwner(scope, values) : { ...values, userId: null })
  return { ok: true, id }
}

/** Newest first, paginated — the admin queue. */
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
  return { rows: listed.map(toRow), total: Number(c) }
}

/** The reporter's own rows, newest first. Anonymous rows are never included. */
export async function listMyDataReports(db: DB, scope: Scope): Promise<DataReportRow[]> {
  const listed = await db
    .select()
    .from(dataReport)
    .where(ownedBy(dataReport, scope))
    .orderBy(desc(dataReport.createdAt), desc(dataReport.id))
  return listed.map(toRow)
}

/**
 * Edit an owned report that has not been triaged yet.
 *
 * Ownership and the `open` status live in the same WHERE clause as the write:
 * dropping the owner filter is privilege escalation, dropping the status
 * filter edits a record the queue has already ruled on.
 */
export async function updateMyDataReport(
  db: DB,
  scope: Scope,
  id: string,
  input: EditDataReportInput,
  now: number,
): Promise<EditDataReportResult> {
  if (!isDataReportKind(input.kind)) return { ok: false, reason: 'kind' }
  const kind: DataReportKind = input.kind
  const detail = (input.detail ?? '').trim()
  if (!detail || detail.length > DETAIL_MAX) return { ok: false, reason: 'detail' }
  const res = await db
    .update(dataReport)
    .set({
      modelId: optional(input.modelId, 120),
      kind,
      detail,
      sourceUrl: optional(input.sourceUrl, SOURCE_URL_MAX),
      updatedAt: new Date(now),
    })
    .where(
      and(ownedBy(dataReport, scope), eq(dataReport.id, id), eq(dataReport.status, 'open')),
    )
    .returning({ id: dataReport.id })
  return res.length > 0 ? { ok: true } : { ok: false, reason: 'locked' }
}

/** Withdraw an owned report that has not been triaged yet. */
export async function deleteMyDataReport(db: DB, scope: Scope, id: string): Promise<boolean> {
  const res = await db
    .delete(dataReport)
    .where(
      and(ownedBy(dataReport, scope), eq(dataReport.id, id), eq(dataReport.status, 'open')),
    )
    .returning({ id: dataReport.id })
  return res.length > 0
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
