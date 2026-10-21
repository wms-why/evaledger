import { describe, test, expect } from 'vitest'
import { REGISTRY } from '@/features/calculator/model-prices'
import { utcDay } from '@/features/calculator/cost'
import { priceDetail } from '@/features/calculator/pricing-detail'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { findLeaderboardModel } from '@/features/leaderboard/models'
import { TRACK_IDS } from '@/features/leaderboard/scoring'
import { sourceKind } from '@/features/leaderboard/sources'
import { seriesForScoreId } from '@/features/series/select'
import {
  FRESH_WINDOW_DAYS,
  channelFor,
  changesFor,
  dataQualitySummary,
  modelQuality,
  priceFreshness,
  priceQuality,
  promoState,
  scoreFreshness,
  scoreQuality,
  trackCoverage,
} from '../quality'

/**
 * The data-quality core is pure: everything below is derived from the static
 * registries, so the tests read the registries rather than fixtures.
 */

describe('freshness window', () => {
  const fetchedAt = '2026-10-20'

  test('14 天之内是 fresh，超过就是 stale', () => {
    // 边界：正好 14 天仍然 fresh（<= 14）
    expect(priceFreshness('2026-10-06', 'https://example.com', fetchedAt)).toEqual({
      freshness: 'fresh',
      ageDays: 14,
    })
    // 边界外一天：15 天 → stale
    expect(priceFreshness('2026-10-05', 'https://example.com', fetchedAt)).toEqual({
      freshness: 'stale',
      ageDays: 15,
    })
    expect(priceFreshness('2026-09-26', 'https://example.com', fetchedAt)).toEqual({
      freshness: 'stale',
      ageDays: 24,
    })
  })

  test('窗口常量就是 14 天', () => {
    expect(FRESH_WINDOW_DAYS).toBe(14)
  })

  test('没有 sourceUrl → unknown（age 不可知）', () => {
    const result = priceFreshness('2026-10-20', undefined, fetchedAt)
    expect(result.freshness).toBe('unknown')
    expect(Number.isFinite(result.ageDays)).toBe(false)
  })

  test('没有 lastVerified → unknown', () => {
    expect(priceFreshness(undefined, 'https://example.com', fetchedAt).freshness).toBe('unknown')
  })

  test('freshness 量的是快照与核对日之间的距离，不是墙钟', () => {
    // 同一个 lastVerified，快照越旧越 stale —— 这正是「快照」语义。
    expect(priceFreshness('2026-10-06', 'https://example.com', '2026-10-20').freshness).toBe('fresh')
    expect(priceFreshness('2026-10-06', 'https://example.com', '2026-11-30').freshness).toBe('stale')
  })

  test('注册表里的行按快照算：核对当天的行是 fresh', () => {
    const row = REGISTRY.models.find((m) => m.id === 'gpt-6-astra')!
    const quality = priceQuality('gpt-6-astra', row)
    expect(quality.freshness).toBe('fresh')
    expect(quality.ageDays).toBe(0)
    expect(quality.lastVerified).toBe(REGISTRY.fetchedAt)
  })
})

describe('channel: 官方价 vs 聚合价', () => {
  const row = (id: string) => {
    const found = REGISTRY.models.find((m) => m.id === id)
    if (!found) throw new Error(`missing registry row: ${id}`)
    return found
  }

  test('一手厂商是 official，OpenRouter 是 aggregator', () => {
    expect(channelFor(row('gpt-6-astra'))).toBe('official')
    expect(channelFor(row('claude-opus-5.5'))).toBe('official')
    expect(channelFor(row('gemini-4-argon'))).toBe('official')
    expect(channelFor(row('deepseek-v4-pro'))).toBe('official')
    expect(channelFor(row('minimax-m3'))).toBe('official')
    expect(channelFor(row('grok-4.7'))).toBe('official')
    // 聚合渠道：provider 是 openrouter 的行必须是 aggregator。
    expect(channelFor({ ...row('gpt-6-astra'), provider: 'openrouter', channel: undefined })).toBe(
      'aggregator',
    )
  })

  test('注册表自己标注的 channel 优先于 provider 推导', () => {
    // openrouter 克隆行即使 provider 看起来像官方，也必须跟着注册表走。
    expect(channelFor({ ...row('gpt-6-astra'), provider: 'openrouter', channel: 'aggregator' })).toBe(
      'aggregator',
    )
    expect(channelFor({ ...row('gpt-6-astra'), channel: 'official' })).toBe('official')
  })

  test('每一条价格行的 channel 都与注册表一致', () => {
    const rows = modelQuality()
    for (const model of LEADERBOARD.models) {
      const quality = rows.find((r) => r.modelId === model.id)
      if (!quality?.price) continue
      const registry = REGISTRY.models.find((m) => m.id === model.priceId)
      if (!registry) throw new Error(`missing registry row: ${model.priceId}`)
      expect(quality.price.channel).toBe(channelFor(registry))
    }
  })

  test('provider 决定 channel，不是我们编的', () => {
    const row = modelQuality().find((m) => m.modelId === 'gpt-6-astra')!
    expect(row.price?.provider).toBe('openai')
    expect(row.price?.channel).toBe('official')
  })
})

