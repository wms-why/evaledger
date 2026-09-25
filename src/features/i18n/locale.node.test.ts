import { test, expect } from 'vitest'
import { translate, negotiateLocale, locales, defaultLocale, stripDefaultLocalePrefix } from '@/features/i18n/locale'
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
