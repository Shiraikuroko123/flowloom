# arXiv LLM 与具身智能 Figure Atlas

生成时间：2026-07-28T09:21:57.299Z。本报告由可重复运行的 `scripts/research-arxiv-figures.mjs` 生成。引用数来自 Semantic Scholar 快照，仅用于候选排序；Figure 与 caption 来自 ar5iv，失败时回退 arXiv HTML。论文图片只下载到被 Git 忽略的 `output/research` 用于人工观察，不进入产品素材库。

## 方法边界

- 样本按六个主题检索并加入奠基性种子，再按主题配额、引用与时间进行分层选择；它是设计语料，不是系统综述或学术排名。
- 自动标签来自 caption 关键词，后续必须结合 contact sheet 人工复核；统计不能替代对原图的视觉检查。
- 产品只吸收构图语法和通用视觉模式，不复制论文原图、品牌资产或受限许可素材。

## LLM

论文数：50；成功提取 Figure 的论文：49；解析到的 Figure 总数：1448。

### 代表图构图类型

| 类型 | 论文数 |
| --- | ---: |
| training-pipeline | 24 |
| model-architecture | 19 |
| quantitative-chart | 19 |
| system-overview | 17 |
| data-pipeline | 8 |
| qualitative-montage | 8 |
| agent-loop | 6 |
| taxonomy-benchmark | 5 |
| temporal-storyboard | 4 |
| other | 3 |

### 代表图视觉元素

| 元素 | 论文数 |
| --- | ---: |
| module-blocks | 46 |
| token-sequence | 37 |
| chart-axes | 18 |
| frozen-trainable-state | 11 |
| image-strip | 9 |
| dataset-stack | 8 |
| loss-objective | 8 |
| stage-containers | 8 |
| attention-bridge | 6 |
| annotations-callouts | 5 |
| feedback-arrow | 4 |
| legend-encoding | 2 |
| heatmap-matrix | 1 |

### 论文与 Figure 证据

