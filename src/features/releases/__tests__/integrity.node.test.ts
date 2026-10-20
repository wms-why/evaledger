import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { calculateCost } from '@/features/calculator/cost'
import { REGISTRY } from '@/features/calculator/model-prices'
import type { ModelPrice } from '@/features/calculator/types'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD, findLeaderboardModel } from '@/features/leaderboard/models'
import type { LeaderboardModel } from '@/features/leaderboard/types'
import { releaseSlugFromPath } from '../select'

/**
 * Integrity guard for the release series.
 *
 * Prices, scores and the release pages are three surfaces that have to move
 * together. This file makes that mechanical:
 *
 *  1. a post must carry the required frontmatter;
 *  2. a post may only point at models that still exist;
 *  3. the en and the zh version of a post must both exist;
 *  4. **every number a post quotes must be a current value of a model that
 *     post actually depends on** — a price of another model, or a score that
 *     was overwritten, fails the build;
 *  5. **a post must not be older than the data it quotes** — if a dependency's
 *     price was re-verified or its score was re-collected after the post's
 *     `dataCheckedAt`, the post is stale and has to be re-read;
 *  6. every model on the leaderboard needs a release post, or an explicit
 *     entry in `POST_EXEMPTIONS`.
 */

const CONTENT_DIR = fileURLToPath(new URL('../../../content/releases/', import.meta.url))

/**
 * Leaderboard models that do not have a release post yet.
 *
 * Each entry is a deliberate "not written yet" — the series started with six
 * posts and the board has ten models. Shrink this list as posts land; a new
 * leaderboard model without a post fails the build until it gets one.
 */
const POST_EXEMPTIONS = new Set([
  'claude-opus-5', // covered by the claude-opus-5-5 post (same line, newer SKU)
  'gpt-5.6-sol', // superseded inside the GPT-6 astra post
  'deepseek-v4-pro', // covered by the deepseek-v4-1-flash post
  'deepseek-v4-flash-0731', // older snapshot, no post yet
  'minimax-m3', // covered by the minimax-m3-1-flash post (same line, newer SKU)
  'glm-5.3', // no post yet
  'kimi-k3', // no post yet
])

type Frontmatter = Record<string, string | string[] | boolean>

interface Post {
  file: string
  slug: string
  zh: boolean
  data: Frontmatter
  body: string
  modelId: string
  modelSlug?: string
  compareModelIds: string[]
  compareSlugs: string[]
  dataCheckedAt: string
}

function unquote(s: string): string {
  const t = s.trim()
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    return t.slice(1, -1)
  }
  return t
}

/** Minimal frontmatter reader — the collection schema is flat, so a full YAML parser is overkill. */
function parseFrontmatter(src: string): { data: Frontmatter; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src)
  if (!m) return { data: {}, body: src }
  const data: Frontmatter = {}
  let currentKey: string | null = null
  for (const line of m[1]!.split(/\r?\n/)) {
    if (!line.trim()) continue
    const listItem = /^\s*-\s+(.*)$/.exec(line)
    if (listItem && currentKey) {
      const arr = data[currentKey]
      if (Array.isArray(arr)) arr.push(unquote(listItem[1]!))
      else data[currentKey] = [unquote(listItem[1]!)]
      continue
    }
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!kv) continue
    currentKey = kv[1]!
    const raw = kv[2]!.trim()
    if (raw === '') {
      data[currentKey] = []
    } else if (raw.startsWith('[') && raw.endsWith(']')) {
      data[currentKey] = raw
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s))
        .filter(Boolean)
    } else if (raw === 'true' || raw === 'false') {
      data[currentKey] = raw === 'true'
    } else {
      data[currentKey] = unquote(raw)
    }
  }
  return { data, body: m[2] ?? '' }
}

