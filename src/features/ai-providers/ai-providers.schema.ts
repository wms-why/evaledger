/**
 * Drizzle schema for the `ai_provider` table — runtime-configurable registry
 * of upstream LLM providers (mmx / DeepSeek / Replicate).
 *
 * Rows store only metadata: kind / model / priority / cap / display info.
 * Raw API keys NEVER appear here — they live in worker secrets
 * (`env.MMX_API_KEY` / `env.DEEPSEEK_API_KEY` / `env.REPLICATE_API_TOKEN`)
 * and are resolved into the adapter ctx just-in-time by `resolveCtx()`.
 *
 * `enabled` uses `{ mode: 'boolean' }` to match the existing `sponsorship.hidden`
 * convention so admin checkboxes bind directly without coercion.
 *
 * Indexing notes:
 * - The `(enabled, priority)` composite index is the selector's exact hot path:
 *   `WHERE enabled=1 ORDER BY priority, id` on every AI call.
 * - `(kind, model)` unique index prevents accidental duplicate registrations
 *   (same model under same vendor — common error when copy-pasting from docs).
 */
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const aiProvider = sqliteTable(
  'ai_provider',
  {
    id: text('id').primaryKey(), // crypto.randomUUID()
    /** Vendor identifier: 'mmx' | 'deepseek' | 'replicate' */
    kind: text('kind').notNull(),
    /** Human-readable label shown in admin UI. */
    label: text('label').notNull(),
    /** Model id passed to the provider (e.g. 'MiniMax-Text-01', 'deepseek-chat', 'meta/meta-llama-3-70b-instruct'). */
    model: text('model').notNull(),
    /** Optional override of the provider's default base URL (e.g. point at a mirror or staging gateway). */
    baseUrlOverride: text('base_url_override'),
    /** Whether this row is selectable by the selector. False rows are kept for history but skipped. */
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    /** Lower = tried first. Ties broken by id. */
    priority: integer('priority').notNull(),
    /** If set, the selector caps the caller's max_tokens per this row (min of caller cap and row cap). */
    maxTokensCap: integer('max_tokens_cap'),
    /** Last surfaced failure message — powers the admin row's "Last error" affordance. */
    lastError: text('last_error'),
    /** When `lastError` was written; selector coalesces writes within a 30s window. */
    lastErrorAt: integer('last_error_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [
    uniqueIndex('ai_provider_kind_model_uniq').on(t.kind, t.model),
    index('ai_provider_priority_idx').on(t.enabled, t.priority),
  ],
)

export type AIProvider = typeof aiProvider.$inferSelect
export type AIProviderInsert = typeof aiProvider.$inferInsert
