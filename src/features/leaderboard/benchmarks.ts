import type { ScoreUnit } from './types'

/**
 * Benchmark registry. Ids are the slugs used in `/benchmarks/[slug]` and as
 * the join key on every `BenchmarkScore.benchmark`.
 *
 * Keep this list hand-curated: a benchmark only earns a page if it has
 * meaningful search volume on its own. Most entries came from the owner's
 * reference table (2026-10-19); the MiniMax ones were added afterwards from
 * the vendor's own launch posts and model cards, which publish a wider set of
 * benchmarks than the reference table covers.
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
      'A composite over high-value knowledge work — finance, coding, legal and tax — published by Vals AI. One number for "how good is this model at the work enterprises actually pay for".',
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
      'Apex Bench v1.1 — the evaluation column DeepSeek publishes in its own V4.1-Flash announcements. Distinct from MathArena Apex: same name, different table, never interchangeable.',
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
    id: 'swe-bench-pro',
    name: 'SWE-bench Pro',
    category: 'coding',
    unit: 'percent',
    description:
      'Long-horizon software-engineering tasks solved in a real repository, scored on held-out test suites.',
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
    id: 'chartography',
    name: 'Chartography',
    category: 'vision',
    unit: 'percent',
    description:
      'Chart and figure understanding without tools. The tool-assisted run of the same family is a separate entry ("chartography-tools") and the two numbers are not interchangeable.',
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
