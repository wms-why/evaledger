/**
 * CI helper: generate `wrangler.jsonc` (git-ignored) from the committed
 * `wrangler.example.jsonc` template by injecting the real production resource
 * ids and the production domain. Run in the Deploy workflow before `pnpm build`.
 *
 * Values come from repo Variables (Settings → Secrets and variables → Actions →
 * Variables) — these are identifiers, not secrets:
 *   - CF_PROD_D1_ID   (required)  production D1 database_id
 *   - CF_PROD_KV_ID   (required)  production KV namespace id
 *   - CF_PROD_DOMAIN  (required)  the domain the worker is served on, e.g. evaledger.com
 *
 * Only the production env block is patched (this workflow deploys production).
 *
 * Why the domain is required: `BETTER_AUTH_URL` is the origin every absolute
 * URL is derived from (canonical, og:url, sitemap.xml, robots.txt, feed.xml,
 * the Stripe return URLs, every auth email link). If it is empty the deployed
 * site advertises URLs that don't resolve — so the domain is injected here
 * instead of being left as a placeholder in the template.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const { CF_PROD_D1_ID, CF_PROD_KV_ID, CF_PROD_DOMAIN } = process.env

if (!CF_PROD_D1_ID || !CF_PROD_KV_ID) {
  console.error('::error::Set repo Variables CF_PROD_D1_ID and CF_PROD_KV_ID to enable deploy')
  process.exit(1)
}

if (!CF_PROD_DOMAIN) {
  console.error('::error::Set repo Variable CF_PROD_DOMAIN (e.g. evaledger.com) to enable deploy')
  process.exit(1)
}

const text = readFileSync('wrangler.example.jsonc', 'utf8')

// Split at the production env block so replacements never touch top-level placeholders.
const at = text.indexOf('"production"')
if (at === -1) {
  console.error('::error::wrangler.example.jsonc has no "production" env block')
  process.exit(1)
}
const head = text.slice(0, at)
let prod = text.slice(at)

// First occurrence within the production slice is production's own placeholder.
prod = prod
  .replace('00000000-0000-0000-0000-000000000000', CF_PROD_D1_ID)
  .replace('00000000000000000000000000000000', CF_PROD_KV_ID)

// Custom domains: apex + www. `custom_domain: true` makes wrangler create the
// DNS record too, but only when the zone lives in the same Cloudflare account
// as the worker — otherwise DNS has to be pointed at <worker>.workers.dev by hand.
prod = prod.replace(
  /("name":\s*"[^"]+",)/,
  `$1
\t\t\t"routes": [
\t\t\t\t{ "pattern": "${CF_PROD_DOMAIN}", "custom_domain": true },
\t\t\t\t{ "pattern": "www.${CF_PROD_DOMAIN}", "custom_domain": true }
\t\t\t],`,
)

// The site's origin — must match the domain the worker is served on.
prod = prod.replace('"BETTER_AUTH_URL": ""', `"BETTER_AUTH_URL": "https://${CF_PROD_DOMAIN}"`)

writeFileSync('wrangler.jsonc', head + prod)
console.log(`Generated wrangler.jsonc for production (domain: ${CF_PROD_DOMAIN})`)
