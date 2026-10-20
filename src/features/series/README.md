# Model Series（版本系列）—— 系列契约

`/series` 是站点的第四个系列（前三个：榜单、对比/计算器、发布解读）。

定位：**同一条产品线的多个版本，放在一起比。**

| 表面 | 回答的问题 | 粒度 |
| --- | --- | --- |
| `/leaderboard` | 现在最强的模型是谁？ | 跨厂商，一个模型一行 |
| `/compare/$pair` | A 和 B 谁更适合我？ | 两个模型，通常来自不同厂商 |
| `/releases/<slug>` | 这次发布值不值得换？ | 一个模型的一次发布 |
| **`/series/$slug`** | **这一代比上一代强在哪、贵在哪？旧版还能用吗？** | **一条产品线的全部版本** |

前三个表面都答不了最后这个问题：榜单把同一家的不同版本平铺成互不相干的行；
`/compare` 的 18 个静态页对是手工挑的（且基本都是跨厂商的）；发布解读一次只讲一个模型。
**版本系列**把这个缺口补上。

## 0. 铁律

1. **页面不写死任何数字。** 一条产品线只存 *键*（成员列表），价格、跑分、
   成本全部在渲染时由 `src/features/series/data.ts` 从 REGISTRY / LEADERBOARD 取。
   改一次价，所有提到它的产品线页同时更新，绝不会和计算器打架。
2. **不插值。** 没有可溯源的跑分就没有跑分 —— 宁可渲染一个诚实的空状态，
   也不做估算、不做外推。
3. **不借分数。** 一个版本的跑分只来自它自己的 LEADERBOARD 行。
   Claude Opus 5.5 的分数不会挪到 Opus 4.8 头上。
4. **注释跟着数字走。** 来源印出来的 caveat（"text-only subset"、
   "vendor-reported, xhigh effort"）跟着那个数字一起显示，不被丢掉。
5. **只在可比的时候比。** 两个版本如果跑分覆盖不同，就只在**双方都公布**的
   基准上比较；共有基准为空时，「谁更强」这句话直接不出现。
6. **中英双份。** 文案在 `src/features/i18n/dictionaries/{en,zh}.ts` 的 `series` 块里，
   zh 是原生重写。

## 1. 数据模型

```ts
interface Series {
  slug: string            // /series/<slug>
  name: string            // 'Claude Opus'（两种语言都保持拉丁文）
  family: string          // REGISTRY.models[].family
  vendor: Vendor
  members: SeriesMember[] // 最新 → 最旧
}

interface SeriesMember {
  key: string             // 短键，pair URL 里用：/series/claude-opus/opus-5.5-vs-opus-5
  version: string         // 数字版本号：'5.5' / '3.1' / '4.1'
  tier: SeriesTier        // flagship | balanced | fast | lite
  priceId?: string        // REGISTRY id —— 价格行
  scoreId?: string        // LEADERBOARD id —— 跑分行
  status?: ModelStatus    // 只有「没有价格行」的成员才需要显式写
}
```

### 为什么成员和顺序是手工维护的

`REGISTRY.models[].family` 太粗：

- `gpt-5` 里同时装着 GPT-5 世代（5 / 5-mini / 5-nano）和 5.6 世代（sol / cyber）；
- `gemini-3` 里是同一代的三个档位（Pro / Flash / Flash-Lite）。

「哪一版取代了哪一版」「一个成员在产品线里站在哪一档」，只有人知道。
所以成员表是写下来的，并由测试盯着（见 §6）。

### 排序规则

成员按**版本号从新到旧**排；版本号按数字段比较（`5.5 > 5 > 4.8`），
同一版本号内按档位排（flagship → balanced → fast → lite，同档位可以并列，
但档位不能往回走）。
版本号是仓库里大多数产品线唯一带的「新旧」信号，所以排序规则写死在
`series.ts` 的注释里，测试会检查版本号不递增。

> 例外：`deepseek-v4` 里两个 `4.1` 成员（0910 与 1017 检点）和两个 `4` 成员
> （V4-Pro 0813 与 V4-Flash 0731）靠仓库内已有的检点编号区分先后 ——
> 这类「同版本号不同检点」的情况由人工顺序决定，测试只要求版本号不递增。

## 2. 路由

