import type { Locale } from '@/features/i18n/locale'
import { BENCHMARK_DESCRIPTIONS_ZH } from './benchmark-descriptions.zh'
import type { ScoreUnit } from './types'

/**
 * Benchmark registry. Ids are the slugs used in `/benchmarks/[slug]` and as
 * the join key on every `BenchmarkScore.benchmark`.
 *
 * Keep this list hand-curated: a benchmark only earns a page if it has
 * meaningful search volume on its own. Most entries came from the owner's
 * reference table (2026-10-19); the MiniMax ones were added afterwards from
 * the vendor's own launch posts and model cards, which publish a wider set of
 * benchmarks than the reference table covers. The Kimi wave (2026-10-24) did
 * the same for Moonshot's K3.1 Pro launch table: eight ids for benchmarks
 * the vendor published in that table and the reference table has no place
 * for — Terminal-Bench Science 0.1, SWE-Marathon, OSWorld V2.1, BenchCAD,
 * Frontier Finance, OfficeQA Pro v2, GDP.pdf and GDPVal-AA.
 */

export type BenchmarkCategory =
  | 'reasoning'
  | 'knowledge'
  | 'coding'
  | 'agentic'
  | 'math'
  | 'security'
  | 'vision'

export interface Benchmark {
  id: string
  name: string
  category: BenchmarkCategory
  unit: ScoreUnit
  /**
   * Version of the benchmark itself, when the benchmark has one — e.g.
   * Terminal-Bench 4.0 is `"4.0"`, DeepSWE v1.1 is `"1.1"`. Two versions of
   * the same benchmark are two different numbers (a 4.0 score is not
   * comparable with a 2.1 score), so the version belongs to the benchmark,
   * not only to its slug.
   */
  version?: string
  /** One-line "what it measures", used as the /benchmarks/[slug] intro. */
  description: string
}

