import type { ScoreUnit } from './types'

/**
 * Benchmark registry. Ids are the slugs used in `/benchmarks/[slug]` and as
 * the join key on every `BenchmarkScore.benchmark`.
 *
 * Keep this list hand-curated: a benchmark only earns a page if it has
 * meaningful search volume on its own. Everything here came from the owner's
 * reference table (2026-10-19), not from independent scraping yet.
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
  /** One-line "what it measures", used as the /benchmarks/[slug] intro. */
  description: string
}

export const BENCHMARKS: Benchmark[] = [
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
    id: 'matharena-apex',
    name: 'MathArena Apex',
    category: 'math',
    unit: 'percent',
    description: 'Hard competition-mathematics problems.',
  },
  {
    id: 'terminal-bench-2.1',
    name: 'Terminal-Bench 2.1',
    category: 'agentic',
    unit: 'percent',
    description: 'End-to-end tasks completed in a real terminal environment (v2.1 task set).',
  },
  {
    id: 'terminal-bench-3.0',
    name: 'Terminal-Bench 3.0',
    category: 'agentic',
    unit: 'percent',
    description: 'End-to-end tasks completed in a real terminal environment (v3.0 task set).',
  },
  {
    id: 'terminal-bench-4.0',
    name: 'Terminal-Bench 4.0',
    category: 'agentic',
    unit: 'percent',
    description: 'End-to-end tasks completed in a real terminal environment (v4.0 task set).',
  },
  {
    id: 'deepswe-v1.1',
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
    id: 'agents-last-exam',
    name: "Agents' Last Exam",
    category: 'agentic',
    unit: 'percent',
    description: 'Long-horizon agentic task benchmark.',
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