| URL | 说明 |
| --- | --- |
| `/{-locale}/series` | 索引页：每条产品线一张卡片（版本数、最新版、最便宜版） |
| `/{-locale}/series/$slug` | 产品线页：版本阶梯 + 逐代变化 + 跑分 + 成本 |
| `/{-locale}/series/$slug/$pair` | 两个版本的对比页：`opus-5.5-vs-opus-5` |

`$pair` 用成员短键，顺序无关（`a-vs-b` 与 `b-vs-a` 指向同一页）。
**跨产品线的对比不走这里** —— 那是 `/compare/$pair` 的事。

## 3. 页面版式（产品线页）

```
[SiteNav]
[Header]  kicker「Version series」/ H1「{series} versions compared」/ 一句话导语
[结论块]  ← 实时算出来的判断句
[版本阶梯表]  ← 核心表：版本 / 档位 / 状态 / 发布日 / 输入 / 输出 / 缓存 / 上下文 / 混合价 / 样例月成本
[逐代变化]  ← 每一代一张卡片：价格怎么动、上下文怎么变、两个版本都公布的基准差多少
[跑分矩阵]  ← 复用 CompareResult；不足两个版本有跑分时渲染诚实的空状态
[该用哪一版]  ← 按档位各给一个在售的最新版本
[成本计算器]  ← 按 REGISTRY 行算，所以没有 LEADERBOARD 行的版本也算得出
[来源]  ← 每个版本的官方定价页 + lastVerified
[同线的其他两两对比]  ← 站内互链，把 46 个 pair 页串起来
[发布解读]  ← 如果这一代有发布文，链过去
[Footer]
```

对比页（`$pair`）是同一套积木的子集：结论块 + 两行阶梯表 + 跑分矩阵 + 成本计算器。

## 4. 渲染时取数（`data.ts`）

| 函数 | 干什么 |
| --- | --- |
| `seriesRows(series)` | 每个成员解析成一行：价格、上下文、状态、样例月成本、核心均分 |
| `seriesSteps(rows)` | 相邻两代之间的**可证明**变化（价格 / 上下文 / 共有基准） |
| `seriesVerdict(rows)` | 结论块的数据 |
| `seriesScoreModels(series)` | 该产品线里**有可溯源跑分**的 LEADERBOARD 行 |
| `pairVerdict(a, b)` | 两个版本的对比结论 |

### 几条容易写错的判断

- **「哪个版本最强」只能在共有基准上算。** Claude Opus 5.5 只有 4 项跑分，
  Opus 5 有 16 项 —— 拿各自的均分比是不公平的。`seriesVerdict` 先取所有有跑分的
  成员**都公布**的基准集合，再在这个集合上取均分；集合为空就不给结论。
- **跑分结论比的是「最近两个有跑分的版本」**，不是产品线的首尾 ——
  最早的那一版通常根本没有跑分。
- **样例月成本**用 `1M input + 500K output`（与发布解读同一个口径）。
  触发了长上下文阶梯的模型，行内会标出实际应用的规则。

## 5. 首期 10 条产品线

| slug | 产品线 | 成员（新 → 旧） |
| --- | --- | --- |
| `claude-opus` | Claude Opus | 5.5 / 5 / 4.8 / 4.7 / 4.6 / 4.5 |
| `claude-sonnet` | Claude Sonnet | 5 / 4.6 / 4.5 |
| `claude-fable` | Claude Fable | 5.1 / 5 |
| `gpt-6` | GPT-6 | astra / sol / luna |
| `gpt-5` | GPT-5 | 5.6 cyber / 5.6 sol / 5 / 5 mini / 5 nano |
| `gemini-3` | Gemini 3 | 3.8 Flash / 3.1 Pro / 3.1 Flash-Lite |
| `gemini-2-5` | Gemini 2.5 | 2.5 Pro / 2.5 Flash / 2.5 Flash-Lite |
| `deepseek-v4` | DeepSeek V4 | V4.1-Flash 1017 / V4.1-Flash 0910 / V4-Pro / V4-Flash 0731 |
| `minimax-m3` | MiniMax M3 | M3.1 Flash / M3 |
| `grok-4` | Grok 4 | 4.7 / 4 |

**没有**做成产品线的 family 写在 `series.ts` 的 `FAMILY_EXCLUSIONS` 里，附理由：

- `gpt-4` —— 4.1 世代已被完全取代，价格也是旧的，做出来只是 GPT-5 阶梯的副本。
- `o-series` —— o1-pro / o3 / o3-mini 的档位与世代同时错位，排成一条阶梯
  会读成一段并不存在的产品史。

## 6. 校验（必须有测试）

