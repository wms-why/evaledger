import type { Provider } from '@/features/calculator/types'

/** Map a registry provider slug to its i18n key. */
const PROVIDER_KEYS: Record<string, string> = {
  openai: 'calculator.providerOpenai',
  anthropic: 'calculator.providerAnthropic',
  google: 'calculator.providerGoogle',
  deepseek: 'calculator.providerDeepSeek',
  minimax: 'calculator.providerMinimax',
  stepfun: 'calculator.providerStepfun',
  grok: 'calculator.providerGrok',
  kimi: 'calculator.providerKimi',
  openrouter: 'calculator.providerOpenRouter',
}

/**
 * Localized provider display name; falls back to the raw slug.
 *
 * Shared by the results grid (filter chips) and the model card (provider
 * badge) so a provider is never rendered as a raw English slug.
 */
export function providerLabel(t: (key: string) => string, provider: Provider | string): string {
  return t(PROVIDER_KEYS[provider] ?? provider)
}
