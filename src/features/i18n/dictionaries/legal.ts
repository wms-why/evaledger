/**
 * 法务页正文（/terms、/privacy）。放在 dictionaries/ 下但独立于 en.ts/zh.ts：
 * 正文是结构化段落数组，translate() 只取字符串路径，取不到数组。
 *
 * TODO(上线前)：
 *  - 把 "EvalLedger, Inc." 换成实际注册主体全称与注册地址。
 *  - 接入 AI 供应商后，在 terms §4 / privacy §3 点名供应商，并核对其训练与留存政策。
 *  - 让法务过一遍仲裁条款与责任上限（各州对消费者合同的可执行性不同）。
 */

export interface LegalSection {
  heading: string
  body: string[]
  bullets?: string[]
}

export interface LegalDoc {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export interface LegalDocs {
  terms: LegalDoc
  privacy: LegalDoc
}

const CONTACT = 'hello@evaledger.com'

const enDocs: LegalDocs = {
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: August 12, 2026',
    intro:
      `These Terms of Service (the “Terms”) are an agreement between you and EvalLedger, Inc., a Delaware corporation (“EvalLedger”, “we”, “us”). They govern your use of evaledger.com and the EvalLedger application (together, the “Service”). By creating an account or using the Service, you agree to these Terms. If you do not agree, please do not use the Service.`,
    sections: [
      {
        heading: '1. The Service and who may use it',
        body: [
          'EvalLedger is an online token-cost calculator for LLM APIs. You paste prompts, set usage assumptions, and compare estimated cost across models and providers. We also publish a machine-readable price feed at /api/prices.json.',
          'You must be at least 13 years old (16 in the EEA and the UK) and able to form a binding contract where you live. If you use the Service on behalf of an organisation, you confirm you are authorised to bind it to these Terms.',
          `You are responsible for your credentials and for everything that happens under your account. Email ${CONTACT} promptly if you suspect unauthorised access.`,
        ],
      },
      {
        heading: '2. Plans, billing and cancellation',
        body: [
          'The Free plan is free for as long as you use it, within its published limits. Paid plans are billed in advance through Stripe; we never receive or store your full card details.',
          'Subscriptions renew automatically at the then-current price until you cancel. You can cancel at any time from Account → Billing, and your paid access continues until the end of the period you have already paid for.',
          'We may change prices or plan limits. We will give you at least 30 days’ notice before a change applies to your renewal; continuing to use a paid plan after that means you accept the new price.',
          'Except where the law requires otherwise, payments are non-refundable, including for partial billing periods. If a renewal payment fails and is not resolved, your account may be downgraded to the Free plan.',
        ],
      },
      {
        heading: '3. Your content',
        body: [
          'You keep every right you already have in what you paste into the calculator. We claim no ownership of your prompts or input text.',
          'You grant us a limited, worldwide, royalty-free licence to host, store, back up, transmit and display your content solely in order to operate the Service for you — and, where you ask for help or we investigate abuse, to review it to the minimum extent needed. The licence ends when you delete the content or your account.',
          'We run backups, but they are not a substitute for your own. Export your data regularly.',
        ],
      },
      {
        heading: '4. Pricing data and AI features',
        body: [
          'Pricing data is sourced from each provider’s official pricing page and re-verified on a regular cadence. Provider prices change without notice — the “Updated YYYY-MM-DD” stamp on each card reflects the last verification, and /api/prices.json reflects the same.',
          'Where applicable, AI-assisted features (if any) produce output via statistical models. Treat AI output as a draft suggestion — not as advice, and not as a guarantee of accuracy.',
          'Do not use the Service to generate unlawful, infringing, deceptive or harmful material.',
        ],
      },
      {
        heading: '5. Acceptable use',
        body: ['When using the Service, you agree not to:'],
        bullets: [
          'upload or generate content that is unlawful, infringing, defamatory, or sexually exploitative of minors;',
          'share one account among multiple people, or resell or sublicense the Service;',
          'scrape, crawl or bulk-download the Service, or bypass rate limits, quotas or plan restrictions;',
          'reverse-engineer, probe or attack the Service, or attempt to access data that is not yours;',
          'upload malware, or use the Service to send spam or to impersonate others.',
        ],
      },
      {
        heading: '6. Disclaimers and limitation of liability',
        body: [
          'The Service is provided “as is” and “as available”. We do not warrant that it will be uninterrupted, error-free, or that pricing estimates will match your bill exactly. To the fullest extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular purpose and non-infringement.',
          'To the maximum extent permitted by law, we are not liable for indirect, incidental, special or consequential damages, or for lost profits, lost data or lost goodwill. Our total aggregate liability for any claim is limited to the greater of US$100 or the amount you paid us in the 12 months before the claim arose.',
          'Some jurisdictions do not allow these exclusions, so parts of this section may not apply to you.',
        ],
      },
      {
        heading: '7. Termination, changes and governing law',
        body: [
          'You may stop using the Service at any time and delete your account from Account settings; deletion removes your saved inputs as described in the Privacy Policy.',
          'We may suspend or terminate an account that breaches these Terms or creates legal or security risk, with notice where that is practical.',
          'We may update these Terms. For material changes we will notify you by email or in the app before they take effect, and we will always update the date at the top of this page.',
          'These Terms are governed by the laws of the State of Delaware, USA, without regard to its conflict-of-laws rules. Before filing a claim, both sides agree to try to resolve the dispute informally by email for 30 days. If that fails, disputes will be resolved by binding individual arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, seated in Delaware — not in a class or representative action. Either side may still bring a qualifying claim in small-claims court. You may opt out of arbitration within 30 days of first accepting these Terms by emailing us.',
          `Questions about these Terms: ${CONTACT}.`,
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: August 12, 2026',
    intro:
      `This Privacy Policy explains what EvalLedger, Inc. (“EvalLedger”, “we”, “us”) collects when you use evaledger.com and the EvalLedger application, why we collect it, who we share it with, and the control you have. Questions? Email ${CONTACT}.`,
    sections: [
      {
        heading: '1. What we collect',
        body: ['We collect only what the Service needs to work:'],
        bullets: [
          'Account data — your name, email address and a hashed password. If you sign in with Google or GitHub, we receive the basic profile they return (provider id, name, email, avatar URL); we never receive your password for those accounts.',
          'Calculator inputs — any text you paste into the calculator (we use it to count tokens and only retain it as long as your session is active), any feedback you send us, and any avatar image you upload.',
          'Billing data — payments are processed by Stripe. We store your Stripe customer and subscription identifiers, plan, status and renewal date. We never see or store full card numbers.',
          'Technical data — IP address, user agent and timestamps in server logs, kept briefly for security and debugging, plus cookieless Cloudflare Web Analytics (aggregate page views, no cross-site tracking and no advertising profiles).',
          'Cookies — a session cookie to keep you signed in, and preference cookies for language and theme. We do not use advertising cookies.',
        ],
      },
      {
        heading: '2. How we use it',
        body: [
          'We use your data to provide and maintain the Service, count tokens, process payments, and send transactional email (verification, password reset, plan changes) through Resend. We also use it to protect the Service against fraud and abuse — public forms are protected by Cloudflare Turnstile — and to understand aggregate usage so we can improve the product.',
          'Where the GDPR or UK GDPR applies, our legal bases are: performance of our contract with you (providing the Service and billing), our legitimate interests (security, abuse prevention, product improvement), your consent where we ask for it, and compliance with legal obligations (tax and accounting records).',
          'We do not use your inputs to build advertising profiles, and we do not sell them.',
        ],
      },
      {
        heading: '3. AI features',
        body: [
          'The calculator itself runs without sending your text to any LLM — token counting happens in your browser (OpenAI family) or via a local heuristic (everyone else).',
          'Where AI-assisted features are added in the future, the relevant input will be sent to our third-party provider so it can produce a response. Nothing is sent unless you trigger an AI feature, and we will document each one in this policy.',
          'We do not train our own models on your inputs, and we do not sell them.',
        ],
      },
      {
        heading: '4. Who we share it with',
        body: [
          'We do not sell personal information, and we do not share it for cross-context behavioural advertising. We share data only with service providers who process it on our behalf, under contract:',
        ],
        bullets: [
          'Cloudflare — hosting, database (D1), file storage (R2), caching (KV), Web Analytics and Turnstile;',
          'Stripe — payment processing and subscription management;',
          'Resend — transactional email delivery;',
          'our AI provider — processing the text you submit to AI features, if and when you trigger them;',
          'Sentry — error reports, if enabled for the deployment you use.',
        ],
      },
      {
        heading: '5. Retention, security and international transfers',
        body: [
          'We keep your account for as long as your account is active. When you delete your account, your saved inputs and uploaded files are removed from live systems within 30 days and from backups within 90 days. Billing and tax records are retained for as long as the law requires — typically seven years.',
          'We protect your data with encryption in transit, hashed passwords, scoped access to production systems, and regular dependency updates. No online service can promise perfect security, but we will notify you and the relevant authorities of a breach where the law requires it.',
          'The Service runs on Cloudflare’s global network, so your data may be processed in the United States and other countries. Where personal data leaves the EEA or the UK, we rely on the European Commission’s Standard Contractual Clauses and the UK Addendum.',
        ],
      },
      {
        heading: '6. Your rights and choices',
        body: [
          'You can view and correct your profile, change your password, and permanently delete your account and its data from Account settings at any time.',
          'If you are in the EEA or the UK, you also have the rights of access, rectification, erasure, restriction, portability and objection, and you may complain to your local supervisory authority. If you are in California, you have the right to know, delete and correct your personal information, to opt out of its sale or sharing (we do neither), and not to be discriminated against for exercising those rights.',
          `To exercise any of these rights, email ${CONTACT}. We will respond within 30 days, and we may need to verify your identity first.`,
          'The Service is not intended for children under 13. If you believe a child has given us personal information, contact us and we will delete it.',
          'We may update this policy. Material changes will be announced by email or in the app before they take effect, and the date at the top of this page always reflects the current version.',
        ],
      },
    ],
  },
}

const zhDocs: LegalDocs = {
  terms: {
    title: '服务条款',
    updated: '最后更新：2026 年 8 月 12 日',
    intro:
      '本《服务条款》（下称“本条款”）是你与美国特拉华州公司 EvalLedger, Inc.（下称“EvalLedger”“我们”）之间的协议，适用于你对 evaledger.com 及 EvalLedger 应用（合称“本服务”）的使用。注册账号或使用本服务即表示你接受本条款；若不接受，请勿使用本服务。',
    sections: [
      {
        heading: '一、服务内容与使用资格',
        body: [
          'EvalLedger 是一款面向 LLM API 的在线 token 成本计算器。你可以粘贴提示词、设定用量假设，并对比各模型与厂商的预估成本。我们也在 /api/prices.json 上提供机器可读的价格数据。',
          '你需年满 13 周岁（欧洲经济区与英国为 16 周岁），并在所在地具备订立合同的能力。若你代表机构使用本服务，即表示你已获授权使本条款对该机构生效。',
          `你需自行保管账号凭据，并对账号下发生的一切行为负责。如发现账号被未经授权访问，请尽快联系 ${CONTACT}。`,
        ],
      },
      {
        heading: '二、套餐、计费与取消',
        body: [
          '免费版在其公布的额度内长期免费。付费版通过 Stripe 预先扣费，我们不会接触或存储你的完整银行卡信息。',
          '订阅在你取消前将按当时价格自动续费。你可随时在「账户 → 订阅」中取消，已付费周期内的权益保留至该周期结束。',
          '我们可能调整价格或套餐额度。价格变动会在对你续费生效前至少提前 30 天通知；继续使用付费版即视为接受新价格。',
          '除法律另有强制规定外，已支付费用不予退还，未使用的部分周期亦同。若续费扣款失败且未及时处理，账号可能被降级为免费版。',
        ],
      },
      {
        heading: '三、你的内容',
        body: [
          '你粘贴进计算器的文本，权利依旧归你。我们不主张对你的输入内容享有任何所有权。',
          '你授予我们一项有限的、全球范围的、免版税的许可，仅用于为你运行本服务而托管、存储、备份、传输和展示你的内容；在你请求支持或我们调查滥用行为时，我们仅在必要的最小范围内查看。该许可在你删除相应内容或账号时终止。',
          '我们会做备份，但备份不能替代你自己的副本，请定期导出你的数据。',
        ],
      },
      {
        heading: '四、价格数据与 AI 功能',
        body: [
          '价格数据取自各厂商官方定价页，按固定周期复核。厂商价格可能未经通知而变动——每张卡片顶部的「更新于 YYYY-MM-DD」戳反映最近一次复核，/api/prices.json 反映同一份数据。',
          'AI 辅助功能（如有）输出由统计模型生成，请将其作为草稿建议，而非专业意见，也不构成对账单精确性的保证。',
          '不得利用本服务生成违法、侵权、欺骗性或有害的内容。',
        ],
      },
      {
        heading: '五、可接受使用',
        body: ['使用本服务时，你同意不进行以下行为：'],
        bullets: [
          '上传或生成违法、侵权、诽谤性内容，或涉及未成年人的性剥削内容；',
          '多人共用同一账号，或转售、再许可本服务；',
          '抓取、爬取或批量下载本服务，或绕过速率限制、配额与套餐限制；',
          '逆向工程、探测或攻击本服务，或试图访问不属于你的数据；',
          '上传恶意程序，或利用本服务发送垃圾信息、冒充他人。',
        ],
      },
      {
        heading: '六、免责声明与责任限制',
        body: [
          '本服务按“现状”和“可获得”状态提供。我们不保证服务不中断、无差错，也不保证价格估算与你的实际账单完全一致。在法律允许的最大范围内，我们不作出适销性、特定用途适用性及不侵权的默示担保。',
          '在法律允许的最大范围内，我们不对间接、附带、特殊或后果性损失，以及利润损失、数据损失、商誉损失承担责任。对任何索赔，我们的累计责任上限为 100 美元与你在索赔发生前 12 个月内向我们支付金额中的较高者。',
          '部分法域不允许上述排除或限制，因此本节的部分内容可能对你不适用。',
        ],
      },
      {
        heading: '七、终止、变更与适用法律',
        body: [
          '你可随时停止使用本服务，并在账户设置中删除账号；删除后你保存的输入将按《隐私政策》所述处理。',
          '对违反本条款或造成法律、安全风险的账号，我们可暂停或终止服务；在可行的情况下会提前通知。',
          '我们可能更新本条款。重大变更会在生效前通过邮件或应用内通知你，页面顶部的更新日期始终反映当前版本。',
          '本条款受美国特拉华州法律管辖，不适用其法律冲突规则。提起正式主张前，双方同意先通过邮件进行为期 30 天的友好协商；协商未果的，争议将提交美国仲裁协会（AAA）依其《消费者仲裁规则》在特拉华州进行具有约束力的个人仲裁，不以集体或代表人诉讼方式进行。任何一方仍可就符合条件的主张向小额索赔法院起诉。你可在首次接受本条款后 30 天内邮件通知我们，选择退出仲裁条款。',
          `关于本条款的问题，请联系 ${CONTACT}。`,
        ],
      },
    ],
  },
  privacy: {
    title: '隐私政策',
    updated: '最后更新：2026 年 8 月 12 日',
    intro:
      `本《隐私政策》说明当你使用 evaledger.com 及 EvalLedger 应用时，EvalLedger, Inc.（下称“我们”）收集哪些信息、为何收集、与谁共享，以及你拥有哪些控制权。如有疑问，请联系 ${CONTACT}。`,
    sections: [
      {
        heading: '一、我们收集哪些信息',
        body: ['我们只收集运行服务所必需的信息：'],
        bullets: [
          '账号信息——你的姓名、邮箱地址与经哈希处理的密码。若你使用 Google 或 GitHub 登录，我们会收到其返回的基础资料（第三方账号 ID、姓名、邮箱、头像地址）；我们不会收到你在这些平台的密码。',
          '计算器输入——你粘贴进计算器的文本（用于 token 计数，仅在你的会话存续期间保留），你提交的反馈，以及你上传的头像图片。',
          '计费信息——支付由 Stripe 处理。我们仅存储 Stripe 客户与订阅标识、套餐、状态和续费日期，不会接触或存储完整卡号。',
          '技术信息——服务器日志中的 IP 地址、浏览器标识与时间戳，仅短期保留用于安全与排障；以及无 Cookie 的 Cloudflare Web Analytics（聚合页面访问量，不做跨站跟踪，不构建广告画像）。',
          'Cookie——用于保持登录状态的会话 Cookie，以及记录语言与主题的偏好 Cookie。我们不使用广告 Cookie。',
        ],
      },
      {
        heading: '二、我们如何使用这些信息',
        body: [
          '我们使用这些信息来提供与维护服务、进行 token 计数、处理支付，并通过 Resend 发送事务性邮件（验证、重置密码、套餐变更）；同时用于防范欺诈与滥用（公开表单由 Cloudflare Turnstile 保护），以及通过聚合的使用情况改进产品。',
          '在适用 GDPR 或英国 GDPR 的情形下，我们的合法性基础为：履行与你的合同（提供服务与计费）、正当利益（安全、防滥用、产品改进）、你的同意（我们征求同意时），以及履行法定义务（税务与账簿记录）。',
          '我们不会用你的输入构建广告画像，也不会出售你的输入。',
        ],
      },
      {
        heading: '三、AI 功能',
        body: [
          '计算器本身不会把你的文本发送给任何 LLM——token 计数在你的浏览器里完成（OpenAI 系列）或在本地启发式（其余厂商）。',
          '若未来加入 AI 辅助功能，相应输入会被发送给第三方供应商以生成回应。除非你主动触发 AI 功能，否则不会发送任何内容；我们也会在本政策中逐项说明。',
          '我们不会用你的输入训练自有模型，也不会出售你的输入。',
        ],
      },
      {
        heading: '四、我们与谁共享',
        body: [
          '我们不出售个人信息，也不为跨场景行为广告而共享个人信息。我们仅与受合同约束、代表我们处理数据的服务提供方共享：',
        ],
        bullets: [
          'Cloudflare——托管、数据库（D1）、文件存储（R2）、缓存（KV）、Web Analytics 与 Turnstile；',
          'Stripe——支付处理与订阅管理；',
          'Resend——事务性邮件投递；',
          'AI 供应商——处理你提交给 AI 功能的文本（仅在你触发时）；',
          'Sentry——错误上报（若你所使用的部署启用了该功能）。',
        ],
      },
      {
        heading: '五、留存、安全与跨境传输',
        body: [
          '账号存续期间，我们会保留你的账号。删除账号后，你保存的输入与上传文件将在 30 天内从线上系统移除，并在 90 天内从备份中移除。计费与税务记录按法律要求留存，通常为七年。',
          '我们通过传输加密、密码哈希、生产系统的最小权限访问与依赖项定期更新来保护数据。没有任何在线服务能承诺绝对安全，但在法律要求时，我们会向你及相关监管机构通报数据泄露事件。',
          '本服务运行在 Cloudflare 的全球网络上，你的数据可能在美国及其他国家处理。个人数据离开欧洲经济区或英国时，我们依据欧盟委员会的标准合同条款（SCCs）及英国附录进行传输。',
        ],
      },
      {
        heading: '六、你的权利与选择',
        body: [
          '你可随时在账户设置中查看与更正个人资料、修改密码，并永久删除账号及其数据。',
          '若你位于欧洲经济区或英国，你还享有访问、更正、删除、限制处理、可携带与反对处理的权利，并可向当地监管机构投诉。若你位于加利福尼亚州，你享有知情、删除、更正个人信息的权利，可选择退出其出售或共享（我们两者都不做），且不会因行使权利而受到差别对待。',
          `行使上述权利请发送邮件至 ${CONTACT}。我们将在 30 天内回复，并可能需要先核验你的身份。`,
          '本服务不面向 13 周岁以下儿童。若你认为儿童向我们提供了个人信息，请联系我们，我们会予以删除。',
          '我们可能更新本政策。重大变更会在生效前通过邮件或应用内通知，页面顶部的日期始终反映当前版本。',
        ],
      },
    ],
  },
}

export const legalDocs = { en: enDocs, zh: zhDocs } as const