---
title: "DeepInfer 开源：DeepSeek 把 V4.1-Flash 背后的推理引擎放出来了"
description: "2026-10-20，DeepSeek 以 Apache-2.0 开源了生产环境在用的推理框架 DeepInfer：只支持一个模型、只认 SM100 与昇腾 950、不含服务化那三层。它不改价格——$0.30 / $1.20 一个子儿没动——但它解释了那个价格是怎么来的。附部署步骤与选型对照。"
date: "2026-10-23"
checkedAt: "2026-10-23"
dataCheckedAt: "2026-10-24"
releasedAt: "2026-10-20"
vendor: deepseek
modelId: deepseek-flash
modelSlug: deepseek-v4.1-flash-1017
compareModelIds:
  - deepseek-v4-pro
compareSlugs:
  - deepseek-v4.1-flash
  - kimi-k3
  - glm-5.3
  - gpt-5.6-sol
  - claude-opus-5
sourceUrl: "https://github.com/deepseek-ai/DeepInfer"
sourceTitle: "deepseek-ai/DeepInfer — High-performance, large-scale inference framework for DeepSeek models"
published: true
---

## 一句话结论

- **这是一次「服务栈」的开源，不是模型发布。** 2026-10-20，DeepSeek 把线上跑 V4.1-Flash 的推理框架 DeepInfer 以 Apache-2.0 放了出来。模型没变、价格没变、跑分没变。变的是：让 $0.30 / $1.20 这个价格成立的那套工程，现在是公开的了。
- **边界比功能表更重要。** DeepInfer 给的是引擎，不给 KV Cache 集群、不给 Prefill/Decode 分离调度、不给副本间负载均衡——而这三样才是一套「服务」。所以这次开源之后，自建 V4.1-Flash 仍然意味着那三块要你自己写。
- **门槛在硬件，而且很窄：NVIDIA SM100 或华为昇腾 950。** 手里的卡不是这两代，这次发布对你的能力边界改变为零；它也不会让你的 API 账单少一分钱。

## 发布了什么

- **一个服务框架，不是一个模型。** `deepseek-ai/DeepInfer`，Apache-2.0，2026-10-20 发布。它就是 DeepSeek 线上跑 V4.1-Flash 的那个框架，这次以离线推理引擎的形态开源。
- **只支持一个模型。** DeepSeek-V4.1-Flash，默认权重是 Hugging Face 上的 1017 checkpoint。它不是「恰好能跑 DeepSeek 模型」的通用引擎，而是为一种架构专门做的引擎。
- **只认两个平台。** 英伟达 SM100 GPU 与华为昇腾 950 NPU，分别对应 CUDA 13 和 CANN 9.2。支持列表就这两行。
- **真正决定吞吐的东西都在。** 融合算子（FlashMLA、DeepGEMM、DeepEP、TileKernels、DeepSelect 以及自研 TileLang 算子）、专家并行加专家并行负载均衡、DSpark 推测解码配合置信度调度的验证、用 SWA bounded replay 砍掉解码器预填充的开销、零开销的异步批调度、batch 不变性推理、确定性采样，以及编译成语法自动机的结构化输出。
- **它站在如今要竞争的这条栈上。** DeepInfer 自己的 README 写着：主体基于 vLLM 构建，并参考了 SGLang 与 TensorRT-LLM。这个出处很诚实，也直接决定了对比关系——它是一条为一个模型特化过的分支，被放进一堆通用引擎的生态里。
- **盒子里没有的东西，DeepSeek 自己列了：** KV Cache 系统、VE/Prefill/Decode 分离、以及 Prefill 与 Decode 两侧跨数据并行副本的负载均衡。框架里 `LLMEngine` 的注释同样直白——本次发布不包含在线服务的封装层。
- **还有一个配套的编解码组件。** 同一天开源的 `deepseek-recipe`，负责在 Chat Completions / Responses / Messages 三种协议和 DeepSeek 的 token 序列之间互转，处理逻辑与官方 API 完全对齐。让第三方部署「像官方一样」，靠的就是它。
- **这条线会继续。** DeepSeek 说未来新模型的推理代码、以及后续的性能优化，都会陆续落在这个仓库里。

## 成本