| # | 论文 | 年份 | 引用 | Figure 数 | 代表 Figure | Caption |
| ---: | --- | ---: | ---: | ---: | --- | --- |
| 1 | [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via R...](https://arxiv.org/abs/2501.12948) | 2025 | 5452 | 9 | Figure 2 | Table 1: Template for DeepSeek-R1-Zero. prompt will be replaced with the specific reasoning question during training. |
| 2 | [Stop Overthinking: A Survey on Efficient Reasoning for Large ...](https://arxiv.org/abs/2503.16419) | 2025 | 424 | 13 | Figure 1: | Figure 1: The pipeline of developing efficient reasoning for LLMs. A reasoning model can be trained on the base model using SFT, RL, or a combination of both. ... |
| 3 | [Scalable Vision Language Model Training via High Quality Data...](https://arxiv.org/abs/2501.05952) | 2025 | 56 | 15 | Figure 1: | Figure 1: SAIL-VL’s overall model training pipeline. |
| 4 | [Automated Generation of Challenging Multiple-Choice Questions...](https://arxiv.org/abs/2501.03225) | 2025 | 39 | 32 | Figure 1: | Figure 1: Overview. (Left) We analyze existing open-ended VQA evaluation metrics, underscoring their limitations in providing accurate and reproducible assessm... |
| 5 | [HiDe-LLaVA: Hierarchical Decoupling for Continual Instruction...](https://arxiv.org/abs/2503.12941) | 2025 | 30 | 18 | Figure 3: | Figure 3: An overview of HiDe-LLaVA framework. (a) During training, we optimize the LoRA modules and projector layer with an autoregressive loss and the image-... |
| 6 | [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783) | 2024 | 17216 | 22 | Figure 1 | Table 1: Overview of the Llama 3 Herd of models. All results in this paper are for the Llama 3.1 models. |
| 7 | [Qwen2 Technical Report](https://arxiv.org/abs/2407.10671) | 2024 | 2361 | 15 | Figure 1 | Table 1: Architecture of Qwen2 dense and MoE models. For MoE models, 57B-A14B denotes that the model has 57B parameters in total and for each token 14B paramet... |
| 8 | [Phi-3 Technical Report: A Highly Capable Language Model Local...](https://arxiv.org/abs/2404.14219) | 2024 | 2358 | 5 | Figure 1: | Figure 1: 4-bit quantized phi-3-mini running natively on an iPhone with A16 Bionic chip, generating over 12 tokens per second. |
| 9 | [Mixtral of Experts](https://arxiv.org/abs/2401.04088) | 2024 | 2027 | 16 | Figure 1: | Figure 1: Mixture of Experts Layer. Each input vector is assigned to 2 of the 8 experts by a router. The layer’s output is the weighted sum of the outputs of t... |
| 10 | [DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-E...](https://arxiv.org/abs/2405.04434) | 2024 | 1325 | 44 | Figure 2: | Figure 2: Illustration of the architecture of DeepSeek-V2. MLA ensures efficient inference by significantly reducing the KV cache for generation, and DeepSeekM... |
| 11 | [QServe: W4A8KV4 Quantization and System Co-design for Efficie...](https://arxiv.org/abs/2405.04532) | 2024 | 232 | 23 | Figure 1: | Figure 1: QServe achieves higher throughput when running Llama models on L40S compared with TensorRT-LLM on A100, effectively saves the dollar cost for LLM ser... |
| 12 | [Image Fusion via Vision-Language Model](https://arxiv.org/abs/2402.02235) | 2024 | 95 | 12 | Figure 1: | Figure 1: Workflow for our FILM. Input images are first processed to create prompts for the ChatGPT model, which then generate detailed textual descriptions. T... |
| 13 | [SPA-VL: A Comprehensive Safety Preference Alignment Dataset f...](https://arxiv.org/abs/2406.12030) | 2024 | 83 | 33 | Figure 3: | Figure 3: Impact of Data Scale on Alignment Model Performance. Line plots illustrate the effect of varying data quantities (100100100, 1​k1𝑘1k, 5​k5𝑘5k, 10​k... |
| 14 | [Vision-Flan: Scaling Human-Labeled Tasks in Visual Instructio...](https://arxiv.org/abs/2402.11690) | 2024 | 82 | 98 | Figure 3: | Figure 3: The left of the figure shows the LLaVA-Architecture and the right of the figure shows the two-stage visual instruction tuning pipeline. |
| 15 | [Identifying Implicit Social Biases in Vision-Language Models](https://arxiv.org/abs/2411.00997) | 2024 | 49 | 12 | Figure 2: | Figure 2: Flowchart demonstrating the process for image retrieval in FairFace. For each word of interest in each category, we compute its embedding with the CL... |
| 16 | [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) | 2024 | 0 | 25 | Figure 2: | Figure 2: Illustration of the basic architecture of DeepSeek-V3. Following DeepSeek-V2, we adopt MLA and DeepSeekMoE for efficient inference and economical tra... |
| 17 | [GPT-4 Technical Report](https://arxiv.org/abs/2303.08774) | 2023 | 26240 | 28 | Figure 6 | Table 2: Performance of GPT-4 on academic benchmarks. We compare GPT-4 alongside the best SOTA (with benchmark-specific training) and the best SOTA for an LM e... |
| 18 | [LLaMA: Open and Efficient Foundation Language Models](https://arxiv.org/abs/2302.13971) | 2023 | 20965 | 19 | Figure 2 | Table 2: Model sizes, architectures, and optimization hyper-parameters. |
| 19 | [Llama 2: Open Foundation and Fine-Tuned Chat Models](https://arxiv.org/abs/2307.09288) | 2023 | 17722 | 92 | Figure 4: | Figure 4: Training of Llama 2-Chat: This process begins with the pretraining of Llama 2 using publicly available online sources. Following this, we create an i... |
| 20 | [Visual Instruction Tuning](https://arxiv.org/abs/2304.08485) | 2023 | 10472 | 30 | Figure 3 | Table 2: The input sequence used to train the model. Only two conversation turns are illustrated here; in practice, the number of turns varies based on the ins... |
| 21 | [Direct Preference Optimization: Your Language Model is Secret...](https://arxiv.org/abs/2305.18290) | 2023 | 9783 | 15 | Figure 1: | Figure 1: DPO optimizes for human preferences while avoiding reinforcement learning. Existing methods for fine-tuning language models with human feedback first... |
| 22 | [BLIP-2: Bootstrapping Language-Image Pre-training with Frozen...](https://arxiv.org/abs/2301.12597) | 2023 | 8722 | 16 | Figure 1: | Figure 1: Overview of BLIP-2’s framework. We pre-train a lightweight Querying Transformer following a two-stage strategy to bridge the modality gap. The first ... |
| 23 | [Mamba: Linear-Time Sequence Modeling with Selective State Spa...](https://arxiv.org/abs/2312.00752) | 2023 | 8237 | 32 | Figure 1: | Figure 1: (Overview.) Structured SSMs independently map each channel (e.g. D=5D=5) of an input xx to output yy through a higher dimensional latent state hh (e.... |
| 24 | [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) | 2023 | 5143 | 19 | Figure 1: | Figure 1: Different finetuning methods and their memory requirements. QLoRA improves over LoRA by quantizing the transformer model to 4-bit precision and using... |
| 25 | [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761) | 2023 | 4847 | 15 | Figure 1: | Figure 1: Exemplary predictions of Toolformer. The model autonomously decides to call different APIs (from top to bottom: a question answering system, a calcul... |
| 26 | [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) | 2023 | 4423 | 23 | Figure 1: | Figure 1: Changing the location of relevant information (in this case, the position of the passage that answers an input question) within the language model’s ... |
| 27 | [Qwen Technical Report](https://arxiv.org/abs/2309.16609) | 2023 | 4119 | 0 | 未提取 | No figure elements found |
| 28 | [Mistral 7B](https://arxiv.org/abs/2310.06825) | 2023 | 3707 | 14 | Figure 2 | Table 1: Model architecture. |
| 29 | [What Makes Good Data for Alignment? A Comprehensive Study of ...](https://arxiv.org/abs/2312.15685) | 2023 | 409 | 27 | Figure 1: | Figure 1: Illustration of the data selection approach. We measure data from three dimensions: complexity, quality, and diversity. I𝐼I and R𝑅R represent instr... |
| 30 | [LongLoRA: Efficient Fine-tuning of Long-Context Large Languag...](https://arxiv.org/abs/2309.12307) | 2023 | 279 | 25 | Figure 2: | Figure 2: Overview of LongLoRA. We introduce Shifted Sparse Attention (S2-Attn) during fine-tuning. The trained model retains original standard self-attention ... |
| 31 | [Scaling Vision-Language Models with Sparse Mixture of Experts](https://arxiv.org/abs/2303.07226) | 2023 | 121 | 13 | Figure 2: | Figure 2: Effect of VL-MoE scaling on three mask language modeling (MLM), mask image modeling (MIM), and masked vision-language modeling (VLM) pre-training tas... |
| 32 | [Training language models to follow instructions with human fe...](https://arxiv.org/abs/2203.02155) | 2022 | 22824 | 65 | Figure 2: | Figure 2: A diagram illustrating the three steps of our method: (1) supervised fine-tuning (SFT), (2) reward model (RM) training, and (3) reinforcement learnin... |
| 33 | [Chain-of-Thought Prompting Elicits Reasoning in Large Languag...](https://arxiv.org/abs/2201.11903) | 2022 | 20479 | 41 | Figure 1: | Figure 1: Chain-of-thought prompting enables large language models to tackle complex arithmetic, commonsense, and symbolic reasoning tasks. Chain-of-thought re... |
| 34 | [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | 2022 | 9114 | 21 | Figure 1: | Figure 1: (1) Comparison of 4 prompting methods, (a) Standard, (b) Chain-of-thought (CoT, Reason Only), (c) Act-only, and (d) \model (Reason+Act), solving a Ho... |
| 35 | [PaLM: Scaling Language Modeling with Pathways](https://arxiv.org/abs/2204.02311) | 2022 | 8230 | 78 | Figure 2: | Figure 2: The Pathways system (Barham et al., 2022) scales training across two TPU v4 pods using two-way data parallelism at the pod level. |
| 36 | [Flamingo: a Visual Language Model for Few-Shot Learning](https://arxiv.org/abs/2204.14198) | 2022 | 6267 | 31 | Figure 2: | Figure 2: Flamingo results overview. Left: Our largest model, dubbed Flamingo, outperforms state-of-the-art fine-tuned models on 6 of the 16 tasks we consider ... |
| 37 | [OPT: Open Pre-trained Transformer Language Models](https://arxiv.org/abs/2205.01068) | 2022 | 4858 | 19 | Figure 1 | Table 1: Model architecture details. We report the number of layers (#L), number of attention heads (#H), and the embedding size (dmodelmodel{}_{\text{model}})... |
| 38 | [FlashAttention: Fast and Memory-Efficient Exact Attention wit...](https://arxiv.org/abs/2205.14135) | 2022 | 4850 | 36 | Figure 1: | Figure 1: Left: FlashAttention uses tiling to prevent materialization of the large N×N𝑁𝑁N\times N attention matrix (dotted box) on (relatively) slow GPU HBM.... |
| 39 | [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) | 2022 | 3559 | 33 | Figure 1: | Figure 1: Overlaid predictions. We overlay the predictions from our three different approaches, along with projections from Kaplan et al. (2020). We find that ... |
| 40 | [BLOOM: A 176B-Parameter Open-Access Multilingual Language Mod...](https://arxiv.org/abs/2211.05100) | 2022 | 2979 | 33 | Figure 3: | Figure 3: Graphical overview of the ROOTS corpus. Left: A treemap plot of the language families of all 46 natural languages where surface is proportional to th... |
| 41 | [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) | 2021 | 21345 | 26 | Figure 3 | Table 2: RoBERTabasesubscriptRoBERTabase\text{RoBERTa}_{\text{base}}, RoBERTalargesubscriptRoBERTalarge\text{RoBERTa}_{\text{large}}, and DeBERTaXXLsubscriptDe... |
| 42 | [Finetuned Language Models Are Zero-Shot Learners](https://arxiv.org/abs/2109.01652) | 2021 | 5249 | 44 | Figure 1: | Figure 1: Top: overview of instruction tuning and FLAN. Instruction tuning finetunes a pretrained language model on a mixture of tasks phrased as instructions.... |
| 43 | [Switch Transformers: Scaling to Trillion Parameter Models wit...](https://arxiv.org/abs/2101.03961) | 2021 | 4374 | 27 | Figure 2: | Figure 2: Illustration of a Switch Transformer encoder block. We replace the dense feed forward network (FFN) layer present in the Transformer with a sparse Sw... |
| 44 | [Improving language models by retrieving from trillions of tok...](https://arxiv.org/abs/2112.04426) | 2021 | 1796 | 35 | Figure 2: | Figure 2: Retro architecture. Left: simplified version where a sequence of length n=12𝑛12n=12 is split into l=3𝑙3l=3 chunks of size m=4𝑚4m=4. For each chunk... |
| 45 | [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) | 2020 | 61271 | 111 | Figure 2.1: | Figure 2.1: Zero-shot, one-shot and few-shot, contrasted with traditional fine-tuning. The panels above show four methods for performing a task with a language... |
| 46 | [Retrieval-Augmented Generation for Knowledge-Intensive NLP Ta...](https://arxiv.org/abs/2005.11401) | 2020 | 16331 | 13 | Figure 1: | Figure 1: Overview of our approach. We combine a pre-trained retriever (Query Encoder + Document Index) with a pre-trained seq2seq model (Generator) and fine-t... |
| 47 | [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) | 2020 | 8619 | 30 | Figure 1: | Figure 1: Language modeling performance improves smoothly as we increase the model size, datasetset size, and amount of compute111Here we display predicted com... |
| 48 | [Exploring the Limits of Transfer Learning with a Unified Text...](https://arxiv.org/abs/1910.10683) | 2019 | 26687 | 23 | Figure 1: | Figure 1: A diagram of our text-to-text framework. Every task we consider—including translation, question answering, and classification—is cast as feeding our ... |
| 49 | [BERT: Pre-training of Deep Bidirectional Transformers for Lan...](https://arxiv.org/abs/1810.04805) | 2018 | 118475 | 13 | Figure 1: | Figure 1: Overall pre-training and fine-tuning procedures for BERT. Apart from output layers, the same architectures are used in both pre-training and fine-tun... |
| 50 | [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | 2017 | 186409 | 9 | Figure 1: | Figure 1: The Transformer - model architecture. |

## 具身智能 / VLA

论文数：50；成功提取 Figure 的论文：49；解析到的 Figure 总数：1155。

### 代表图构图类型

| 类型 | 论文数 |
| --- | ---: |
| system-overview | 23 |
| training-pipeline | 18 |
| agent-loop | 15 |
| model-architecture | 15 |
| data-pipeline | 11 |
| qualitative-montage | 9 |
| temporal-storyboard | 8 |
| quantitative-chart | 7 |
| taxonomy-benchmark | 4 |
| other | 3 |

### 代表图视觉元素

| 元素 | 论文数 |
| --- | ---: |
| robot-embodiment | 43 |
| token-sequence | 35 |
| action-trajectory | 33 |
| image-strip | 33 |
| module-blocks | 33 |
| dataset-stack | 11 |
| environment-scene | 11 |
| stage-containers | 10 |
| attention-bridge | 7 |
| frozen-trainable-state | 7 |
| annotations-callouts | 5 |
| chart-axes | 5 |
| feedback-arrow | 4 |
| legend-encoding | 1 |

### 论文与 Figure 证据

| # | 论文 | 年份 | 引用 | Figure 数 | 代表 Figure | Caption |
| ---: | --- | ---: | ---: | ---: | --- | --- |
| 1 | [CoT-VLA: Visual Chain-of-Thought Reasoning for Vision-Languag...](https://arxiv.org/abs/2503.22020) | 2025 | 502 | 12 | Figure 1: | Figure 1: Comparison between vanilla VLA and CoT-VLA frameworks. Prior VLA models (top) directly predict robot actions from task inputs without explicit reason... |
| 2 | [SpatialVLA: Exploring Spatial Representations for Visual-Lang...](https://arxiv.org/abs/2501.15830) | 2025 | 464 | 24 | Figure 1: | Figure 1: Overview of SpatialVLA. Given an image observation 𝐨t\mathbf{o}_{t} and a task instruction 𝐋\mathbf{L}, the model processes the image using Ego3D P... |
| 3 | [Unified Vision-Language-Action Model](https://arxiv.org/abs/2506.19850) | 2025 | 112 | 18 | Figure 1: | Figure 1: We present UniVLA, a unified vision-language-action model. Unlike prior VLA approaches that typically rely on an extra vision encoder to extract imag... |
| 4 | [OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/abs/2406.09246) | 2024 | 2823 | 16 | Figure 1: | Figure 1: OpenVLA model architecture. Given an image observation and a language instruction, the model predicts 7-dimensional robot control actions. The archit... |
| 5 | [$π_0$: A Vision-Language-Action Flow Model for General Robot ...](https://arxiv.org/abs/2410.24164) | 2024 | 2244 | 14 | Figure 3: | Figure 3: Overview of our framework. We start with a pre-training mixture, which consists of both our own dexterous manipulation datasets and open-source data.... |
| 6 | [Octo: An Open-Source Generalist Robot Policy](https://arxiv.org/abs/2405.12213) | 2024 | 1581 | 14 | Figure 0: | Figure 0: Model architecture. Left: Octo tokenizes task descriptions (green) and input observations (blue) using a pretrained language model and a lightweight ... |
| 7 | [DROID: A Large-Scale In-The-Wild Robot Manipulation Dataset](https://arxiv.org/abs/2403.12945) | 2024 | 920 | 17 | Figure 6: | Figure 6: Does DROID Improve Policy Performance and Robustness? We find that across all our evaluation tasks, co-training with DROID significantly improves bot... |
| 8 | [RDT-1B: a Diffusion Foundation Model for Bimanual Manipulation](https://arxiv.org/abs/2410.07864) | 2024 | 764 | 28 | Figure 1: | Figure 1: Overview of Robotics Diffusion Transformer with 1B-Parameters (RDT-1B), a language-conditioned visuomotor policy for bimanual manipulation,with state... |
| 9 | [Mobile ALOHA: Learning Bimanual Mobile Manipulation with Low-...](https://arxiv.org/abs/2401.02117) | 2024 | 716 | 16 | Figure 2: | Figure 2: Task Definitions. We illustrate 6 real-world tasks that Mobile ALOHA can perform autonomously. The 7th task High Five is illustrated in the Appendix ... |
| 10 | [CogACT: A Foundational Vision-Language-Action Model for Syner...](https://arxiv.org/abs/2411.19650) | 2024 | 391 | 26 | Figure 2: | Figure 2: Overview of our architecture. Our model is componentized into three parts: 1) a vision module encoding information from the current image observation... |
| 11 | [TinyVLA: Towards Fast, Data-Efficient Vision-Language-Action ...](https://arxiv.org/abs/2409.12514) | 2024 | 391 | 12 | Figure 2: | Figure 2: Model architecture.The left image illustrates the VLM pretraining pipeline, whereas the right image demonstrates the process of training TinyVLA usin... |
| 12 | [3D-VLA: A 3D Vision-Language-Action Generative World Model](https://arxiv.org/abs/2403.09631) | 2024 | 365 | 14 | Figure 2: | Figure 2: Overview of our 3D-VLA pipeline. The left part shows our goal-generation capability. Our model can imagine the final state image and point cloud base... |
| 13 | [Robotic Control via Embodied Chain-of-Thought Reasoning](https://arxiv.org/abs/2407.08693) | 2024 | 361 | 15 | Figure 4: | Figure 4: Our pipeline for generating synthetic embodied chain-of-thought data at scale for a given robot dataset. We use a Prismatic VLM [35] to create a scen... |
| 14 | [HumanPlus: Humanoid Shadowing and Imitation from Humans](https://arxiv.org/abs/2406.10454) | 2024 | 333 | 11 | Figure 2: | Figure 2: Shadowing and Retargeting. Our system uses one RGB camera for body and hand pose estimation. |
| 15 | [Aligning Cyber Space with Physical World: A Comprehensive Sur...](https://arxiv.org/abs/2407.06886) | 2024 | 324 | 29 | Figure 2: | Figure 2: The overall framework of the embodied agent based on MLMs and WMs. The embodied agent has a embodied world model as its “brain”. It has the capabilit... |
| 16 | [Video Prediction Policy: A Generalist Robot Policy with Predi...](https://arxiv.org/abs/2412.14803) | 2024 | 256 | 54 | Figure 2: | Figure 2: We use the video diffusion model as a vision encoder to obtain the predictive representations that explicitly express both current and sequential fut... |
| 17 | [Diffusion Policy: Visuomotor Policy Learning via Action Diffu...](https://arxiv.org/abs/2303.04137) | 2023 | 3775 | 18 | Figure 3: | Figure 3: Diffusion Policy Overview a) General formulation. At time step t𝑡t, the policy takes the latest Tosubscript𝑇𝑜T_{o} steps of observation data Otsub... |
| 18 | [RT-2: Vision-Language-Action Models Transfer Web Knowledge to...](https://arxiv.org/abs/2307.15818) | 2023 | 3705 | 17 | Figure 1: | Figure 1: RT-2 overview: we represent robot actions as another language, which can be cast into text tokens and trained together with Internet-scale vision-lan... |
| 19 | [PaLM-E: An Embodied Multimodal Language Model](https://arxiv.org/abs/2303.03378) | 2023 | 2939 | 19 | Figure 3: | Figure 3: Overview of transfer learning demonstrated by PaLM-E: across three different robotics domains, using PaLM and ViT pretraining together with the full ... |
| 20 | [Learning Fine-Grained Bimanual Manipulation with Low-Cost Har...](https://arxiv.org/abs/2304.13705) | 2023 | 2065 | 19 | Figure 1: | Figure 1: Left: Camera viewpoints of the front, top, and two wrist cameras, together with an illustration of the bimanual workspace of ALOHA. Middle: Detailed ... |
| 21 | [Voyager: An Open-Ended Embodied Agent with Large Language Mod...](https://arxiv.org/abs/2305.16291) | 2023 | 2021 | 32 | Figure 7 | Table 1: Tech tree mastery. Fractions indicate the number of successful trials out of three total runs. 0/3 means the method fails to unlock a level of the tec... |
| 22 | [Open X-Embodiment: Robotic Learning Datasets and RT-X Models](https://arxiv.org/abs/2310.08864) | 2023 | 1112 | 6 | Figure 1: | Figure 1: RT-1-X and RT-2-X both take images and a text instruction as input and output discretized end-effector actions. RT-1-X is an architecture designed fo... |
| 23 | [BridgeData V2: A Dataset for Robot Learning at Scale](https://arxiv.org/abs/2308.12952) | 2023 | 767 | 14 | Figure 2: | Figure 2: (System setup) A picture of our robot setup showing the WidowX 250 robot arm and various cameras. For sensing, we use an RGBD camera that is fixed in... |
| 24 | [EmbodiedGPT: Vision-Language Pre-Training via Embodied Chain ...](https://arxiv.org/abs/2305.15021) | 2023 | 433 | 27 | Figure 2: | Figure 2: Overall framework of EmbodiedGPT. The black arrow shows the vision-language planning process, while the red arrow represents that we leverage the que... |
| 25 | [Vision-Language Foundation Models as Effective Robot Imitators](https://arxiv.org/abs/2311.01378) | 2023 | 421 | 23 | Figure 2: | Figure 2: The illustration of the proposed RoboFlamingo framework. The Flamingo backbone models single-step observations, and the temporal features are modeled... |
| 26 | [Real-World Humanoid Locomotion with Reinforcement Learning](https://arxiv.org/abs/2303.03381) | 2023 | 399 | 8 | Figure 7: | Figure 7: Overview of the method. (A) Our training consists of two steps. First, we assume that the environment is fully observable and train a teacher state p... |
| 27 | [Unleashing Large-Scale Video Generative Pre-training for Visu...](https://arxiv.org/abs/2312.13139) | 2023 | 381 | 19 | Figure 1: | Figure 1: Overview of GR-1. GR-1 is first pre-trained on the task of video prediction with a large-scale video dataset. It is then finetuned on robot data to l... |
| 28 | [Physically Grounded Vision-Language Models for Robotic Manipu...](https://arxiv.org/abs/2309.02561) | 2023 | 269 | 34 | Figure 1: | Figure 1: (a) We collect physical concept annotations of common household objects for fine-tuning VLMs. (b) We use the fine-tuned VLM in an LLM-based robotic p... |
| 29 | [Open-World Object Manipulation using Pre-trained Vision-Langu...](https://arxiv.org/abs/2303.00905) | 2023 | 239 | 14 | Figure 1: | Figure 1: Overview of MOO. We train a language-conditioned policy conditioned on object locations from a frozen VLM. The policy is trained on demonstrations sp... |
| 30 | [ETPNav: Evolving Topological Planning for Vision-Language Nav...](https://arxiv.org/abs/2304.03047) | 2023 | 237 | 0 | 未提取 | 404 Not Found for https://arxiv.org/html/2304.03047 |
| 31 | [RoboCat: A Self-Improving Generalist Agent for Robotic Manipu...](https://arxiv.org/abs/2306.11706) | 2023 | 120 | 102 | Figure 3: | Figure 3: The real-world object sets used by RoboCat. The first two object sets are used to systematically study structure-building and insertion affordances, ... |
| 32 | [Do As I Can, Not As I Say: Grounding Language in Robotic Affo...](https://arxiv.org/abs/2204.01691) | 2022 | 3410 | 63 | Figure 12 | Table 1: List of instruction family definitions: We evaluate the algorithm on 101 instructions. We group the instructions into different families, with each fa... |
| 33 | [RT-1: Robotics Transformer for Real-World Control at Scale](https://arxiv.org/abs/2212.06817) | 2022 | 2561 | 33 | (a) | (a) RT-1 takes images and natural language instructions and outputs discretized base and arm actions. Despite its size (35M parameters), it does this at 3 Hz, ... |
| 34 | [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753) | 2022 | 1701 | 12 | Figure 2: | Figure 2: Code as Policies can follow natural language instructions across diverse domains and robots: table-top manipulation (a)-(b), 2D shape drawing (c), an... |
| 35 | [Inner Monologue: Embodied Reasoning through Planning with Lan...](https://arxiv.org/abs/2207.05608) | 2022 | 1456 | 30 | Figure 1: | Figure 1: Inner Monologue enables grounded closed-loop feedback for robot planning with large language models by leveraging a collection of perception models (... |
| 36 | [A Generalist Agent](https://arxiv.org/abs/2205.06175) | 2022 | 1125 | 27 | Figure 3: | Figure 3: Running Gato as a control policy. Gato consumes a sequence of interleaved tokenized observations, separator tokens, and previously sampled actions to... |
| 37 | [R3M: A Universal Visual Representation for Robot Manipulation](https://arxiv.org/abs/2203.12601) | 2022 | 936 | 12 | Figure 9: | Figure 9: Per task Success Rate. We observe that R3M is the highest performing method on 11/12 tasks. |
| 38 | [Perceiver-Actor: A Multi-Task Transformer for Robotic Manipul...](https://arxiv.org/abs/2209.05451) | 2022 | 839 | 18 | Figure 1: | Figure 1: Language-Conditioned Manipulation Tasks: PerAct is a language-conditioned multi-task agent capable of imitating a wide range of 6-DoF manipulation ta... |
| 39 | [BC-Z: Zero-Shot Task Generalization with Robotic Imitation Le...](https://arxiv.org/abs/2202.02005) | 2022 | 814 | 28 | Figure 1: | Figure 1: Overview of BC-Z. We collect a large-scale dataset (25,877 episodes) of 100 diverse manipulation tasks, and train a 7-DoF multi-task policy that cond... |
| 40 | [LM-Nav: Robotic Navigation with Large Pre-Trained Models of L...](https://arxiv.org/abs/2207.04429) | 2022 | 743 | 22 | Figure 1: | Figure 1: Embodied instruction following with LM-Nav: Our system takes as input a set of raw observations from the target environment and free-form textual ins... |
| 41 | [Visual Language Maps for Robot Navigation](https://arxiv.org/abs/2210.05714) | 2022 | 620 | 27 | Figure 3: | Figure 3: System overview. A VLMap is created by fusing pretrained visual-language features into the reconstruction of the environment to enable visual-spatial... |
| 42 | [MineDojo: Building Open-Ended Embodied Agents with Internet-S...](https://arxiv.org/abs/2206.08853) | 2022 | 598 | 25 | Figure 1: | Figure 1: MineDojo is a novel framework for developing open-ended, generally capable agents that can learn and adapt continually to new goals. MineDojo feature... |
| 43 | [VIMA: General Robot Manipulation with Multimodal Prompts](https://arxiv.org/abs/2210.03094) | 2022 | 580 | 49 | Figure 2: | Figure 2: Evaluation Protocol in VIMA-Bench. We design 4 levels of evaluation settings to systematically measure the zero-shot generalization capability of an ... |
| 44 | [CLIPort: What and Where Pathways for Robotic Manipulation](https://arxiv.org/abs/2109.12098) | 2021 | 966 | 17 | Figure 1: | Figure 1: Language-Conditioned Manipulation Tasks: CLIPort is a broad framework applicable to a wide range of language-conditioned manipulation tasks in tablet... |
| 45 | [CALVIN: A Benchmark for Language-Conditioned Policy Learning ...](https://arxiv.org/abs/2112.03227) | 2021 | 670 | 8 | Figure 3: | Figure 3: CALVIN supports a range of sensors commonly utilized for visuomotor control: RGB-D images from both a static and a gripper camera, proprioceptive inf... |
| 46 | [BEHAVIOR: Benchmark for Everyday Household Activities in Virt...](https://arxiv.org/abs/2108.03332) | 2021 | 257 | 53 | Figure 2: | Figure 2: Unary and Binary Predicates in BDDL: We represent object states and relationships to other objects based on their kinematics, temperature, wetness le... |
| 47 | [Transporter Networks: Rearranging the Visual World for Roboti...](https://arxiv.org/abs/2010.14406) | 2020 | 586 | 21 | Figure 1: | Figure 1: A Transporter Network is a simple model architecture that attends to a local region and predicts its spatial displacement (b) from visual input – whi... |
| 48 | [ALFRED: A Benchmark for Interpreting Grounded Instructions fo...](https://arxiv.org/abs/1912.01734) | 2019 | 1149 | 20 | Figure 4: | Figure 4: Model overview. At each step, our model reweights the instruction based on the history (x^tsubscript^𝑥𝑡\hat{x}_{t}), and combines the current obser... |
| 49 | [Reinforced Cross-Modal Matching and Self-Supervised Imitation...](https://arxiv.org/abs/1811.10092) | 2018 | 644 | 14 | Figure 2: | Figure 2: Overview of our RCM framework. |
| 50 | [PDDLStream: Integrating Symbolic Planners and Blackbox Sample...](https://arxiv.org/abs/1802.08705) | 2018 | 357 | 4 | Figure 1: | Figure 1: Left: Domain 1 (with 5 blocks). Right: A real-world robot planning to “serve a meal” on the brown tray. |