describe('changes：与同一条线的前一个版本比较', () => {
  test('变化来自 series 的机械 diff（价格槽位 + 基准分差）', () => {
    const rows = modelQuality()
    // Claude Opus 5.5 与 Opus 5 同属 claude-opus 系列，前者有分数行。
    const opus55 = rows.find((m) => m.modelId === 'claude-opus-5.5')!
    const series = seriesForScoreId('claude-opus-5.5')!
    expect(series.slug).toBe('claude-opus')
    // 系列成员按「新 → 旧」排列，所以前一个成员是下一条。
    const index = series.members.findIndex((m) => m.scoreId === 'claude-opus-5.5')
    expect(series.members[index + 1].scoreId).toBe('claude-opus-5')

    expect(opus55.changes.length).toBeGreaterThan(0)
    for (const change of opus55.changes) {
      expect(['price', 'score']).toContain(change.field)
      expect(['up', 'down', 'same']).toContain(change.direction)
      expect(change.detail).toContain('→')
    }
    // 分数变化必须来自两个版本都报告、且数值不同的基准。
    const older = findLeaderboardModel('claude-opus-5')!
    const newer = findLeaderboardModel('claude-opus-5.5')!
    const shared = older.scores
      .filter((a) => {
        const b = newer.scores.find((s) => s.benchmark === a.benchmark)
        return b != null && b.score !== a.score
      })
      .map((a) => a.benchmark)
    const reported = opus55.changes.filter((c) => c.field === 'score').length
    expect(reported).toBe(shared.length)
  })

  test('价格槽位变了才报变化，相等就跳过', () => {
    const changes = changesFor(findLeaderboardModel('claude-opus-5.5')!)
    const priceChanges = changes.filter((c) => c.field === 'price')
    expect(priceChanges.length).toBeGreaterThan(0)
    for (const change of priceChanges) {
      expect(['input', 'output', 'cached']).toContain(change.label)
      expect(change.direction).not.toBe('same')
    }
    // Opus 5.5 比 Opus 5 便宜：input / output / cached 三个槽位都降了。
    const directions = priceChanges.map((c) => c.direction)
    expect(directions.every((d) => d === 'down')).toBe(true)
  })

  test('没有前代版本 → changes 为空', () => {
    // Kimi K3 不属于任何系列（没有可比较的前一版本）。
    const kimi = findLeaderboardModel('kimi-k3')!
    expect(seriesForScoreId('kimi-k3')).toBeUndefined()
    expect(changesFor(kimi)).toEqual([])
    const row = modelQuality().find((m) => m.modelId === 'kimi-k3')!
    expect(row.changes).toEqual([])
  })

  test('同一条线里更老的那一版，比较对象是它自己的前一代', () => {
    const opus5 = findLeaderboardModel('claude-opus-5')!
    const changes = changesFor(opus5)
    const series = seriesForScoreId('claude-opus-5')!
    const index = series.members.findIndex((m) => m.scoreId === 'claude-opus-5')
    const previous = series.members[index + 1]
    expect(previous.key).toBe('opus-4.8')
    // 前一代没有分数行 → 没有可证明的分数比较（不借用、不插值）。
    expect(changes.filter((c) => c.field === 'score')).toEqual([])
  })
})