- **许可证免费，模型单价没动。** DeepInfer 是 Apache-2.0。V4.1-Flash 仍然是高峰 $0.30 输入 / $1.20 输出（每 100 万 token），非高峰 $0.15 / $0.60，缓存读 $0.006、非高峰 $0.003，上下文 1,000,000 token，没有长上下文档位需要规划。
- **所以如果你调 API，这次开源不改变你的账单。** 费率不变、endpoint 不变、checkpoint 不变。1017 的权重本来就是 API 在服务的权重，跑它的框架本来也就在跑。变化只在于——你现在知道那是什么了。
- **它真正解释的是价格里面的那笔账。** DeepSeek 说，单集群通过这套框架每天服务 155 万亿 token。撑住那个比 GPT-5.6 sol 与 Claude Opus 5 低 13 到 21 倍的标价的，是这个数字，而不只是权重。把这次发布读成「账单要变」是读错了；读成「我正在付的这笔账，成本结构长这样」才是对的。
- **对比自家 Pro 档，Flash 仍然便宜 4.4 倍（输入）和 3.3 倍（输出）**——V4-Pro 高峰 $1.32 / $3.96，非高峰与 Flash 一样对折。DeepInfer 不会缩小这个差距。它是这条走量产品线的引擎，不是让你在该产品线上上下移动的理由。
- **对比前沿，自建不改变任何别人的定价。** GPT-5.6 sol 在 2026-11-21 之前是 $4 / $20，之后 $5 / $30；Claude Opus 5 是 $5 / $25。DeepInfer 改变的不是这些数字，而是「你有没有一条可信的路，把便宜的那个跑在自己的硬件上」。
- **真正会动的是硬件加人力这笔预算。** 框架免费，加速卡不免费；要补的那层服务代码是一个项目，不是一个下午。按 DeepSeek 自己的部署说明，最小**高效**单元是 64 卡 Prefill 加 64 卡 Decode，实践中 Prefill 与 Decode 的卡数比大致 1:1。一 P 一 D 也能部署，但谈不上效率。

## 跑分

- **推理框架没有跑分，这一页也不会给它编一个。** 我们的榜单比的是准确率——GPQA、HLE、Terminal-Bench、DeepSWE 这些。DeepInfer 不在榜上，也永远不会在，因为它优化的东西是吞吐和延迟，不是答得对不对。
- **上面那张跑分表是 checkpoint 的，一个数没动。** 它来自 1017 的发布对照表，不会因为一个服务框架开源而改变。如果你来这页是想问「模型变强了吗」，答案是：没有。这次发布没有重新评测模型，我们也不会假装某一行的数字动了。
- **DeepInfer 公开的不是一个分数，而是一张帕累托图。** 横轴纵轴分别是「非缓存输入的预填充吞吐 vs 延迟」和「解码输出吞吐 vs 单用户速度」，测在 4 张 SM100（Prefill）和 64 张（Decode）上，各自在单个 scale-up 域内。复现脚本就在仓库里——这比发布对照表通常给出的证据更可复现。
- **曲线背后是部署说明里写明了的一些工程事实：** 变长推测验证把每步要验证的草稿 token 砍掉约 30%，而平均接受长度基本不变，在生产工作点上折合约 4–7% 的吞吐提升；负载均衡能到「完全均衡的离线基准」的约 80%；KV Cache 保留目标是 72 小时以上，其中 agent 流量 TTL 3 天、chatbot 流量 7 天。
- **这些全部是厂商在自己硬件上测的。** 这不是贬低——我们对厂商给的跑分表也是同样的口径。但放在框架上，这套「但是」更咬人一些：吞吐取决于集群拓扑、互联和 batch 形状，而这三样都不会跟着数字一起传过来。

## 怎么跑起来

- **前置条件（仓库原文）：** Linux、GCC 13 以上、一个干净的 Python 3.12 环境；NVIDIA 路线要 CUDA 13，昇腾路线要 CANN 9.2。没有 pip 一键安装——必须源码编译。
- **编译并跑离线示例：**

```
git clone --recurse-submodules https://github.com/deepseek-ai/DeepInfer.git
cd DeepInfer
export DEEPINFER_ACCELERATOR=nvidia   # 昇腾改成 ascend
./build.sh

python examples/offline_inference.py --ep 8
```

- **用本地权重**，不让它把默认 checkpoint 下到 Hugging Face 缓存里：

```
export DEEPINFER_HF_MODEL_DIR=/path/to/DeepSeek-V4.1-Flash-1017
python examples/offline_inference.py --ep 2 --dp 8
```

- **仓库给的三种跑法，对应三种不同的瓶颈。** `--ep 8` 是专家并行的起点；`--ep 2 --dp 8` 把请求摊到多个数据并行副本上；`--ep 2 --cp 8` 把长上下文按 rank 切片。Prefill 侧部署得窄——专家并行和数据并行都在个位数——Decode 侧则要宽，因为 MoE 专家部分的每步显存搬运才是那里的瓶颈。
- **功能开关都是环境变量**，这点在排上线计划前值得先知道：推测解码、SWA 重放截断、batch 不变性、确定性采样都是靠变量名开关的，其中 batch 不变性与确定性采样仅限 NVIDIA。
- **你最后拿到的是一个批推理引擎**，不是一个 endpoint。要在它前面架一个 OpenAI 兼容服务，KV Cache 层、Prefill/Decode 分离、负载均衡都得自己补——DeepSeek 的说明里写了「分离所需的大部分引擎功能已经实现」，但组件本身不在这次发布里。