function readPosts(): Post[] {
  let names: string[]
  try {
    names = readdirSync(CONTENT_DIR).filter((n) => n.endsWith('.md') || n.endsWith('.mdx'))
  } catch {
    return []
  }
  return names.map((file) => {
    const src = readFileSync(CONTENT_DIR + file, 'utf8')
    const { data, body } = parseFrontmatter(src)
    const path = `releases/${file}`
    return {
      file,
      slug: releaseSlugFromPath(path),
      zh: path.includes('.zh'),
      data,
      body,
      modelId: String(data.modelId ?? ''),
      modelSlug: data.modelSlug ? String(data.modelSlug) : undefined,
      compareModelIds: (data.compareModelIds as string[] | undefined) ?? [],
      compareSlugs: (data.compareSlugs as string[] | undefined) ?? [],
      dataCheckedAt: String(data.dataCheckedAt ?? ''),
    }
  })
}

// ── dependency resolution ────────────────────────────────────────────────

function findPriceModel(id: string): ModelPrice | undefined {
  return REGISTRY.models.find((m) => m.id === id)
}

/**
 * The models a post depends on.
 *
 * Price dependencies: the subject, the price comparisons, and the price of
 * every leaderboard model the post compares scores against — a post that
 * writes "Claude Opus 5 is $5" depends on Claude Opus 5's price.
 */
function priceDependencies(post: Post): string[] {
  const ids = new Set<string>([post.modelId, ...post.compareModelIds])
  for (const slug of leaderboardDependencies(post)) {
    const m = findLeaderboardModel(slug)
    if (m?.priceId) ids.add(m.priceId)
  }
  return [...ids]
}

function leaderboardDependencies(post: Post): string[] {
  const ids = new Set<string>(post.compareSlugs)
  if (post.modelSlug) ids.add(post.modelSlug)
  return [...ids]
}

/** Every price figure a dependency model currently has, plus its cost estimates. */
function allowedPrices(post: Post): number[] {
  const out: number[] = []
  for (const id of priceDependencies(post)) {
    const m = findPriceModel(id)
    if (!m) continue
    out.push(m.inputPricePer1M, m.outputPricePer1M)
    if (m.cachedInputPricePer1M != null) out.push(m.cachedInputPricePer1M)
    for (const w of m.cacheWrite ?? []) out.push(w.pricePer1M)
    // The registry sometimes records the same price in another currency
    // ("$0.15 / $0.60 / $0.015 (¥1 / ¥4 / ¥0.1)") — quoting the yuan figure
    // is quoting the source, so those are allowed as well.
    for (const note of [m.note ?? '', m.peakOffPeak?.offPeakNote ?? '']) {
      for (const n of note.matchAll(/[¥￥]\s*([0-9]+(?:\.[0-9]+)?)/g)) out.push(Number(n[1]))
    }
    if (m.peakOffPeak) {
      out.push(m.peakOffPeak.peak.inputPricePer1M, m.peakOffPeak.peak.outputPricePer1M)
      out.push(m.peakOffPeak.offPeak.inputPricePer1M, m.peakOffPeak.offPeak.outputPricePer1M)
    }
    for (const tokens of [
      [1_000_000, 500_000],
      [1_000_000, 1_000_000],
    ]) {
      for (const peakHour of [true, false]) {
        try {
          const c = calculateCost(m.id, tokens[0]!, tokens[1]!, { peakHour })
          out.push(
            c.totalCost,
            c.inputCost,
            c.outputCost,
            c.totalCost * 12,
            c.inputCost * 12,
            c.outputCost * 12,
          )
        } catch {
          // not in the registry — nothing to allow
        }
      }
    }
  }
  return out
}

/** Every score a dependency model currently holds, plus the gaps between them. */
function allowedScores(post: Post): number[] {
  const out: number[] = []
  for (const slug of leaderboardDependencies(post)) {
    const m = findLeaderboardModel(slug)
    if (!m) continue
    for (const s of m.scores) {
      out.push(s.score)
      // A caveat can carry a second figure ("39.1 on text-only subset") —
      // quoting it is quoting the source, so it is allowed too.
      for (const n of (s.note ?? '').matchAll(/([0-9]+(?:\.[0-9]+)?)/g)) out.push(Number(n[1]))
    }
  }
  // "a 0.2-point gap between harnesses" is a difference of two live scores,
  // not a score of its own — allow those too.
  const figures = [...new Set(out)]
  for (let i = 0; i < figures.length; i++) {
    for (let j = i + 1; j < figures.length; j++) {
      out.push(Math.round(Math.abs(figures[i]! - figures[j]!) * 100) / 100)
    }
  }
  return out
}

