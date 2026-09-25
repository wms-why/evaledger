import { en, type Dict } from './dictionaries/en'
import { zh } from './dictionaries/zh'

export const locales = ['en', 'zh'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const dictionaries: Record<Locale, Dict> = { en, zh }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

type Params = Record<string, string | number>

/** 按点路径取文案；缺失回退 key；支持 {var} 插值。 */
export function translate(dict: Dict, key: string, params?: Params): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return (acc as Record<string, unknown>)[part]
    return undefined
  }, dict)
  if (typeof value !== 'string') return key
  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}

/**
 * 按点路径取**原始值**（不插值），用于字典里数组/嵌套对象的取数。
 * 缺失返回 undefined。调用方负责按预期形态断言/收敛。
 */
export function lookup<T = unknown>(dict: Dict, key: string): T {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return (acc as Record<string, unknown>)[part]
    return undefined
  }, dict) as T
}

/** 从完整 href 上剥掉冗余的 /en 前缀，保留 query 和 hash——
 *  规范化重定向用（`/en/pricing?ref=x` → `/pricing?ref=x`）。 */
export function stripDefaultLocalePrefix(href: string): string {
  const stripped = href.replace(/^\/en(?=[/?#]|$)/, '')
  if (stripped === '') return '/'
  if (stripped.startsWith('?') || stripped.startsWith('#')) return `/${stripped}`
  return stripped
}

/** en 无前缀；其余 locale 加 /{locale} 前缀。 */
export function localizePath(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path
  if (locale === defaultLocale) return clean || '/'
  return `/${locale}${clean}` || `/${locale}`
}

/** SSR 语言协商：cookie 优先，其次 Accept-Language，最后默认。 */
export function negotiateLocale(
  cookieLocale: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(cookieLocale)) return cookieLocale
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(',')) {
      const tag = part.split(';')[0].trim().toLowerCase()
      const base = tag.split('-')[0]
      if (isLocale(base)) return base
    }
  }
  return defaultLocale
}