export const BENCHMARKS: Benchmark[] = [
  {
    id: 'vals-index',
    name: 'Vals Index',
    category: 'knowledge',
    unit: 'percent',
    description:
      'A composite over high-value knowledge work — finance, coding, legal and tax — published by Vals AI. One number for the work enterprises pay for.',
  },
  {
    id: 'gdpval-aa',
    name: 'GDPVal-AA v2.1',
    category: 'knowledge',
    unit: 'absolute',
    version: '2.1',
    description:
      'The Artificial Analysis GDPval variant: a model’s professional deliverables valued as a raw number, not a percentage. Higher means more value per task.',
  },
  {
    id: 'gdp-pdf',
    name: 'GDP.pdf',
    category: 'knowledge',
    unit: 'percent',
    description:
      'Document-understanding tasks graded against a per-document rubric, with the PDF supplied as page images plus extracted text.',
  },
  {
    id: 'gpqa-diamond',
    name: 'GPQA Diamond',
    category: 'knowledge',
    unit: 'percent',
    description: 'Graduate-level physics, chemistry and biology questions written to be Google-proof.',
  },
  {
    id: 'hle',
    name: 'HLE',
    category: 'knowledge',
    unit: 'percent',
    description: "Humanity's Last Exam — a broad frontier-knowledge set. Some models report a text-only subset (marked with an asterisk at the source).",
  },
  {
    id: 'codeforces',
    name: 'Codeforces (Rating)',
    category: 'coding',
    unit: 'rating',
    description: 'Competitive-programming Elo-style rating, not a percentage.',
  },
  {
    id: 'apex-bench-v1.1',
    version: '1.1',
    name: 'Apex Bench v1.1',
    category: 'agentic',
    unit: 'percent',
    description:
      'Apex Bench v1.1 — the evaluation column DeepSeek publishes in its V4.1-Flash announcements. Distinct from MathArena Apex: same name, different table.',
  },
  {
    id: 'matharena-apex',
    name: 'MathArena Apex',
    category: 'math',
    unit: 'percent',
    description: 'Hard competition-mathematics problems.',
  },
  {
    id: 'terminal-bench-2.1',
    version: '2.1',
    name: 'Terminal-Bench 2.1',
    category: 'agentic',
    unit: 'percent',
    description: 'End-to-end tasks completed in a real terminal environment (v2.1 task set).',
  },
  {
    id: 'terminal-bench-3.0',
    version: '3.0',
    name: 'Terminal-Bench 3.0',
    category: 'agentic',
    unit: 'percent',
    description: 'End-to-end tasks completed in a real terminal environment (v3.0 task set).',
  },
  {
    id: 'terminal-bench-4.0',
    version: '4.0',
    name: 'Terminal-Bench 4.0',
    category: 'agentic',
    unit: 'percent',
    description: 'End-to-end tasks completed in a real terminal environment (v4.0 task set).',
  },
  {
    id: 'terminal-bench-science-0.1',
    version: '0.1',
    name: 'Terminal-Bench Science 0.1',
    category: 'agentic',
    unit: 'percent',
    description:
      'Science-flavoured terminal tasks (v0.1 task set), scored on strict task-specific tests in a real shell.',
  },
  {
    id: 'swe-bench-pro',
    name: 'SWE-bench Pro',
    category: 'coding',
    unit: 'percent',
    description:
      'Long-horizon software-engineering tasks solved in a real repository, scored on held-out test suites.',
  },
  {
    id: 'swe-marathon',
    name: 'SWE-Marathon v1.1',
    version: '1.1',
    category: 'coding',
    unit: 'percent',
    description:
      'Long multi-session engineering jobs on real repositories — the model has to keep working across a whole project, not one pull request.',
  },
  {
    id: 'frontierswe-v2',
    version: '2',
    name: 'FrontierSWE v2',
    category: 'coding',
    unit: 'percent',
    description:
      'Repository-level software-engineering tasks at the frontier difficulty level — the harder sibling of DeepSWE.',
  },
  {
    id: 'deepswe-v1.1',
    version: '1.1',
    name: 'DeepSWE v1.1',
    category: 'coding',
    unit: 'percent',
    description: 'Repository-level software-engineering task resolution.',
  },
  {
    id: 'programbench',
    name: 'ProgramBench',
    category: 'coding',
    unit: 'percent',
    description: 'Program-synthesis and implementation benchmark.',
  },
  {
    id: 'nl2repo-bench',
    name: 'NL2Repo-Bench',
    category: 'coding',
    unit: 'percent',
    description: 'Natural-language-to-repository generation.',
  },
  {
    id: 'cybergym',
    name: 'CyberGym',
    category: 'security',
    unit: 'percent',
    description: 'Offensive-security capture-the-flag style tasks.',
  },
  {
    id: 'sec-bench-pro',
    name: 'SEC-Bench Pro',
    category: 'security',
    unit: 'percent',
    description: 'Security-engineering benchmark (pro tier).',
  },
  {
    id: 'exploitgym',
    name: 'ExploitGym',
    category: 'security',
    unit: 'percent',
    description: 'Exploit-development tasks.',
  },
  {
    id: 'hle-tools',
    name: 'HLE (w/tools)',
    category: 'knowledge',
    unit: 'percent',
    description: 'HLE run with tool access enabled.',
  },
  {
    id: 'automation-bench',
    name: 'Automation-Bench',
    category: 'agentic',
    unit: 'percent',
    description: 'Multi-step automation and workflow tasks.',
  },
  {
    id: 'osworld-2.0',
    version: '2.0',
    name: 'OSWorld-2.0',
    category: 'agentic',
    unit: 'percent',
    description:
      'Computer-use tasks driven through a real desktop — scored as a partial score on the offline subset.',
  },
  {
    id: 'osworld-2.1',
    version: '2.1',
    name: 'OSWorld V2.1',
    category: 'agentic',
    unit: 'percent',
    description:
      'Computer-use tasks driven through a real desktop (v2.1 task set) — a different task set from OSWorld-2.0, so the two numbers are not interchangeable.',
  },
  {
    id: 'chartography',
    name: 'Chartography',
    category: 'vision',
    unit: 'percent',
    description:
      'Chart and figure understanding without tools. The tool-assisted run is a separate entry (chartography-tools); the numbers are not interchangeable.',
  },
  {
    id: 'graphwalks',
    name: 'GraphWalks',
    category: 'reasoning',
    unit: 'percent',
    description:
      'Multi-hop traversal of a synthetic knowledge graph, scored as F1. The published score is the 256k–1M-token band — the one that stresses a long context.',
  },
  {
    id: 'cwe-bench-v1',
    version: '1',
    name: 'CWE-bench v1',
    category: 'security',
    unit: 'percent',
    description:
      'Remediating real vulnerabilities: the model has to find and patch the flaw, not just describe it.',
  },
  {
    id: 'agents-last-exam',
    name: "Agents' Last Exam",
    category: 'agentic',
    unit: 'percent',
    description: 'Long-horizon agentic task benchmark.',
  },
  {
    id: 'browsecompc',
    name: 'BrowseComp',
    category: 'agentic',
    unit: 'percent',
    description: 'Hard fact-seeking browsing tasks that need many retrieval steps to answer.',
  },
  {
    id: 'mcp-atlas',
    name: 'MCP Atlas',
    category: 'agentic',
    unit: 'percent',
    description: 'Tool selection and multi-step use of Model Context Protocol servers.',
  },
  {
    id: 'bankertoolbench',
    name: 'BankerToolBench',
    category: 'agentic',
    unit: 'percent',
    description: 'Multi-step finance work that chains document, spreadsheet and market-data tools.',
  },
  {
    id: 'officeqa-pro-v2',
    name: 'OfficeQA Pro v2',
    version: '2',
    category: 'agentic',
    unit: 'percent',
    description:
      'Financial-document analysis over a full PDF corpus — retrieval, cross-document checking and multi-step numeric reasoning, graded per question.',
  },
  {
    id: 'frontier-finance',
    name: 'Frontier Finance',
    category: 'agentic',
    unit: 'percent',
    description:
      'The whole investment workflow — screening candidates through to profitability analysis — on an official market-data agent harness.',
  },
  {
    id: 'chartography-tools',
    name: 'Chartography (w/tools)',
    category: 'vision',
    unit: 'percent',
    description: 'Chart and figure understanding, tool-assisted.',
  },
  {
    id: 'babyvision-tools',
    name: 'BabyVision (w/tools)',
    category: 'vision',
    unit: 'percent',
    description: 'Visual perception benchmark, tool-assisted.',
  },
  {
    id: 'benchcad',
    name: 'BenchCAD',
    category: 'vision',
    unit: 'percent',
    description:
      'Rebuilding a 3D model from multi-view renderings by generating CAD code. We track the tool-assisted run of it.',
  },
  {
    id: 'zerobench-main-tools',
    name: 'ZeroBench-main (w/tools)',
    category: 'vision',
    unit: 'percent',
    description: 'Vision benchmark ZeroBench main split, tool-assisted.',
  },
]