`src/features/series/__tests__/series.node.test.ts` —— 机器检查：

1. slug 唯一且 URL 安全；每条线至少 2 个成员；成员键在产品线内唯一且不含 `-vs-`。
2. 每个 `priceId` 都能在 REGISTRY 找到；每个 `scoreId` 都能在 LEADERBOARD 找到。
3. 有价格行的成员，其 `family` 必须等于产品线的 `family`。
4. 版本号自上而下不递增。
5. **不漏版本**：某个 family 下的每个 REGISTRY 模型都必须出现在该产品线里；
   否则要么进产品线，要么在 `FAMILY_EXCLUSIONS` 里写明理由。
6. `FAMILY_EXCLUSIONS` 里的 family 必须真实存在且成员数 ≥ 2（为 1 个成员
   的 family 立豁免是废话）。
7. pair slug 往返一致；`a-vs-b` 与 `b-vs-a` 指向同一对；别的产品线的键在本线解析不出来。
8. `seriesRows` 每成员一行、`isNewest` 只在第一行、`isCheapest` 只在混合价最低的行。
9. `seriesSteps` 的每一条变化（比例、差值）都能用 `from`/`to` 反算出来。

## 7. i18n 键位

`series` 块（en / zh 结构完全一致，zh 是原生重写）：

- `nav` `indexTitle` `indexKicker` `indexIntro` `indexMetaDescription`
- `pageTitle` `pageMetaTitle` `pageMetaDescription`（都带 `{series}`）
- `ladderTitle`（带 `{series}`）`ladderSubtitle` `ladderNote`
  `pairLadderTitle`（对比页那张两行表）`pairLinksTitle`（带 `{series}`，两两对比链接块的标题）
  `jsonLdName`（带 `{series}`，结构化数据的名字）
- 列表头：`colVersion` `colTier` `colStatus` `colReleased` `colInput` `colOutput`
  `colCached` `colContext` `colBlended` `colSampleCost`
- `statusActive` `statusLegacy` `statusRetired`
- `tierFlagship` `tierBalanced` `tierFast` `tierLite`
- `latestTag` `cheapestTag` `versionCount`
- 结论块：`verdictTitle` `verdictCheaper` `verdictPricier` `verdictSamePrice`
  `verdictScoreHigher` `verdictScoreLower` `verdictNoScores` `verdictCheapest`
  `verdictBest` `verdictLegacy`
- 逐代变化：`changesTitle` `changesSubtitle` `changePrice` `changePriceSame`
  `changeContext` `changeScore` `changeUp` `changeDown` `changeSame` `changeNoChange`
  （价格没动的版本不进变化列表 —— 「没变」不是变化）
- 跑分：`scoresTitle` `scoresSubtitle` `scoresEmpty` `scoresSingle` `scoresNote` `scoreCount`
- 成本：`costTitle` `costSubtitle` `costNote` `callsPerMonth` `inputTokens` `outputTokens`
- 选型：`whichTitle` `whichFlagship` `whichBalanced` `whichFast` `whichLite`
- 对比页：`pairTitle`（带 `{a}` `{b}`）`pairMetaDescription` `siblingsTitle`
- 杂项：`sourcesTitle` `sourceVerified` `modelPage` `modelLink` `runUsage`
  `interactiveCompare` `releaseAnalysis` `backToIndex` `empty` `offPeak`

## 8. SEO

- `/series`、`/series/$slug`、`/series/$slug/$pair` 全部进 `sitemap.xml`。
- 产品线页与对比页的 JSON-LD 用 `ItemList`（成员 → 模型页 URL），
  走 `localeHead({ scripts: [jsonLd(obj)] })` —— `scripts[]` 会被静默丢弃，
  必须走 `meta`。
- canonical / hreflang 用 `localeHead({ path })`，zh 自动带 `/zh` 前缀。
- 站内互链：模型页 → 所属产品线；产品线页 → 成员模型页、发布解读、
  `/compare` 交互工具（预选有跑分的成员）、同线的两两对比页。

## 9. 与其他表面的关系

版本系列是**派生表面**：它不存自己的数字，只存键。所以它自动跟着
REGISTRY / LEADERBOARD 走 —— 改价、改分、退役一个版本，产品线页跟着变，
不需要再改一次文章。

> 例外：发布解读（`/releases`）在改价后需要人重读一遍正文、把 `dataCheckedAt`
> 推到今天；产品线页不需要，因为它的正文也是实时算出来的。
