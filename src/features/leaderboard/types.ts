/**
 * Domain types for the LLM leaderboard.
 *
 * Scope (v1): the frontier vendors — Claude (Anthropic), GPT (OpenAI),
 * Gemini (Google), Grok (xAI), DeepSeek, GLM (Zhipu), Kimi (Moonshot).
 *
 * Conventions:
 * - Scores are percentages (0–100) unless `unit` says otherwise. Never
 *   invent a score: every `BenchmarkScore` carries `sourceUrl` + `observedAt`
 *   so a wrong number can be traced and a correction left on the page.
 * - `releaseDate` is the ISO date a model shipped. `updatedAt` is the ISO
 *   timestamp of the last score-collection run for that model (i.e. when the
 *   numbers were last observed), not a vendor release date.
 * - `priceId` joins a model to `REGISTRY.models[].id` in the calculator
 *   feature so the four price surfaces stay one source of truth.
 */

export type Vendor =
  | 'claude'
  | 'openai'
  | 'google'
  | 'grok'
  | 'deepseek'
  | 'glm'
  | 'kimi'

/** Vendor-facing model line, e.g. Sonnet / Opus / Flash. */
export type ModelKind =
  | 'sonnet'
  | 'opus'
  | 'haiku'
  | 'fable'
  | 'gpt'
  | 'o-series'
  | 'pro'
  | 'flash'
  | 'flash-lite'
  | 'grok'
  | 'other'

export type ScoreUnit = 'percent' | 'rating' | 'elo' | 'absolute'

/** One model's score on one benchmark, at one point in time. */
export interface BenchmarkScore {
  /** Benchmark slug — must match a `Benchmark.id` in `benchmarks.ts`. */
  benchmark: string
  score: number
  unit: ScoreUnit
  /** Canonical URL the score was read from; filled once the scrape lands. */
  sourceUrl?: string
  /** ISO date the score was observed (scrape run date). */
  observedAt: string
  /**
   * Provenance caveat straight from the source, e.g. "text-only HLE subset".
   * Never drop a caveat the source printed — it is exactly what the
   * correction log exists to preserve.
   */
  note?: string
}

/** A model entry in the leaderboard. */
export interface LeaderboardModel {
  /** Stable slug used in `/models/[slug]`; never rename without a redirect. */
  id: string
  vendor: Vendor
  /** Vendor-facing line (Sonnet / Opus / Flash…). */
  kind: ModelKind
  /** Concrete version tag (e.g. 'opus-5.5', 'deepseek-flash-4.1', 'grok-4.7'). */
  version: string
  displayName: string
  /** Join key into the calculator price registry (`REGISTRY.models[].id`). */
  priceId?: string
  /** ISO date the model first shipped. */
  releaseDate?: string
  /** ISO timestamp of the last score-collection run for this model. */
  updatedAt?: string
  /** Scores, newest observation per benchmark wins. */
  scores: BenchmarkScore[]
}

/**
 * A superseded score kept on record so `/benchmarks/[slug]/history` and
 * `/leaderboard-history` can show "this number was overwritten on X".
 */
export interface ScoreSnapshot {
  modelId: string
  benchmark: string
  score: number
  unit: ScoreUnit
  sourceUrl: string
  observedAt: string
  /** ISO date this snapshot stopped being the current value. */
  supersededAt?: string
}

export interface LeaderboardRegistry {
  registryVersion: string
  fetchedAt: string
  sourceNote: string
  models: LeaderboardModel[]
  history: ScoreSnapshot[]
}