describe('tracks：完整与缺失', () => {
  test('completeTracks + missingTracks 覆盖全部 track，且互不重叠', () => {
    const rows = modelQuality()
    for (const row of rows) {
      expect(row.completeTracks.length + row.missingTracks.length).toBe(TRACK_IDS.length)
      for (const id of row.completeTracks) expect(TRACK_IDS).toContain(id)
      for (const id of row.missingTracks) expect(TRACK_IDS).toContain(id)
      expect(row.completeTracks.some((id) => row.missingTracks.includes(id))).toBe(false)
    }
  })

  test('trackCoverage 与 modelQuality 的行一致', () => {
    const model = findLeaderboardModel('claude-opus-5')!
    const coverage = trackCoverage(model)
    const row = modelQuality().find((m) => m.modelId === 'claude-opus-5')!
    expect(row.completeTracks).toEqual(coverage.completeTracks)
    expect(row.missingTracks).toEqual(coverage.missingTracks)
  })

  test('分数少的模型缺 track，核心基准齐全的模型不缺', () => {
    const rows = modelQuality()
    // Grok 4.7 只有两个分数 → 四条轨都缺核心基准。
    const grok = rows.find((m) => m.modelId === 'grok-4.7')!
    expect(grok.completeTracks).toEqual([])
    expect(grok.missingTracks.length).toBe(TRACK_IDS.length)
    // Claude Opus 5 报告了 general 轨的两个核心基准 → general 完整。
    const opus5 = rows.find((m) => m.modelId === 'claude-opus-5')!
    expect(opus5.completeTracks).toContain('general')
    expect(opus5.missingTracks).not.toContain('general')
  })
})

describe('summary 计数', () => {
  test('模型数 = 排行榜行数，价格行数 = 有价格行的模型数', () => {
    const summary = dataQualitySummary()
    const rows = modelQuality()
    expect(summary.modelCount).toBe(rows.length)
    expect(summary.modelCount).toBe(LEADERBOARD.models.length)
    expect(summary.priceRows).toBe(rows.filter((r) => r.price).length)
  })

  test('fresh + stale + unverified = priceRows', () => {
    const summary = dataQualitySummary()
    expect(summary.freshPrices + summary.stalePrices + summary.unverifiedPrices).toBe(summary.priceRows)
  })

  test('按来源分类的分数条数加起来 = 分数总数', () => {
    const summary = dataQualitySummary()
    expect(
      summary.vendorReportedScores + summary.thirdPartyScores + summary.referenceTableScores,
    ).toBe(summary.scoreRows)
    expect(summary.scoreRows).toBe(
      LEADERBOARD.models.reduce((sum, m) => sum + m.scores.length, 0),
    )
  })

  test('完整模型数 = 有价格且没有缺失 track 的模型数', () => {
    const summary = dataQualitySummary()
    const expected = modelQuality().filter((r) => r.price && r.missingTracks.length === 0).length
    expect(summary.completeModelCount).toBe(expected)
  })
})

