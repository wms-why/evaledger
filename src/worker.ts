/**
 * Cloudflare Worker entry (wrangler `main`). Wraps the framework's default
 * server entry so every deployed response goes through cross-cutting steps:
 *   1. validate required env once per isolate (fail fast on misconfig),
 *   2. add baseline security headers, and
 *   3. report unhandled exceptions to Sentry (when SENTRY_DSN is set).
 *
 * Importing `@tanstack/react-start/server-entry` reuses the exact handler the
 * framework would otherwise run, so SSR/streaming behaviour is unchanged.
 */
import * as Sentry from '@sentry/cloudflare'
import entry from '@tanstack/react-start/server-entry'
import { withSecurityHeaders } from '@/lib/security-headers'
import { assertEnvOnce } from '@/lib/env-validate'
import {
  canonicalHostRedirect,
  isLocalOrigin,
  permanentPathRedirect,
} from '@/features/seo/canonical-redirect'
import { createDb } from '@/db/client'
import { runCleanup } from '@/features/maintenance/cleanup'

const fetchHandler = (
  entry as { fetch: (request: Request, env: Cloudflare.Env, ctx: ExecutionContext) => Promise<Response> }
).fetch

const handler = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    await assertEnvOnce()
    // Canonicalise the address before the router can answer a duplicate form
    // with a temporary redirect: non-canonical host/protocol, `/en` prefix,
    // historical path aliases, and trailing slashes. See
    // `features/seo/canonical-redirect.ts`.
    if (!isLocalOrigin(env.BETTER_AUTH_URL)) {
      const hostRedirect = canonicalHostRedirect(request, env.BETTER_AUTH_URL)
      if (hostRedirect) return withSecurityHeaders(hostRedirect)
    }
    const pathRedirect = permanentPathRedirect(request)
    if (pathRedirect) return withSecurityHeaders(pathRedirect)
    const response = await fetchHandler(request, env, ctx)
    return withSecurityHeaders(response)
  },

  // Cron Triggers entry (schedule in wrangler.jsonc → triggers.crons). Runs the
  // maintenance cleanup; extend with your own periodic tasks (digests, etc.).
  async scheduled(_controller: ScheduledController, env: Cloudflare.Env, _ctx: ExecutionContext): Promise<void> {
    const result = await runCleanup(createDb(env.DB), Date.now())
    console.log('[cron] cleanup', result)
  },
}

// withSentry catches unhandled exceptions / promise rejections in the worker.
// Returning undefined when no DSN is set disables Sentry entirely (degrades
// gracefully). tracesSampleRate: 0 keeps it errors-only — cheap by default.
export default Sentry.withSentry(
  (env: Cloudflare.Env) =>
    env.SENTRY_DSN ? { dsn: env.SENTRY_DSN, tracesSampleRate: 0, sendDefaultPii: false } : undefined,
  handler,
)
