# Flowloom 论文级 Figure 独立终审

评审日期：2026-07-29
评审对象：Flowloom `dda9afa` 加当前未提交工作区，以及 2026-07-29 03:46（Asia/Shanghai）重新生成的 publication evidence bundle
评审角色：独立 Figure 审稿人；本报告只评价图形与交付证据，不参与本轮产品代码实现

## 结论

**终审得分：95.2 / 100。最低单项：9.2 / 10。Critical：0；Major：0；Minor：3。结论：通过（PASS，Publication-ready for the audited scope）。**

本轮重新检查后，上一版报告中的三个浏览器预览 P0 均已真实关闭。九张真实浏览器成品、54 个 SVG/PNG/PDF 核心交付物、36 个可访问性模拟和 18 个 Poppler PDF 回渲均未发现新的裁切、文字越界、标题粘连、结构丢失或线宽退化。三个旗舰场景在单栏、双栏与 16:9 汇报版式中均形成稳定、场景专用且可直接复用的科研叙事，不再是通用流程框的简单组合。

本次 PASS 仅适用于本报告锁定的三张旗舰 Figure、三种版式、两种风格及其当前源码指纹。它表示这些经过审计的**方法示意图和系统图**已达到无需二次视觉设计即可进入顶会/顶刊论文或正式学术汇报的出版准备度；它不代表任意 AI 提示、任意用户内容或未来模板会自动达到同一水平。

**出版准备度不等于任何会议或期刊的录用保证。** 本报告也不替代对论文科学内容、实验有效性、引用合规、版权许可和 venue-specific author guidelines 的审查。

硬门槛核算如下：

| 门槛 | 结果 | 判定 |
| --- | ---: | --- |
| 总分至少 95 / 100 | **95.2** | 通过 |
| 十个单项均不低于 9 / 10 | **最低 9.2** | 通过 |
| Critical 为零 | **0** | 通过 |
| Major 为零 | **0** | 通过 |
| 50 篇 LLM/VLM + 50 篇 embodied/VLA 均有本地有效代表图 | **100/100** | 通过 |
| 三图 x 三版式 x 两风格 x SVG/PDF/PNG | **54/54** | 通过 |
| 原生 PNG 与 Poppler PDF 视觉等价 | **18/18** | 通过 |
| PDF 单页、尺寸正确、字体嵌入、文本可提取 | **18/18** | 通过 |
| 灰度与三类 CVD 模拟 | **36/36** | 通过 |
| 九张真实浏览器预览无布局失败，且与正式 SVG 断行一致 | **9/9；261/261 checks** | 通过 |

## 证据锁定

最终证据来自：

- `docs/research/arxiv-figure-corpus.json`
- `docs/research/ARXIV_FIGURE_ATLAS.md`
- `output/research/contact-sheets/llm-01.jpg` 至 `llm-05.jpg`
- `output/research/contact-sheets/embodied-01.jpg` 至 `embodied-05.jpg`
- `output/playwright/final-qa-{vla,world,llm}-{single,double,presentation}.png`
- `output/publication-evidence/manifest.json`
- `output/publication-evidence/raster-validation.json`
- `output/publication-evidence/contact-sheets/core-exports.jpg`
- `output/publication-evidence/contact-sheets/pdf-poppler-renders.jpg`
- `output/publication-evidence/contact-sheets/accessibility-simulations.jpg`

终审时独立重算结果：

- manifest 固定的 **10/10 源文件 SHA-256** 与当前工作区一致；
- **112/112 证据文件哈希**一致且无缺失；
- **9/9 浏览器 QA 截图哈希**一致；
- 当前 `HEAD` 与 manifest 均为 `dda9afaad1dbc1ece0bad89cab5158194a8301af`。

当前工作区仍为 dirty，因此结论只对这组源码指纹和对应证据包成立，不能自动外推到尚未重生成证据的其他提交或 GitHub Pages 版本。

## 百篇论文基准

本轮复核了 50 篇 LLM/VLM 与 50 篇 embodied/VLA 的本地代表图。语料采用六主题检索、奠基性种子、主题配额以及引用/时效排序；Figure 与 caption 来自 ar5iv，失败时回退 arXiv HTML。它是可追溯的设计语料，不是对这些论文科学结论的系统综述或学术排名。

独立文件解码检查结果：

| 方向 | 论文 | 解析 Figure | 非 Table 代表图 | 本地可解码代表图 |
| --- | ---: | ---: | ---: | ---: |
| LLM/VLM | 50 | 656 | 50/50 | 50/50 |
| Embodied/VLA | 50 | 633 | 50/50 | 50/50 |
| **合计** | **100** | **1,289** | **100/100** | **100/100** |

高频视觉语法与 Flowloom 覆盖关系如下；标签并非互斥：

