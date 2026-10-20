import { REGISTRY } from '@/features/calculator/model-prices'
import type { ModelPrice } from '@/features/calculator/types'
import { BENCHMARKS, type Benchmark } from './benchmarks'
import { LEADERBOARD } from './models'
import type { BenchmarkScore, LeaderboardModel, ScoreUnit } from './types'

/** The six benchmarks shown on the home leaderboard (models mostly have these). */
export const CORE_BENCHMARK_IDS = [
  'gpqa-diamond',
  'hle',
  'terminal-bench-2.1',
  'deepswe-v1.1',
  'automation-bench',
  'nl2repo-bench',
] as const

export function getBenchmark(id: string): Benchmark | undefined {
  return BENCHMARKS.find((b) => b.id === id)
}

/** Join a leaderboard model to its calculator price entry, if any. */
export function findPrice(model: LeaderboardModel): ModelPrice | undefined {
  if (!model.priceId) return undefined
  return REGISTRY.models.find((m) => m.id === model.priceId)
}

/** Blended (input + output) / 2 price, USD per 1M tokens. */
export function blendedPricePer1M(price: ModelPrice | undefined): number | undefined {
  if (!price) return undefined
  return (price.inputPricePer1M + price.outputPricePer1M) / 2
}

export function scoreOf(model: LeaderboardModel, benchmarkId: string): BenchmarkScore | undefined {
  return model.scores.find((s) => s.benchmark === benchmarkId)
}

export function averageCoreScore(model: LeaderboardModel): number | undefined {
  const vals = CORE_BENCHMARK_IDS.map((id) => scoreOf(model, id)).filter(
    (s): s is BenchmarkScore => !!s && s.unit === 'percent',
  )
  if (vals.length === 0) return undefined
  return vals.reduce((sum, s) => sum + s.score, 0) / vals.length
}

export interface LeaderboardRow {
  model: LeaderboardModel
  price?: ModelPrice
  blendedPricePer1M?: number
  average?: number
}

export function leaderboardRows(): LeaderboardRow[] {
  return LEADERBOARD.models.map((model) => {
    const price = findPrice(model)
    return { model, price, blendedPricePer1M: blendedPricePer1M(price), average: averageCoreScore(model) }
  })
}

export type SortKey = 'model' | 'average' | 'price' | string

export function sortRows(rows: LeaderboardRow[], key: SortKey, dir: 'asc' | 'desc'): LeaderboardRow[] {
  const mul = dir === 'asc' ? 1 : -1
  const value = (r: LeaderboardRow): number | string => {
    if (key === 'model') return r.model.displayName.toLowerCase()
    if (key === 'average') return r.average ?? -Infinity
    if (key === 'price') return r.blendedPricePer1M ?? Number.NaN
    const s = scoreOf(r.model, key)
    return s ? s.score : -Infinity
  }
  return [...rows].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (typeof va === 'string' || typeof vb === 'string') {
      return String(va).localeCompare(String(vb)) * mul
    }
    // A model without a price has no place in the price ranking: it goes last
    // in BOTH directions — "no price" is not "the most expensive", and a
    // descending sort used to put every priceless model at the top.
    if (Number.isNaN(va) || Number.isNaN(vb)) {
      if (Number.isNaN(va) && Number.isNaN(vb)) return 0
      return Number.isNaN(va) ? 1 : -1
    }
    return (va - vb) * mul
  })
}

// ───────────────────────── Compare pairs ─────────────────────────

export type CompareKind = 'technical' | 'plan' | 'ecosystem'

export interface ComparePair {
  /** Canonical order is alphabetical by id; use pairSlug() to build URLs. */
  a: string
  b: string
  kind: CompareKind
}

/** Canonical slug for an unordered pair: `[/models/[a]-vs-[b]]` param. */
export function pairSlug(a: string, b: string): string {
  return [a, b].sort().join('-vs-')
}

export function parsePairSlug(slug: string): [string, string] | null {
  const parts = slug.split('-vs-')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return [parts[0], parts[1]]
}

/** 18 static comparison pages. One page per unordered pair (both word orders). */
export const COMPARE_PAIRS: ComparePair[] = [
  { a: 'claude-opus-5', b: 'gpt-5.6-sol', kind: 'technical' },
  { a: 'claude-opus-5', b: 'gemini-3.1-pro', kind: 'technical' },
  { a: 'claude-opus-5', b: 'deepseek-v4.1-flash', kind: 'plan' },
  { a: 'gpt-5.6-sol', b: 'gemini-3.1-pro', kind: 'technical' },
  { a: 'gpt-5.6-sol', b: 'deepseek-v4.1-flash', kind: 'plan' },
  { a: 'gemini-3.1-pro', b: 'grok-4.7', kind: 'technical' },
  { a: 'gemini-3.1-pro', b: 'deepseek-v4.1-flash', kind: 'plan' },
  { a: 'grok-4.7', b: 'claude-opus-5', kind: 'ecosystem' },
  { a: 'grok-4.7', b: 'deepseek-v4.1-flash', kind: 'technical' },
  { a: 'claude-opus-5', b: 'glm-5.3', kind: 'ecosystem' },
  { a: 'gpt-5.6-sol', b: 'kimi-k3', kind: 'ecosystem' },
  { a: 'gemini-3.1-pro', b: 'glm-5.3', kind: 'technical' },
  { a: 'deepseek-v4.1-flash', b: 'glm-5.3', kind: 'plan' },
  { a: 'deepseek-v4.1-flash', b: 'kimi-k3', kind: 'plan' },
  { a: 'grok-4.7', b: 'kimi-k3', kind: 'ecosystem' },
  { a: 'deepseek-v4-pro', b: 'deepseek-v4-flash-0731', kind: 'technical' },
  { a: 'glm-5.3', b: 'kimi-k3', kind: 'technical' },
  { a: 'gpt-5.6-sol', b: 'grok-4.7', kind: 'technical' },
  // Gemini 4 Argon — the new frontier row, against the two flagships it
  // replaces in the conversation and Google's own previous Pro.
  { a: 'gemini-4-argon', b: 'gpt-6-astra', kind: 'technical' },
  { a: 'gemini-4-argon', b: 'claude-opus-5.5', kind: 'technical' },
  { a: 'gemini-4-argon', b: 'gemini-3.1-pro', kind: 'technical' },
]

