import { describe, test, expect, beforeAll, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import { scopeFromUser } from '@/db/scope'
import {
  createDataReport,
  deleteMyDataReport,
  listDataReports,
  listMyDataReports,
  setDataReportStatus,
  updateMyDataReport,
} from '../data-report.server'
import { DETAIL_MAX, OPEN_REPORT_LIMIT } from '../data-report.shared'

/**
 * The correction-report workers integration test — real D1 (miniflare DB
 * binding). The workers pool does not apply migrations, so the table is
 * created by hand here.
 */
beforeAll(async () => {
  await env.DB.exec(
    `CREATE TABLE IF NOT EXISTS data_report (` +
    `id TEXT PRIMARY KEY NOT NULL, user_id TEXT, model_id TEXT, kind TEXT NOT NULL, ` +
    `detail TEXT NOT NULL, source_url TEXT, email TEXT, ` +
    `status TEXT DEFAULT 'open' NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  )
  await env.DB.exec(
    `CREATE INDEX IF NOT EXISTS data_report_createdAt_idx ON data_report (created_at)`,
  )
  await env.DB.exec(
    `CREATE INDEX IF NOT EXISTS data_report_userId_idx ON data_report (user_id)`,
  )
})

beforeEach(async () => {
  await env.DB.exec('DELETE FROM data_report')
})

const db = () => createDb(env.DB)

describe('createDataReport', () => {
  test('合法提交 → 落库一行，状态为 open，文本 trim 过', async () => {
    const r = await createDataReport(
      db(),
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
    const { rows } = await listDataReports(db(), { page: 0, pageSize: 50 })
    const row = rows.find((x) => x.id === r.id)!
    expect(row.kind).toBe('stale-price')
    expect(row.detail).toBe('OpenAI lists $8 now, not $10.')
    expect(row.sourceUrl).toBe('https://platform.openai.com/docs/pricing')
    expect(row.email).toBe('someone@example.com')
    expect(row.status).toBe('open')
    expect(new Date(row.createdAt).getTime()).toBe(1000)
  })

  test('每个报告是 data_report 表里的一行', async () => {
    const r = await createDataReport(db(), { kind: 'other', detail: 'row probe' }, 1100)
    if (!r.ok) throw new Error('setup failed')
    const raw = await env.DB
      .prepare('SELECT id, detail, status FROM data_report WHERE id = ?')
      .bind(r.id)
      .first<{ id: string; detail: string; status: string }>()
    expect(raw?.detail).toBe('row probe')
    expect(raw?.status).toBe('open')
    const counted = await env.DB.prepare('SELECT COUNT(*) AS c FROM data_report').first<{ c: number }>()
    expect(counted?.c).toBe(1)
  })

  test('未知 kind → 拒绝，不落库', async () => {
    const before = (await listDataReports(db(), { page: 0, pageSize: 100 })).total
    expect(await createDataReport(db(), { kind: 'nonsense', detail: 'x' }, 2000)).toEqual({
      ok: false,
      reason: 'kind',
    })
    const after = (await listDataReports(db(), { page: 0, pageSize: 100 })).total
    expect(after).toBe(before)
  })

  test('空详情 / 超长详情 → 拒绝', async () => {
    expect(await createDataReport(db(), { kind: 'other', detail: '   ' }, 2000)).toEqual({
      ok: false,
      reason: 'detail',
    })
    expect(
      await createDataReport(db(), { kind: 'other', detail: 'x'.repeat(DETAIL_MAX + 1) }, 2000),
    ).toEqual({ ok: false, reason: 'detail' })
  })

  test('可选字段留空 → null（不是空串）', async () => {
    const r = await createDataReport(db(), { kind: 'other', detail: 'site wide note' }, 2100)
    if (!r.ok) throw new Error('setup failed')
    const { rows } = await listDataReports(db(), { page: 0, pageSize: 100 })
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
      const r = await createDataReport(db(), { kind: 'other', detail: `page probe ${i}` }, 3000 + i)
      if (!r.ok) throw new Error('setup failed')
      ids.push(r.id)
    }
    const first = await listDataReports(db(), { page: 0, pageSize: 1 })
    expect(first.rows.length).toBe(1)
    expect(first.rows[0].id).toBe(ids[ids.length - 1]) // 最新在前
    const second = await listDataReports(db(), { page: 1, pageSize: 1 })
    expect(second.rows[0].id).not.toBe(first.rows[0].id)
    expect(first.total).toBe(second.total)
  })
})

describe('setDataReportStatus', () => {
  test('状态流转写回行，updatedAt 跟着走', async () => {
    const r = await createDataReport(db(), { kind: 'wrong-version', detail: 'version mismatch' }, 4000)
    if (!r.ok) throw new Error('setup failed')
    await setDataReportStatus(db(), r.id, 'accepted', 5000)
    const { rows } = await listDataReports(db(), { page: 0, pageSize: 100 })
    const row = rows.find((x) => x.id === r.id)!
    expect(row.status).toBe('accepted')
    expect(new Date(row.updatedAt).getTime()).toBe(5000)
    expect(new Date(row.createdAt).getTime()).toBe(4000)
  })

  test('非法状态 → 抛错（状态词表是封闭的）', async () => {
    const r = await createDataReport(db(), { kind: 'other', detail: 'invalid status probe' }, 6000)
    if (!r.ok) throw new Error('setup failed')
    await expect(
      setDataReportStatus(db(), r.id, 'bogus' as never, 6100),
    ).rejects.toThrow(/invalid status/)
  })
})

describe('ownership', () => {
  const alice = scopeFromUser('user_alice')
  const bob = scopeFromUser('user_bob')

  test('登录用户提交 → 归到自己名下，匿名报告不进任何人的「我的报告」', async () => {
    const owned = await createDataReport(
      db(),
      { userId: 'user_alice', kind: 'stale-price', detail: 'alice report' },
      7000,
    )
    const anon = await createDataReport(db(), { kind: 'other', detail: 'anonymous report' }, 7001)
    if (!owned.ok || !anon.ok) throw new Error('setup failed')

    const mine = await listMyDataReports(db(), alice)
    expect(mine.map((r) => r.id)).toEqual([owned.id])
    expect(await listMyDataReports(db(), bob)).toEqual([])
  })

  test('只改得动自己且仍为 open 的报告', async () => {
    const r = await createDataReport(
      db(),
      { userId: 'user_alice', kind: 'other', detail: 'before edit' },
      7100,
    )
    if (!r.ok) throw new Error('setup failed')

    expect(
      await updateMyDataReport(db(), bob, r.id, { kind: 'other', detail: 'bob was here' }, 7101),
    ).toEqual({ ok: false, reason: 'locked' })

    expect(
      await updateMyDataReport(
        db(),
        alice,
        r.id,
        { kind: 'wrong-version', detail: 'after edit', sourceUrl: ' https://example.com ' },
        7102,
      ),
    ).toEqual({ ok: true })

    const row = (await listMyDataReports(db(), alice)).find((x) => x.id === r.id)!
    expect(row.detail).toBe('after edit')
    expect(row.kind).toBe('wrong-version')
    expect(row.sourceUrl).toBe('https://example.com')
    expect(new Date(row.updatedAt).getTime()).toBe(7102)
    expect(new Date(row.createdAt).getTime()).toBe(7100)

    // Triaged rows are frozen intake — no further edits from the reporter.
    await setDataReportStatus(db(), r.id, 'accepted', 7103)
    expect(
      await updateMyDataReport(db(), alice, r.id, { kind: 'other', detail: 'late edit' }, 7104),
    ).toEqual({ ok: false, reason: 'locked' })
  })

  test('编辑的正文校验与创建一致', async () => {
    const r = await createDataReport(
      db(),
      { userId: 'user_alice', kind: 'other', detail: 'validation probe' },
      7200,
    )
    if (!r.ok) throw new Error('setup failed')
    expect(
      await updateMyDataReport(db(), alice, r.id, { kind: 'nonsense', detail: 'x' }, 7201),
    ).toEqual({ ok: false, reason: 'kind' })
    expect(
      await updateMyDataReport(db(), alice, r.id, { kind: 'other', detail: '   ' }, 7202),
    ).toEqual({ ok: false, reason: 'detail' })
  })

  test('只撤得掉自己且仍为 open 的报告', async () => {
    const mine = await createDataReport(
      db(),
      { userId: 'user_alice', kind: 'other', detail: 'withdraw me' },
      7300,
    )
    const triaged = await createDataReport(
      db(),
      { userId: 'user_alice', kind: 'other', detail: 'already accepted' },
      7301,
    )
    if (!mine.ok || !triaged.ok) throw new Error('setup failed')
    await setDataReportStatus(db(), triaged.id, 'rejected', 7302)

    expect(await deleteMyDataReport(db(), bob, mine.id)).toBe(false)
    expect(await deleteMyDataReport(db(), alice, triaged.id)).toBe(false)
    expect(await deleteMyDataReport(db(), alice, mine.id)).toBe(true)
    expect(await deleteMyDataReport(db(), alice, mine.id)).toBe(false)

    const ids = (await listMyDataReports(db(), alice)).map((r) => r.id)
    expect(ids).toEqual([triaged.id])
    // The admin queue still sees the triaged row.
    const { total } = await listDataReports(db(), { page: 0, pageSize: 100 })
    expect(total).toBe(1)
  })

  test('每个账号的 open 报告有上限', async () => {
    const ids: string[] = []
    for (let i = 0; i < OPEN_REPORT_LIMIT; i++) {
      const r = await createDataReport(
        db(),
        { userId: 'user_alice', kind: 'other', detail: `limit probe ${i}` },
        7400 + i,
      )
      if (!r.ok) throw new Error('setup failed')
      ids.push(r.id)
    }
    expect(
      await createDataReport(
        db(),
        { userId: 'user_alice', kind: 'other', detail: 'over the limit' },
        7500,
      ),
    ).toEqual({ ok: false, reason: 'limit' })

    // Freeing one open report frees one slot.
    expect(await deleteMyDataReport(db(), alice, ids[0])).toBe(true)
    expect(
      (await createDataReport(
        db(),
        { userId: 'user_alice', kind: 'other', detail: 'slot reused' },
        7501,
      )).ok,
    ).toBe(true)

    // Another account is unaffected.
    expect(
      (await createDataReport(db(), { userId: 'user_bob', kind: 'other', detail: 'bob files' }, 7502)).ok,
    ).toBe(true)
  })
})
