# scripts — 抓取的标准流程

这个仓库有两个抓取脚本：`scripts/prices/`（价格表）和 `scripts/releases/`（发布公告草稿）。
它们共用一个浏览器启动器（`scripts/shared/browser.ts`）和同一套纪律。
**给一个厂商链接时，按本文的流程走** —— 2026-10-27 抓 GPT-6.1 Terra
（`https://openai.com/zh-Hans-CN/index/introducing-gpt-6-1-terra/`）踩过的坑，
都记在下面了。

## 0. 一句话版本

给定一个厂商链接：① 判断页面类型（公告页 / 定价页）；② 用共享浏览器抓；
③ **正文缺失时按 §3 的阶梯排查**（先怀疑指纹，别急着改选择器）；
④ 公告里的价格与厂商定价页交叉核对；⑤ 结果只落成**草稿**，绝不写进 `src/content/`；
⑥ 给人工留一份 §7 的清单。

## 1. 先分清页面类型

| 页面 | 用途 | 落点 |
|---|---|---|
| 发布公告（announcement） | 「发布了什么」的事实与散文 | release 草稿 + changelog 草稿 |
| API 定价页（pricing） | 价格的**出处**（source of record） | REGISTRY 价格行 |

两者常常都要：公告里会引用价格，定价页才是价格的出处。一个厂商可以同时有
两个页面 —— 抓取注册表按 **slug** 建键（见 §6）。

## 2. 浏览器指纹：提示头不是可选项

共享启动器 `scripts/shared/browser.ts` 每次都发：

- 一个桌面版 UA；
- 与该 UA **版本一致**的 `Sec-CH-UA` / `Sec-CH-UA-Mobile` / `Sec-CH-UA-Platform`。

**为什么不能省**：在 Playwright 里覆盖 user agent 会让 Chromium **丢掉客户端提示**，
而 openai.com 对「没有提示的请求」回一个 HTTP 200、正文却是
「500 / Internal Server Error.」的错误壳。这个壳保留了 `<title>` 和 `og:` 元数据、
只丢了正文，看起来像「页面坏了」，实际是「你的请求像个机器人」。

对照实验（2026-10-27，openai.com/zh-Hans-CN/index/introducing-gpt-6-1-terra/）：

| 请求 | 结果 |
|---|---|
| UA 124，无提示头 | 200，正文 = 500 错误壳（52 字符） |
| UA 124 + 提示头 124 | 200，正文 = 公告全文（2500 字符） |
| UA 140，无提示头 | 200，正文 = 500 错误壳 |
| UA 140 + 提示头 140 | 200，正文 = 公告全文（2500 字符） |
| 不覆盖 UA（HeadlessChrome 出现在提示头里） | 403 |

所以：**不要**为了「修好某个页面」去删提示头；反过来，页面 200 但正文是个 500，
先去核对提示头。

## 3. 正文抓不到时的排查阶梯

按这个顺序走，从便宜到贵：

| 症状 | 多半是 | 怎么办 |
|---|---|---|
| HTTP 403，0 字符 | 被当成机器人拦了（提示头里露了 `HeadlessChrome`） | 保留 UA 覆盖 + 提示头；放慢频率；别硬刚 |
| HTTP 200，标题/`og:` 都在，正文是「500 / Internal Server Error.」 | **缺客户端提示** | 回 §2：查提示头，不是选择器 |
| HTTP 200，正文只有站点导航 | 客户端渲染，没等到 hydration | 等 `networkidle`；检查 content 选择器 |
| 正文在，但抓错了元素 | 选择器漂移 | 打开 `.tmp/<slug>-fail.html` 看 DOM，**在选择器列表前面**加一条（先匹配先用） |
| 换个语言版本就正常 | 该路由/该语言版本单独渲染坏了 | 试 `/en-US/`、`/ja-JP/`、`/am-ET/` —— 同一篇公告 |
| 同站别的页正常、就这一页不行 | 这一条路由的数据源坏了 | 过一阵重试；可能是 CMS 的临时错误 |
| 标题/正文都拿到了但少了小节 | 该页的标题不是 `h2/h3` | 页面里可能是 `strong` 之类的假标题 → 用 `headingFallback` |

顺序很重要：**先查指纹**（最便宜，而且能解释「200 但正文是 500」这种最像 bug 的症状），
再查选择器。

