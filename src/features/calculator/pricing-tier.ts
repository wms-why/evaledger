/**
 * Preset output-to-input ratios for common LLM use cases.
 *
 * The user's input on the form is "X input tokens, what does Y output cost?".
 * We default to a preset rather than forcing the user to guess, matching
 * tokencalculator.ai's UX.
 *
 * Numbers are conservative — they're meant to give a plausible monthly bill,
 * not a precise one. Users override via the slider / manual input.
 */

export interface OutputPreset {
  id: string
  /** English label. */
  label: string
  /** Chinese label. */
  labelZh: string
  /** Output tokens as a fraction of input tokens. */
  ratio: number
  /** Short English description. */
  description: string
  /** Short Chinese description. */
  descriptionZh: string
}

export const OUTPUT_PRESETS: OutputPreset[] = [
  {
    id: 'classification',
    label: 'Classification',
    labelZh: '分类',
    ratio: 0.05,
    description: 'Sentiment, intent, routing — short labels.',
    descriptionZh: '情感、意图、路由——短标签。',
  },
  {
    id: 'rag',
    label: 'RAG Q&A',
    labelZh: 'RAG 问答',
    ratio: 0.2,
    description: 'Retrieval-augmented answers over long context.',
    descriptionZh: '基于检索的长文问答。',
  },
  {
    id: 'chat',
    label: 'Chat reply',
    labelZh: '对话回复',
    ratio: 0.5,
    description: 'Conversational back-and-forth, moderate length.',
    descriptionZh: '对话式往返，中等长度。',
  },
  {
    id: 'full',
    label: 'Full response',
    labelZh: '完整回复',
    ratio: 1.0,
    description: 'Equal input and output — typical generation.',
    descriptionZh: '输入输出等长——典型生成。',
  },
  {
    id: 'long',
    label: 'Long generation',
    labelZh: '长输出',
    ratio: 2.0,
    description: 'Articles, reports, translations — output dominates.',
    descriptionZh: '文章、报告、翻译——输出为主。',
  },
]

export const DEFAULT_PRESET_ID = 'rag'

export function findPreset(id: string): OutputPreset {
  return OUTPUT_PRESETS.find((p) => p.id === id) ?? OUTPUT_PRESETS[1]
}