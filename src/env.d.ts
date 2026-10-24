/**
 * The project-owned half of the Cloudflare `Env` type.
 *
 * `worker-configuration.d.ts` is **generated** by `wrangler types` and is
 * committed. It is regenerated when the Worker configuration changes shape —
 * a new *binding*, a renamed variable, a new environment. A var that is only
 * *added* to `wrangler.jsonc` does not reach it on its own, because
 * regenerating inlines the config's literal values (a secret value ends up
 * in a committed file) and rewrites thousands of lines of generated code.
 *
 * So the vars that arrived after the last regeneration are declared here, in
 * the project-owned half of the type — which is exactly what the generated
 * file's own comment prescribes:
 *
 * > Project-specific parameters used to inform types. […] A project should
 * > have a declaration like: `interface GlobalProps { … }`
 *
 * `Env` keeps every member the generated file declares and gains these. The
 * generated file is never edited by hand.
 */
declare global {
  /**
   * `Cloudflare.Env` is the type `cloudflare:workers` hands out as `env`.
   * The generated file declares it as `interface Env extends __BaseEnv_Env {}`
   * inside the `Cloudflare` namespace, so the augmentation has to target
   * THAT interface — the global `Env` alias is a different declaration and
   * augmenting it would not reach the binding.
   */
  namespace Cloudflare {
    interface Env {
      /**
       * Google Analytics 4 measurement id (`G-XXXXXXXXXX`).
       *
       * Not a secret — it ships in a public page — so it lives in wrangler
       * `vars`. Optional: without it the gtag snippet is simply not injected
       * (`src/features/analytics/analytics.ts`).
       */
      GA4_MEASUREMENT_ID?: string
    }
  }
}

export {}