## 4. 数字要交叉核对

公告里的价格是**厂商的说法**，定价页是**价格的出处**。

- 抓完公告，用 `pnpm prices:fetch -- --only <vendor>` 把同一家厂商的定价页也抓一遍，
  拿模型那一行跟公告对照。
- 对不上：信定价页，回头重读公告。
- 公告里的跑分是厂商自测口径，**不会**自动变成 LEADERBOARD 的一行 ——
  只有能溯源的成绩才登记。

抓价格表时**按表头名取列，不要按列号**（`scripts/prices/sources/openai.ts` 现在这么做）：
线上表头是 `Model / Input / Output / Cached input / 30m write / 12h write`，
按位置读会把 output 读成「30m write」、把 cached 读成 output —— 这种错位会一路
写进发布出去的价格。

## 5. 落盘：只落草稿

| 产物 | 路径 |
|---|---|
| release 草稿 | `data/release-drafts/<slug>.md` + `<slug>.json` |
| changelog 草稿 | `data/release-drafts/changelog/<slug>.md` + `<slug>.changelog.json` |

- 写入器**拒绝** `src/content/` 下的任何路径（发布内容是人写的，改动要在 diff 里被审）。
- 脚本填：页面标题、日期、小标题、正文纯文本，以及可溯源的事实。
- 脚本**不填**：`modelId` / `modelSlug` / `compareModelIds` / `compareSlugs` /
  `releasedAt` / 价格 / 跑分 / 结论。
- 草稿不会自动被覆盖（要 `--force` 才覆盖）—— 草稿是半成品，不是缓存。
- 每抓一个新模型，**同时**产出 changelog 草稿（见 `scripts/releases/README.md`）。

## 6. 一个厂商多个链接

发布抓取注册表按 **slug** 建键（`RELEASE_SCRAPERS[slug]`），厂商 id 仍挂在源上。
新增一个公告页 = 加一个 source（URL + 契约标题 + 选择器 + 注意事项），
注册到 `RELEASE_SOURCES` 与 `RELEASE_SCRAPERS`，把 URL 与标题写进契约
（`src/features/releases/README.md`），更新测试，bump `SCRIPT_VERSION`。
详见 `scripts/releases/README.md` § "Adding a new source"。

**slug 怎么取**：跟公告 URL 的 slug 走，去掉 `introducing-` 前缀，点换横线，全小写 ——
`introducing-gpt-6-1-terra` → `gpt-6-1-terra`。

## 7. 交给人的清单

抓完只是「把官方公告抄下来了」。发布这篇东西还需要（脚本一件都不做）：

- [ ] REGISTRY 价格行（价格 / 上下文 / `lastVerified` / `fetchedAt`）
- [ ] LEADERBOARD 跑分行（只登记可溯源的成绩）+ `priceId` 指回 REGISTRY
- [ ] records 台账条目（`pnpm records:pins`）
- [ ] series 成员（这条产品线有 series 的话）
- [ ] release 文章 `<slug>.md` + `<slug>.zh.md`（中文版是**重写**，不是翻译）+ `dataCheckedAt` 推到当天
- [ ] changelog 正式条目 `<version>-<slug>.md` + `.zh.md`，`published: true`
- [ ] `pnpm typecheck && pnpm test`（外加受影响页面的单个 e2e spec）

## 8. 排错速查

| 想做什么 | 用什么 |
|---|---|
| 抓发布公告 | `pnpm releases:fetch -- --slug <slug>` |
| 抓价格 | `pnpm prices:fetch -- --only <vendor>` |
| 看所有源和它们的注意事项 | `pnpm releases:fetch -- --list` |
| 看失败的页面长什么样 | `.tmp/<slug>-fail.png` / `.tmp/<slug>-fail.html` |
| 改抓取逻辑 | `scripts/prices/sources/<vendor>.ts`、`scripts/releases/sources/<vendor>.ts` |

抓取脚本的版本号在 `scripts/<prices|releases>/version.ts`；**加新源就 bump**。

## 9. 相关文档

- `scripts/prices/README.md` —— 价格抓取 CLI
- `scripts/releases/README.md` —— 发布草稿抓取 CLI
- `src/features/releases/README.md` —— 发布系列契约（正文模板、来源、数字纪律）