/** The most recent date any dependency's data was touched. */
function latestDataDate(post: Post): string | undefined {
  let latest: string | undefined
  const bump = (iso?: string) => {
    if (!iso) return
    const day = iso.slice(0, 10)
    if (!latest || day > latest) latest = day
  }
  for (const id of priceDependencies(post)) bump(findPriceModel(id)?.lastVerified)
  for (const slug of leaderboardDependencies(post)) {
    for (const s of findLeaderboardModel(slug)?.scores ?? []) bump(s.observedAt)
  }
  return latest
}

// ── prose scanning ──────────────────────────────────────────────────────

/**
 * Every dollar amount the article quotes.
 * `$1M` / `$10M` are token counts, not prices — they are skipped.
 */
function dollarAmounts(text: string): number[] {
  const out: number[] = []
  for (const m of text.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)(?!\s*[MBK]\b)/g)) out.push(Number(m[1]))
  return out
}

/**
 * Prices written as a per-1M claim, with or without a `$` sign.
 *
 * Deliberately narrow: a line may mention a model version ("V4.1", "3.1")
 * next to a price, so we only capture the number that is *attached* to the
 * per-1M wording — never every number on the line.
 */
const PRICE_CLAIMS: RegExp[] = [
  // $0.30 per 1M · $0.30/1M · $0.30/M · $0.30 per million
  /\$\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/\s*1M\b|\/\s*M\b|per\s*1M\b|per\s*million\b)/gi,
  // 0.30 per 1M · 0.30/1M
  /(?<![$\d.])([0-9]+(?:\.[0-9]+)?)\s*(?:\/\s*1M\b|per\s*1M\b|per\s*million\b)/gi,
  // 每 100 万 token 0.30 美元
  /每\s*100\s*万[^\d$]{0,12}([0-9]+(?:\.[0-9]+)?)/g,
]

/** Every number the article presents as a price. */
function priceClaims(text: string): number[] {
  const out: number[] = []
  for (const re of PRICE_CLAIMS) {
    re.lastIndex = 0
    for (const m of text.matchAll(re)) out.push(Number(m[1]))
  }
  return out
}

/**
 * Version fragments that appear in model and benchmark names: "Opus 5.5",
 * "Gemini 3.1", "Terminal-Bench 2.1". They look like decimals but are names,
 * so they are excluded from the score check.
 *
 * Derived from the registries rather than guessed — when a new model ships,
 * the exclusion set follows it automatically.
 */
const VERSION_TOKENS = (() => {
  const tokens = new Set<string>()
  const names = [
    ...REGISTRY.models.map((m) => m.displayName),
    ...LEADERBOARD.models.map((m) => m.displayName),
    ...BENCHMARKS.map((b) => b.name),
  ]
  for (const name of names) {
    for (const m of name.matchAll(/([0-9]+\.[0-9]+)/g)) tokens.add(m[1]!)
  }
  return tokens
})()

/**
 * Bare decimals that read like a score ("90.9", "36.8").
 *
 * Skips: percentages, multipliers ("2.5×"), yuan restatements ("¥0.1") and
 * version fragments taken from the model / benchmark names. What is left has
 * to be a live score of a model the post depends on.
 */
function scoreClaims(text: string): number[] {
  const out: number[] = []
  for (const m of text.matchAll(/(?<![\d.])([0-9]+\.[0-9]+)(?![0-9])/g)) {
    const raw = m[0]!
    if (VERSION_TOKENS.has(raw)) continue
    const before = text[m.index - 1] ?? ''
    const after = text[m.index + raw.length] ?? ''
    const afterWord = text.slice(m.index + raw.length).match(/^\s*(\S)/)?.[1] ?? ''
    // ¥ / ￥ restatement of the same fact in another currency
    if (before === '¥' || before === '￥') continue
    // a dollar amount — the price check already covers it
    if (before === '$') continue
    // percentage or multiplier
    if (after === '%' || after === '×' || after === 'x' || afterWord === '倍') continue
    out.push(Number(raw))
  }
  return out
}

