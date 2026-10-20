# Records — 一条模型版本就一条记录，旧数据不改

## 0. 铁律

> **每一次小版本迭代，都是一次「大模型版本发布」。**
> **旧数据默认不可改；只有发现记录错误时才改，而且必须留痕。**

DeepSeek 把 V4.1-Flash 当作同一个 API 模型名（`deepseek-flash`）下的滚动 checkpoint 来发：
0910 一版，1017 一版。**版本号没变，只是后缀变了 —— 这仍然是两个模型版本。**
把它们并成一行，等于让「发布公告测出来的成绩」冒充「今天 API 里的权重」。

所以：

| 情况 | 做法 |
| --- | --- |
| 厂商发新 checkpoint（哪怕只改后缀） | **新记录**：新的 REGISTRY id、新的 LEADERBOARD id、新的 release 文章（中英）、新的 ledger 条目；旧记录**退役**（`retiredAt` + 价格行转 `delisted`） |
| 厂商改价 | 改**在售**记录的价格 + `lastVerified` = 今天 + `fetchedAt` = 今天 + 重读受影响的文章并把 `dataCheckedAt` 推到今天。**在售价格不是被 pin 住的值** |
| 厂商对同一批权重重新测了一遍 | 同一记录的分数更新 + 在 `changes` 里记一条 `remeasurement`（写明新值来源） |
| **我们抄错了** | 同一记录的分数修正 + 在 `changes` 里记一条 `correction`（写明错在哪、正确值来自哪个页面） |
| 厂商下架了一个模型 | 记录退役：价格行转 `delisted`/`retired` + `retiredAt`；**文章永远不删**（长尾搜索入口） |

## 1. 三张表

一份「记录」横跨三张表，和 release 系列的「三者一体」是同一条纪律：

- 价格：`src/features/calculator/model-prices.ts` → `REGISTRY.models[]`
- 跑分：`src/features/leaderboard/models.ts` → `LEADERBOARD.models[]`
- 文章：`src/content/releases/<slug>.md` + `<slug>.zh.md`
- 记录台账：`src/features/records/ledger.ts` → `LEDGER`（**新增的第四张表：把「我们发布过什么」钉住**）

## 2. 加一个新 checkpoint（唯一的正确姿势）

1. **先建记录，不要改旧记录。**
   - 价格表加一行新 id（例如 `deepseek-flash-1017`），`family` 与旧行相同。
   - 榜单加一行新 id（例如 `deepseek-v4.1-flash-1017`），`version` 用**新的版本 token**（同一 family 内不能重复）。
   - 两行都写 `introduced`（发布日）；新行写 `supersedes: '<旧行的 id>'`。
   - 旧行写 `retiredAt`（退役日），旧价格行 `status: 'delisted'`。
2. **文章**：新 slug 一篇，中英各一，frontmatter 指向上面两个新 id。
3. **台账**：在 `src/features/records/ledger.ts` 加一条新记录；旧记录加 `retiredAt`（如果还没有）并 pin 住它的价格线。
4. `pnpm records:pins` 打印当前台账，照抄进 `ledger.ts`（它只打印，不写文件）。
5. `pnpm test` —— 台账护栏会检查：新记录有没有登记、旧记录有没有被改动。

> 旧记录的分数**一条都不要动**。新 checkpoint 的新分数写在新行里。

## 3. 发现记录错误时

在对应 ledger 条目的 `changes` 里加一条：

```ts
changes: [
  {
    date: '2026-10-20',
    field: 'scores.terminal-bench-4.0',   // scores.<benchmark> | notes.<benchmark> | prices.<slot> | identity.version | identity.displayName
    from: '31.2',
    to: '41.2',
    kind: 'correction',                   // correction = 我们抄错了；remeasurement = 厂商重测了同一批权重
    reason: 'The launch table column was read from the wrong row of the PDF.',
    sourceUrl: 'https://api-docs.deepseek.com/zh-cn/news/news260910/',
  },
]
```

然后把 pin 更新成修正后的值。护栏只认「有 `changes` 条目、且 `to` 等于新值」的改动；
没有条目的改动 = 直接改旧数据 = **构建失败**。

退役记录只接受 `correction`：它测的是没人再服务的权重，不存在「重新测量」。

## 4. 护栏查什么

`src/features/records/__tests__/records.node.test.ts`：

1. **每个价格行、每个榜单行都必须在台账里有一条记录** —— 新版本必须是新记录；
2. 台账指向的行必须存在，`supersedes` 必须指向另一条记录；
3. **pin 住的值不得静默改动** —— 分数、备注、身份（displayName / version）都在 pin 里；
   退役记录的价格线也 pin 住（在售记录的价格不 pin，价格会动，它有自己的一套纪律）；
4. 每条 `changes` 都要有日期、理由、来源；退役记录只允许 `correction`；
5. **取代别人的记录必须把被取代的退役**（`retiredAt` + 价格行非 active）；
6. 退役记录的价格行不能还是 `active`；
7. **同一 family 内版本 token 不能重复** —— 抓「版本号没变、只改后缀，却把旧行改掉了」这种操作。

## 5. 工具

```bash
pnpm records:pins            # 打印当前台账（与注册表对齐的版本）
pnpm records:pins deepseek   # 只打印匹配的行
```

它只读、只打印：台账是人工审阅过的文件，不自动合并。

## 6. 和别的机制的关系

- **release 系列的「三者一体」**：价格 + 跑分 + 文章必须一起动 —— 台账是它的第四面。
- **`LEADERBOARD.history`**：记录「某个分数被覆盖成新值」的历史；台账记录「这条记录发布过什么、什么时候改过、为什么改」。
- **`AGENTS.md` 的「Data moves as one」**：这里是它的规则版本。
