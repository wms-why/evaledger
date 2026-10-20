/**
 * The record ledger — types.
 *
 * A *record* is one published fact-set: one model version (or checkpoint) as
 * it was measured and priced when we published it. DeepSeek ships V4.1-Flash
 * as rolling checkpoints under one API model name, so "V4.1-Flash 0910" and
 * "V4.1-Flash 1017" are **two records**, not one model with two sets of
 * numbers.
 *
 * The rule this slice enforces:
 *
 *   **A new iteration is a new record. A published record does not change.**
 *
 * - A version bump — even one that only changes a suffix, like
 *   `-0910` → `-1017` — is a release: a new REGISTRY row, a new LEADERBOARD
 *   row, a new release post, and a new ledger entry that supersedes the old
 *   one. The old record is retired, not rewritten.
 * - The numbers a record was published with are **pinned** in the ledger. A
 *   pinned value only changes through a logged {@link RecordChange}:
 *   - `correction` — we published a wrong value (a recording error). The
 *     reason and the source are required.
 *   - `remeasurement` — the source published a new measurement for the same
 *     weights. Not allowed for a retired record: its weights are frozen.
 * - A price on a *live* record may move without a change entry — prices are
 *   facts about the vendor's billing, not about the version, and they carry
 *   their own discipline (`lastVerified`, `fetchedAt`, re-read articles). The
 *   price of a *retired* record is a historical fact and is pinned like the
 *   scores.
 */

/**
 * One logged change to a pinned value.
 *
 * The point of the log is the review trail: an editor who changes published
 * data has to say, in the diff, what was wrong and where the right number
 * comes from. A version bump is not a change — it is a new record.
 */
export interface RecordChange {
  /** ISO date the change was made. */
  date: string
  /**
   * Which pinned value changed. Naming:
   * - `scores.<benchmark>` — a score
   * - `notes.<benchmark>` — the caveat printed with a score
   * - `prices.<slot>` — a price (only pinned for retired records)
   * - `identity.version` / `identity.displayName` — what the record *is*
   * - `price.displayName` — the price row's label
   */
  field: string
  /** The value we published. */
  from: string
  /** The value it is now. */
  to: string
  /**
   * `correction` — we published a wrong value.
   * `remeasurement` — the source published a new measurement of the same
   * weights (live records only).
   */
  kind: 'correction' | 'remeasurement'
  /** One sentence: why this changed. */
  reason: string
  /** Where the correct / new value comes from. */
  sourceUrl: string
}

/** The pinned price line of a record. */
export interface PricePin {
  /** USD per 1M input tokens. */
  input: number
  /** USD per 1M output tokens. */
  output: number
  /** USD per 1M cached input tokens, when the vendor has one. */
  cached?: number
  /** Maximum context window in tokens. */
  context: number
}

/** The pinned identity of a record: what it *is*, not what it scores. */
export interface IdentityPin {
  /** The label the site prints. */
  displayName: string
  /** The version token — unique inside the family (e.g. `v4.1-flash-1017`). */
  version?: string
}

/** One published record. */
export interface RecordEntry {
  /** How the record is labelled on the site. */
  label: string
  /** REGISTRY id — the price side of this record. */
  priceId?: string
  /** LEADERBOARD id — the score side of this record. */
  scoreId?: string
  /**
   * ISO date the record came into existence (the checkpoint's ship date).
   * Optional: we only know it for some models.
   */
  introduced?: string
  /**
   * The record this one replaces. A new checkpoint of the same model points
   * at the checkpoint it took over from — that link is what makes the line
   * readable as a history instead of a pile of rows.
   */
  supersedes?: string
  /**
   * ISO date the record stopped being served. A retired record's numbers are
   * frozen: they are historical facts about weights nobody serves any more.
   */
  retiredAt?: string
  /** The official page the numbers were read from. */
  sourceUrl: string
  /** Pinned scores — benchmark id → the value we published. */
  scores?: Record<string, number>
  /** Pinned caveats — benchmark id → the note printed with the score. */
  notes?: Record<string, string>
  /** Pinned identity of the score record. */
  identity?: IdentityPin
  /** Pinned identity of the price record. */
  priceIdentity?: IdentityPin
  /**
   * Pinned price line. Only meaningful for retired records — a live record's
   * prices move with the vendor's billing page.
   */
  prices?: PricePin
  /** The change log for this record. */
  changes?: RecordChange[]
}