describe('promo 状态', () => {
  test('没有促销窗口的价目行 → 不促销，也没有下一次变更日', () => {
    const row = REGISTRY.models.find((m) => m.id === 'gpt-6-astra')!
    expect(row.priceWindows).toBeUndefined()
    expect(promoState(row)).toEqual({ active: false })
  })

  test('注册表里的促销价带：快照当天促销仍在，下一次变更是下一档的开始日', () => {
    const row = REGISTRY.models.find((m) => m.id === 'gpt-5.6-sol')!
    expect(row.priceWindows?.length).toBe(2)
    const state = promoState(row, REGISTRY.fetchedAt)
    expect(state.active).toBe(true)
    expect(state.nextChangeAt).toBe('2026-11-22')
  })

  test('促销带结束之后 → 不促销', () => {
    const row = REGISTRY.models.find((m) => m.id === 'gpt-5.6-sol')!
    const state = promoState(row, '2026-12-01')
    expect(state.active).toBe(false)
  })

  test('单个显式 promo：到期前 active，到期后不 active', () => {
    const base = REGISTRY.models.find((m) => m.id === 'gpt-6-astra')!
    const promo = { untilDate: '2026-11-21', inputPricePer1M: 1, outputPricePer1M: 2, note: '' }
    const row = { ...base, promo }
    expect(promoState(row, '2026-10-20')).toEqual({ active: true, nextChangeAt: '2026-11-21' })
    expect(promoState(row, '2026-12-01').active).toBe(false)
  })

  test('promoState 与 priceDetail 对每一条注册表价格行完全一致', () => {
    // 促销状态的判定只能有一个来源：cost.ts 的 band resolver。
    // promoState 不再自己实现一遍（字符串比较 + 取第一个匹配 + “后面还有
    // 一档就算促销”），而是委托给 priceDetail —— 否则数据质量页会和计算器
    // 对“哪一档在生效”产生分歧。
    expect(REGISTRY.models.length).toBeGreaterThanOrEqual(41)
    for (const row of REGISTRY.models) {
      const detail = priceDetail(row, utcDay(REGISTRY.fetchedAt))
      const state = promoState(row, REGISTRY.fetchedAt)
      expect(state.active, `${row.id} 促销状态不一致`).toBe(detail.promoActive === true)
      expect(state.nextChangeAt, `${row.id} 下次调价日不一致`).toBe(detail.nextChange?.from)
    }
  })

  test('任意日期上 promoState 与 priceDetail 都一致', () => {
    const dates = ['2026-09-30', '2026-10-20', '2026-11-21', '2026-11-22', '2026-12-01', '2027-02-01']
    for (const row of REGISTRY.models) {
      for (const date of dates) {
        const detail = priceDetail(row, utcDay(date))
        const state = promoState(row, date)
        expect(state.active, `${row.id} @ ${date}`).toBe(detail.promoActive === true)
        expect(state.nextChangeAt, `${row.id} @ ${date}`).toBe(detail.nextChange?.from)
      }
    }
  })
})

describe('评测数据的新鲜度：对照注册表快照', () => {
  test('量的是快照与测得日之间的距离，不是墙钟', () => {
    // 边界：正好 14 天仍然 fresh（<= 14）
    expect(scoreFreshness('2026-10-06', '2026-10-20')).toEqual({ freshness: 'fresh', ageDays: 14 })
    // 边界外一天：15 天 → stale
    expect(scoreFreshness('2026-10-05', '2026-10-20')).toEqual({ freshness: 'stale', ageDays: 15 })
    // 快照语义：同一个测得日，快照越旧越 stale。
    expect(scoreFreshness('2026-10-06', '2026-11-30').freshness).toBe('stale')
    expect(scoreFreshness('2026-10-20', '2026-10-20').freshness).toBe('fresh')
  })

  test('快照当天晚些时候测得 → age 0，仍然 fresh', () => {
    // 快照是一个日期：当天晚上的读数不是「来自未来」，就是当天。
    expect(scoreFreshness('2026-10-20T21:20:00+08:00', '2026-10-20')).toEqual({
      freshness: 'fresh',
      ageDays: 0,
    })
  })

  test('没有可用的观测日期 → unknown', () => {
    expect(scoreFreshness(undefined, '2026-10-20').freshness).toBe('unknown')
    expect(Number.isFinite(scoreFreshness(undefined, '2026-10-20').ageDays)).toBe(false)
    expect(scoreFreshness('not-a-date', '2026-10-20').freshness).toBe('unknown')
  })
})

