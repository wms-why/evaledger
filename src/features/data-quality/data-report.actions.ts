import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { clampPage, clampPageSize } from '@/features/admin/params'
import type { DataReportRow } from './data-report.server'

/**
 * The correction-report server functions.
 *
 * The submit endpoint is **public**: reporting a wrong price must not
 * require an account. That makes it an abuse target, so it carries the same
 * two dampers the waitlist form does — a per-IP fixed-window limit on KV and
 * an optional Turnstile check — and both degrade gracefully when the KV
 * binding or the Turnstile secret is missing.
 *
 * The `my*` endpoints are the signed-in half of the same table: they require
 * an account, skip the captcha (the session is the damper), and only ever
 * touch rows the caller owns and that are still `open`. Triage is the cutoff —
 * once an admin has ruled on a report it is a governance record, not editable
 * intake.
 *
 * The reports themselves are rows in the `data_report` D1 table. See the
 * "Where data lives" rule in AGENTS.md: published data is files, submitted
 * intake (like this and the waitlist) is a table.
 */

export type SubmitDataReportStatus =
  | 'submitted'
  | 'invalid'
  | 'rate-limited'
  | 'captcha'
  | 'limit'
  | 'error'

/** The signed-in caller, or a login redirect (same contract as feedback). */
async function currentUser() {
  const { readUser } = await import('@/features/auth/readUser.server')
  const user = await readUser()
  if (!user) throw redirect({ to: '/{-$locale}/login' })
  return user
}

/** Per-IP damper shared by the public form and the dashboard. Fail-open. */
async function withinRateLimit(cache: KVNamespace, ip: string, now: number) {
  const { fixedWindowLimit } = await import('@/features/waitlist/rate-limit')
  try {
    return await fixedWindowLimit(cache, `data-report:${ip}`, 5, 600, now)
  } catch (err) {
    // KV 故障时放行：限流是阻尼不是安全边界。
    console.error('[data-report] rate limit check failed (allowing)', err)
    return true
  }
}

/** Public, unauthenticated — but attributed when a session is present. */
export const submitDataReportFn = createServerFn({ method: 'POST' })
  .validator((d: { modelId?: string; kind?: string; detail?: string; sourceUrl?: string; email?: string; turnstileToken?: string }) => {
    const o = (d ?? {}) as Record<string, unknown>
    const str = (v: unknown): string => (typeof v === 'string' ? v : '')
    return {
      modelId: str(o.modelId).slice(0, 120),
      kind: str(o.kind).slice(0, 40),
      detail: str(o.detail).slice(0, 4000),
      sourceUrl: str(o.sourceUrl).slice(0, 500),
      email: str(o.email).slice(0, 200),
      turnstileToken: str(o.turnstileToken).slice(0, 4096),
    }
  })
  .handler(async ({ data }): Promise<{ status: SubmitDataReportStatus }> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { getRequestHeader } = await import('@tanstack/react-start/server')
    const { readUser } = await import('@/features/auth/readUser.server')
    const { verifyTurnstile } = await import('@/features/waitlist/turnstile')
    const { createDataReport } = await import('./data-report.server')
    const { isDataReportKind } = await import('./data-report.shared')

    // 每 IP 5 次 / 10 分钟：够真人反复改错重提，挡得住脚本灌库。
    const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown'
    if (!(await withinRateLimit(env.CACHE, ip, Date.now()))) return { status: 'rate-limited' }

    // 先校验正文再消费 Turnstile token：siteverify 的 token 是一次性的，
    // 先消费再报错会让用户改正后的第二次提交莫名撞上「验证码失败」。
    if (!isDataReportKind(data.kind)) return { status: 'invalid' }
    if (!data.detail.trim()) return { status: 'invalid' }

    const ok = await verifyTurnstile(data.turnstileToken, env.TURNSTILE_SECRET_KEY)
    if (!ok) return { status: 'captcha' }

    // A logged-in reporter owns their row (so it shows up in /app/reports);
    // a failed session lookup must not block a public report.
    const user = await readUser().catch(() => null)

    try {
      const result = await createDataReport(
        createDb(env.DB),
        {
          userId: user?.id ?? null,
          modelId: data.modelId,
          kind: data.kind,
          detail: data.detail,
          sourceUrl: data.sourceUrl,
          email: data.email,
        },
        Date.now(),
      )
      if (result.ok) return { status: 'submitted' }
      return { status: result.reason === 'limit' ? 'limit' : 'invalid' }
    } catch (err) {
      console.error('[data-report] submit failed', err)
      return { status: 'error' }
    }
  })

/** Signed in — the caller's own reports, newest first. */
export const getMyDataReportsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DataReportRow[]> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { scopeFromUser } = await import('@/db/scope')
    const { listMyDataReports } = await import('./data-report.server')
    const user = await currentUser()
    return listMyDataReports(createDb(env.DB), scopeFromUser(user.id))
  },
)

