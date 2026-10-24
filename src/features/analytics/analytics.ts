import { createServerFn } from '@tanstack/react-start'

/**
 * Optional analytics snippets for the whole site:
 *
 *  - `getAnalyticsToken` → Cloudflare Web Analytics beacon token (public).
 *    Get one at Cloudflare dashboard → Analytics & Logs → Web Analytics.
 *  - `getGtagConfig` → Google Analytics 4 measurement id (e.g. `G-XXXXXXXXXX`).
 *    Get one at Google Analytics → Admin → Data Streams.
 *
 * Both return `null` when unset, so each snippet is simply not injected —
 * privacy-friendly and degrades gracefully like every other optional
 * integration. A measurement id is not a secret (it ships in a public page),
 * so it lives in wrangler `vars`, not `secrets`.
 */

export const getAnalyticsToken = createServerFn({ method: 'GET' }).handler(
  async (): Promise<string | null> => {
    // Lazy env import (repo convention): keeps cloudflare:workers out of node test graphs.
    const { env } = await import('@/lib/env')
    return env.CF_ANALYTICS_TOKEN || null
  },
)

export const getGtagConfig = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ measurementId: string } | null> => {
    const { env } = await import('@/lib/env')
    const measurementId = env.GA4_MEASUREMENT_ID?.trim()
    return measurementId ? { measurementId } : null
  },
)
