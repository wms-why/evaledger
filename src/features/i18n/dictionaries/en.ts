import { hub } from './hub'
import { linking } from './linking'
import { calc } from './calc'
import { landing } from './landing'
import { site } from './site'

export const en = {
  common: { appName: 'EvalLedger', toggleTheme: 'Toggle theme', language: 'Language' },
  home: {
    title: 'EvalLedger — Free LLM Token Cost Calculator',
    calculatorTitle: 'Token Cost Calculator — Compare Every LLM',
    openrouterTitle: 'OpenRouter Pricing Calculator with Markup',
    claudeTitle: 'Claude Token Cost Calculator — Cost per Token',
    deepseekTitle: 'DeepSeek API Pricing — V4 & V3 Per-Token Rates',
    chatgptTitle: 'ChatGPT API Pricing — GPT-6 & 5.6 Rates',
    greeting: 'Hello, {name}!',
  },
  leaderboard: {
    navBoard: 'Leaderboard',
    navCompare: 'Compare',
    navCalculator: 'Token Calculator',
    navHistory: 'Leaderboard history',
    navBenchmarks: 'Benchmarks',
    navBest: 'Best models',
    perMonth: '/mo',
    colRank: '#',
    colModel: 'Model',
    colScore: 'Score',
    colPrice: 'Price /1M',
    colObserved: 'Observed',
    sourceVerified: 'Source · verified {date}',
    vendorClaude: 'Anthropic',
    vendorOpenai: 'OpenAI',
    vendorGoogle: 'Google',
    vendorGrok: 'xAI',
    vendorDeepseek: 'DeepSeek',
    vendorMinimax: 'MiniMax',
    vendorStepfun: 'StepFun',
    vendorGlm: 'Zhipu',
    vendorKimi: 'Moonshot',
    modelSelect: {
      search: 'Search models or vendors…',
      empty: 'No models found',
      exhausted: 'No models left to add',
    },
    home: {
      // The title carries the brand and the three things the page actually
      // answers: the benchmark scores, the ranking, and the API price.
      title: 'LLM Leaderboard: Benchmarks & API Prices | EvalLedger',
      metaDescription:
        'Compare {n} LLMs on GPQA, HLE, DeepSWE and more — benchmark scores next to per-token API price. One table, one source of truth, updated by hand.',
      h1: 'LLM Leaderboard: Compare AI Models by Benchmark and Price',
      updated: 'Updated',
      positioning:
        'Every score here is traceable to a named source, and every price to a provider page. No interpolation, no marketing charts — just the numbers you can defend.',
      compareTitle: 'Compare multiple models',
      compareBody:
        'Shortlist up to five models and compare them side by side: benchmark deltas, blended price per million tokens, context window, and a monthly cost estimate for your usage. Drag them to reorder the columns.',
      compareCta: 'Compare LLM benchmarks & prices →',
      browse: 'Browse',
    },
    compare: {
      title: 'Compare LLMs',
      metaDescription:
        'Compare up to five LLMs side by side — benchmark scores, per-token price, context window, and a monthly cost estimate for your usage.',
      pairMetaDescription:
        'How {a} and {b} compare on benchmarks and price — scores, context window, and what a month of your usage would cost.',
      techKicker: 'Head to head',
      vs: 'vs',
      planKicker: 'Buying guide',
      ecosystemKicker: 'Capability matrix',
      ecosystemTitle: 'which ecosystem fits',
      ecosystemNote:
        'Raw benchmark parity rarely decides the pick — tooling, open weights, and provider reliability usually do.',
      whichToBuy: 'which should you use?',
      selectedModels: 'Selected models',
      addModel: 'Add model',
      maxReached: 'Max {max} models',
      removeModel: 'Remove {model}',
      reorderModel: 'Reorder {model}',
      reorderHint: 'Drag a grip to reorder the columns, or press ← / → on a focused grip.',
      modelCount: '{count} / {max} models',
      scoreItems: 'Score items',
      scoreCount: '{count} / {total} selected',
      scorePickerHint:
        'Click a score to show or hide its row; hover a table row to remove it.',
      selectAllScores: 'Select all',
      clearScores: 'Clear',
      showAllScores: 'Show all',
      removeScore: 'Remove {benchmark}',
      noScoresSelected: 'No score items selected — add one above to show its benchmark row.',
      dimension: 'Dimension',
      price: 'Blended price',
      fullPrice: 'Full price',
      context: 'Context window',
      openWeights: 'Open weights',
      coverage: 'Benchmarks covered',
      input: 'Input',
      output: 'Output',
      cached: 'Cached input',
      blended: 'Blended /1M',
      leads: '{model} leads',
      cheaperNote: '{model} is the cheaper option per blended million tokens.',
      pickIf: 'Pick {n} if',
      pickReasonA:
        'You need the highest benchmark scores and can absorb the higher per-token price.',
      pickReasonB:
        'You are optimizing for cost at scale and your workloads tolerate the score gap.',
      costTitle: 'What your usage would cost',
      costSubtitle: 'Adjust the monthly volume — every model recomputes instantly.',
      callsPerMonth: 'Requests per month',
      inputTokens: 'Input tokens / request',
      outputTokens: 'Output tokens / request',
      costNote:
        'Estimates use list prices and ignore cached input, batch discounts, and off-peak rates.',
      runUsageFor: 'Run {model} usage',
      popularTitle: 'Popular comparisons',
      summarySeparator: '; ',
      summaryTerminator: '.',
      summarySplit: '{a} and {b} split the {n} shared benchmarks',
      summaryLeads: '{model} leads on {wins} of {total} shared benchmarks',
      summaryCheaper: '{model} is ~{pct}% cheaper per blended million tokens',
      summaryNone:
        '{a} and {b} have no overlapping benchmarks or price difference to compare',
      summaryMultiLeads:
        '{model} leads on {wins} of {total} shared benchmarks across {count} models',
      summaryMultiTie: '{models} tie at {wins} of {total} shared benchmarks',
      summaryCheapest:
        '{model} has the lowest blended price at {price} per million tokens, ~{pct}% below {dearer}',
      summaryMultiNone: 'Not enough shared benchmark or price data to rank these models',
    },
    model: {
      metaTitleSuffix: 'Benchmarks & Token Pricing',
      metaDescription:
        '{model} benchmark scores and per-token API pricing, plus how it compares to the other frontier models.',
      released: 'Released',
      updated: 'Updated',
      scores: 'Benchmark scores',
      noScores: 'No verified benchmark scores for this model yet.',
      pricing: 'Pricing',
      runUsage: 'Run your usage',
      related: 'Comparisons',
    },
    benchmark: {
      kicker: 'Benchmark',
      metaTitleSuffix: 'Leaderboard',
      scores: 'Model scores',
      historyLink: 'Score history',
    },
    history: {
      title: 'Score history',
      metaDescription:
        'How a benchmark leaderboard has changed over time — every snapshot, plus overwritten scores.',
      intro:
        'Benchmark scores get restated when harnesses change or models are re-run. This page keeps the trail instead of quietly overwriting it.',
      timeline: 'Timeline',
      empty: 'No historical snapshots recorded yet — the current scores are shown below.',
      snapshots: '{n} snapshots recorded.',
      snapshotTable: 'Current snapshot',
      overwritten: 'Overwritten scores',
      overwrittenEmpty: 'Nothing has been overwritten yet.',
      supersededOn: 'superseded on',
    },
    historyPage: {
      title: 'Leaderboard history',
      metaDescription:
        'The archive of LLM leaderboard changes — per-benchmark leaders today and every score that has since been overwritten.',
      intro:
        'Leaderboards move. This is the archive: who leads each core benchmark right now, and which earlier scores have been replaced.',
      timeline: 'Current leaders by benchmark',
      topNow: 'top 3 now',
      overwritten: 'Overwritten scores',
      source:
        'Scores are collected from named primary sources; see each model page for the exact citation.',
    },
    best: {
      kicker: 'Best models',
      metaDescription:
        'Best LLMs by use case — Chinese models, open weights, and coding — ranked on the benchmarks that actually measure the job.',
      scoredOn: 'Scored on',
      fullBoard: 'See the full leaderboard',
      // Every category carries its OWN meta description. One shared sentence
      // across eight pages told a crawler they were the same page; the
      // description is the line that has to name what THIS page answers.
      'chinese-model': {
        title: 'Best Chinese LLMs',
        intro:
          'DeepSeek, GLM, and Kimi ranked on reasoning, agentic coding, and automation benchmarks.',
        metaDescription:
          'Best Chinese LLMs (DeepSeek, GLM, Kimi) ranked on GPQA Diamond, HLE, DeepSWE and automation benchmarks — with the API price of each one.',
      },
      'open-source': {
        title: 'Best open-weight LLMs',
        intro:
          'Models you can self-host or route through any provider, ranked on coding and automation benchmarks.',
        metaDescription:
          'Best open-weight LLMs you can self-host or route through any provider, ranked on DeepSWE, NL2Repo and automation benchmarks — with API prices.',
      },
      'for-coding': {
        title: 'Best LLMs for coding',
        intro:
          'Ranked on real repository tasks, program synthesis, and command-line agent benchmarks.',
        metaDescription:
          'Best LLMs for coding, ranked on DeepSWE, ProgramBench, NL2Repo and Terminal-Bench — the models that clear every coding benchmark, with their API price.',
      },
      // The two capability boards that had no long-tail page of their own.
      // Their benchmark sets are the board's own core, so the page and the
      // board rank the same models — the page just answers the search
      // ("best LLM for agents") instead of the board's question.
      'for-agents': {
        title: 'Best LLMs for AI agents & tool use',
        intro:
          'Ranked on terminal tasks, long-horizon tool use, and automation — the benchmarks that measure work a model does in a real environment, not a chat window.',
        metaDescription:
          'Best LLMs for coding agents and tool use, ranked on Terminal-Bench 4.0, Agent\'s Last Exam and automation benchmarks — with the API price of each.',
      },
      'for-reasoning': {
        title: 'Best LLMs for reasoning & math',
        intro:
          'Ranked on frontier knowledge, hard competition mathematics, and long-horizon graph traversal — the benchmarks that isolate deduction from recall.',
        metaDescription:
          'Best LLMs for reasoning and math, ranked on GPQA Diamond, HLE and MathArena Apex — the models that clear every reasoning benchmark, with API prices.',
      },
      // The three attribute-ranked pages. Not boards: a price, a context
      // window and a cache discount are not scores, so they sort by their own
      // number and carry no coverage gate.
      'cheapest-llms': {
        title: 'Cheapest LLM APIs per million tokens',
        intro:
          'Every model we price, ordered by blended price per million tokens — input plus output divided by two, at the rate actually in force today.',
        metaDescription:
          'Cheapest LLM API pricing per million tokens — every model we price, ordered by blended input/output rate, with the cached-input rate and context window of each.',
      },
      '1m-context-window': {
        title: 'Best long-context LLMs — 1M tokens and up',
        intro:
          'Only the models whose context window actually reaches one million tokens, largest window first, with the rate each one charges.',
        metaDescription:
          'Best long-context LLMs — the models with a 1M token context window and up, largest window first, with the price per million tokens each one charges.',
      },
      'prompt-caching': {
        title: 'Best LLMs for prompt caching discounts',
        intro:
          'Ordered by the discount a cached-input rate gives against the same model’s uncached input rate. A model that publishes no cached rate is not listed — there is no honest discount to show.',
        metaDescription:
          'Best LLM prompt caching discounts — ranked by how much each model’s cached-input rate saves against its own uncached input price, with the rates side by side.',
      },
      'cheapest-coding': {
        title: 'Cheapest LLMs for coding',
        intro:
          'The models that clear every benchmark on our coding board, ordered by blended price per million tokens. A model we never measured on all of them is not listed.',
        metaDescription:
          'Cheapest LLM API for coding — the models that clear every coding benchmark (DeepSWE, ProgramBench, NL2Repo, Terminal-Bench), ordered by price.',
      },
    },
    tokenCalculator: {
      title: 'Token Calculator — Price Any LLM Prompt',
      metaDescription:
        'Paste a prompt or enter your usage and see the cost across every model in the leaderboard. Real tokenizer for OpenAI, accurate estimates for the rest.',
      h1: 'Token Calculator',
      subtitle:
        'Cost any prompt across every model on the leaderboard — paste text or enter your monthly usage.',
    },

    // ── Scoring tracks ──────────────────────────────────────────────────
    // Four capability boards. Each states its own formula, weights and scope;
    // nothing here is shared between boards, so a score can never leak across.
    tracks: {
      general: {
        label: 'General intelligence',
        scope:
          'Broad academic and frontier knowledge. It deliberately excludes coding and agent benchmarks, so a model strong at reasoning is not penalised for being weaker at editing files.',
        formula:
          'The weighted mean of GPQA Diamond (weight 1) and HLE (weight 2), each rescaled against the best score any model has recorded on that benchmark. A model missing either benchmark is not ranked.',
      },
      coding: {
        label: 'Coding',
        scope:
          'Repository-level software engineering: real issue resolution, program synthesis and natural-language-to-repository generation.',
        formula:
          'The weighted mean of DeepSWE v1.1 (weight 2), NL2Repo-Bench (weight 1) and ProgramBench (weight 1), each rescaled against the best score any model has recorded on that benchmark. A model missing any of the three is not ranked.',
      },
      agent: {
        label: 'Agent',
        scope:
          'Long-horizon tool use — terminal tasks, multi-step automation and work that has to survive contact with a real environment.',
        formula:
          'The weighted mean of Terminal-Bench 4.0 (weight 2), Agents’ Last Exam (weight 1) and Automation-Bench (weight 1), each rescaled against the best score any model has recorded on that benchmark. A model missing any of the three is not ranked.',
      },
      reasoning: {
        label: 'Reasoning',
        scope:
          'Deliberate multi-step problem solving under hard evaluation: frontier knowledge, competition mathematics and long-horizon graph traversal.',
        formula:
          'The weighted mean of GPQA Diamond (weight 1), HLE (weight 1) and MathArena Apex (weight 2), each rescaled against the best score any model has recorded on that benchmark. A model missing any of the three is not ranked.',
      },
    },
    track: {
      nav: 'Capability boards',
      title: '{track} leaderboard',
      metaDescription:
        'Models ranked on {track}, with the formula, the weights and the source of every score. Only models measured on every core benchmark are ranked.',
      intro:
        'A model is ranked here only if it published a score for every benchmark this board scores on. Models that were not measured on all of them are listed below, marked as untested — never averaged over the benchmarks they happen to have.',
      formulaTitle: 'How this board is scored',
      weightsTitle: 'Weights',
      scopeTitle: 'What this board measures',
      benchmarksTitle: 'Benchmarks in this board',
      contextTitle: 'Reported here but not scored',
      contextNote:
        'These benchmarks are published for this model but carry no weight in this board’s score.',
      normalizationTitle: 'Normalization',
      normalizationNote:
        'Raw scores are not comparable across benchmarks — 90% on one test and 90% on another are not the same achievement. Each benchmark is therefore rescaled against the best score any model has recorded on it, so 100 always means "the best result anyone has published on this benchmark".',
      fieldBest: 'Best recorded',
      fieldBestHeldBy: 'held by {model}',
      composite: 'Composite',
      coverage: 'Coverage',
      coverageFull: 'All {n} benchmarks',
      coveragePartial: '{n} of {total} scored',
      untested: 'Not tested',
      untestedHint: 'This model has no published score for that benchmark, so it is not counted as zero — it simply has not been measured.',
      notRanked: 'Not ranked on this board',
      notRankedReason: 'Missing a score for {benchmarks}',
      notRankedReasonOne: 'Missing a score for {benchmark}',
      allModels: 'All {n} models',
      rankedModels: '{n} models ranked',
      unrankedModels: '{n} not ranked',
      sourceTitle: 'Where these scores come from',
      sourceVendor: 'Vendor-reported',
      sourceThirdParty: 'Third-party evaluation',
      sourceReference: 'Reference table',
      sourceNote:
        'A score published by the vendor is the vendor’s own harness. A third-party score is measured on someone else’s infrastructure, which is why the two are not interchangeable.',
      observedAt: 'Measured',
      testConfig: 'Test configuration',
      sampleConditions: 'Sample conditions',
      version: 'Version',
      compareAll: 'Compare all boards',
      pick: 'Pick a board',
      rankTitle: 'Ranked models',
      noRankedModels: 'No model has been measured on every benchmark of this board yet.',
    },
    custom: {
      title: 'Custom weights',
      intro:
        'Weight what matters to you and the board re-ranks itself. A model that was never measured on one of your weighted boards cannot be scored on it, so it drops out of this ranking rather than being averaged over the benchmarks it happens to have.',
      price: 'Price',
      score: 'Custom score',
      priceAxis: 'Price index',
      notRanked: 'Not ranked on your weights',
      noPrice: 'No published price',
      note: 'The price axis is logarithmic, so the cheapest model in the field scores 100 and the most expensive scores 0.',
    },
    methodology: {
      title: 'How we score',
      metaDescription:
        'The exact formula and weights behind every EvalLedger leaderboard — what a composite score means, what it excludes, and why a missing score is never a zero.',
      intro:
        'A leaderboard is only as trustworthy as its arithmetic. This is the whole of ours: every board, its weights, and what it leaves out. Each number’s provenance — the page it was read from — lives on the data quality page.',
      why: 'Why a missing score is never a zero',
      whyBody:
        'Averaging over the benchmarks a model happens to have scored flatters thin models: drop the two hardest tests and your average rises. So no board on this site averages over a partial set. A model that was not measured on every benchmark of a board is not ranked on it — it is listed as untested, and the benchmarks it is missing are named.',
      weights: 'Weights',
      benchmark: 'Benchmark',
      weight: 'Weight',
      best: 'Best recorded',
      source: 'Source',
      scope: 'Scope',
      formula: 'Formula',
      boards: 'The boards',
      boardsNote: 'Each board is scored on its own benchmarks, with its own weights. A model needs a complete set for that board to be ranked on it.',
      sourcesLink: 'Where the numbers come from',
      updates: 'How the data is kept honest',
      updatesNote:
        'Prices carry the date they were last checked against the provider’s page. Scores carry the date they were observed and the caveat the source printed with them. Corrections are logged rather than quietly applied, and you can report a number that looks wrong.',
      reportIssue: 'Report a data problem',
    },

    // ── Price breakdown ─────────────────────────────────────────────────
    // Every price is broken into its parts, so a reader can tell which
    // number they are looking at and where it came from.
    price: {
      title: 'Price breakdown',
      input: 'Input',
      output: 'Output',
      cached: 'Cached input',
      perMillion: 'per 1M tokens',
      provider: 'Provider',
      channel: 'Channel',
      channelOfficial: 'Official API',
      channelAggregator: 'Third-party router',
      channelNote:
        'The price above is the vendor’s own API price. A third-party router resells the same model at its own rate, which is listed separately.',
      tier: 'Pricing tier',
      tiers: 'Available tiers',
      tiersNote:
        'The rate that actually applies depends on how you call the API: a batch request, a long prompt, or peak hours can all cost differently.',
      tierStandard: 'Standard',
      tierBatch: 'Batch',
      tierLongContext: 'Long context',
      tierPriority: 'Priority',
      tierFlex: 'Flex',
      tierPeak: 'Peak hours',
      tierOffPeak: 'Off-peak hours',
      tierCacheRead: 'Cache read',
      tierCacheWrite: 'Cache write',
      lastVerified: 'Last verified',
      verifiedOn: 'Verified {date}',
      source: 'Price source',
      currentRate: 'Current rate',
      effectiveFrom: 'From {date}',
      effectiveUntil: 'until {date}',
      promoActive: 'Promotional rate',
      nextChange: 'Next change',
      changesOn: 'From {date}',
      note: 'Note',
      noTier: 'No alternative tier published for this model.',
    },
  },
  changelog: {
    title: 'Changelog',
    subtitle: 'Product updates and improvements.',
    metaDescription:
      'Every EvalLedger release, in order: what changed in the price and score registries, which pages were added, and which benchmark or model coverage moved.',
  },
  dataQuality: {
    title: 'Data quality',
    metaDescription:
      'The price and score of every model we track: how fresh each one is, where it was read from, and what changed. Report anything that looks wrong.',
    intro:
      'Anyone can show the same numbers. What separates a source you can check from one you cannot is whether it keeps showing its work. This is our work: when each price was last verified, when each score was measured, which harness produced it, and what moved since the last version. This page covers the models on our leaderboards — one row per model, with its price, its scores and the pages they were read from.',
    summary: {
      title: 'At a glance',
      modelCount: 'Models tracked',
      priceRows: 'Prices of the tracked models',
      freshPrices: 'Verified recently',
      stalePrices: 'Due for re-verification',
      unverifiedPrices: 'No source',
      scoreRows: 'Scores recorded',
      vendorReportedScores: 'Vendor-reported',
      thirdPartyScores: 'Third-party',
      referenceTableScores: 'From a reference table',
      freshScoreSets: 'Score sets measured recently',
      staleScoreSets: 'Score sets due for re-measurement',
      undatedScoreSets: 'Score sets with no measurement date',
      completeModelCount: 'Models with a complete score set',
    },
    sources: {
      title: 'Where the numbers come from',
      note:
        'Every score links to the page it was read from, grouped by who measured it — a vendor’s own harness and an independent evaluation are not the same measurement.',
      colSource: 'Source',
      colKind: 'Measured by',
      colScores: 'Scores',
    },
    col: {
      model: 'Model',
      price: 'Price',
      scores: 'Scores',
      changes: 'Changes since the previous version',
      tracks: 'Boards',
    },
    fresh: 'Verified',
    stale: 'Due for re-check',
    unknown: 'No source',
    freshHint: 'Checked against the provider’s own pricing page within the last 14 days.',
    staleHint:
      'The last check is more than 14 days old. The price is probably still right, but we have not confirmed it against the provider’s page since.',
    unknownHint: 'This row has no source URL, so nothing about it can be verified.',
    scoreFresh: 'Measured recently',
    scoreStale: 'Due for re-measurement',
    scoreUnknown: 'No measurement date',
    scoreFreshHint:
      'Every score of this model was measured within 14 days of the registry snapshot.',
    scoreStaleHint:
      'The oldest measurement of this model is more than 14 days before the registry snapshot. The number is probably still right, but we have not re-read the source since.',
    scoreUnknownHint:
      'These scores carry no usable observation date, so how old they are cannot be known.',
    changes: {
      none: 'No change',
      priceUp: 'Price up',
      priceDown: 'Price down',
      scoreUp: 'Score up',
      scoreDown: 'Score down',
      same: 'Unchanged',
    },
    tracks: {
      complete: 'Scored on every benchmark',
      missing: 'Not measured on every benchmark',
    },
    report: {
      title: 'Report a data problem',
      intro:
        'Found a price that has moved, a version that is wrong, or two scores that contradict each other? Tell us and we will check it against the source.',
      signInTitle: 'Sign in to send a report',
      signInBody:
        'Reports are filed from an account, so you can edit or withdraw yours until we triage it — and so we can tell you when the problem is fixed.',
      signInPointModel: 'Which model is affected',
      signInPointDetail: 'What the page says and what the source says',
      signInPointSource: 'The URL you checked',
      signInCta: 'Sign in to report',
      signInNote: 'Takes a few seconds with Google.',
      model: 'Model',
      modelOptional: 'Which model? (optional)',
      kind: 'What is wrong?',
      kindStalePrice: 'The price looks stale or wrong',
      kindWrongVersion: 'The version is wrong',
      kindInconsistentScore: 'Two scores contradict each other',
      kindOther: 'Something else',
      detail: 'What did you find?',
      detailPlaceholder:
        'What the page says, what the source says, and the URL you checked.',
      sourceUrl: 'Source URL (optional)',
      submit: 'Send report',
      submitting: 'Sending…',
      success: 'Thank you — the report is in. We check every one against the source.',
      successHint: 'You can edit or withdraw it under My reports until we triage it.',
      filedFrom: 'Filed from {email}',
      myReports: 'My reports',
      authExpired:
        'Your session expired — sign in and send this report again. Your draft is still here.',
      invalid: 'Add a short description of what is wrong.',
      error: 'The report could not be sent. Please try again.',
      rateLimited: 'Too many reports from this address. Please try again later.',
      limit: 'You have {n} open reports — wait for triage before filing more.',
      fileAnother: 'File another report',
      back: 'Back to the data quality report',
    },
  },
  releases: {
    nav: 'Model Releases',
    title: 'Model Releases',
    // One post = one launch. The title is the subject plus the page's job;
    // the full article headline stays the H1.
    metaTitle: '{model}: launch analysis',
    metaDescription:
      'Every model launch as a cost-and-switch analysis: live prices, verified scores, and whether the new model is worth switching to.',
    subtitle:
      'Every major model launch, rewritten as a cost-and-switch analysis. The prices and scores on each page are pulled live from the provider pages, not copied into the article.',
    kicker: 'Model release',
    publishedOn: 'Published',
    releasedOn: 'Released',
    checkedOn: 'Prices checked',
    source: 'Source',
    sourceNote: 'Source re-checked on {date}.',
    sourcePrice: '{name} pricing comes from the provider page linked in the table above.',
    readMore: 'Read the analysis',
    empty: 'No release analyses published yet.',
    scoreCount: '{n} benchmarks tracked',
    noScores: 'No verified scores yet',
    pendingBadge: 'Pre-release',
    pendingTitle: 'Not released yet',
    pendingNote:
      'The vendor has shown this model, but has published no price, no benchmark set and no API model id. So this page carries no price table and no score table — we publish neither until the numbers are real. When the model ships, this page is updated in place with the live figures.',
    priceTitle: 'What it costs',
    priceNote:
      'USD per 1M tokens, read live from the provider pricing page — so this table can never go stale.',
    colModel: 'Model',
    colInput: 'Input',
    colOutput: 'Output',
    colCached: 'Cached',
    colContext: 'Context',
    colVs: 'Output vs subject',
    colBenchmark: 'Benchmark',
    statusActive: 'Active',
    statusLegacy: 'Legacy',
    statusRetired: 'Retired',
    costTitle: 'What your usage would cost',
    costNote: '1M input + 500K output tokens per month, at list price.',
    costBreakdown: '{input} input + {output} output',
    // The label of the standard-rate tile when the provider also publishes an
    // off-peak rate. Without it the tile would repeat the section heading and
    // the reader could not tell which of the two tiles is the peak.
    costPeak: 'Peak hours',
    costOffPeak: 'Off-peak hours',
    costOffPeakNote: 'The same workload scheduled outside this provider’s peak window.',
    scoreTitle: 'How it scores',
    scoreEmpty:
      'We have not verified a benchmark set for this model yet — so we do not publish one. Numbers we cannot trace do not belong on this site.',
    scoreNote:
      'Transcribed from the sources named on each leaderboard entry. Coverage differs per model; a missing cell means the source did not report that benchmark.',
    scoreLegend:
      'The tinted column is the model this post is about. A bold figure is the highest score recorded on that benchmark among the models in this table — a tie is left unmarked.',
    subjectBadge: 'this model',
    ctaTitle: 'Run the numbers yourself',
    ctaNote: 'The tables above are the same data the calculator and the comparison tool use.',
    ctaCompare: 'Compare it head to head',
    ctaCalculator: 'Price your own usage',
    ctaModel: 'See the full model page',
    ctaSeries: 'Compare every {series} version',
    backToIndex: 'All model releases',
    relatedTitle: 'More release analyses',
  },
  series: {
    nav: 'Version series',
    indexTitle: 'Model version series',
    indexKicker: 'Every line, version by version',
    indexIntro:
      'Every version of one vendor line, newest first: what the latest one changed, whether the older ones are still worth running, and what each one costs.',
    indexMetaDescription:
      'Every version of a model line side by side — Claude Opus, GPT-6, Gemini 3 and more: token prices, context window, benchmark scores and monthly cost.',
    pageTitle: '{series} versions compared',
    pageMetaTitle: '{series} versions compared',
    pageMetaDescription:
      'Every {series} version in one table: input, output and cached prices, context window, benchmark scores, and what a month of your usage costs on each one.',
    ladderTitle: 'Every {series} version in one table',
    ladderSubtitle:
      'Prices are read live from the provider pricing pages, so this table cannot go stale.',
    jsonLdName: '{series} versions',
    pairLadderTitle: 'The two versions side by side',
    pairLinksTitle: 'Compare two versions of {series}',
    ladderNote:
      'Sample cost = 1M input + 500K output tokens per month at list price. A model with a long-context band is priced on that band — the rule is printed in the row. Use the calculator below for your own workload.',
    colVersion: 'Version',
    colTier: 'Tier',
    colStatus: 'Status',
    colReleased: 'Released',
    colInput: 'Input',
    colOutput: 'Output',
    colCached: 'Cached',
    colContext: 'Context',
    colBlended: 'Blended /1M',
    colSampleCost: 'Sample /mo',
    versionCount: '{n} versions',
    statusActive: 'Active',
    statusLegacy: 'Legacy',
    statusRetired: 'Retired',
    tierFlagship: 'Flagship',
    tierBalanced: 'Balanced',
    tierFast: 'Fast',
    tierLite: 'Lite',
    latestTag: 'Latest',
    cheapestTag: 'Cheapest',
    verdictTitle: 'The short version',
    verdictCheaper: '{newer} costs {pct}% less than {older} per output token',
    verdictPricier: '{newer} costs {pct}% more than {older} per output token',
    verdictSamePrice: '{a} and {b} are priced identically',
    verdictScoreHigher: '{newer} scores {points} points higher on {benchmark} than {older}',
    verdictScoreLower: '{newer} scores {points} points lower on {benchmark} than {older}',
    verdictNoScores: 'No verifiable score comparison between these two versions',
    verdictCheapest:
      '{model} is the cheapest version in this line at {price} per million blended tokens',
    verdictBest: '{model} has the highest verified average on the benchmarks this line shares ({avg})',
    verdictLegacy: '{n} of {total} versions in this line are now legacy models',
    changesTitle: 'What changed at each step',
    changesSubtitle:
      'Only the differences we can prove from the pricing and score records — a price that moved, a context window that grew, a benchmark both versions report.',
    changePrice: '{slot} price {direction} {pct}% ({from} → {to})',
    changePriceSame: '{slot} price unchanged ({from} → {to})',
    changeContext: 'Context window {direction} ({from} → {to})',
    changeScore: '{benchmark} {direction} {points} points ({from} → {to})',
    changeUp: 'up',
    changeDown: 'down',
    changeSame: 'unchanged',
    changeNoChange: 'Nothing we can prove changed',
    scoresTitle: 'Benchmark scores',
    scoresSubtitle: 'The versions of this line that have a published, traceable score record.',
    scoresEmpty:
      'We have not verified a score for this line yet — so we do not publish one. Numbers we cannot trace do not belong on this site.',
    scoresSingle:
      'Only one version of this line has a verifiable score set so far, so there is nothing to compare it against yet.',
    scoresNote:
      'Transcribed from the sources named on each leaderboard entry. Coverage differs per version; a missing cell means the source did not report that benchmark.',
    scoreCount: '{n} benchmarks tracked',
    costTitle: 'What your usage would cost',
    costSubtitle: 'Adjust the monthly volume — every version of the line recomputes instantly.',
    costNote:
      'List price only: cached input, batch discounts and off-peak rates are not included. The sample column prices 1M input + 500K output tokens per month.',
    callsPerMonth: 'Requests per month',
    inputTokens: 'Input tokens / request',
    outputTokens: 'Output tokens / request',
    whichTitle: 'Which version to use',
    whichFlagship: 'Top of the line: {model}',
    whichBalanced: 'Middle of the line: {model}',
    whichFast: 'Throughput tier: {model}',
    whichLite: 'Cheapest tier: {model}',
    pairTitle: '{a} vs {b}',
    pairMetaDescription:
      '{a} vs {b}: prices, context window, benchmark scores, and what changed between versions.',
    siblingsTitle: 'Other versions in {series}',
    sourcesTitle: 'Sources',
    sourceVerified: 'Verified {date}',
    modelPage: 'Model page',
    modelLink: 'Model series',
    runUsage: 'Price your own usage',
    interactiveCompare: 'Open in the interactive comparator',
    releaseAnalysis: 'Read the launch analysis',
    backToIndex: 'All version series',
    empty: 'No version series yet',
    offPeak: 'Off-peak hours',
  },
  waitlist: {
    title: 'Join the waitlist',
    subtitle: "We'll let you know the moment we launch.",
    metaDescription:
      'Join the EvalLedger waitlist and be the first to know when we launch — the free LLM token cost calculator. One email, and only when there is something to say.',
    emailLabel: 'Email',
    submit: 'Join',
    added: "You're on the list — thanks!",
    already: "You're already on the list.",
    invalidEmail: 'Please enter a valid email address.',
    captcha: 'Verification failed. Please try again.',
    rateLimited: 'Too many attempts — please try again in a few minutes.',
    comingSoonTitle: 'Coming soon',
    comingSoonBody: "We're putting on the finishing touches. Leave your email and we'll tell you the moment it's live.",
  },
  email: {
    verify: {
      subject: 'Verify your email',
      heading: 'Confirm your email',
      body: 'Click the button below to verify your email address.',
      button: 'Verify email',
    },
    reset: {
      subject: 'Reset your password',
      heading: 'Reset your password',
      body: 'Click the button below to choose a new password.',
      button: 'Reset password',
    },
    proActivated: {
      subject: "You're on Pro 🎉",
      heading: 'Welcome to Pro',
      body: 'Your Pro access is now active. Head back to your workspace to start using it.',
      button: 'Open app',
    },
  },
  app: {
    dashboard: 'Dashboard',
    account: 'Account',
    loggedInAs: 'Logged in as {email}',
    passwordChanged: 'Password changed successfully.',
    proDemo: 'Pro demo',
    navWorkspace: 'Workspace',
    collapseSidebar: 'Collapse sidebar', expandSidebar: 'Expand sidebar',
    navAccount: 'Account',
    userMenuLabel: 'User menu',
    welcomeSub: "Here's your EvalLedger workspace.",
    quickActions: 'Quick actions',
    openAccount: 'Account settings',
    openAccountSub: 'Profile, password, danger zone',
    openPro: 'Pro demo',
    openProSub: 'A peek at what Pro unlocks',
    openReports: 'My data reports',
    openReportsSub: 'Corrections you filed — edit or withdraw them',
    myReports: {
      nav: 'My reports',
      title: 'My data reports',
      subtitle:
        'Corrections you filed about a price, a version or a score. You can edit or withdraw them until we triage them.',
      newTitle: 'File a correction',
      editTitle: 'Edit report',
      empty: 'Nothing yet — file your first correction above.',
      filedFrom: 'Filed from {email}',
      edit: 'Edit',
      save: 'Save changes',
      cancel: 'Cancel',
      saved: 'Report updated.',
      saveFailed: 'Only open reports can be edited.',
      delete: 'Withdraw',
      deleteConfirm: 'Withdraw this report?',
      deleted: 'Report withdrawn.',
      deleteFailed: 'Only open reports can be withdrawn.',
      submitted: 'Report received — thank you.',
      invalid: 'Add a short description of what is wrong.',
      rateLimited: 'Too many reports from this address. Please try again later.',
      limit: 'You have {n} open reports — wait for triage before filing more.',
      error: 'The report could not be sent. Please try again.',
      lockedHint: 'Reports become read-only once we triage them.',
      model: 'Model',
      modelOptional: 'Which model? (optional)',
      kind: 'What is wrong?',
      detail: 'What did you find?',
      detailPlaceholder: 'What the page says, what the source says, and the URL you checked.',
      sourceUrl: 'Source URL (optional)',
      submit: 'Send report',
      submitting: 'Sending…',
      status: { open: 'Open', accepted: 'Accepted', rejected: 'Rejected' },
    },
  },
  storage: {
    avatar: 'Avatar',
    changeAvatar: 'Change avatar',
    uploading: 'Uploading…',
    avatarHint: 'PNG, JPEG, WebP or GIF. Up to {mb} MB.',
    empty: 'That file is empty.',
    type: 'Unsupported image type.',
    size: 'Image is too large.',
    noFile: 'No file selected.',
    failed: 'Upload failed — please try again.',
  },
  // 法务页正文见 dictionaries/legal.ts（结构化段落，translate() 只取字符串）。
  auth: {
    login: 'Log in', register: 'Sign up', logout: 'Log out',
    name: 'Name', email: 'Email', password: 'Password', newPassword: 'New password', currentPassword: 'Current password',
    forgotPassword: 'Forgot password?', resetPassword: 'Reset password',
    haveAccount: 'Already have an account?', noAccount: "Don't have an account?",
    continueWith: 'Continue with {provider}',
    verifySent: 'Verification email sent. Check your inbox.',
    resendVerification: 'Resend verification email',
    checkEmailReset: 'If that email exists, a reset link has been sent.',
    deleteAccount: 'Delete account', deleteConfirm: 'This permanently deletes your account and data. Continue?',
    changePassword: 'Change password',
    loginTitle: 'Welcome back', loginSub: 'Sign in with Google to your EvalLedger workspace.',
    registerTitle: 'Create your account', registerSub: 'Sign up with Google — no password needed.',
    orContinue: 'or continue with',
    forgotTitle: 'Reset your password', forgotSub: "Enter your email and we'll send a reset link.",
    resetTitle: 'Set a new password', resetSub: 'Choose a strong password for your account.',
    verifyTitle: 'Check your email', verifySub: 'Enter your email to resend the verification link.',
    pwHint: 'At least 8 characters.', showPassword: 'Toggle password visibility',
    errors: {
      invalidCredentials: 'Invalid email or password.',
      emailExists: 'An account with this email already exists.',
      emailNotVerified: 'Please verify your email before logging in.',
      invalidToken: 'This link is invalid or has expired.',
      weakPassword: 'Password is too weak.',
      rateLimited: 'Too many attempts. Try again later.',
      captchaFailed: 'Bot check failed. Please try again.',
      unknown: 'Something went wrong. Please try again.',
    },
  },
  billing: {
    currentPlan: 'Current plan', upgrade: 'Upgrade',
    manageSubscription: 'Manage subscription', proArea: 'Pro area',
    proOnly: 'This is Pro-only content 🎉', proPeekBody: "You're previewing the Pro area. Upgrade to unlock it.",
    processing: 'Subscription processing — refresh in a moment.',
    free: 'Free', pro: 'Pro', renewsOn: 'Renews on', status: 'Status',
    lifetimeOwned: 'Pro · Lifetime', lifetimeNote: 'One-time purchase — yours forever. Nothing to manage.',
    paymentFailedBanner: 'Your last payment failed. Update your payment method to keep your subscription active.',
    updatePaymentMethod: 'Update payment method',
  },
  admin: {
    title: 'Admin', dashboard: 'Overview', users: 'Users',
    navAdmin: 'Admin',
    overviewSub: 'Signups, activity and subscriptions across EvalLedger.',
    usersSub: 'Search, inspect and manage every account.',
    totalUsers: 'Users', activeUsers: 'Active users', activeSubs: 'Active subs', subscriptions: 'Subscriptions',
    active: 'Active', pastDue: 'Past due', canceled: 'Canceled', pro: 'Pro', free: 'Free',
    roleAdmin: 'Admin', plan: 'Plan', source: 'Source',
    searchPlaceholder: 'Search by email or name', clearSearch: 'Clear search', email: 'Email', name: 'Name', createdAt: 'Created', role: 'Role', status: 'Status',
    unban: 'Unban', banned: 'Banned', impersonate: 'Log in as',
    impersonating: 'Impersonating {email}', exitImpersonation: 'Exit',
    joined: 'Joined', updated: 'Updated',
    copyEmail: 'Copy email', emailCopied: 'Email copied', customerId: 'Customer ID',
    banReason: 'Ban reason', banReasonPlaceholder: 'Why is this user being banned?',
    banExpires: 'Ban expires', banNever: 'Never',
    banDefaultReason: 'Banned by admin', banSubmit: 'Ban user', banPermanent: 'Permanent',
    rowsPerPage: 'Rows per page', pageOf: 'Page {page} of {total}',
    noResults: 'No users found', waitlistEmpty: 'No signups yet', closeDrawer: 'Close',
    waitlist: 'Waitlist', waitlistExport: 'Export CSV', locale: 'Locale',
    sponsors: 'Sponsors', sponsorsSub: 'Every sponsorship, with wall visibility controls.',
    amount: 'Amount', message: 'Message', hide: 'Hide', unhide: 'Unhide', hiddenBadge: 'Hidden',
    sponsorsExport: 'Export CSV',
    feedbackAdmin: 'All Feedback', feedbackSub: 'Every submission, with status controls and replies.',
    adminNotePlaceholder: 'Optional reply shown to the submitter', save: 'Save', saved: 'Saved.',
    noProviders: 'No providers configured yet.',
    dataReports: 'Data Reports', dataReportsSub: 'Corrections reported by users, with status controls.',
    dataReportStatus: 'Status',
    dataReportStatusOpen: 'Open',
    dataReportStatusAccepted: 'Accepted',
    dataReportStatusRejected: 'Rejected',
  },
  marketing: {
    navFeatures: 'Features',
    navChangelog: 'Changelog',
    githubStar: 'Star on GitHub',
    heroEyebrow: 'Token Cost Calculator · Free',
    heroTitlePre: 'See what your ', heroTitleHl: 'LLM tokens', heroTitlePost: ' actually cost — across every major model.',
    heroSubtitle:
      'Compare prices across OpenAI, Claude, Gemini, DeepSeek, MiniMax, and Grok in one place. Real tokenizer for OpenAI models, accurate estimates for the rest. Updated regularly.',
    heroCtaPrimary: 'Open the calculator',
    heroSocialProof: 'Trusted by engineers comparing LLM costs every day',
    heroPreviewVolume: '100k input · 40k output · 1k req/mo',
    heroPreviewShown: '{shown} of {total} models shown',
    heroPreviewUpdated: 'Updated {date}',
    heroPreviewSorted: 'Sorted by cheapest first · {n} models · {p} providers',
    heroPreviewSource: 'Source: provider pricing pages',
    heroPreviewCheapest: 'Cheapest',
    faqKicker: 'frequently asked',
    faqTitle: 'Questions about the calculator',
    ctaTitle: 'Ready to compare your LLM bill?',
    ctaBody: 'Paste your prompt, set your usage, see the cost across every model — in seconds. No signup.',
    ctaButton: 'Open the calculator',
    brandMetaDescription:
      'EvalLedger is a free token cost calculator for OpenAI, Claude, Gemini, DeepSeek, MiniMax and Grok. Real tokenizer for OpenAI, accurate estimates for the rest.',
    calculatorMetaDescription:
      'Compare token prices for OpenAI, Claude, Gemini, DeepSeek, MiniMax and Grok. Paste your prompt and see the cost across every model. Updated {date}.',
    deepseekMetaDescription:
      'DeepSeek API pricing — {model}: {input} in / {output} out per 1M, off-peak rates, prompt cache, and a GPT-6 / Claude comparison. Updated {date}.',
    homeMetaDescription:
      'See what your LLM tokens actually cost across OpenAI, Claude, Gemini, DeepSeek, MiniMax, and Grok. Real tokenizer for OpenAI models, accurate estimates for the rest. Updated {date}.',
    openrouterMetaDescription:
      'See what OpenRouter really charges after the markup — and when going direct to OpenAI, Claude, Gemini, or DeepSeek is cheaper. Updated {date}.',
    claudeMetaDescription:
      'See what {model} costs per token — and when the Anthropic API is cheaper than Pro / Max subscriptions. Updated {date}.',
    chatgptMetaDescription:
      'ChatGPT API pricing — {model} at {input} input / {output} output per 1M, cached input {cached} ({cachedPct}% off), and the Batch API at 50% off. Updated {date}.',
    brandTitle: 'EvalLedger — Compare Prices Across OpenAI, Claude, Gemini & DeepSeek',
    brandDescription: 'See what your LLM tokens actually cost across OpenAI, Claude, Gemini, DeepSeek, MiniMax, and Grok. Real tokenizer for OpenAI models, accurate estimates for the rest.',
    brandOgDescription: 'The token cost calculator for engineers comparing LLM prices. Free, no signup.',
    footerTagline: 'Pricing, benchmarks, and version history for every major LLM.',
    footerProduct: 'Product', footerResources: 'Resources', footerLegal: 'Legal',
    footerProductToken: 'Token Calculator',
    footerChangelog: 'Changelog',
    footerTwitter: 'X (Twitter)',
    footerTerms: 'Terms', footerPrivacy: 'Privacy', footerContact: 'Contact',
    footerRights: '© 2026 EvalLedger. All rights reserved.',
  },
  feedback: {
    nav: 'Feedback',
    title: 'Feedback', subtitle: 'Tell us what to build next — we read everything.',
    formTitle: 'New feedback',
    titleLabel: 'Title', bodyLabel: 'Details', optional: 'optional',
    submit: 'Submit', submitted: 'Thanks — received.',
    limitReached: 'You have {n} open items — let us catch up before filing more.',
    errTitle: 'Title is required (max {max} characters).',
    errBody: 'Details too long (max {max} characters).',
    mineTitle: 'My feedback', empty: 'Nothing yet — file your first feedback above.',
    deleteBtn: 'Delete', deleteConfirm: 'Delete this feedback?', deleted: 'Feedback deleted.',
    deleteFailed: 'Only open feedback can be deleted.',
    cancel: 'Cancel',
    replyLabel: 'Reply from the team',
    status: { open: 'Open', planned: 'Planned', shipped: 'Shipped', closed: 'Closed' },
  },
  sponsor: {
    navSponsor: 'Sponsor', footerSponsor: 'Sponsor',
    kicker: 'support the project',
    title: 'Sponsor EvalLedger', titleHl: 'EvalLedger',
    metaDescription:
      'Sponsor EvalLedger, the free LLM token cost calculator. One-time or monthly — every contribution funds fresh price checks and keeps the tool free.',
    subtitle: 'EvalLedger helps engineers see what their LLM tokens actually cost, across every major model. Sponsorships fund fresh price updates, new calculators, and the infra that keeps the tool free — and put your avatar on the sponsor wall.',
    monthly: 'Monthly', once: 'One-time', perMo: '/mo',
    popular: 'Recommended',
    customLabel: 'Custom', customHint: 'Enter any amount',
    tiers: {
      supporter: { name: 'Supporter', perks: ['Your avatar on the sponsor wall (Supporters tier)', 'Monthly /mo badge on your avatar'] },
      backer: { name: 'Backer', perks: ['Everything in Supporter', 'Backers-tier placement on the wall'] },
      sponsor: { name: 'Sponsor', perks: ['Everything in Backer', 'Gold top billing on the wall'] },
      coffee: { name: 'Coffee', perks: ['Your avatar on the sponsor wall', 'Supporters-tier placement'] },
      believer: { name: 'Believer', perks: ['Everything in Coffee', 'Backers-tier placement on the wall'] },
      patron: { name: 'Patron', perks: ['Everything in Believer', 'Gold top billing on the wall'] },
    },
    formTitle: 'Complete your sponsorship',
    githubLabel: 'GitHub username', githubOptional: 'optional', githubPlaceholder: 'your-handle',
    githubNote: 'Use your own GitHub username — your avatar + handle appear on the sponsor wall instantly. Leave blank to sponsor anonymously (not shown on the wall).',
    autoRenewNote: 'Renews monthly until canceled — manage anytime via the Stripe portal',
    nonRefundNote: 'Sponsorships are voluntary support and are non-refundable',
    earlyPerkNote: 'Early sponsors get an exclusive perk when Pro launches',
    messageLabel: 'Public message', messageOptional: 'optional', messagePlaceholder: 'EvalLedger saved me hours of API bill auditing',
    messageNote: 'Shown as a quote on the sponsor wall, next to your name.',
    sponsorBtn: 'Sponsor', secure: 'Secure checkout via Stripe · cancel anytime',
    payWithCard: 'Card', payWithWechat: 'WeChat Pay',
    wechatNote: 'The WeChat app shows the converted CNY amount',
    notConfigured: 'Sponsorship is not configured on this instance.',
    successTitle: 'Thank you for your support', successBody: 'Your sponsorship came through. It means a lot.',
    manageLink: 'Manage or cancel your sponsorship',
    wallTitle: 'Our sponsors', wallSub: 'Sponsors who share a GitHub handle appear on the wall in real time, linking to that GitHub profile. Tiers reflect cumulative support — it adds up.',
    wallEmpty: 'Be the first to sponsor this project.',
    tierGold: 'Gold sponsors', tierBackers: 'Backers', tierSupporters: 'Supporters',
    notesTitle: 'Notes from sponsors',
  },
  calculator: {
    // Shared SEO blocks
    kicker: 'Token Cost Calculator',
    h1Token: 'Token Cost Calculator',
    // Heading above the per-route FAQ list. Rendered visible (not collapsed) so
    // crawlers can index the answer copy — overrides the marketing.faqTitle
    // default which is a generic landing-page phrasing.
    faqTitle: 'Frequently asked questions',
    subtitleToken: 'Compare prices across OpenAI, Claude, Gemini, DeepSeek, MiniMax, and Grok. Real tokenizer for OpenAI, accurate estimates for the rest.',
    h1Openrouter: 'OpenRouter Pricing Calculator',
    subtitleOpenrouter: 'See what your tokens actually cost after the OpenRouter markup — and when going direct to the provider is cheaper.',
    h1Claude: 'Claude Token Cost Calculator',
    subtitleClaude: 'Cost per token and monthly estimates for Claude Opus, Sonnet, and Haiku — with the Anthropic API.',
    h1Deepseek: 'DeepSeek API Pricing',
    subtitleDeepseek: 'V4-Pro and V4.1-Flash per-token rates, off-peak hours, and prompt-cache savings — compared to Claude, GPT, and Gemini.',
    h1Chatgpt: 'ChatGPT API Pricing',
    subtitleChatgpt: 'GPT-6 and GPT-5 per-token rates, Batch API 50% off, and prompt-cache savings — compared to Claude, Gemini, and DeepSeek.',

    // Input form
    tabPaste: 'Paste text',
    tabManual: 'Enter usage',
    pasteLabel: 'Paste your prompt or document',
    pasteHint: 'Token counts update as you type. Real tokenizer for OpenAI models, approximation for others.',
    monthlyLabel: 'Requests per month',
    inputTokensLabel: 'Avg input tokens per request',
    outputTokensLabel: 'Avg output tokens per request',
    outputPresetLabel: 'Output size preset',
    outputCustomLabel: 'Custom ratio',
    calculateBtn: 'Calculate',
    resetBtn: 'Reset',

    // Token count display
    tokenCountChars: '{n} characters',
    tokenCountWords: '{n} words',
    tokenCountTokens: '{n} tokens',
    tokenCountApprox: 'approximate',
    tokenCountExact: 'exact',
    tokenCountLoading: 'Loading exact tokenizer…',

    // Misc labels
    tokenizerLabel: 'Tokenizer',
    useCached: 'Use cached input (Anthropic / OpenAI / DeepSeek / MiniMax)',
    familyGpt5: 'GPT-5',
    familyGpt4: 'GPT-4',
    familyOSeries: 'o-series',
    familyClaudeOpus: 'Claude Opus',
    familyClaudeSonnet: 'Claude Sonnet',
    familyClaudeHaiku: 'Claude Haiku',
    familyGemini25: 'Gemini 2.5',
    familyGrok4: 'Grok 4',
    familyDeepSeekV3: 'DeepSeek V3',
    familyDeepSeekR1: 'DeepSeek R1',
    familyMiniMaxM3: 'MiniMax M3',
    providerOpenai: 'OpenAI',
    providerAnthropic: 'Anthropic',
    providerGoogle: 'Google',
    providerDeepSeek: 'DeepSeek',
    providerMinimax: 'MiniMax',
    providerStepfun: 'StepFun',
    providerGrok: 'Grok',
    providerKimi: 'Moonshot',
    providerOpenRouter: 'OpenRouter',
    openrouterCurrentMarkup: 'Current average markup: ×{multiplier} ({pct}%)',
    claudeProCardTitle: 'Claude Pro · $20/mo',
    claudeMaxCardTitle: 'Claude Max · $200/mo',
    claudeBreakEven: 'Break-even: ~{input}M input + {output}M output per month',
    claudeProDescription: 'Below this combined usage the Pro plan is cheaper; above it the API starts winning.',
    claudeMaxDescription: 'For sustained heavy usage, Max covers you up to roughly the API equivalent of $200/mo.',
    claudeSampleReference: 'Sample reference: 1M input + 500K output tokens via the API costs ${cost} / month ({rate}).',
    claudeSampleNoUsage: 'no usage',
    claudeSampleRate: 'at current Sonnet 5 rates',
    relatedKicker: 'More calculators',
    relatedTitle: 'Pick the right page for your use case',
    relatedOpen: 'Open',

    // Results grid
    resultsTitle: 'Estimated cost across {n} models',
    cheapestBadge: 'Cheapest',
    sortCheapest: 'Cheapest first',
    sortExpensive: 'Most expensive first',
    filterAll: 'All providers',
    copyEstimate: 'Copy estimate',
    copied: 'Copied',
    perMonth: '/ month',
    perYear: '/ year',
    inputLabel: 'Input',
    outputLabel: 'Output',
    contextLabel: 'Context window',
    tokensUnit: 'tokens',
    pricingSourceLabel: '{model} pricing source',
    cachedInputLabel: 'Cached input',
    cacheWriteLabel: 'Cache write ({window})',
    peakLabel: 'Peak hours',
    offPeakLabel: 'Off-peak hours',
    longContextLabel: 'Long context ≥{n}',
    ruleStandard: 'Standard pricing',
    ruleWindow: '{label}',
    ruleWindowUntil: '{label} (until {date})',
    rulePromo: 'Promo until {date}',
    ruleDelisted: 'Discontinued',

    // TLDR (featured-snippet bait)
    tldrTitle: 'Quick takeaways',
    tldrItems: [
      'Output tokens usually cost 4–8× more than input — keeping replies short is the highest-leverage cost saver.',
      'Anthropic prompt caching drops repeat-input cost by ~90%; OpenAI cached input drops it by ~90% on the GPT-6 line.',
      'DeepSeek off-peak hours are ~50% cheaper than peak — schedule batch jobs accordingly.',
      'Gemini 2.5 Pro doubles its input price above 200K context — large-context calls cost roughly twice as much.',
    ],

    // Swap-model table
    swapTitle: 'What if you switched model?',
    swapBaseline: 'Baseline: {label}',
    swapMultiple: '× {n}',
    swapSavings: 'Save ${n}/mo',
    swapCostlier: 'Costs ${n}/mo more',

    // OpenRouter-specific
    openrouterMarkupTitle: 'OpenRouter markup, explained',
    openrouterMarkupBody: 'OpenRouter charges a small markup on top of each provider\'s official API price. The current average is around 5%, but the exact markup varies per model and per credit package. For most single-model workloads the overhead is small; it gets painful when you pay per request with many small models, or when you don\'t need OpenRouter\'s fallback / multi-model routing at all.',
    openrouterBreakEvenTitle: 'When going direct is cheaper',
    openrouterBreakEvenBody: 'If your workload is single-model, high-volume, and latency-sensitive, going direct to the provider\'s API almost always wins: lower latency, no aggregator in the request path, and you can negotiate volume pricing the aggregator can\'t match. OpenRouter wins when you need (a) automatic fallback across providers, (b) one bill for many models, or (c) access to models that aren\'t available on your home region.',

    // Claude-specific
    claudeSubscriptionTitle: 'Claude.ai subscription vs API',
    claudeSubscriptionBody: 'Claude Pro ($20/mo) and Claude Max ($200/mo) include generous usage caps that are usually cheaper than the API up to a break-even point. Beyond that point, the API — or a third-party router like OpenRouter — is the right choice.',
    claudeBreakEvenTitle: 'API break-even',
    claudeBreakEvenBody: 'For Claude Sonnet 5 at $2/$10 per 1M tokens, the Pro plan covers you up to roughly {input}M input + {output}M output tokens per month. The Max plan covers roughly {inputMax}M input + {outputMax}M output tokens. Past those thresholds, the API starts winning on pure cost.',

    // Money-saving tips
    tipsTitle: 'How to bring the bill down',
    tips: [
      'Use a smaller model for routing / classification — Claude Haiku 4.5 costs about 10× less than Claude Fable 5.1, and GPT-6 luna about 100× less than GPT-6 astra on output.',
      'Cache repeat prefixes (system prompts, tool schemas) — Anthropic cached input drops the rate by ~90%.',
      'Set max_tokens explicitly — output is the expensive side; capping it prevents runaway replies.',
      'Batch non-urgent jobs into DeepSeek off-peak hours for ~50% cheaper inference.',
      'Trim long context — Gemini 2.5 Pro doubles its input rate above 200K; chunk documents that don\'t need the rest.',
    ],

    // FAQ — 8 questions, flat Q/A pairs (mirrors the convention used by the
    // home route\'s JSON-LD builder). Order matters for matching search intent.
    faq1Q: 'How much does 1 million tokens cost?',
    faq1A: 'It depends entirely on the model. GPT-5 nano is around $0.05 input / $0.40 output per 1M tokens; Claude Opus 4.5 is $5 / $25; Gemini 2.5 Flash is $0.30 / $2.50. Use the calculator above to compare every major model at your exact usage.',
    faq2Q: 'Why is output more expensive than input?',
    faq2A: 'Every LLM provider charges more per output token than per input token — typically 4× to 8× more. Output tokens are billed higher because generation is the compute-heavy step (autoregressive decoding), while input is a single forward pass.',
    faq3Q: 'How do I count tokens?',
    faq3A: 'For OpenAI models, the calculator uses the real tokenizer (o200k_base for GPT-5, cl100k_base for older families). For Anthropic, Google, DeepSeek, MiniMax, and Grok, it uses a CJK-aware character approximation — accurate to within ~10% for English, ~5% for Chinese.',
    faq4Q: 'How accurate is this calculator?',
    faq4A: 'Token counts are exact for OpenAI-family models and approximate for everyone else. Prices are sourced from each provider\'s official pricing page and re-verified regularly, but providers change prices without notice — always check the source link on each model card before relying on a number for billing.',
    faq5Q: 'What is prompt caching?',
    faq5A: 'Prompt caching lets you reuse a previously-seen prefix (system prompt, tool definitions, large document) across requests at a fraction of the normal input cost. Anthropic charges ~90% less for cached reads; OpenAI charges ~90% less on GPT-5; DeepSeek charges ~90% less for cache hits. The biggest single cost saver for repeat-prompt workloads.',
    faq6Q: 'Does OpenRouter add a markup?',
    faq6A: 'Yes — OpenRouter charges a small markup (typically around 5%) on top of each provider\'s official API price. For most single-model workloads the overhead is negligible; OpenRouter wins when you need automatic fallback across providers or a single bill for many models.',
    faq7Q: 'Is the Claude subscription cheaper than the API?',
    faq7A: 'Up to a point, yes. Claude Pro ($20/mo) and Max ($200/mo) include generous usage caps. Beyond roughly 1M input + 0.5M output tokens per month (Pro) or roughly 5M input + 2.5M output tokens per month (Max), the API starts winning on pure cost. Use the calculator above to find your break-even point.',
    faq8Q: 'How often are prices updated?',
    faq8A: 'Prices are re-verified against each provider\'s official pricing page regularly. The "Updated YYYY-MM-DD" stamp at the top of the page reflects the last verification. A machine-readable version is available at /api/prices.json — same data, designed for AI agents and programmatic access.',

    // OpenRouter-specific FAQ (8 entries)
    openrouterFaq1Q: 'What does OpenRouter actually charge?',
    openrouterFaq1A: 'OpenRouter charges the provider\'s official API price plus a small markup (typically 5%) for the routing, billing, and fallback service. The exact markup varies per model — check the model\'s card on OpenRouter for the current number.',
    openrouterFaq2Q: 'Is OpenRouter more expensive than going direct?',
    openrouterFaq2A: 'For most single-model, high-volume workloads, going direct to the official provider is slightly cheaper because you skip the markup. OpenRouter wins when you need automatic fallback across providers, a single bill for many models, or access to models not available in your home region.',
    openrouterFaq3Q: 'How much does 1 million tokens cost on OpenRouter?',
    openrouterFaq3A: 'It depends on which model you route to. For GPT-5 it\'s about $1.31 input / $10.50 output per 1M tokens (after the 5% markup on the official $1.25 / $10). For Claude Sonnet 4.5: $3.15 / $15.75. Use the calculator above to compare every model on OpenRouter against its official price.',
    openrouterFaq4Q: 'Does OpenRouter charge per request?',
    openrouterFaq4A: 'No per-request fee — just the per-token markup on top of the underlying model price. The total is the same shape as a direct API call; the only difference is the small multiplier.',
    openrouterFaq5Q: 'Can I use my own provider API key with OpenRouter?',
    openrouterFaq5A: 'Yes — OpenRouter lets you bring your own keys (BYOK) for some providers. When you do, you pay the provider\'s official rate with no OpenRouter markup. When you don\'t, OpenRouter bills you for both the tokens and the markup.',
    openrouterFaq6Q: 'How accurate is this calculator?',
    openrouterFaq6A: 'The base model prices come from each provider\'s official pricing page; the OpenRouter column multiplies those by the current average markup factor (about 5%). Re-check the model\'s source link before relying on a number for billing.',
    openrouterFaq7Q: 'Which models are available on OpenRouter?',
    openrouterFaq7A: 'OpenRouter aggregates most major models — GPT-5 family, Claude Opus / Sonnet / Haiku 4.5, Gemini 2.5 Pro / Flash, DeepSeek V3 / R1, and many open-source models. Check the live catalog at openrouter.ai/models for the current count (it changes weekly).',
    openrouterFaq8Q: 'How often are these OpenRouter prices updated?',
    openrouterFaq8A: 'Whenever the underlying provider changes its price, the OpenRouter markup-adjusted column above updates on the same cadence. The "Updated YYYY-MM-DD" stamp and /api/prices.json both reflect the latest verification.',

    // Claude-specific FAQ (8 entries)
    claudeFaq1Q: 'How much does Claude Sonnet 4.5 cost per million tokens?',
    claudeFaq1A: 'Claude Sonnet 4.5 is $3 per 1M input tokens and $15 per 1M output tokens via the Anthropic API. With prompt caching, cached reads drop to $0.30 per 1M (90% off). The 5-minute cache write is $3.75 per 1M; the 1-hour cache write is $6 per 1M.',
    claudeFaq2Q: 'How much do 10,000 tokens cost in Claude?',
    claudeFaq2A: '10,000 input tokens on Claude Sonnet 4.5 cost $0.03 (3 cents). 10,000 output tokens cost $0.15 (15 cents). For Opus 4.5 the same is $0.05 input and $0.25 output; for Haiku 4.5 it\'s $0.01 input and $0.05 output.',
    claudeFaq3Q: 'How many tokens does $5 get you in Claude?',
    claudeFaq3A: '$5 buys you roughly 1.67M input tokens on Claude Sonnet 4.5 (or 333K output tokens). On Haiku 4.5 the same $5 buys 5M input / 1M output tokens. On Opus 4.5 it\'s 1M input / 200K output tokens.',
    claudeFaq4Q: 'How much is 200,000 tokens in Claude?',
    claudeFaq4A: '200,000 input tokens on Claude Sonnet 4.5 cost $0.60; on Opus 4.5 it\'s $1.00; on Haiku 4.5 it\'s $0.20. The same 200K output tokens cost $3.00 on Sonnet 4.5, $5.00 on Opus 4.5, and $1.00 on Haiku 4.5.',
    claudeFaq5Q: 'Is Claude Pro or Max cheaper than the API?',
    claudeFaq5A: 'Up to a point, yes. Claude Pro ($20/mo) is cheaper than the API below roughly 6M input + 3M output tokens per month (Sonnet rates). Max ($200/mo) covers up to roughly 60M input + 30M output. Beyond those thresholds, the API wins on pure cost.',
    claudeFaq6Q: 'How does Claude prompt caching work?',
    claudeFaq6A: 'Anthropic caches prompt prefixes for 5 minutes or 1 hour. Reads from the cache cost 90% less than fresh input ($0.30 per 1M on Sonnet 4.5). Writes cost a small premium — $3.75 per 1M for the 5-min window, $6 per 1M for the 1-hour window. Caching is the single biggest cost saver for repeat-system-prompt workloads.',
    claudeFaq7Q: 'Which Claude model is cheapest?',
    claudeFaq7A: 'Claude Haiku 4.5 is the cheapest at $1 / $5 per 1M tokens. For most classification and short-answer workloads it matches Sonnet 4.5 on quality at a third of the price. Sonnet 4.5 ($3 / $15) is the mid-tier; Opus 4.5 ($5 / $25) is the flagship.',
    claudeFaq8Q: 'How accurate is this calculator?',
    claudeFaq8A: 'Token counts are approximated (the Claude tokenizer is not yet bundled with this tool — counts use a CJK-aware character heuristic, accurate to within ~10% for English, ~5% for Chinese). Prices are sourced from claude.com/pricing and re-verified regularly. Always check the source link on each card before relying on a number for billing.',

    // DeepSeek-specific FAQ (8 entries)
    deepseekFaq1Q: 'How much does the DeepSeek API cost?',
    deepseekFaq1A: 'DeepSeek V4-Pro is $1.32 per 1M input tokens / $3.96 per 1M output tokens. DeepSeek V4.1-Flash is $0.30 / $1.20. New accounts get a small free credit to start; top-up minimums start at $5. Numbers above are re-verified against platform.deepseek.com/api-docs/pricing.',
    deepseekFaq2Q: 'When is DeepSeek off-peak?',
    deepseekFaq2A: 'Off-peak runs Monday through Friday outside the peak windows (UTC 01:00–04:00 and 06:00–10:00) and all day on weekends and Chinese public holidays. During off-peak, both input and output are billed at 50% of the peak rate. The schedule is published at platform.deepseek.com.',
    deepseekFaq3Q: 'Is DeepSeek cheaper than GPT-5?',
    deepseekFaq3A: 'Yes — at peak, DeepSeek V4.1-Flash output is $1.20 per 1M tokens versus GPT-5 output at roughly $10 per 1M (~8× cheaper on output). V4-Pro output at $3.96 is roughly 2.5× cheaper than GPT-5 output. For high-volume workloads the difference dominates every other cost lever.',
    deepseekFaq4Q: 'What is DeepSeek V4.1-Flash?',
    deepseekFaq4A: 'V4.1-Flash is the fast non-reasoning model in the V4 family: 1M context window, $0.30 / $1.20 per 1M, with a $0.003 cache-hit price on input. It is the cheapest model in the active registry — input is roughly 17× cheaper than Claude Opus 4.5 and output is roughly 21× cheaper.',
    deepseekFaq5Q: 'What is DeepSeek V4-Pro?',
    deepseekFaq5A: 'V4-Pro is the flagship reasoning model: 1M context window, $1.32 / $3.96 per 1M, with a $0.022 cache-hit price. It benchmarks in the same tier as Claude Sonnet 4.5 on most reasoning evals while costing roughly 2.3× less. Use it when you need Sonnet-class reasoning at sub-Haiku price.',
    deepseekFaq6Q: 'Does DeepSeek have prompt caching?',
    deepseekFaq6A: 'Yes. V4.1-Flash cache hits are $0.003 per 1M input tokens — a 99% drop from $0.30/M standard. V4-Pro cache hits are $0.022 per 1M, a 98% drop from $1.32/M. For repeat-prefix workloads (system prompts, tool schemas, large document context) caching is the single biggest cost lever.',
    deepseekFaq7Q: 'Is the DeepSeek API the same as OpenRouter?',
    deepseekFaq7A: 'No — going direct to platform.deepseek.com bills at the official rate; OpenRouter adds a small markup (typically ~5%) for routing, billing, and automatic fallback. For single-model high-volume workloads direct is cheaper; OpenRouter wins when you need fallback across providers or a single invoice for many models.',
    deepseekFaq8Q: 'How do I get a DeepSeek API key?',
    deepseekFaq8A: 'Sign up at platform.deepseek.com, complete the minimum top-up (currently $5), and generate a key from the API Keys page in the console. The calculator above always shows the current per-million rates, and /api/prices.json exposes the same numbers in a machine-readable form for AI agents.',

    // ChatGPT-specific FAQ (8 entries)
    chatgptFaq1Q: 'How much does the ChatGPT API cost per million tokens?',
    chatgptFaq1A: 'GPT-6 astra is $10 input / $50 output per 1M; GPT-6 sol is $2 / $10; GPT-6 luna is $0.10 / $0.50. Older GPT-5 (now delisted) was $1.25 / $10 with cached input at $0.125/M. Use the calculator above to compare every active model at your exact usage.',
    chatgptFaq2Q: 'How many tokens does $5 get you in ChatGPT?',
    chatgptFaq2A: '$5 buys you roughly 500K input tokens on GPT-6 astra (or 100K output). On GPT-6 sol the same $5 buys 2.5M input / 500K output. On GPT-6 luna it\'s 50M input / 10M output. On GPT-5 nano the same $5 buys 100M input / 12.5M output.',
    chatgptFaq3Q: 'How much is 200,000 tokens in ChatGPT?',
    chatgptFaq3A: '200,000 input tokens on GPT-6 astra cost $2.00; on GPT-6 sol $0.40; on GPT-6 luna $0.02. The same 200K output tokens cost $10.00 on astra, $2.00 on sol, $0.10 on luna. GPT-5 nano: 200K input is $0.01, 200K output is $0.08.',
    chatgptFaq4Q: 'Should I use GPT-5 mini or GPT-5 nano?',
    chatgptFaq4A: 'GPT-5 mini ($0.25 input / $2.00 output per 1M) is for short-answer workloads where quality matters. GPT-5 nano ($0.05 / $0.40) is for high-volume routing and classification — output is 5× cheaper than mini. Most production stacks use nano for routing and reserve mini for the harder prompts.',
    chatgptFaq5Q: 'How does ChatGPT prompt caching work?',
    chatgptFaq5A: 'OpenAI automatically caches prompt prefixes of 1,024 tokens or more for 5–10 minutes (longer on GPT-5/6). Cached reads bill at roughly 10% of the standard input rate — $0.125/M on GPT-5 vs $1.25/M standard, $1/M on GPT-6 astra vs $10/M. The single biggest cost saver for repeat-prefix workloads.',
    chatgptFaq6Q: 'Who should use the OpenAI Batch API?',
    chatgptFaq6A: 'The Batch API is for non-urgent jobs that can wait up to 24 hours — evals, bulk summarization, dataset generation, embedding backfills. Both input and output bill at 50% of standard rates; you submit a JSONL file of requests and poll for completion. Latency-sensitive workloads should use the real-time API.',
    chatgptFaq7Q: 'Is OpenRouter cheaper than going direct to OpenAI?',
    chatgptFaq7A: 'For most single-model, high-volume workloads, going direct to platform.openai.com is slightly cheaper — you skip the OpenRouter markup (~5%). OpenRouter wins when you need automatic fallback across providers, a single bill for many models, or access to models not available in your home region.',
    chatgptFaq8Q: 'How accurate is this calculator?',
    chatgptFaq8A: 'Token counts are exact for ChatGPT models (the calculator uses OpenAI\'s o200k_base tokenizer for GPT-5/6, cl100k_base for older families). Prices are sourced from platform.openai.com/docs/pricing and re-verified regularly. Always check the source link on each card before relying on a number for billing.',

    // DeepSeek-specific TLDR + Tips (separate arrays so the page can quote
    // DeepSeek-specific numbers without diluting the cross-provider page).
    deepseekTldrItems: [
      'DeepSeek V4.1-Flash is $0.30 input / $1.20 output per 1M tokens — roughly 8× cheaper than GPT-5 on output.',
      'V4-Pro is $1.32 / $3.96 per 1M — comparable to Claude Sonnet 4.5 on benchmarks, ~3.8× cheaper than it on output.',
      'Off-peak (Mon–Fri outside 01:00–04:00 & 06:00–10:00 UTC, plus all weekends & Chinese holidays) is 50% of peak — schedule batch jobs accordingly.',
      'Cache hits drop V4.1-Flash input from $0.30/M to $0.006/M at peak (98% off) and $0.003/M off-peak (99% off). Cache aggressively when the system prompt or tool schema repeats.',
    ],
    deepseekTips: [
      'Use V4.1-Flash for routing / classification — output is $1.20/M vs $3.96/M on V4-Pro, ~3.3× cheaper.',
      'Cache repeat prefixes — V4.1-Flash cache hit is $0.006/M at peak (98% off) and $0.003/M off-peak (99% off) vs $0.30/M. The single biggest cost saver for repeat-prompt workloads.',
      'Batch non-urgent jobs into off-peak hours (Mon–Fri outside 01:00–04:00 and 06:00–10:00 UTC) for ~50% cheaper inference.',
      'Set max_tokens explicitly — output is the expensive side; capping it prevents runaway replies.',
      'Going direct to DeepSeek\'s API beats OpenRouter by a few percent. OpenRouter wins on automatic fallback + a single invoice.',
    ],

    // ChatGPT-specific TLDR + Tips (separate arrays so the page can quote
    // ChatGPT-specific numbers without diluting the cross-provider page).
    chatgptTldrItems: [
      'GPT-6 astra cached input drops to $1/M — a 90% discount vs the $10/M standard rate.',
      'The Batch API runs at 50% off with a 24-hour SLA — ideal for evals, bulk summarization, and dataset generation.',
      'GPT-6 astra is the flagship at $10 input / $50 output per 1M tokens.',
      'GPT-6 luna is the cheapest GPT-6 tier at $0.10 input / $0.50 output per 1M tokens.',
    ],
    chatgptTips: [
      'Use GPT-6 luna for routing / classification — its output rate is 100× below GPT-6 astra\'s.',
      'Enable cached input — OpenAI auto-caches prefix repeats for ~90% off the standard input rate.',
      'Route non-urgent jobs through the Batch API for 50% off (24-hour SLA, no queue rate-limits).',
      'Set max_tokens explicitly — output is the expensive side; capping it prevents runaway replies.',
      'ChatGPT Plus ($20/mo) does NOT replace API access — high-volume workloads still need the API.',
    ],

    // DeepSeekSection copy
    deepseekOffPeakTitle: 'Off-peak hours, explained',
    deepseekOffPeakBody:
      'Mon–Fri (excluding Chinese public holidays), DeepSeek bills at the full peak rate only during 01:00–04:00 and 06:00–10:00 UTC. All other times — including all weekend hours — are off-peak and bill at 50% of peak for both input and output.',
    deepseekOffPeakBadge: 'Off-peak = 50% of peak · Mon–Fri · weekends & Chinese holidays all-day off-peak',
    deepseekCacheTitle: 'Prompt-cache pricing',
    deepseekCacheBody:
      'DeepSeek cache hits are aggressive — V4.1-Flash drops cached input by 98% from the standard rate, V4-Pro by 97%. For any workload with a repeated prefix (system prompt, tool definitions, document context) caching the prefix is the single highest-leverage cost saving.',

    // ChatGPTSection copy
    chatgptBatchTitle: 'Batch API · 50% off',
    chatgptBatchBody:
      "OpenAI's Batch API processes requests asynchronously with a 24-hour SLA at half the standard rate — both input and output bill at 50%. You submit a JSONL file of requests, poll for completion, and there are no rate limits on the queue. Ideal for non-urgent workloads: evals, bulk summarization, dataset generation, and large backfills.",
    chatgptBatchBadge: '50% off · 24-hour SLA · no queue rate-limits',
    chatgptCacheTitle: 'Prompt caching · ~90% off',
    chatgptCacheBody:
      'OpenAI automatically caches prompt prefixes (≥1,024 tokens) for 5–10 minutes (longer on GPT-5/6). Cached reads bill at roughly 10% of the standard input rate. For repeat-prefix workloads (system prompts, tool schemas, large documents) caching is the single biggest cost lever — most production stacks see a 50–80% input reduction once caching is on.',

    // Data freshness + API link
    freshness: 'Prices verified {date}. Source: official provider pricing pages.',
    apiLinkLabel: 'Machine-readable: /api/prices.json',
    lastUpdated: 'Last updated: {date}',
  },
  // ───── Feature-slice dictionaries ─────
  // Each slice owns its own copy and wires it in here; the key sets are
  // identical in both languages, and `zh` is typed against this shape, so a
  // missing Chinese key is a compile error rather than a silent fallback to
  // the raw key. See `docs/seo-internal-linking-plan.md`.
  hub: hub.en,
  linking: linking.en,
  calc: calc.en,
  landing: landing.en,
  site: site.en,
} as const

/** Recursively widen all leaf string literals to `string` so other locales can satisfy this type. */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }

export type Dict = Widen<typeof en>