## 选哪个引擎

- **说句实在话：这次发布只对极少数团队有用。** DeepInfer 是正确答案，需要同时满足两个条件——你手上有 SM100 或昇腾 950，而且你就是要跑 V4.1-Flash。除此之外，通用引擎仍然是务实的选择。

| 引擎 | 是什么 | 门槛 | 什么时候选它 |
| --- | --- | --- | --- |
| DeepInfer | DeepSeek 自家引擎的开源版 | SM100 或昇腾 950，且只有一个模型 | 硬件对得上，想要厂商特化的算子 |
| vLLM | 通用基准线，OpenAI 兼容 | 硬件覆盖面最广 | 要跑很多模型，运维风险要最低 |
| SGLang | 高吞吐，带前缀复用缓存 | 以 NVIDIA / AMD 为主 | 流量里重复的共享前缀占大头 |
| TensorRT-LLM | 英伟达的编译型引擎 | 仅 NVIDIA，且有引擎编译步骤 | 固定模型、固定集群，为吞吐不惜成本 |
| LMDeploy | 轻量，对 Qwen / InternLM 系最好 | NVIDIA 与昇腾 | 规模中等、栈比较混、常在国内 |
| MindIE | 华为自家的昇腾服务栈 | 仅昇腾 | 已经押定昇腾，愿意用厂商栈 |

- **这些引擎我们一个都没测过**，表里没有一行是测量结果。它是一张约束地图——先看硬件，再看模型，最后看服务层——而这恰好也是决策真实的顺序。
- **对照表里最有意思的一行是「出身」那一行。** DeepInfer 感谢 vLLM、SGLang 和 TensorRT-LLM，因为它就是它们下游的产物。这让明年的问题变得具体：为单个模型做的特化，能跑出通用引擎达不到的数字吗？还是说，生态会像此前每一次那样，在一个季度后把同样的想法吸收进去？这次发布没有回答。它只是把这场考试布置好了。

## 该不该换

- **如果你调 DeepSeek API，没有可换的东西。** endpoint、价格、checkpoint 全都没变。把这次发布当成「你买的这套东西的说明书」来读就好——而且这是一份相当好的说明书。
- **如果你有 SM100 而且已经在自建 DeepSeek 的 checkpoint，这是本季度唯一值得压测的引擎。** 编译、跑仓库里的 sweep 脚本、按你自己的形状测，跟你现在用的那套比。去复现那条曲线，而不是读他们的曲线。
- **如果你在 Hopper 或别的 NVIDIA 代次上，这次发布帮不到你。** 支持列表里没有 Hopper。继续用你现在跑的引擎——vLLM 或 SGLang 今天就能跑 V4.1-Flash，而且 1017 的权重是公开的，所以这件事从来不是「能不能拿到模型」的问题。
- **如果你在为多模型平台选引擎，别从这里开始。** 一个模型、两种加速器、没有服务层。先选与硬件匹配的通用引擎，等仓库里落了第二个模型再回头看 DeepInfer。
- **如果你真正想要的是更便宜的账单，杠杆在费率卡上，不在框架里。** 非高峰调度直接让 V4.1-Flash 对折，而缓存读 $0.006 对 $0.30 的输入价。这比任何服务层优化都省得多，而且今天就能在 API 上拿到，不需要一整个集群。

## 延伸阅读

- **它服务的那一版权重** —— 1017 的全部跑分：[/models/deepseek-v4.1-flash-1017](/models/deepseek-v4.1-flash-1017)
- **模型自己的发布解读** —— 1017 改了什么、值不值得换：[/releases/deepseek-v4-1-flash-1017](/releases/deepseek-v4-1-flash-1017)
- **完整费率卡** —— 高峰、非高峰与缓存价，带生效日期区间：[/deepseek-api-pricing](/deepseek-api-pricing)
- **跟前沿模型正面比** —— [/compare?a=deepseek-v4.1-flash-1017&b=gpt-5.6-sol](/compare?a=deepseek-v4.1-flash-1017&b=gpt-5.6-sol)
- **算一算你自己的流量** —— [/token-calculator](/token-calculator)
- **本页的事实来源** —— DeepInfer 仓库，2026-10-23 复核。价格来自 DeepSeek 定价页，2026-10-20 核验。
