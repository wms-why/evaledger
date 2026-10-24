/**
 * Chinese descriptions of the benchmarks — the `zh` counterparts of
 * `Benchmark.description`.
 *
 * These live in their own file, keyed by benchmark id, for the same reason
 * the benchmark registry is hand-curated: the description is *copy*, and a
 * Chinese page must not publish the English sentence. Keeping them as a
 * mapping (instead of a second field on every registry entry) makes the
 * translation reviewable on its own and lets a guard test assert that every
 * benchmark has one.
 *
 * The `name` field stays untranslated — a benchmark's name is a proper noun
 * ("GPQA Diamond", "Terminal-Bench 4.0"), exactly like a model name.
 */
export const BENCHMARK_DESCRIPTIONS_ZH: Record<string, string> = {
  'vals-index':
    '由 Vals AI 发布，覆盖金融、编程、法律、税务等高价值知识工作的综合评分。用同一个数字回答：这个模型在企业真正付钱的那种工作上到底有多强。',
  'gdpval-aa':
    'GDPval 的 Artificial Analysis 版本：衡量模型交付的专业成果值多少钱，以绝对数值而非百分比发布。数值越高，意味着每个任务交付的价值越高。',
  'gdp-pdf': '文档理解任务，按每份文档的评分标准打分；PDF 以页面图像加抽取文本的形式输入。',
  'gpqa-diamond': '研究生水平的物理、化学、生物题目，专门设计成无法靠搜索直接找到答案。',
  hle: 'Humanity\u2019s Last Exam——覆盖面很广的前沿知识题集。部分模型只报告纯文本子集（来源处以星号标注）。',
  codeforces: '竞技编程的 Elo 式评分，不是百分比。',
  'apex-bench-v1.1':
    'Apex Bench v1.1——DeepSeek 在其 V4.1-Flash 发布材料里使用的评测列。与 MathArena Apex 不是一回事：名字相近、表格不同，两者不可互换。',
  'matharena-apex': '高难度数学竞赛题。',
  'terminal-bench-2.1': '在真实终端环境里完成的端到端任务（v2.1 题集）。',
  'terminal-bench-3.0': '在真实终端环境里完成的端到端任务（v3.0 题集）。',
  'terminal-bench-4.0': '在真实终端环境里完成的端到端任务（v4.0 题集）。',
  'terminal-bench-science-0.1':
    '偏科学方向的终端任务（v0.1 题集），在真实 shell 中按严格的任务专属测试评分。',
  'swe-bench-pro': '在真实代码仓库中解决长程软件工程任务，按留出测试集评分。',
  'swe-marathon': '真实仓库上的长周期多阶段工程任务——模型要跨整个项目持续工作，而不是只做一个 PR。',
  'frontierswe-v2': '前沿难度的仓库级软件工程任务——DeepSWE 中更难的那一类。',
  'deepswe-v1.1': '仓库级软件工程任务的解决能力。',
  programbench: '程序合成与实现基准。',
  'nl2repo-bench': '从自然语言需求生成代码仓库。',
  cybergym: '攻击性安全（CTF 风格）任务。',
  'sec-bench-pro': '安全工程基准（pro 档）。',
  exploitgym: '漏洞利用开发任务。',
  'hle-tools': '在开启工具访问的条件下运行 HLE。',
  'automation-bench': '多步骤自动化与工作流任务。',
  'osworld-2.0': '通过真实桌面环境操作电脑的任务——在离线子集上按部分得分计算。',
  'osworld-2.1':
    '通过真实桌面环境操作电脑的任务（v2.1 题集）——与 OSWorld-2.0 是不同题集，两个分数不可互换。',
  chartography:
    '不使用工具的图表与图形理解。同族的工具辅助版本单列（“chartography-tools”），两者不可互换。',
  graphwalks:
    '在合成知识图谱上做多跳遍历，按 F1 评分。公布的成绩来自 256k–1M token 区间——最考验长上下文的那个区间。',
  'cwe-bench-v1': '修复真实漏洞：模型必须找到并修补缺陷，而不只是描述它。',
  'agents-last-exam': '长程智能体任务基准。',
  browsecompc: '高难度事实检索型浏览任务，需要多步检索才能回答。',
  'mcp-atlas': 'Model Context Protocol 服务器的工具选择与多步骤使用。',
  bankertoolbench: '多步骤金融工作，串联文档、表格与行情数据工具。',
  'officeqa-pro-v2':
    '在整份 PDF 语料上做金融文档分析——检索、跨文档核对与多步数值推理，逐题评分。',
  'frontier-finance': '完整投资工作流——从筛选候选到盈利分析——运行在官方行情数据智能体环境上。',
  'chartography-tools': '图表与图形理解，工具辅助。',
  'babyvision-tools': '视觉感知基准，工具辅助。',
  benchcad: '通过生成 CAD 代码，从多视角渲染图重建 3D 模型。我们跟踪的是它的工具辅助运行结果。',
  'zerobench-main-tools': '视觉基准 ZeroBench 主分片，工具辅助。',
}
