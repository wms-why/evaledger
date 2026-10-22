import { createServerFn } from '@tanstack/react-start'
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
 * The reports themselves are rows in the `data_report` D1 table. See the
 * "Where data lives" rule in AGENTS.md: published data is files, submitted
 * intake (like this and the waitlist) is a table.
 */

export type SubmitDataReportStatus =
  | 'submitted'
  | 'invalid'
  | 'rate-limited'
  | 'captcha'
  | 'error'

/** Public, unauthenticated. */
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
    const { verifyTurnstile } = await import('@/features/waitlist/turnstile')
    const { fixedWindowLimit } = await import('@/features/waitlist/rate-limit')
    const { createDataReport } = await import('./data-report.server')
    const { isDataReportKind } = await import('./data-report.shared')

    // 每 IP 5 次 / 10 分钟：够真人反复改错重提，挡得住脚本灌库。
    // KV 故障时放行（fail-open）：限流是阻尼不是安全边界。
    try {
      const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown'
      const allowed = await fixedWindowLimit(env.CACHE, `data-report:${ip}`, 5, 600, Date.now())
      if (!allowed) return { status: 'rate-limited' }
    } catch (err) {
      console.error('[data-report] rate limit check failed (allowing)', err)
    }

    // 先校验正文再消费 Turnstile token：siteverify 的 token 是一次性的，
    // 先消费再报错会让用户改正后的第二次提交莫名撞上「验证码失败」。
    if (!isDataReportKind(data.kind)) return { status: 'invalid' }
    if (!data.detail.trim()) return { status: 'invalid' }

    const ok = await verifyTurnstile(data.turnstileToken, env.TURNSTILE_SECRET_KEY)
    if (!ok) return { status: 'captcha' }

    try {
      const result = await createDataReport(
        createDb(env.DB),
        {
          modelId: data.modelId,
          kind: data.kind,
          detail: data.detail,
          sourceUrl: data.sourceUrl,
          email: data.email,
        },
        Date.now(),
      )
      return result.ok ? { status: 'submitted' } : { status: 'invalid' }
    } catch (err) {
      console.error('[data-report] submit failed', err)
      return { status: 'error' }
    }
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
