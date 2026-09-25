import { test, expect } from 'vitest'
import { translate, lookup, negotiateLocale, locales, defaultLocale, stripDefaultLocalePrefix } from '@/features/i18n/locale'
import { en } from '@/features/i18n/dictionaries/en'
import { zh } from '@/features/i18n/dictionaries/zh'

test('stripDefaultLocalePrefix：去掉 /en 前缀且保留 query 和 hash', () => {
  expect(stripDefaultLocalePrefix('/en/pricing?ref=x')).toBe('/pricing?ref=x')
  expect(stripDefaultLocalePrefix('/en/sponsor?status=success&session_id=cs_1')).toBe('/sponsor?status=success&session_id=cs_1')
  expect(stripDefaultLocalePrefix('/en/docs#setup')).toBe('/docs#setup')
  expect(stripDefaultLocalePrefix('/en')).toBe('/')
  expect(stripDefaultLocalePrefix('/en?a=1')).toBe('/?a=1')
  expect(stripDefaultLocalePrefix('/en/')).toBe('/')
})

test('translate 解析嵌套 key', () => {
  expect(translate(en, 'home.title')).toBe('Token Cost Calculator — Compare Prices Across OpenAI, Claude, Gemini & DeepSeek')
})
test('translate 插值 {name}', () => {
  expect(translate(en, 'home.greeting', { name: 'Yang' })).toBe('Hello, Yang!')
})
test('translate 缺失 key 回退为 key 本身', () => {
  expect(translate(en, 'home.nope')).toBe('home.nope')
})
test('translate 插值 marketing.homeMetaDescription 的 {date}', () => {
  // i18n key symmetry + interpolation — both locales must interpolate {date}
  // so the home meta description can carry REGISTRY.fetchedAt through dicts.
  const date = '2026-09-25'
  expect(translate(en, 'marketing.homeMetaDescription', { date })).toContain(date)
  expect(translate(zh, 'marketing.homeMetaDescription', { date })).toContain(date)
  expect(translate(en, 'marketing.homeMetaDescription', { date })).not.toBe('marketing.homeMetaDescription')
  expect(translate(zh, 'marketing.homeMetaDescription', { date })).not.toBe('marketing.homeMetaDescription')
})
test('translate 插值 marketing.openrouterMetaDescription / claudeMetaDescription 的 {date}', () => {
  const date = '2026-09-25'
  expect(translate(en, 'marketing.openrouterMetaDescription', { date })).toContain(date)
  expect(translate(zh, 'marketing.openrouterMetaDescription', { date })).toContain(date)
  expect(translate(en, 'marketing.claudeMetaDescription', { date })).toContain(date)
  expect(translate(zh, 'marketing.claudeMetaDescription', { date })).toContain(date)
})
test('translate 解析 home.openrouterTitle / home.claudeTitle', () => {
  expect(translate(en, 'home.openrouterTitle')).toContain('OpenRouter')
  expect(translate(zh, 'home.openrouterTitle')).toContain('OpenRouter')
  expect(translate(en, 'home.claudeTitle')).toContain('Claude')
  expect(translate(zh, 'home.claudeTitle')).toContain('Claude')
})
test('marketing.brandTitle / brandDescription / brandOgDescription 两语种都有非空值', () => {
  for (const key of ['brandTitle', 'brandDescription', 'brandOgDescription'] as const) {
    expect(translate(en, `marketing.${key}` as const).length).toBeGreaterThan(0)
    expect(translate(zh, `marketing.${key}` as const).length).toBeGreaterThan(0)
  }
})
test('lookup 取数组 calculator.tldrItems（en 4 项）', () => {
  const items = lookup<string[]>(en, 'calculator.tldrItems')
  expect(Array.isArray(items)).toBe(true)
  expect(items?.length).toBe(4)
  expect(items?.[0]).toContain('Output tokens')
})
test('lookup 取数组 calculator.tips（zh 5 项）', () => {
  const items = lookup<string[]>(zh, 'calculator.tips')
  expect(Array.isArray(items)).toBe(true)
  expect(items?.length).toBe(5)
})
test('lookup 缺失 key 返回 undefined（不回退 key 本身）', () => {
  // translate() 缺失返回 key 字符串以保持 UI 显示 fallback
  expect(translate(en, 'calculator.nope')).toBe('calculator.nope')
  // lookup() 缺失则返回 undefined 以保留类型语义
  expect(lookup(en, 'calculator.nope')).toBeUndefined()
})
test('negotiateLocale：cookie 优先', () => {
  expect(negotiateLocale('zh', 'en-US,en')).toBe('zh')
})
test('negotiateLocale：无 cookie 时按 accept-language', () => {
  expect(negotiateLocale(undefined, 'zh-CN,zh;q=0.9,en;q=0.8')).toBe('zh')
})
test('negotiateLocale：都不匹配回退默认', () => {
  expect(negotiateLocale('fr', 'fr-FR')).toBe(defaultLocale)
  expect(locales).toContain(defaultLocale)
})