describe('模型的评测新鲜度', () => {
  test('相对快照过旧的模型 → stale；新鲜的模型 → fresh', () => {
    const model = findLeaderboardModel('claude-opus-5.5')!
    const fresh = scoreQuality(model, REGISTRY.fetchedAt)
    expect(fresh.freshness).toBe('fresh')
    expect(fresh.ageDays).toBeLessThanOrEqual(FRESH_WINDOW_DAYS)

    // 同一批分数，把快照往后推 45 天就变成 stale —— 判定的是证据的新旧，
    // 不是墙钟今天是哪一天。
    const stale = scoreQuality(model, '2026-12-04')
    expect(stale.freshness).toBe('stale')
    expect(stale.ageDays).toBeGreaterThan(FRESH_WINDOW_DAYS)
  })

  test('最旧的一次测得决定结论（混合年龄的分数集判 stale）', () => {
    const model = findLeaderboardModel('claude-opus-5.5')!
    const mixed = {
      ...model,
      scores: [
        { ...model.scores[0], observedAt: '2026-10-20T15:30:00+08:00' },
        { ...model.scores[1], observedAt: '2026-08-01T10:00:00+08:00' },
      ],
    }
    const quality = scoreQuality(mixed, REGISTRY.fetchedAt)
    expect(quality.freshness).toBe('stale')
    expect(quality.oldestObservedAt).toBe('2026-08-01T10:00:00+08:00')
    expect(quality.latestObservedAt).toBe('2026-10-20T15:30:00+08:00')
  })

  test('注册表里的每个模型都能得出一个评测新鲜度结论', () => {
    for (const model of LEADERBOARD.models) {
      const quality = scoreQuality(model)
      expect(['fresh', 'stale', 'unknown']).toContain(quality.freshness)
      if (quality.freshness === 'unknown') {
        expect(Number.isFinite(quality.ageDays)).toBe(false)
      } else {
        expect(Number.isFinite(quality.ageDays)).toBe(true)
      }
    }
  })
})

describe('分数的原始来源', () => {
  test('scoreQuality 返回去重后的来源页面，按来源分类的计数仍等于基准数', () => {
    for (const model of LEADERBOARD.models) {
      const quality = scoreQuality(model)
      const urls = quality.sources.map((source) => source.url)
      expect(new Set(urls).size, `${model.id} 的来源链接应去重`).toBe(urls.length)
      expect(quality.sourceCount).toBe(urls.length)
      const counted = Object.values(quality.byKind).reduce((sum, n) => sum + n, 0)
      expect(counted, `${model.id} 按来源分类的计数应等于基准数`).toBe(quality.benchmarkCount)
      expect(quality.benchmarkCount).toBe(model.scores.length)
    }
  })

  test('每个来源链接都带着它的类别，且与来源登记表一致', () => {
    for (const model of LEADERBOARD.models) {
      for (const source of scoreQuality(model).sources) {
        expect(source.kind, `${model.id} 的来源类别应与登记表一致`).toBe(
          sourceKind(source.url) ?? 'third-party',
        )
      }
    }
  })

  test('一个模型的分数可以来自多个页面（链接数 = 不同来源数）', () => {
    const quality = scoreQuality(findLeaderboardModel('claude-opus-5.5')!)
    expect(quality.sources.length).toBe(quality.sourceCount)
    expect(quality.sources.length).toBeGreaterThan(1)
  })
})

describe('价格渠道的判定（页面上那一栏）', () => {
  test('厂商行 → official，路由商行 → aggregator', () => {
    const vendor = REGISTRY.models.find((m) => m.id === 'gpt-6-astra')!
    expect(priceQuality('gpt-6-astra', vendor).channel).toBe('official')

    // 路由商行：OpenRouter 的转售价（cost.ts 的 applyOpenRouterMarkup 就是
    // 这个形状）——页面必须把它标成第三方路由商，而不是官方价。
    const router = { ...vendor, provider: 'openrouter' as const, channel: 'aggregator' as const }
    expect(priceQuality('gpt-6-astra', router).channel).toBe('aggregator')
  })
})

describe('summary 计数（评测新鲜度）', () => {
  test('fresh + stale + undated = 模型数', () => {
    const summary = dataQualitySummary()
    expect(summary.freshScoreSets + summary.staleScoreSets + summary.undatedScoreSets).toBe(
      summary.modelCount,
    )
  })

  test('本页只覆盖排行榜上的模型：价格行数少于注册表的全部行数', () => {
    const summary = dataQualitySummary()
    expect(summary.modelCount).toBe(LEADERBOARD.models.length)
    expect(summary.priceRows).toBeLessThan(REGISTRY.models.length)
    expect(summary.priceRows).toBe(
      LEADERBOARD.models.filter((m) => REGISTRY.models.some((r) => r.id === m.priceId)).length,
    )
  })
})