/**
 * Signed in — file a report from the dashboard.
 *
 * No Turnstile: an authenticated account plus the per-IP window is the damper,
 * and the account carries its own open-report ceiling. The account email is
 * stored as the contact address so a triager can reply without asking.
 */
export const submitMyDataReportFn = createServerFn({ method: 'POST' })
  .validator((d: { modelId?: string; kind?: string; detail?: string; sourceUrl?: string }) => {
    const o = (d ?? {}) as Record<string, unknown>
    const str = (v: unknown): string => (typeof v === 'string' ? v : '')
    return {
      modelId: str(o.modelId).slice(0, 120),
      kind: str(o.kind).slice(0, 40),
      detail: str(o.detail).slice(0, 4000),
      sourceUrl: str(o.sourceUrl).slice(0, 500),
    }
  })
  .handler(async ({ data }): Promise<{ status: SubmitDataReportStatus }> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { getRequestHeader } = await import('@tanstack/react-start/server')
    const { createDataReport } = await import('./data-report.server')
    const user = await currentUser()

    const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown'
    if (!(await withinRateLimit(env.CACHE, ip, Date.now()))) return { status: 'rate-limited' }
    try {
      const result = await createDataReport(
        createDb(env.DB),
        {
          userId: user.id,
          modelId: data.modelId,
          kind: data.kind,
          detail: data.detail,
          sourceUrl: data.sourceUrl,
          email: user.email,
        },
        Date.now(),
      )
      if (result.ok) return { status: 'submitted' }
      if (result.reason === 'limit') return { status: 'limit' }
      return { status: 'invalid' }
    } catch (err) {
      console.error('[data-report] my submit failed', err)
      return { status: 'error' }
    }
  })

/** Signed in — edit an owned, still-open report. */
export const updateMyDataReportFn = createServerFn({ method: 'POST' })
  .validator((d: { id?: string; modelId?: string; kind?: string; detail?: string; sourceUrl?: string }) => {
    const o = (d ?? {}) as Record<string, unknown>
    const str = (v: unknown): string => (typeof v === 'string' ? v : '')
    return {
      id: str(o.id).slice(0, 80),
      modelId: str(o.modelId).slice(0, 120),
      kind: str(o.kind).slice(0, 40),
      detail: str(o.detail).slice(0, 4000),
      sourceUrl: str(o.sourceUrl).slice(0, 500),
    }
  })
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: 'kind' | 'detail' | 'locked' }> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { scopeFromUser } = await import('@/db/scope')
    const { updateMyDataReport } = await import('./data-report.server')
    const user = await currentUser()
    const r = await updateMyDataReport(
      createDb(env.DB),
      scopeFromUser(user.id),
      data.id,
      { modelId: data.modelId, kind: data.kind, detail: data.detail, sourceUrl: data.sourceUrl },
      Date.now(),
    )
    return r.ok ? { ok: true } : { ok: false, reason: r.reason }
  })

/** Signed in — withdraw an owned, still-open report. */
export const deleteMyDataReportFn = createServerFn({ method: 'POST' })
  .validator((d: { id?: string }) => ({ id: typeof d?.id === 'string' ? d.id.slice(0, 80) : '' }))
  .handler(async ({ data }): Promise<{ deleted: boolean }> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { scopeFromUser } = await import('@/db/scope')
    const { deleteMyDataReport } = await import('./data-report.server')
    const user = await currentUser()
    return { deleted: await deleteMyDataReport(createDb(env.DB), scopeFromUser(user.id), data.id) }
  })

/** Admin only — the report queue. */
export const listDataReportsFn = createServerFn({ method: 'GET' })
  .validator((d: { page?: number; pageSize?: number }) => ({
    page: clampPage(d?.page),
    pageSize: clampPageSize(d?.pageSize),
  }))
  .handler(async ({ data }): Promise<{ rows: DataReportRow[]; total: number }> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { assertAdmin } = await import('@/features/admin/assert-admin.server')
    const { listDataReports } = await import('./data-report.server')
    await assertAdmin()
    return listDataReports(createDb(env.DB), data)
  })

/** Admin only — triage a report. */
export const setDataReportStatusFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string; status: string }) => {
    const o = (d ?? {}) as Record<string, unknown>
    return {
      id: typeof o.id === 'string' ? o.id : '',
      status: typeof o.status === 'string' ? o.status : '',
    }
  })
  .handler(async ({ data }): Promise<void> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { assertAdmin } = await import('@/features/admin/assert-admin.server')
    const { setDataReportStatus } = await import('./data-report.server')
    const { isDataReportStatus } = await import('./data-report.shared')
    await assertAdmin()
    if (!isDataReportStatus(data.status)) throw new Error(`invalid status: ${data.status}`)
    await setDataReportStatus(createDb(env.DB), data.id, data.status, Date.now())
  })
