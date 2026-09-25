# TokenCalculator

> **看清你的 LLM token 在每一家主流模型上到底多少钱。**

一个跑在 **TanStack Start** + **Cloudflare Workers** 上的免费 token 成本计算器。粘贴提示词（或填每月用量）、选分词器家族，立刻拿到 OpenAI、Claude、Gemini、DeepSeek、Grok 的成本对比——同时给出 OpenRouter 加价系数,以及 Claude 订阅 vs API 的盈亏平衡点。

定价 registry 在 [`src/features/calculator/model-prices.ts`](src/features/calculator/model-prices.ts),每次刷新都会按文件头的「Refresh workflow」流程去各家厂商官方定价页核对。

**线上:** [tokencalculator.com](https://tokencalculator.com) · **文档:** [tokencalculator.com/docs](https://tokencalculator.com/docs)

---

## 功能

- **实时 token 计数** — OpenAI 系列用真实分词器(GPT-5 走 `o200k_base`,旧家族走 `cl100k_base`);Anthropic / Google / DeepSeek / Grok 走 CJK 感知的字符近似(英文误差 ~10%,中文 ~5%)。
- **逐模型成本拆解** — registry 里的每一个活跃模型,默认从低到高排序。可切换「从高到低」,按厂商筛选,点按钮把估算复制到剪贴板。
- **三个 SEO 落地页** — `/token-cost-calculator`、`/openrouter-pricing-calculator`、`/claude-token-cost-calculator`,各自配 Hero、TLDR、FAQ 与 Tips 区块。
- **Claude 盈亏平衡** — Claude 页算出了 Pro($20/月)与 Max($200/月)不再比 API 划算的临界点,按 Sonnet 4.5 的实时单价计算。
- **OpenRouter 加价系数** — registry 里存当前平均加价(默认 5%);每张对比卡都显示加价后的数字。
- **机器可读** — 同份数据通过 [`/api/prices.json`](src/features/calculator/api/prices.json.ts) 暴露,给 AI agent 和程序化访问用。

## 内置模块

| 模块 | 说明 |
|------|------|
| **计算器** | 产品本体。两种输入模式(粘贴 / 手工填)、实时分词、OpenRouter 感知成本网格、三个 SEO 路由。源码:[`src/features/calculator/`](src/features/calculator/)。 |
| **赞助** | 独立 `/sponsor` 页面,真实 Stripe 收款闭环(一次性 + 月度,WeChat Pay 走 Stripe)。自定义金额(PWYW)走 `price_data.recurring`。GitHub 头像墙按金额分层。 |
| **反馈箱** | 应用内反馈 + 后台治理(open / planned / shipped / closed + 一句话回复)。是任何新功能可参照的纵向切片范本。 |
| **认证** | 邮箱密码 + Google OAuth([better-auth](https://better-auth.com))。OAuth 按钮在 env 缺位时自动隐藏。 |
| **国际化** | 路径式语言路由(`/` = 英文,`/zh` = 中文)。字典在 [`src/features/i18n/dictionaries/`](src/features/i18n/dictionaries/)。 |
| **SEO** | 按语言生成 sitemap、`hreflang`、canonical URL、OpenGraph、`robots.txt`、JSON-LD(`Organization` + `SoftwareApplication/FinanceApplication` + `FAQPage`)。 |
| **后台** | 仅管理员可见的控制台:数据看板、用户搜索/封禁/模拟登录、候补名单 + 赞助 + 反馈治理。 |
| **主题** | 浅色/深色跟随系统偏好,cookie 持久化。 |

## 技术栈

- **[TanStack Start](https://tanstack.com/start)** (React 19,基于文件的路由,server functions)
- **[Cloudflare Workers](https://workers.cloudflare.com)** 运行时,通过 `@cloudflare/vite-plugin` 部署
- **[D1](https://developers.cloudflare.com/d1/)** (SQLite) + **[Drizzle ORM](https://orm.drizzle.team)**(账号、赞助、反馈、候补名单)
- **[KV](https://developers.cloudflare.com/kv/)** 缓存、**[R2](https://developers.cloudflare.com/r2/)** 头像存储
- **[better-auth](https://better-auth.com)** + **[Stripe](https://stripe.com)** + **[Resend](https://resend.com)**
- **[Tailwind CSS v4](https://tailwindcss.com)** + **[Vitest](https://vitest.dev)**(Node 单元测试 + Workers/D1 集成测试)

## 快速开始

```bash
pnpm install
cp wrangler.example.jsonc wrangler.jsonc
cp .dev.vars.example .dev.vars       # 本地全可选
pnpm db:migrate:local                # 应用 D1 迁移
pnpm dev                             # http://localhost:3000
```

### 常用脚本

```bash
pnpm dev               # vite dev,端口 3000
pnpm typecheck         # fumadocs-mdx && tsc --noEmit
pnpm test              # vitest run(node + workers 双池)
pnpm build             # vite build
pnpm db:generate       # 从 schema 变更生成 Drizzle 迁移
pnpm db:migrate:local  # 本地 D1 应用迁移
pnpm db:migrate:prod   # 生产 D1 应用迁移(见 docs/getting-started/deploy)
pnpm deploy:prod       # CLOUDFLARE_ENV=production build + wrangler deploy
```

## 刷新价格

计算器想保持准确,registry 必须跟上。流程写在 [`src/features/calculator/model-prices.ts`](src/features/calculator/model-prices.ts) 文件头:

1. 打开每条记录的 `sourceUrl`,核对 `inputPricePer1M` / `outputPricePer1M`。
2. 把 `lastVerified` 改成今天的 ISO 日期。
3. 更新 `REGISTRY.fetchedAt`,让页面显示「更新于 YYYY-MM-DD」。
4. 重跑 `pnpm test && pnpm typecheck`。

## 项目结构

```
src/
  features/
    calculator/    # 产品本体 — 定价 registry、成本计算、分词器、三个 SEO 路由
    auth/          # better-auth + 邮箱密码 + Google OAuth
    billing/       # Stripe 订阅 + 终身买断 + webhook
    sponsor/       # 一次性/月度 Stripe + GitHub 头像墙 + WeChat Pay
    feedback/      # 提交 + 后台治理 — 教学范本纵向切片
    i18n/          # en/zh 字典 + provider
    seo/           # sitemap、robots、locale head、JSON-LD 工具
    docs/          # fumadocs 源/布局 + llms.txt 生成
    admin/         # admin 插件接线 + 看板
    analytics/     # CF Web Analytics(可选)
    audience/      # Resend audience 同步(waitlist 复用)
    waitlist/      # 上线前候补登记 + Turnstile + Resend 同步
    changelog/     # 应用内 changelog 页面(MDX,按语言)
    storage/       # R2 上传 + serving route(头像上传参考实现)
    email/         # Resend 客户端 + 字符串模板
    maintenance/   # Cron 清理任务(过期会话/token/限流记录)
    theme/         # 浅色/深色主题切换
  routes/
    {-$locale}/    # 带语言前缀的页面:/、/zh、/admin、/app、/token-cost-calculator ...
    api/, docs/, docs-md/, llms.txt, robots.txt, sitemap.xml
  content/docs/    # 应用内文档(fumadocs mdx 源)
  db/              # Drizzle schema barrel + client + migrations
drizzle/           # 生成的 SQL 迁移
```

## 文档

文档随主应用一起发布——访问 `/docs` 即可阅读(基于 [Fumadocs](https://fumadocs.dev)):

- [`install.mdx`](src/content/docs/getting-started/install.mdx) — 本地启动
- [`deploy.mdx`](src/content/docs/getting-started/deploy.mdx) — 生产部署
- [`migrations.mdx`](src/content/docs/getting-started/migrations.mdx) — D1 迁移流程
- [`codebase.mdx`](src/content/docs/getting-started/codebase.mdx) — 目录结构
- [`environment.mdx`](src/content/docs/getting-started/environment.mdx) — 环境变量
- [`calculator.mdx`](src/content/docs/features/calculator.mdx) — 计算器内部
- [`billing.mdx`](src/content/docs/features/billing.mdx) — Stripe + 赞助循环
- [`storage.mdx`](src/content/docs/features/storage.mdx) — R2 对象存储
- [`cf-gotchas.mdx`](src/content/docs/platform/cf-gotchas.mdx) — Cloudflare/workerd 坑
- [`security.mdx`](src/content/docs/platform/security.mdx) — 安全头/CSP、env 校验、限流

## 致谢

本项目 fork 自 [FlareStarter](https://github.com/FlareStarter/flarestarter)——一个 Cloudflare-native SaaS starter,为我们提供了 auth、billing、i18n、admin 外壳与 Workers/D1 接线。本仓库目前大部分逻辑围绕计算器产品,但 auth/billing/sponsor/admin 这些横切模块基本是原版 FlareStarter + 品牌替换。

## 贡献与支持

- **遇到问题?** [GitHub Issues](https://github.com/ymk/tokencalculator/issues)
- **本地启动 / 约定:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **变更记录:** [`CHANGELOG.md`](CHANGELOG.md)

## 赞助

❤️ [赞助本项目](https://tokencalculator.com/sponsor)——你的头像会出现在官网赞助墙,并用于支持价格刷新、新计算器开发与维持免费服务的基础设施。

## 许可证

[Apache License 2.0](LICENSE)。Copyright 2026 TokenCalculator.