import { test, expect } from 'vitest'
import { trustedOrigins, type AuthEnv } from '@/features/auth/auth.server'

function env(over: Partial<AuthEnv> = {}): AuthEnv {
  return { BETTER_AUTH_SECRET: 'x'.repeat(32), BETTER_AUTH_URL: 'https://evaledger.com', ...over }
}

test('trustedOrigins：默认只有 base URL 的 origin', () => {
  expect(trustedOrigins(env())).toEqual(['https://evaledger.com'])
})

test('trustedOrigins：AUTH_TRUSTED_ORIGINS 追加额外 origin', () => {
  const origins = trustedOrigins(
    env({ AUTH_TRUSTED_ORIGINS: 'https://tokencalculator.flowmails.net, https://www.evaledger.com' }),
  )
  expect(origins).toContain('https://evaledger.com')
  expect(origins).toContain('https://tokencalculator.flowmails.net')
  expect(origins).toContain('https://www.evaledger.com')
})

test('trustedOrigins：重复项去重，空项忽略', () => {
  const origins = trustedOrigins(env({ AUTH_TRUSTED_ORIGINS: 'https://evaledger.com, ,' }))
  expect(origins).toEqual(['https://evaledger.com'])
})

test('trustedOrigins：路径被归一到 origin', () => {
  expect(trustedOrigins(env({ AUTH_TRUSTED_ORIGINS: 'https://old.example.com/some/path' }))).toContain(
    'https://old.example.com',
  )
})

test('trustedOrigins：非法条目被丢弃，不影响其它条目', () => {
  const origins = trustedOrigins(env({ AUTH_TRUSTED_ORIGINS: 'not-a-url, https://old.example.com' }))
  expect(origins).toContain('https://old.example.com')
  expect(origins).toContain('https://evaledger.com')
  expect(origins).not.toContain('not-a-url')
})