const EPSILON = 1e-6
const isAllowed = (n: number, allowed: number[]) => allowed.some((a) => Math.abs(a - n) < EPSILON)

const posts = readPosts()

describe('release posts', () => {
  it.skipIf(posts.length === 0)('have posts to check', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  it.skipIf(posts.length === 0)('carry the required frontmatter', () => {
    for (const p of posts) {
      for (const key of [
        'title',
        'date',
        'checkedAt',
        'dataCheckedAt',
        'vendor',
        'modelId',
        'sourceUrl',
        'sourceTitle',
      ]) {
        expect(p.data[key], `${p.file}: missing ${key}`).toBeTruthy()
      }
      expect(String(p.data.date)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(String(p.data.checkedAt)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(String(p.data.dataCheckedAt)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it.skipIf(posts.length === 0)('point at models that exist in the registries', () => {
    const priceIds = new Set(REGISTRY.models.map((m) => m.id))
    const leaderboardIds = new Set(LEADERBOARD.models.map((m) => m.id))
    for (const p of posts) {
      expect(priceIds.has(p.modelId), `${p.file}: unknown modelId "${p.modelId}"`).toBe(true)
      for (const id of p.compareModelIds) {
        expect(priceIds.has(id), `${p.file}: unknown compareModelId "${id}"`).toBe(true)
      }
      if (p.modelSlug) {
        expect(leaderboardIds.has(p.modelSlug), `${p.file}: unknown modelSlug`).toBe(true)
      }
      for (const slug of p.compareSlugs) {
        expect(leaderboardIds.has(slug), `${p.file}: unknown compareSlug "${slug}"`).toBe(true)
      }
    }
  })

  it.skipIf(posts.length === 0)('ship every post in both languages', () => {
    const en = posts.filter((p) => !p.zh).map((p) => p.slug).sort()
    const zh = posts.filter((p) => p.zh).map((p) => p.slug).sort()
    expect(zh).toEqual(en)
  })

  it.skipIf(posts.length === 0)('cover every model on the leaderboard, or list it as exempt', () => {
    const covered = new Set<string>()
    for (const p of posts) {
      if (p.modelSlug) covered.add(p.modelSlug)
      for (const slug of p.compareSlugs) covered.add(slug)
    }
    for (const model of LEADERBOARD.models as LeaderboardModel[]) {
      if (covered.has(model.id)) continue
      expect(
        POST_EXEMPTIONS.has(model.id),
        `${model.displayName} is on the leaderboard but has no release post — ` +
          `write one, or add "${model.id}" to POST_EXEMPTIONS in the integrity test.`,
      ).toBe(true)
    }
  })

  it.skipIf(posts.length === 0)('quote only live values of the models they depend on', () => {
    for (const p of posts) {
      const prices = allowedPrices(p)
      const scores = allowedScores(p)
      // The body and the description are both rendered (the description becomes
      // the meta description and the index-card blurb), so both are guarded.
      const texts = [p.body, typeof p.data.description === 'string' ? p.data.description : '']
      for (const text of texts) {
        for (const amount of dollarAmounts(text)) {
          expect(
            isAllowed(amount, prices),
            `${p.file}: $${amount} is not a current price of a model this post depends on`,
          ).toBe(true)
        }
        for (const amount of priceClaims(text)) {
          expect(
            isAllowed(amount, prices),
            `${p.file}: ${amount} is not a current price of a model this post depends on`,
          ).toBe(true)
        }
        for (const amount of scoreClaims(text)) {
          expect(
            isAllowed(amount, scores),
            `${p.file}: ${amount} is not a current score of a model this post depends on`,
          ).toBe(true)
        }
      }
    }
  })

  it.skipIf(posts.length === 0)('are not older than the data they quote', () => {
    for (const p of posts) {
      const latest = latestDataDate(p)
      if (!latest) continue
      expect(
        p.dataCheckedAt >= latest,
        `${p.file}: data moved on ${latest}, after the post was last checked (${p.dataCheckedAt}) — ` +
          `re-read the post against the new numbers, then bump dataCheckedAt.`,
      ).toBe(true)
    }
  })
})