export function findBenchmark(id: string): Benchmark | undefined {
  return BENCHMARKS.find((b) => b.id === id)
}

/**
 * The version to print *next to* a benchmark's name, or `null` when the name
 * already carries it.
 *
 * Every versioned benchmark's display name says its own version — "DeepSWE
 * v1.1", "Terminal-Bench 4.0", "GDPVal-AA v2.1" — because that is how a
 * reader names the test. The `version` field stays in the registry: it is
 * metadata (it keeps two editions of one benchmark apart in a join, a sort
 * and a test), not a second thing to say. A page that printed both
 * unconditionally read "DeepSWE v1.1 1.1"; this helper is the one place
 * that decides, so no component can make the name stutter again.
 */
export function benchmarkVersionSuffix(
  benchmark: Pick<Benchmark, 'name' | 'version'>,
): string | null {
  if (!benchmark.version) return null
  const wants = versionTokens(benchmark.version)
  if (wants.length === 0) return benchmark.version
  const carried = versionTokens(benchmark.name)
  // Whole-token equality, never substring, never a dynamic regex. "v2" is a
  // token of "Foo v2.1" only as part of "2.1"; the name must carry "2"
  // *itself* for the version to count as already said.
  return wants.every((token) => carried.includes(token)) ? null : benchmark.version
}

/**
 * Every version token inside a string, in order.
 *
 * A token is a maximal run of digits and dots, with the trailing dot of a
 * sentence and the stray dots of a punctuation mark dropped: `"v1.1."`
 * yields `["1.1"]`, `"V2.1"` yields `["2.1"]`, `"OSWorld-2.0"` yields
 * `["2.0"]`. Two token lists are compared as strings, so the check that a
 * name already says its version is a plain `includes`, not a regex test —
 * a `new RegExp(dynamicVersion)` "does this substring occur anywhere"
 * check is what let "DeepSWE v1.1." print "DeepSWE v1.1. 1.1", because the
 * `[^0-9.]` boundary after the version refused to accept a trailing dot.
 */
function versionTokens(text: string): string[] {
  return text
    .match(/\d+(?:\.\d+)*/g)
    ?.map((token) => token.replace(/\.+$/, ''))
    .filter((token) => token.length > 0) ?? []
}

/**
 * A benchmark's one-line description in the reader's language.
 *
 * The English sentence is the registry's own (`Benchmark.description`); the
 * Chinese one is a hand-written counterpart in
 * `benchmark-descriptions.zh.ts`. A Chinese page printing the English
 * sentence duplicated its hreflang twin and told a Chinese reader nothing —
 * which is what the second-round audit found on 17 indexable zh pages.
 */
export function benchmarkDescription(
  benchmark: Pick<Benchmark, 'id' | 'description'>,
  locale: Locale,
): string {
  if (locale === 'zh') return BENCHMARK_DESCRIPTIONS_ZH[benchmark.id] ?? benchmark.description
  return benchmark.description
}
