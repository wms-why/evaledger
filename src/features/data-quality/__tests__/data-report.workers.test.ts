import { describe, test, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import {
  createDataReport,
  listDataReports,
  setDataReportStatus,
  reportKey,
  REPORT_PREFIX,
} from '../data-report.server'
import { DETAIL_MAX } from '../data-report.shared'

/**
 * The correction-report workers integration test — real R2 (miniflare BUCKET
 * binding).
 *
 * A report is a file, not a row: there is no schema to create, so this test
 * has no `beforeAll` table setup. Each test starts from an empty prefix.
 */
async function clearReports(): Promise<void> {
  const listed = await env.BUCKET.list({ prefix: REPORT_PREFIX })
  const keys = listed.objects.map((o) => o.key)
  if (keys.length > 0) await env.BUCKET.delete(keys)
}

beforeEach(async () => {
  await clearReports()
})

describe('createDataReport', () => {
  test('合法提交 → 落成一个文件，状态为 open，文本 trim 过', async () => {
    const r = await createDataReport(
      env.BUCKET,
      {
        modelId: 'gpt-6-astra',
        kind: 'stale-price',
        detail: '  OpenAI lists $8 now, not $10.  ',
        sourceUrl: ' https://platform.openai.com/docs/pricing ',
        email: ' someone@example.com ',
      },
      1000,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('setup failed')
    const { rows } = await listDataReports(env.BUCKET, { page: 0, pageSize: 50 })
    const row = rows.find((x) => x.id === r.id)!
    expect(row.kind).toBe('stale-price')
    expect(row.detail).toBe('OpenAI lists $8 now, not $10.')
    expect(row.sourceUrl).toBe('https://platform.openai.com/docs/pricing')
    expect(row.email).toBe('someone@example.com')
    expect(row.status).toBe('open')
    expect(new Date(row.createdAt).getTime()).toBe(1000)
  })

  test('每个报告是桶里的一个 JSON 文件', async () => {
    const r = await createDataReport(env.BUCKET, { kind: 'other', detail: 'file probe' }, 1100)
    if (!r.ok) throw new Error('setup failed')
    const listed = await env.BUCKET.list({ prefix: REPORT_PREFIX })
    expect(listed.objects).toHaveLength(1)
    expect(listed.objects[0].key).toBe(reportKey(r.id))
    const object = await env.BUCKET.get(reportKey(r.id))
    expect(object?.httpMetadata?.contentType).toBe('application/json')
    expect((await object!.json<{ detail: string }>()).detail).toBe('file probe')
  })

  test('未知 kind → 拒绝，不落文件', async () => {
    const before = (await listDataReports(env.BUCKET, { page: 0, pageSize: 100 })).total
    expect(await createDataReport(env.BUCKET, { kind: 'nonsense', detail: 'x' }, 2000)).toEqual({
      ok: false,
      reason: 'kind',
    })
    const after = (await listDataReports(env.BUCKET, { page: 0, pageSize: 100 })).total
    expect(after).toBe(before)
  })

  test('空详情 / 超长详情 → 拒绝', async () => {
    expect(await createDataReport(env.BUCKET, { kind: 'other', detail: '   ' }, 2000)).toEqual({
      ok: false,
      reason: 'detail',
    })
    expect(
      await createDataReport(env.BUCKET, { kind: 'other', detail: 'x'.repeat(DETAIL_MAX + 1) }, 2000),
    ).toEqual({ ok: false, reason: 'detail' })
  })

  test('可选字段留空 → null（不是空串）', async () => {
    const r = await createDataReport(env.BUCKET, { kind: 'other', detail: 'site wide note' }, 2100)
    if (!r.ok) throw new Error('setup failed')
    const { rows } = await listDataReports(env.BUCKET, { page: 0, pageSize: 100 })
    const row = rows.find((x) => x.id === r.id)!
    expect(row.modelId).toBeNull()
    expect(row.sourceUrl).toBeNull()
    expect(row.email).toBeNull()
  })
})

describe('listDataReports', () => {
  test('按创建时间倒序，分页切片正确', async () => {
    const ids: string[] = []
    for (let i = 0; i < 3; i++) {
      const r = await createDataReport(env.BUCKET, { kind: 'other', detail: `page probe ${i}` }, 3000 + i)
      if (!r.ok) throw new Error('setup failed')
      ids.push(r.id)
    }
    const first = await listDataReports(env.BUCKET, { page: 0, pageSize: 1 })
    expect(first.rows.length).toBe(1)
    expect(first.rows[0].id).toBe(ids[ids.length - 1]) // 最新在前
    const second = await listDataReports(env.BUCKET, { page: 1, pageSize: 1 })
    expect(second.rows[0].id).not.toBe(first.rows[0].id)
    expect(first.total).toBe(second.total)
  })
})

describe('setDataReportStatus', () => {
  test('状态流转写回文件，updatedAt 跟着走', async () => {
    const r = await createDataReport(env.BUCKET, { kind: 'wrong-version', detail: 'version mismatch' }, 4000)
    if (!r.ok) throw new Error('setup failed')
    await setDataReportStatus(env.BUCKET, r.id, 'accepted', 5000)
    const { rows } = await listDataReports(env.BUCKET, { page: 0, pageSize: 100 })
    const row = rows.find((x) => x.id === r.id)!
    expect(row.status).toBe('accepted')
    expect(new Date(row.updatedAt).getTime()).toBe(5000)
    expect(new Date(row.createdAt).getTime()).toBe(4000)
  })

  test('非法状态 → 抛错（状态词表是封闭的）', async () => {
    const r = await createDataReport(env.BUCKET, { kind: 'other', detail: 'invalid status probe' }, 6000)
    if (!r.ok) throw new Error('setup failed')
    await expect(
      setDataReportStatus(env.BUCKET, r.id, 'bogus' as never, 6100),
    ).rejects.toThrow(/invalid status/)
  })
})