export interface ComparePairEntry extends ComparePair {
  slug: string
}

export const COMPARE_PAIR_ENTRIES: ComparePairEntry[] = COMPARE_PAIRS.map((p) => ({
  ...p,
  slug: pairSlug(p.a, p.b),
}))

export function findComparePair(slug: string): ComparePairEntry | undefined {
  const direct = COMPARE_PAIR_ENTRIES.find((p) => p.slug === slug)
  if (direct) return direct
  // Accept the reversed word order: /compare/b-vs-a → /compare/a-vs-b.
  const parsed = parsePairSlug(slug)
  if (!parsed) return undefined
  const canonical = pairSlug(parsed[0], parsed[1])
  return COMPARE_PAIR_ENTRIES.find((p) => p.slug === canonical)
}

// ───────────────────────── Best categories ─────────────────────────

export interface BestCategory {
  slug: string
  /** Benchmarks used to rank models in this category. */
  benchmarkIds: string[]
  /** Optional vendor restriction. */
  vendors?: string[]
}

export const BEST_CATEGORIES: BestCategory[] = [
  {
    slug: 'chinese-model',
    benchmarkIds: ['gpqa-diamond', 'hle', 'deepswe-v1.1', 'automation-bench'],
    vendors: ['deepseek', 'glm', 'kimi'],
  },
  {
    slug: 'open-source',
    benchmarkIds: ['deepswe-v1.1', 'nl2repo-bench', 'automation-bench', 'hle'],
    vendors: ['deepseek', 'glm', 'kimi'],
  },
  {
    slug: 'for-coding',
    benchmarkIds: ['deepswe-v1.1', 'programbench', 'nl2repo-bench', 'terminal-bench-2.1'],
  },
]

export function findBestCategory(slug: string): BestCategory | undefined {
  return BEST_CATEGORIES.find((c) => c.slug === slug)
}

export function categoryRows(category: BestCategory): LeaderboardRow[] {
  const rows = leaderboardRows().filter(
    (r) => !category.vendors || category.vendors.includes(r.model.vendor),
  )
  const scored = rows.map((r) => {
    const vals = category.benchmarkIds
      .map((id) => scoreOf(r.model, id))
      .filter((s): s is BenchmarkScore => !!s && s.unit === 'percent')
    const avg = vals.length ? vals.reduce((n, s) => n + s.score, 0) / vals.length : undefined
    return { row: r, avg }
  })
  return scored
    .filter((s) => s.avg !== undefined)
    .sort((x, y) => (y.avg as number) - (x.avg as number))
    .map((s) => ({ ...s.row, average: s.avg }))
}

/** Compact column headings for dense tables. */
export const BENCHMARK_SHORT: Record<string, string> = {
  'gpqa-diamond': 'GPQA',
  'hle': 'HLE',
  'vals-index': 'Vals',
  'codeforces': 'Codeforces',
  'matharena-apex': 'Apex',
  'apex-bench-v1.1': 'Apex v1.1',
  'terminal-bench-2.1': 'TB 2.1',
  'terminal-bench-3.0': 'TB 3.0',
  'terminal-bench-4.0': 'TB 4.0',
  'deepswe-v1.1': 'DeepSWE',
  'frontierswe-v2': 'FrontierSWE',
  'swe-bench-pro': 'SWE-Pro',
  'programbench': 'ProgBench',
  'nl2repo-bench': 'NL2Repo',
  'cybergym': 'CyberGym',
  'sec-bench-pro': 'SEC-Pro',
  'exploitgym': 'ExploitGym',
  'hle-tools': 'HLE+',
  'automation-bench': 'AutoBench',
  'agents-last-exam': 'ALE',
  'osworld-2.0': 'OSWorld',
  'browsecompc': 'BrowseComp',
  'mcp-atlas': 'MCP Atlas',
  'bankertoolbench': 'BankerTool',
  'chartography': 'Charto',
  'chartography-tools': 'Charto+',
  'babyvision-tools': 'BabyVision',
  'zerobench-main-tools': 'ZeroBench',
  'graphwalks': 'GraphWalks',
  'cwe-bench-v1': 'CWE',
}

/** Format a score according to its unit. */
export function formatScore(score: number, unit: ScoreUnit): string {
  if (unit === 'rating') return String(Math.round(score))
  if (unit === 'elo') return String(Math.round(score))
  return `${score}%`
}
