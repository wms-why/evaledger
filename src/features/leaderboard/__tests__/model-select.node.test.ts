import { test, expect } from 'vitest'
import { filterModels, groupModelsByVendor } from '@/features/leaderboard/model-select'
import type { LeaderboardModel, Vendor } from '@/features/leaderboard/types'

const VENDOR_LABELS: Record<Vendor, string> = {
  claude: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  grok: 'xAI',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
  glm: '智谱',
  kimi: '月之暗面',
}

const vendorLabel = (vendor: Vendor) => VENDOR_LABELS[vendor]

function model(
  id: string,
  vendor: Vendor,
  displayName: string,
  extra: Partial<LeaderboardModel> = {},
): LeaderboardModel {
  return {
    id,
    vendor,
    kind: 'other',
    version: id,
    displayName,
    scores: [],
    ...extra,
  }
}

const MODELS = [
  model('grok-4.7', 'grok', 'Grok 4.7'),
  model('claude-opus-5', 'claude', 'Claude Opus 5'),
  model('claude-sonnet-4.5', 'claude', 'Claude Sonnet 4.5'),
  model('glm-5.3', 'glm', 'GLM 5.3'),
]

test('groupModelsByVendor：按固定厂商顺序分组，组内保持输入顺序', () => {
  const groups = groupModelsByVendor(MODELS)
  expect(groups.map((group) => group.vendor)).toEqual(['claude', 'grok', 'glm'])
  expect(groups[0].models.map((entry) => entry.id)).toEqual([
    'claude-opus-5',
    'claude-sonnet-4.5',
  ])
  expect(groups[1].models.map((entry) => entry.id)).toEqual(['grok-4.7'])
})

test('groupModelsByVendor：空列表没有分组', () => {
  expect(groupModelsByVendor([])).toEqual([])
})

test('filterModels：空查询返回原列表，忽略首尾空白', () => {
  expect(filterModels(MODELS, '', vendorLabel)).toEqual(MODELS)
  expect(filterModels(MODELS, '   ', vendorLabel)).toEqual(MODELS)
})

test('filterModels：模型名忽略大小写匹配', () => {
  expect(filterModels(MODELS, 'CLAUDE', vendorLabel).map((entry) => entry.id)).toEqual([
    'claude-opus-5',
    'claude-sonnet-4.5',
  ])
})

test('filterModels：匹配本地化厂商名', () => {
  expect(filterModels(MODELS, '智谱', vendorLabel).map((entry) => entry.id)).toEqual(['glm-5.3'])
  expect(filterModels(MODELS, 'anthropic', vendorLabel).map((entry) => entry.id)).toEqual([
    'claude-opus-5',
    'claude-sonnet-4.5',
  ])
})

test('filterModels：多个关键词按 AND 匹配厂商与型号', () => {
  expect(
    filterModels(MODELS, 'anthropic opus', vendorLabel).map((entry) => entry.id),
  ).toEqual(['claude-opus-5'])
  expect(filterModels(MODELS, 'xai 4.7', vendorLabel).map((entry) => entry.id)).toEqual([
    'grok-4.7',
  ])
})

test('filterModels：匹配 id / version / kind', () => {
  expect(filterModels(MODELS, 'grok-4.7', vendorLabel).map((entry) => entry.id)).toEqual([
    'grok-4.7',
  ])
  expect(
    filterModels(
      [model('claude-opus-5', 'claude', 'Claude Opus 5', { version: 'opus-5', kind: 'opus' })],
      'opus-5',
      vendorLabel,
    ).map((entry) => entry.id),
  ).toEqual(['claude-opus-5'])
})

test('filterModels：无匹配返回空数组', () => {
  expect(filterModels(MODELS, 'no-such-model', vendorLabel)).toEqual([])
})
