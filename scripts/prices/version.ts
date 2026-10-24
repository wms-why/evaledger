/**
 * Version of the `pnpm prices:fetch` script.
 *
 * Bump when the script gains scraping capability for a new model type or
 * version (new provider, new selector, new regex pattern). Move in lockstep
 * with `REGISTRY_VERSION` in `src/features/calculator/model-prices.ts` —
 * when the two diverge, the script prints a warning at the end of its run.
 *
 * The `--apply` mode does NOT touch `REGISTRY_VERSION`; only humans update
 * both versions, in the same commit.
 *
 * 0.9.0 — the REGISTRY gained the Moonshot Kimi provider (K3.1 Pro, its
 * Highspeed twin and K3). There is still no Kimi selector in `sources/`, the
 * same state StepFun is in: that page is read by hand. The version moves so
 * the two tables stay in lockstep and the script prints no drift warning.
 */
export const SCRIPT_VERSION = '0.9.0'