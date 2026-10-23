import type { Vendor } from './types'

/**
 * Canonical vendor order for grouped surfaces such as the model picker.
 * Label keys live here too, so the table, the profile, and the picker always
 * render the same vendor name.
 */
export const VENDOR_ORDER: readonly Vendor[] = [
  'claude',
  'openai',
  'google',
  'grok',
  'deepseek',
  'minimax',
  'stepfun',
  'glm',
  'kimi',
]

/** i18n key for the vendor-facing name (Anthropic, OpenAI, 智谱…). */
export const VENDOR_LABEL_KEY: Record<Vendor, string> = {
  claude: 'leaderboard.vendorClaude',
  openai: 'leaderboard.vendorOpenai',
  google: 'leaderboard.vendorGoogle',
  grok: 'leaderboard.vendorGrok',
  deepseek: 'leaderboard.vendorDeepseek',
  minimax: 'leaderboard.vendorMinimax',
  stepfun: 'leaderboard.vendorStepfun',
  glm: 'leaderboard.vendorGlm',
  kimi: 'leaderboard.vendorKimi',
}
