/**
 * Telling a software version from a benchmark score.
 *
 * The release guard reads every bare decimal in an article ("90.9", "36.8")
 * as a score claim and fails the build unless a model the post depends on
 * actually holds that figure. That is the right rule for a launch analysis —
 * it is what catches a table that moved while the prose did not.
 *
 * A deployment walkthrough, though, names toolchain versions: "Python 3.12",
 * "GCC >= 13.0", "CANN 9.2". Those are identifiers from a requirements list,
 * not measurements, and no registry will ever contain them. Without this the
 * article is rejected for printing a number it is right to print.
 *
 * Deliberately an explicit list of product names. A blanket "any capitalised
 * word before a decimal" rule would let a real score slip through by naming a
 * model.
 */
const TOOLCHAIN_NAMES = [
  'Python',
  'GCC',
  'G\\+\\+',
  'CUDA',
  'CANN',
  'ROCm',
  'NCCL',
  'glibc',
  'CMake',
  'Clang',
  'Node\\.?js',
  'npm',
  'pnpm',
]

const TOOLCHAIN_PREFIX = new RegExp(
  // `\\b` does not work after "G++": `+` is not a word character, so there is
  // no boundary between the two. Anchor on "not followed by a word character"
  // instead, which covers both "Python 3.12" and "G++ 13".
  `(?<![A-Za-z])(?:${TOOLCHAIN_NAMES.join('|')})(?![A-Za-z])\\s*(?:>=|<=|>|<|~=)?\\s*$`,
  'i',
)

/**
 * True when the decimal at `index` is the version number of a toolchain
 * requirement ("…Python 3.12"), rather than a measurement.
 *
 * `before` is the text preceding the number; the check is anchored to its end,
 * so a tool name anywhere earlier in the paragraph does not excuse a score.
 */
export function isToolchainVersion(before: string): boolean {
  return TOOLCHAIN_PREFIX.test(before)
}