| 方向 | 语料中的高频元素 | 代表图数量 | 当前旗舰图的对应覆盖 |
| --- | --- | ---: | --- |
| LLM/VLM | module blocks | 45 | 模型、checkpoint、评估模块与证据门 |
| LLM/VLM | token sequence | 39 | token batch、偏好对与 action/token strip |
| LLM/VLM | quantitative chart | 21 | worst-slice、drift、score 等 schematic glyph；真实论文需绑定数据 |
| LLM/VLM | training pipeline | 19 | 数据、预训练、SFT、DPO、RM/PPO、发布闭环 |
| LLM/VLM | image strip | 12 | 多模态证据与时序帧语法 |
| Embodied/VLA | robot embodiment | 48 | 机器人本体、夹爪、目标物与相机视角 |
| Embodied/VLA | action trajectory | 38 | H=16、6-DoF、waypoint、执行路径与接触 |
| Embodied/VLA | image strip | 29 | front/wrist observation、rollout 与 next observation |
| Embodied/VLA | system overview | 27 | 感知、策略、控制、执行与反馈闭环 |
| Embodied/VLA | training pipeline | 20 | VLM、flow/action head、risk gate 与 controller |
| Embodied/VLA | temporal storyboard | 7 | t0 到 tH、成功/碰撞/遮挡分支与回观测 |

论文原图只作为本地分析材料；产品图元为独立绘制的原生矢量，不复制论文原图、品牌资产或受限许可素材。

## 100 分量表

| 维度 | 得分 | 终审判断 |
| --- | ---: | --- |
| 1. Composition | **9.5** | 三种物理版式均为独立重排；阶段容器、主轴、反馈回路和留白稳定。九张浏览器成品与正式导出不再分叉。 |
| 2. Visual hierarchy | **9.5** | 标题、阶段、核心模块、分支结果和注释形成清晰层级；第一眼可识别输入、机制、选择与验证。 |
| 3. Semantic specificity / density | **9.6** | 图元承担任务对象、状态、时间、动作、目标、风险、结果和不确定性等具体语义，信息密度达到所审百篇论文中高质量系统图的区间。 |
| 4. Typography | **9.2** | 物理字号、真实浏览器包围盒、SVG 断行与 PDF 文本层全部合格；剩余扣分来自数学标签仍混用 `theta_D`、`r_phi`、`L_NLL` 等纯文本写法。 |
| 5. Annotation / callout grammar | **9.3** | 具备公式、score、uncertainty、coordinate frame、contact、gate、worst slice 与 prediction error 等原生标注；更复杂的局部 zoom/callout 仍有扩展空间。 |
| 6. Connector / line grammar | **9.6** | 数据、控制、梯度、广播、可选路径、时间与反馈均有冗余编码；junction、merge 和闭环路径明确，无标题穿线、重叠箭头或目标内长段。 |
| 7. Scientific storytelling / credibility | **9.5** | 三图均能独立讲清问题、机制、备选路径、约束与验证；schematic/data provenance 边界清楚，不把模板 glyph 自动冒充实验结果。 |
| 8. Slide readability | **9.4** | 16:9 版采用 11 pt 主模块、短标题和三至四段叙事；1920x1200、1920x1080 与 1366x768 三视口均无碰撞。 |
| 9. Print / export / accessibility | **9.8** | 彩色、黑白、灰度、三类 CVD、SVG、300 DPI PNG 与矢量 PDF 均保留结构和语义；18 份 PDF 字体全嵌入。 |
| 10. Native editability / reuse | **9.8** | 18/18 SVG 含可编辑 metadata、完整图结构和 provenance；428 个节点 ID 与 332 条边 ID 均与可见 DOM 一致，round-trip 回归通过。 |
| **总分** | **95.2 / 100** | **通过** |

## 三张旗舰 Figure

### VLA Policy

**通过。** 双栏版形成“任务证据 -> 多模态策略 -> 接触感知动作 -> 物理执行”的完整叙事；单栏版保留相机、主干、动作和执行 pictogram；16:9 版使用独立的三阶段构图。`Closed-loop controller` 已完整位于节点内，真实浏览器最小四边内边距为 **11.731 px**，高于 8 px 门槛。

### World-Model Rollout

**通过。** 三条 rollout 在内容、结果状态和线型上可区分，共享时域、score junction、选择、执行和 prediction-error 闭环完整。16:9 标题已稳定为 `B Predictive state` 与 `C Future rollouts`；三视口的最小相邻标题间距为 **27.519 px**，高于 12 px 门槛，DOM 与 SVG 断行逐行一致。

### LLM Training / Alignment

**通过。** 双栏版完整区分数据、预训练、对齐备选路径与证据门；单栏版中的 DPO/RL 与评估阶段无越界；16:9 版形成 reference policy、alignment alternatives 与 evidence gate 三段式叙事。A/B 标题已分别改为 `A Reference policy` 与 `B Alignment alternatives`，三视口最小间距为 **52.728 px**。

## 版式、格式与导出

