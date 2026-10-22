import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

/**
 * Correction reports filed by visitors about a price, score or version.
 *
 * These are operational intake (like `feedback` / `waitlist`), not published
 * site content: the fix a report produces is still an edit to the price file.
 */
export const dataReport = sqliteTable('data_report', {
  id: text('id').primaryKey(),
  modelId: text('model_id'),
  kind: text('kind').notNull(),
  detail: text('detail').notNull(),
  sourceUrl: text('source_url'),
  email: text('email'),
  status: text('status').notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [
  // The admin queue always lists newest-first.
  index('data_report_createdAt_idx').on(t.createdAt),
])

export type DataReport = typeof dataReport.$inferSelect
