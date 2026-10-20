import { test, expect } from 'vitest'
import {
  DEFAULT_COMPARE_IDS,
  MAX_COMPARE_MODELS,
  NO_COMPARE_SCORES,
  availableScoreIds,
  moveCompareId,
  resolveCompareIds,
  resolveCompareScoreIds,
  serializeCompareIds,
  serializeCompareScores,
} from '@/features/leaderboard/compare-selection'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD, findLeaderboardModel } from '@/features/leaderboard/models'

const ids = LEADERBOARD.models.map((m) => m.id)

test('resolveCompareIds：空搜索返回默认两个模型', () => {
  expect(resolveCompareIds({})).toEqual([...DEFAULT_COMPARE_IDS])
})

test('resolveCompareIds：models 的顺序就是列顺序', () => {
  expect(resolveCompareIds({ models: 'kimi-k3,claude-opus-5,grok-4.7' })).toEqual([
    'kimi-k3',
    'claude-opus-5',
    'grok-4.7',
  ])
})

test('resolveCompareIds：models 优先于旧的 a/b 参数', () => {
  expect(resolveCompareIds({ models: 'glm-5.3,kimi-k3', a: 'grok-4.7', b: 'minimax-m3' })).toEqual([
    'glm-5.3',
    'kimi-k3',
  ])
})

test('resolveCompareIds：兼容 ?a=&b= 旧链接', () => {
  expect(resolveCompareIds({ a: 'grok-4.7', b: 'gemini-3.1-pro' })).toEqual([
    'grok-4.7',
    'gemini-3.1-pro',
  ])
})

test('resolveCompareIds：去重并丢弃未知 id', () => {
  expect(
    resolveCompareIds({ models: 'claude-opus-5,not-a-model,claude-opus-5,gpt-5.6-sol' }),
  ).toEqual(['claude-opus-5', 'gpt-5.6-sol'])
})

test('resolveCompareIds：只剩一个有效 id 时补足到两个', () => {
  const resolved = resolveCompareIds({ models: 'grok-4.7' })
  expect(resolved).toHaveLength(2)
  expect(resolved[0]).toBe('grok-4.7')
  expect(new Set(resolved).size).toBe(2)
})

test('resolveCompareIds：全部无效时回退默认值', () => {
  expect(resolveCompareIds({ models: 'nope,nada' })).toEqual([...DEFAULT_COMPARE_IDS])
})

test('resolveCompareIds：超过上限时截断并保留前 N 个', () => {
  const resolved = resolveCompareIds({ models: ids.join(',') })
  expect(resolved).toHaveLength(MAX_COMPARE_MODELS)
  expect(resolved).toEqual(ids.slice(0, MAX_COMPARE_MODELS))
})

test('serializeCompareIds：逗号连接，可被 resolveCompareIds 读回', () => {
  const ordered = ['grok-4.7', 'kimi-k3', 'glm-5.3']
  const csv = serializeCompareIds(ordered)
  expect(csv).toBe('grok-4.7,kimi-k3,glm-5.3')
  expect(resolveCompareIds({ models: csv })).toEqual(ordered)
})

test('moveCompareId：左右移动并夹紧边界', () => {
  const ordered = ['a', 'b', 'c']
  expect(moveCompareId(ordered, 'a', 1)).toEqual(['b', 'a', 'c'])
  expect(moveCompareId(ordered, 'c', -1)).toEqual(['a', 'c', 'b'])
  expect(moveCompareId(ordered, 'a', -1)).toBe(ordered)
  expect(moveCompareId(ordered, 'c', 1)).toBe(ordered)
  expect(moveCompareId(ordered, 'missing', 1)).toBe(ordered)
})

function modelOrThrow(id: string) {
  const model = findLeaderboardModel(id)
  if (!model) throw new Error(`missing fixture model: ${id}`)
  return model
}

test('availableScoreIds：只保留有分数的基准，并按注册表顺序排列', () => {
  const available = availableScoreIds([modelOrThrow('claude-opus-5'), modelOrThrow('grok-4.7')])
  expect(available).toContain('gpqa-diamond')
  expect(available).toContain('terminal-bench-4.0')
  expect(available).not.toContain('swe-bench-pro')

  const order = BENCHMARKS.map((benchmark) => benchmark.id)
  expect(available).toEqual([...available].sort((a, b) => order.indexOf(a) - order.indexOf(b)))
})

test('availableScoreIds：并集覆盖多个模型各自独有的基准', () => {
  const available = availableScoreIds([
    modelOrThrow('claude-opus-5'),
    modelOrThrow('grok-4.7'),
  ])
  expect(available).toContain('programbench')
  expect(available).toContain('deepswe-v1.1')
})

test('resolveCompareScoreIds：缺省时显示全部可用分数项', () => {
  const available = availableScoreIds([modelOrThrow('claude-opus-5')])
  expect(resolveCompareScoreIds({}, available)).toEqual(available)
})

test('resolveCompareScoreIds：scores=none 表示全部隐藏', () => {
  const available = availableScoreIds([modelOrThrow('claude-opus-5')])
  expect(resolveCompareScoreIds({ scores: NO_COMPARE_SCORES }, available)).toEqual([])
})

test('resolveCompareScoreIds：按注册表顺序返回子集并去重', () => {
  const available = ['gpqa-diamond', 'hle', 'terminal-bench-4.0']
  expect(
    resolveCompareScoreIds(
      { scores: 'terminal-bench-4.0,gpqa-diamond,terminal-bench-4.0' },
      available,
    ),
  ).toEqual(['gpqa-diamond', 'terminal-bench-4.0'])
})

test('resolveCompareScoreIds：全是未知 id 时回退到全部可用项', () => {
  const available = ['gpqa-diamond', 'hle']
  expect(resolveCompareScoreIds({ scores: 'gone,also-gone' }, available)).toEqual(available)
})

test('serializeCompareScores：全选时省略参数，空选写 none，子集写 CSV', () => {
  const available = ['gpqa-diamond', 'hle', 'terminal-bench-4.0']
  expect(serializeCompareScores(available, available)).toBeUndefined()
  expect(serializeCompareScores([], available)).toBe(NO_COMPARE_SCORES)
  expect(serializeCompareScores(['hle', 'gpqa-diamond'], available)).toBe('gpqa-diamond,hle')
})

test('serializeCompareScores：CSV 可被 resolveCompareScoreIds 读回', () => {
  const available = ['gpqa-diamond', 'hle', 'terminal-bench-4.0']
  const picked = ['terminal-bench-4.0', 'hle']
  const csv = serializeCompareScores(picked, available)
  expect(csv).toBeDefined()
  expect(resolveCompareScoreIds({ scores: csv }, available)).toEqual(['hle', 'terminal-bench-4.0'])
})