| 版式 | 物理尺寸 | 样本数 | 最小字号 | 最小线宽 | 结论 |
| --- | --- | ---: | ---: | ---: | --- |
| 单栏论文 | 89 x 70 mm | 6 | 7.19 pt | 0.8 pt | 通过 |
| 双栏论文 | 180 x 120 mm | 6 | 7.00 pt | 0.8 pt | 通过 |
| 16:9 汇报 | 180 x 101.25 mm | 6 | 注释 9.64 pt；主模块至少 11 pt | 1.0 pt | 通过 |

浏览器预览：9 个图/视口组合共 **261 项真实 DOM 几何检查**，失败为 0；最小 phase 内边距 **8.646 px**，最小相邻标题间距 **27.519 px**，所有 phase label 与正式 SVG 的行数和逐行文本一致。

SVG：18/18 可解析，18/18 带 `data-flowloom-editable="true"`，metadata JSON、provenance、节点/边数量与可见 ID 完全一致。合计核验 **428 个节点 ID、332 条边 ID**。

PNG/PDF 视觉等价：18/18 通过。最差指标仍优于门槛：structural SSIM **0.992692**、content structural SSIM **0.991657**、edge precision **0.966165**、edge recall **0.964205**；最大 missing-ink rate **0.046381**，最大 mean absolute error **0.024130**。

PDF：独立运行 `pdfinfo`、`pdffonts`、`pdftotext -layout` 与 `pdftoppm -r 300`。18/18 为单页，物理尺寸分别为 252.283 x 198.425、510.236 x 340.157 或 510.236 x 287.008 pt；18/18 字体全嵌入，18/18 标题和文字层可提取，18/18 独立 300 DPI 回渲成功。原尺寸人工抽查未见缺字、细线消失、遮挡或结构漂移。

Accessibility：36/36 灰度、protanopia、deuteranopia 与 tritanopia 模拟均保留主阅读顺序和关键分支。它们是设计审查模拟，不是临床色觉模型。

## 已关闭的阻断问题

1. **P0-01，World Model 16:9 B/C 标题粘连：已关闭。** 标题改为 `B Predictive state` / `C Future rollouts`；最小间距 27.519 px，phase 内边距至少 8.646 px，三视口均通过。
2. **P0-02，LLM 16:9 A/B 标题粘连：已关闭。** 标题改为 `A Reference policy` / `B Alignment alternatives`；最小间距 52.728 px，三视口均通过。
3. **P0-03，VLA 16:9 controller 标签越框：已关闭。** 标签改为 `Closed-loop controller`；最小四边内边距 11.731 px，三视口均通过。
4. **旧 Critical C-01，PDF pictogram 与内部结构线系统性变细：保持关闭。** 18/18 PNG-PDF 结构等价通过，edge precision/recall 均高于 0.95。
5. **旧 Critical C-02，LLM PDF 边标签白色遮挡：保持关闭。** 彩色、黑白、PNG、SVG 与 Poppler PDF 均无复现。

## 剩余非阻断问题

以下计为 **Minor 3**，不降低任何单项到 9 分以下：

1. 数学标签仍混用纯文本形式，例如 `theta_D`、`theta_RL`、`L_NLL`、`z_hat`、`r_phi`。后续宜统一为可编辑的 Unicode/tspan 数学排版；当前字号、边界和语义不影响使用。
2. score、uncertainty、capability、worst-slice 与 prediction-error 小图属于 schematic glyph，不是数据绑定结果。用于真实实验结果图时必须接入数据、单位、误差和 provenance。
3. 证据包对应 dirty 工作区。虽然 10 个源文件与 112 个证据文件均有一致哈希，发布提交或 Pages 版本仍应在目标 commit 上重新生成一次 evidence bundle。

另有两个范围限制不计为缺陷：CVD 输出是审查模拟而非临床模型；本轮通过的是三张旗舰图及其 18 个组合，不是对任意未来 AI 生成图的永久认证。

## 回归结果

- `npm.cmd test`：**6 files / 75 tests 全部通过**。
- publication manifest：audit errors 0、audit warnings 0、raster failures 0、PDF font failures 0、preview layout failures 0。
- `git diff --check -- docs/research/PUBLICATION_FIGURE_REVIEW.md`：通过。

## 最终声明

Flowloom 当前审计范围达到本报告定义的最高出版准备门槛：`95.2/100`、最低单项 `9.2/10`、`Critical=0`、`Major=0`。三张旗舰方法示意图可在保持当前内容与证据指纹的前提下，直接用于顶会/顶刊论文或正式学术汇报，无需再做视觉层面的二次设计。

该结论不保证任意 AI 请求、任意用户内容或未来模板会自动达到同一水平；每张新图仍需经过场景语义核对、物理版式审计、SVG round-trip、300 DPI PNG、Poppler PDF、灰度/CVD 与人工原尺寸复核。Figure 通过也不构成会议/期刊录用保证或科学有效性背书。
