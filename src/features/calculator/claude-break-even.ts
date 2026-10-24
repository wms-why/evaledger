import { findModel } from './model-prices'
import { priceDetail } from './pricing-detail'

/**
 * The Claude Pro / Max subscription prices quoted on the Claude page.
 *
 * These are NOT registry prices — they are the subscription prices Anthropic
 * publishes for the consumer plans. They live here, in one place, because the
 * break-even figure is quoted in two surfaces (the subscription card and the
 * FAQ): when the two read different numbers, the page contradicts itself.
 */
export const CLAUDE_PRO_MONTHLY_USD = 20
export const CLAUDE_MAX_MONTHLY_USD = 200

/**
 * The model the break-even is computed against.
 *
 * Claude Sonnet 5 — the current mid-tier. The previous copy computed the
 * break-even from Sonnet 4.5 (a delisted checkpoint) while the page's own
 * tables showed Sonnet 5, and the FAQ quoted a third set of numbers.
 */
export const CLAUDE_BREAK_EVEN_MODEL_ID = 'claude-sonnet-5'

/** Output tokens per input token in the break-even workload (a 1:2 mix). */
export const BREAK_EVEN_OUTPUT_RATIO = 0.5

export interface ClaudeBreakEven {
  /** Registry id of the model the break-even is computed against. */
  modelId: string
  /** Display name of that model. */
  modelName: string
  /** Input rate used ($/1M). */
  inputRate: number
  /** Output rate used ($/1M). */
  outputRate: number
  /** Pro subscription price ($/month). */
  proMonthly: number
  /** Max subscription price ($/month). */
  maxMonthly: number
  /** Pro break-even: input tokens (millions) per month. */
  proInputM: number
  /** Pro break-even: output tokens (millions) per month. */
  proOutputM: number
  /** Max break-even: input tokens (millions) per month. */
  maxInputM: number
  /** Max break-even: output tokens (millions) per month. */
  maxOutputM: number
}

/**
 * The break-even between the Claude subscriptions and the Anthropic API.
 *
 * The arithmetic is the site's own: fix output at half the input volume (a
 * typical Sonnet workload) and solve `monthly = input × rateIn + output ×
 * rateOut` for the input volume. Both the card on the page and the FAQ call
 * this function, so the two can never disagree.
 */
export function claudeBreakEven(modelId: string = CLAUDE_BREAK_EVEN_MODEL_ID): ClaudeBreakEven | null {
  const model = findModel(modelId)
  if (!model) return null
  // The rate in force on the registry snapshot day — the same resolution
  // every other published price on the site uses.
  const detail = priceDetail(model)
  const inputRate = detail.input
  const outputRate = detail.output
  const perMillion = inputRate + BREAK_EVEN_OUTPUT_RATIO * outputRate
  if (perMillion <= 0) return null

  const proInputM = CLAUDE_PRO_MONTHLY_USD / perMillion
  const maxInputM = CLAUDE_MAX_MONTHLY_USD / perMillion
  return {
    modelId,
    modelName: model.displayName,
    inputRate,
    outputRate,
    proMonthly: CLAUDE_PRO_MONTHLY_USD,
    maxMonthly: CLAUDE_MAX_MONTHLY_USD,
    proInputM,
    proOutputM: proInputM * BREAK_EVEN_OUTPUT_RATIO,
    maxInputM,
    maxOutputM: maxInputM * BREAK_EVEN_OUTPUT_RATIO,
  }
}

/**
 * The break-even volumes, as the page prints them.
 *
 * The card and the FAQ share this formatter, so "2.86M input + 1.43M output"
 * is the same string on both sides of the page.
 */
export function formatBreakEvenM(n: number): string {
  if (n >= 100) return n.toFixed(0)
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}
