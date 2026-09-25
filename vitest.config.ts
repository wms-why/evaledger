import { defineConfig } from 'vitest/config'
import { cloudflarePool, cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { fileURLToPath, URL } from 'node:url'

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) }

const workersPoolOptions = {
  miniflare: {
    compatibilityDate: '2026-05-30',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: ['DB'],
    r2Buckets: ['BUCKET'],
    kvNamespaces: ['CACHE'],
  },
}

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.node.test.ts', 'scripts/**/*.node.test.ts'],
        },
        resolve: { alias },
      },
      {
        plugins: [cloudflareTest(workersPoolOptions)],
        test: {
          name: 'workers',
          include: ['src/**/*.workers.test.ts', 'src/**/*.workers.test.tsx'],
          pool: cloudflarePool(workersPoolOptions),
        },
        resolve: { alias },
      },
    ],
  },
})
