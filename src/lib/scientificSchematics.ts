import type {
  FlowEdge,
  FlowNode,
  ScientificProvenance,
  ScientificSchematicDensity,
  ScientificSchematicLanguage,
  ScientificSchematicOptions,
  ScientificSchematicRole,
  ScientificSchematicStyle,
  ScientificSchematicTemplateId,
  ShapeKind,
} from '../types';
import { createEdgeMarker, createFlowEdge, createFlowNode, normalizeGraph } from './diagram';
import { createId } from './id';

export interface ScientificSchematicReference {
  arxivId: string;
  title: string;
  figure: string;
  pattern: string;
}

export interface ScientificSchematicTemplate {
  id: ScientificSchematicTemplateId;
  name: string;
  nameEn: string;
  description: string;
  focus: string;
  references: ScientificSchematicReference[];
}

export interface EditableScientificSchematic {
  title: string;
  templateId: ScientificSchematicTemplateId;
  nodes: FlowNode[];
  edges: FlowEdge[];
  width: number;
  height: number;
  references: ScientificSchematicReference[];
}

export const SCIENTIFIC_SCHEMATIC_TEMPLATES: ScientificSchematicTemplate[] = [
  {
    id: 'multimodal-foundation',
    name: '多模态基础模型',
    nameEn: 'Multimodal foundation model',
    description: '图像、文本、音频与机器人状态交错成 token 流，进入统一主干并分发到多种任务。',
    focus: '模态输入 · token 流 · 统一主干',
    references: [
      { arxivId: '2303.03378', title: 'PaLM-E', figure: 'Figure 1', pattern: 'Interleaved multimodal tokens enter one language-model backbone.' },
      { arxivId: '2204.14198', title: 'Flamingo', figure: 'Architecture figures', pattern: 'Visual conditioning is interleaved with language processing.' },
    ],
  },
  {
    id: 'vision-language-bridge',
    name: '视觉语言桥接',
    nameEn: 'Vision-language bridge',
    description: '冻结视觉编码器、轻量桥接模块与语言模型的两阶段训练和推理路径。',
    focus: '视觉编码 · 桥接器 · 两阶段训练',
    references: [
      { arxivId: '2301.12597', title: 'BLIP-2', figure: 'Figures 1-3', pattern: 'A lightweight querying transformer bridges frozen vision and language models.' },
      { arxivId: '2406.09246', title: 'OpenVLA', figure: 'Figure 1', pattern: 'Vision encoder, projector, language backbone, and action output form a clear modular chain.' },
    ],
  },
  {
    id: 'vla-policy',
    name: 'VLA 机器人策略',
    nameEn: 'Vision-language-action policy',
    description: '观察、语言和本体状态经编码与融合后，由 VLM 主干和动作专家输出动作块。',
    focus: '多源观察 · VLM · 动作专家 · 闭环',
    references: [
      { arxivId: '2406.09246', title: 'OpenVLA', figure: 'Figure 1', pattern: 'Image and instruction are encoded into a language backbone that predicts robot actions.' },
      { arxivId: '2410.24164', title: 'pi0', figure: 'Figure 3', pattern: 'A VLM backbone and action expert serve multiple robot embodiments.' },
      { arxivId: '2307.15818', title: 'RT-2', figure: 'System overview', pattern: 'Robot actions are represented in a vision-language model output space.' },
    ],
  },
  {
    id: 'prompt-conditioned-agent',
    name: '多模态提示智能体',
    nameEn: 'Prompt-conditioned embodied agent',
    description: '多模态任务提示与交互历史通过交叉注意力共同条件化因果控制器。',
    focus: '提示编码 · 交叉注意力 · 交互历史',
    references: [
      { arxivId: '2210.03094', title: 'VIMA', figure: 'Figures 1 and 3', pattern: 'Multimodal prompts and interaction history condition a causal robot controller.' },
    ],
  },
  {
    id: 'embodied-loop',
    name: '具身智能闭环',
    nameEn: 'Embodied intelligence loop',
    description: '感知、世界模型、规划、策略、执行与环境反馈形成可解释的控制闭环。',
    focus: '感知 · 世界模型 · 规划 · 反馈',
    references: [
      { arxivId: '2303.03378', title: 'PaLM-E', figure: 'Figures 1 and 5', pattern: 'Embodied reasoning connects multimodal perception, planning, and low-level policies.' },
      { arxivId: '2212.06817', title: 'RT-1', figure: 'Architecture overview', pattern: 'Observations and language condition closed-loop robot actions.' },
    ],
  },
  {
    id: 'train-deploy',
    name: '训练与部署全景',
    nameEn: 'Training and deployment system',
    description: '数据混合、预训练、适配、检查点与在线机器人推理被组织成训练和部署双区。',
    focus: '数据混合 · 训练阶段 · 多机器人部署',
    references: [
      { arxivId: '2410.24164', title: 'pi0', figure: 'Figures 3-5', pattern: 'A heterogeneous data mixture trains one policy for multiple robot embodiments.' },
      { arxivId: '2405.12213', title: 'Octo', figure: 'System overview', pattern: 'A generalist policy is pretrained on diverse robot data and adapted downstream.' },
    ],
  },
  {
    id: 'llm-training-pipeline',
    name: 'LLM 全阶段训练流水线',
    nameEn: 'LLM training pipeline',
    description: '语料策展、预训练、指令微调、偏好对齐与评测沿 checkpoint 主路径展开。',
    focus: '数据策展 · SFT · 偏好对齐 · 评测',
    references: [
      { arxivId: '2203.02155', title: 'InstructGPT', figure: 'Figure 2', pattern: 'Demonstrations, comparisons, and PPO training form a staged alignment pipeline.' },
      { arxivId: '2305.18290', title: 'DPO', figure: 'Figure 1', pattern: 'Preference optimization is contrasted with reward-model-based RLHF.' },
    ],
  },
  {
    id: 'moe-routing',
    name: '稀疏 MoE 路由',
    nameEn: 'Sparse mixture-of-experts routing',
    description: 'token 经门控选择 top-k 专家，专家输出按权重合并，并标出其在 Transformer 层内的位置。',
    focus: 'Token · Router · Top-k 专家 · 汇流',
    references: [
      { arxivId: '2401.04088', title: 'Mixtral of Experts', figure: 'Figure 1', pattern: 'A router sends each token to a sparse subset of experts.' },
      { arxivId: '2101.03961', title: 'Switch Transformers', figure: 'Figure 2', pattern: 'Sparse expert routing replaces a dense feed-forward sublayer.' },
    ],
  },
  {
    id: 'rag-tool-agent',
    name: 'RAG 与工具智能体',
    nameEn: 'Retrieval and tool-using agent',
    description: '问题路由到知识检索或外部工具，证据和 observation 回流 LLM 后生成带引用答案。',
    focus: '路由 · 检索 · 工具 · 证据回流',
    references: [
      { arxivId: '2005.11401', title: 'RAG', figure: 'Figure 1', pattern: 'A query retrieves documents that condition a generator.' },
      { arxivId: '2210.03629', title: 'ReAct', figure: 'Figure 1', pattern: 'Reasoning, actions, and observations alternate in an agent trace.' },
      { arxivId: '2302.04761', title: 'Toolformer', figure: 'Figure 1', pattern: 'Tool calls and returned values are inserted into language-model context.' },
    ],
  },
  {
    id: 'reasoning-trace',
    name: '推理轨迹与校验',
    nameEn: 'Reasoning trace and verification',
    description: '问题、思考、工具动作、观察、校验和最终答案沿可读时间轴组织。',
    focus: 'Thought · Action · Observation · Verify',
    references: [
      { arxivId: '2201.11903', title: 'Chain-of-Thought Prompting', figure: 'Figure 1', pattern: 'Standard and chain-of-thought prompting are compared with readable examples.' },
      { arxivId: '2210.03629', title: 'ReAct', figure: 'Figure 1', pattern: 'Correct and failed reasoning-action traces are shown side by side.' },
    ],
  },
  {
    id: 'robot-data-collection',
    name: '机器人数据采集与策展',
    nameEn: 'Robot data collection and curation',
    description: '相机、机体和示教生成多视角 episode，经过同步、切分、过滤与标注进入数据集。',
    focus: '传感器 · Episode · 过滤 · 数据混合',
    references: [
      { arxivId: '2403.12945', title: 'DROID', figure: 'Figures 1 and 6', pattern: 'In-the-wild collection hardware and dataset distributions are presented together.' },
      { arxivId: '2308.12952', title: 'BridgeData V2', figure: 'Figure 2', pattern: 'Robot hardware and randomized camera viewpoints explain dataset coverage.' },
      { arxivId: '2310.08864', title: 'Open X-Embodiment', figure: 'Figure 1', pattern: 'Many embodiments and datasets are normalized into one training mixture.' },
    ],
  },
  {
    id: 'world-model-rollout',
    name: '世界模型与未来展开',
    nameEn: 'World-model rollout',
    description: '当前观察编码为空间状态，模型并行展开候选未来，评分后选择动作轨迹并闭环执行。',
    focus: '空间状态 · 未来帧 · 候选轨迹 · 反馈',
    references: [
      { arxivId: '2403.09631', title: '3D-VLA', figure: 'Figure 2', pattern: 'A 3D world representation connects goal imagination and robot control.' },
      { arxivId: '2412.14803', title: 'Video Prediction Policy', figure: 'Figure 2', pattern: 'Future visual representations are predicted before action selection.' },
    ],
  },
  {
    id: 'sim-to-real',
    name: '仿真到真实迁移',
    nameEn: 'Simulation-to-real transfer',
    description: '仿真 rollout、域随机化、共享策略、真实适配器与部署评测形成清晰迁移桥梁。',
    focus: '仿真 · 域随机化 · 适配 · 真机',
    references: [
      { arxivId: '2406.10454', title: 'HumanPlus', figure: 'Figure 2', pattern: 'Human motion, simulation, and real humanoids are visually aligned.' },
      { arxivId: '2303.03381', title: 'Real-World Humanoid Locomotion', figure: 'Figure 7', pattern: 'Simulation training and real-robot transfer are separated into panels.' },
    ],
  },
  {
    id: 'multi-embodiment-policy',
    name: '多机体通用策略',
    nameEn: 'Multi-embodiment generalist policy',
    description: '多种机器人数据先统一表示，再进入共享主干和机体专用动作专家。',
    focus: '多机体数据 · 统一表示 · 共享主干 · 专家头',
    references: [
      { arxivId: '2410.24164', title: 'pi0', figure: 'Figure 3', pattern: 'A shared VLM and action expert operate across multiple robot platforms.' },
      { arxivId: '2310.08864', title: 'Open X-Embodiment', figure: 'Figure 1', pattern: 'Cross-embodiment data is mapped into common model inputs and outputs.' },
      { arxivId: '2405.12213', title: 'Octo', figure: 'Figure 0', pattern: 'A shared transformer is pretrained and adapted across robot datasets.' },
    ],
  },
];

export const DEFAULT_SCIENTIFIC_SCHEMATIC_OPTIONS: ScientificSchematicOptions = {
  templateId: 'vla-policy',
  title: 'Vision-Language-Action Policy',
  backbone: 'VLM Backbone',
  style: 'conference',
  density: 'standard',
  language: 'en',
};

interface RoleColors {
  fill: string;
  stroke: string;
  text: string;
}

type SchematicPalette = Record<ScientificSchematicRole, RoleColors> & {
  edge: string;
  feedback: string;
};

const PALETTES: Record<ScientificSchematicStyle, SchematicPalette> = {
  conference: {
    frame: { fill: '#FFFFFF', stroke: '#9AA6B2', text: '#1E2933' },
    phase: { fill: '#F7F8FA', stroke: '#C8D0D8', text: '#46515C' },
    modality: { fill: '#E8F2FB', stroke: '#4C7DA5', text: '#173C5A' },
    token: { fill: '#FFF3D8', stroke: '#B67B19', text: '#5D3D08' },
    encoder: { fill: '#E7F4EE', stroke: '#3E8064', text: '#1C4C39' },
    bridge: { fill: '#FFF0E8', stroke: '#B95D3D', text: '#67311F' },
    backbone: { fill: '#EEEAF8', stroke: '#725BA5', text: '#3C2E65' },
    policy: { fill: '#FCEBED', stroke: '#B64E63', text: '#692638' },
    action: { fill: '#E8F3FC', stroke: '#3979AA', text: '#173F5F' },
    environment: { fill: '#EDF6E9', stroke: '#56814A', text: '#294D22' },
    memory: { fill: '#F1EDF7', stroke: '#6D5C8B', text: '#3D3156' },
    dataset: { fill: '#F9F0DE', stroke: '#98722F', text: '#584114' },
    loss: { fill: '#FBE9E7', stroke: '#A84D45', text: '#642B26' },
    annotation: { fill: '#F3F5F6', stroke: '#7B838C', text: '#42484E' },
    edge: '#4B5864',
    feedback: '#A34F3C',
  },
  technical: {
    frame: { fill: '#FFFFFF', stroke: '#82909D', text: '#16212B' },
    phase: { fill: '#F4F7F8', stroke: '#B8C3CB', text: '#36434D' },
    modality: { fill: '#E4F1F6', stroke: '#28708B', text: '#134253' },
    token: { fill: '#F8EDCF', stroke: '#9B7420', text: '#533D08' },
    encoder: { fill: '#E5F1EA', stroke: '#2F7555', text: '#17432F' },
    bridge: { fill: '#F4EAE0', stroke: '#99603A', text: '#55311B' },
    backbone: { fill: '#E8EDF4', stroke: '#496B8E', text: '#233F5B' },
    policy: { fill: '#F3E6EA', stroke: '#945368', text: '#55283A' },
    action: { fill: '#E3EEF6', stroke: '#346E98', text: '#193D58' },
    environment: { fill: '#E9F1E7', stroke: '#557A4C', text: '#2B4B26' },
    memory: { fill: '#EBE9F0', stroke: '#655E79', text: '#393446' },
    dataset: { fill: '#F2EBD9', stroke: '#866D35', text: '#4C3C17' },
    loss: { fill: '#F5E5E2', stroke: '#97504A', text: '#572B27' },
    annotation: { fill: '#F0F2F3', stroke: '#747E86', text: '#3B4349' },
    edge: '#3F4D58',
    feedback: '#8F493D',
  },
  monochrome: {
    frame: { fill: '#FFFFFF', stroke: '#727272', text: '#111111' },
    phase: { fill: '#F7F7F7', stroke: '#A5A5A5', text: '#333333' },
    modality: { fill: '#F1F1F1', stroke: '#555555', text: '#151515' },
    token: { fill: '#FFFFFF', stroke: '#777777', text: '#202020' },
    encoder: { fill: '#E9E9E9', stroke: '#4D4D4D', text: '#151515' },
    bridge: { fill: '#F5F5F5', stroke: '#626262', text: '#1A1A1A' },
    backbone: { fill: '#DDDDDD', stroke: '#333333', text: '#101010' },
    policy: { fill: '#E6E6E6', stroke: '#444444', text: '#121212' },
    action: { fill: '#F0F0F0', stroke: '#555555', text: '#151515' },
    environment: { fill: '#FFFFFF', stroke: '#333333', text: '#111111' },
    memory: { fill: '#EFEFEF', stroke: '#555555', text: '#151515' },
    dataset: { fill: '#F5F5F5', stroke: '#666666', text: '#202020' },
    loss: { fill: '#E8E8E8', stroke: '#444444', text: '#151515' },
    annotation: { fill: '#FFFFFF', stroke: '#777777', text: '#333333' },
    edge: '#333333',
    feedback: '#111111',
  },
};

interface NodeOptions {
  id: string;
  kind?: ShapeKind;
  role: ScientificSchematicRole;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  description?: string;
  detail?: ScientificSchematicDensity;
  fontSize?: number;
  fontWeight?: number;
  zIndex?: number;
  scientificRole?: FlowNode['data']['scientificRole'];
  provenance?: ScientificProvenance;
}

function densityRank(value: ScientificSchematicDensity): number {
  return value === 'compact' ? 0 : value === 'standard' ? 1 : 2;
}

function text(language: ScientificSchematicLanguage, english: string, chinese: string): string {
  return language === 'zh' ? chinese : english;
}

function moduleNode(palette: SchematicPalette, input: NodeOptions): FlowNode {
  const colors = palette[input.role];
  const node = createFlowNode(input.kind ?? 'rounded-rectangle', { x: input.x, y: input.y }, input.label, {
    id: input.id,
    selected: false,
    zIndex: input.zIndex ?? (input.role === 'frame' ? -30 : input.role === 'phase' ? -20 : 10),
    style: { width: input.width, height: input.height },
  });
  node.data = {
    ...node.data,
    label: input.label,
    description: input.description,
    fill: colors.fill,
    stroke: colors.stroke,
    textColor: colors.text,
    borderWidth: input.role === 'frame' ? 1.4 : input.role === 'phase' ? 1 : 1.5,
    radius: input.role === 'frame' || input.role === 'phase' ? 7 : 6,
    fontSize: input.fontSize ?? (input.role === 'frame' ? 16 : input.role === 'phase' ? 13 : 13),
    fontWeight: input.fontWeight ?? (input.role === 'frame' ? 700 : input.role === 'phase' ? 650 : 650),
    schematicRole: input.role,
    schematicDetail: input.detail ?? 'compact',
    scientificRole: input.scientificRole,
    provenance: input.provenance,
  };
  return node;
}

interface EdgeOptions {
  label?: string;
  routing?: 'smoothstep' | 'straight' | 'bezier';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  feedback?: boolean;
  width?: number;
  arrowEnd?: 'none' | 'open' | 'closed';
}

function moduleEdge(palette: SchematicPalette, source: string, target: string, options: EdgeOptions = {}): FlowEdge {
  const routing = options.routing ?? 'smoothstep';
  const color = options.feedback ? palette.feedback : palette.edge;
  const width = options.width ?? (options.feedback ? 1.8 : 1.65);
  const arrowEnd = options.arrowEnd ?? 'closed';
  const edge = createFlowEdge(source, target, options.label, routing);
  edge.selected = false;
  edge.data = {
    ...edge.data!,
    label: options.label,
    color,
    width,
    routing,
    lineStyle: options.lineStyle ?? (options.feedback ? 'dashed' : 'solid'),
    arrowEnd,
  };
  edge.style = {
    ...edge.style,
    stroke: color,
    strokeWidth: width,
    strokeDasharray: edge.data.lineStyle === 'dashed' ? '8 6' : edge.data.lineStyle === 'dotted' ? '2 5' : undefined,
  };
  edge.markerEnd = createEdgeMarker(arrowEnd, color);
  return edge;
}

interface Blueprint {
  nodes: FlowNode[];
  edges: FlowEdge[];
  width: number;
  height: number;
}

function buildMultimodal(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'mm-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1280, height: 660, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'mm-input-phase', kind: 'group', role: 'phase', x: 30, y: 68, width: 235, height: 550, label: t('Multimodal inputs', '多模态输入') }),
    moduleNode(palette, { id: 'mm-token-phase', kind: 'group', role: 'phase', x: 290, y: 68, width: 250, height: 550, label: t('Encoding and tokens', '编码与 Token') }),
    moduleNode(palette, { id: 'mm-model-phase', kind: 'group', role: 'phase', x: 565, y: 68, width: 410, height: 550, label: t('Unified foundation model', '统一基础模型') }),
    moduleNode(palette, { id: 'mm-output-phase', kind: 'group', role: 'phase', x: 1000, y: 68, width: 250, height: 550, label: t('Task outputs', '任务输出') }),
    moduleNode(palette, { id: 'mm-image', kind: 'scientific-image-frame', role: 'modality', x: 66, y: 118, width: 160, height: 92, label: t('Images / video', '图像 / 视频'), description: t('spatial observations', '空间观察') }),
    moduleNode(palette, { id: 'mm-text', role: 'modality', x: 66, y: 238, width: 160, height: 70, label: t('Language', '语言'), description: t('instruction + context', '指令 + 上下文') }),
    moduleNode(palette, { id: 'mm-audio', role: 'modality', x: 66, y: 348, width: 160, height: 70, label: t('Audio', '音频'), description: t('events + speech', '事件 + 语音'), detail: 'standard' }),
    moduleNode(palette, { id: 'mm-state', role: 'modality', x: 66, y: 458, width: 160, height: 70, label: t('Robot state', '机器人状态'), description: t('joints + sensors', '关节 + 传感器') }),
    moduleNode(palette, { id: 'mm-vision-encoder', role: 'encoder', x: 325, y: 128, width: 180, height: 70, label: t('Vision encoder', '视觉编码器') }),
    moduleNode(palette, { id: 'mm-tokenizer', role: 'encoder', x: 325, y: 238, width: 180, height: 70, label: t('Tokenizer', '文本分词器') }),
    moduleNode(palette, { id: 'mm-audio-encoder', role: 'encoder', x: 325, y: 348, width: 180, height: 70, label: t('Audio encoder', '音频编码器'), detail: 'standard' }),
    moduleNode(palette, { id: 'mm-state-projector', role: 'bridge', x: 325, y: 458, width: 180, height: 70, label: t('State projector', '状态投影器') }),
    moduleNode(palette, { id: 'mm-token-stream', kind: 'scientific-token-strip', role: 'token', x: 610, y: 125, width: 320, height: 84, label: t('[IMG]  text  [STATE]  text  [AUDIO]', '[图像] 文本 [状态] 文本 [音频]'), description: t('interleaved token sequence', '交错 Token 序列') }),
    moduleNode(palette, { id: 'mm-backbone', kind: 'scientific-transformer', role: 'backbone', x: 615, y: 245, width: 310, height: 220, label: options.backbone || t('Multimodal LLM', '多模态大模型'), description: t('shared attention and reasoning', '共享注意力与推理'), fontSize: 18 }),
    moduleNode(palette, { id: 'mm-alignment', role: 'loss', x: 670, y: 510, width: 200, height: 62, label: t('Alignment objectives', '对齐训练目标'), description: t('caption + QA + control', '描述 + 问答 + 控制'), detail: 'detailed' }),
    moduleNode(palette, { id: 'mm-language-output', role: 'action', x: 1040, y: 132, width: 170, height: 72, label: t('Language output', '语言输出'), description: t('answer + caption', '回答 + 描述') }),
    moduleNode(palette, { id: 'mm-reasoning-output', role: 'policy', x: 1040, y: 258, width: 170, height: 72, label: t('Embodied plan', '具身规划'), description: t('steps + constraints', '步骤 + 约束') }),
    moduleNode(palette, { id: 'mm-action-output', role: 'action', x: 1040, y: 384, width: 170, height: 72, label: t('Action tokens', '动作 Token'), description: t('policy command', '策略指令') }),
    moduleNode(palette, { id: 'mm-transfer-note', kind: 'note', role: 'annotation', x: 1030, y: 508, width: 190, height: 68, label: t('One shared model transfers across tasks.', '同一主干在不同任务间迁移。'), detail: 'detailed', fontSize: 11, fontWeight: 500 }),
  ];
  const edges = [
    moduleEdge(palette, 'mm-image', 'mm-vision-encoder'),
    moduleEdge(palette, 'mm-text', 'mm-tokenizer'),
    moduleEdge(palette, 'mm-audio', 'mm-audio-encoder'),
    moduleEdge(palette, 'mm-state', 'mm-state-projector'),
    moduleEdge(palette, 'mm-vision-encoder', 'mm-token-stream'),
    moduleEdge(palette, 'mm-tokenizer', 'mm-token-stream'),
    moduleEdge(palette, 'mm-audio-encoder', 'mm-token-stream'),
    moduleEdge(palette, 'mm-state-projector', 'mm-token-stream'),
    moduleEdge(palette, 'mm-token-stream', 'mm-backbone'),
    moduleEdge(palette, 'mm-backbone', 'mm-language-output'),
    moduleEdge(palette, 'mm-backbone', 'mm-reasoning-output'),
    moduleEdge(palette, 'mm-backbone', 'mm-action-output'),
    moduleEdge(palette, 'mm-alignment', 'mm-backbone', { lineStyle: 'dashed', arrowEnd: 'open' }),
  ];
  return { nodes, edges, width: 1280, height: 660 };
}

function buildVisionLanguageBridge(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'vl-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1320, height: 660, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'vl-stage-one', kind: 'group', role: 'phase', x: 30, y: 72, width: 610, height: 540, label: t('Stage 1 · representation alignment', '阶段一 · 表征对齐') }),
    moduleNode(palette, { id: 'vl-stage-two', kind: 'group', role: 'phase', x: 665, y: 72, width: 625, height: 540, label: t('Stage 2 · generative bootstrapping', '阶段二 · 生成式桥接') }),
    moduleNode(palette, { id: 'vl-images', kind: 'scientific-image-frame', role: 'modality', x: 68, y: 150, width: 150, height: 100, label: t('Image batch', '图像批次') }),
    moduleNode(palette, { id: 'vl-frozen-vision', kind: 'scientific-frozen', role: 'encoder', x: 270, y: 145, width: 190, height: 116, label: t('Frozen vision encoder', '冻结视觉编码器'), description: t('patch features', '图像块特征') }),
    moduleNode(palette, { id: 'vl-queries', kind: 'scientific-token-strip', role: 'token', x: 270, y: 312, width: 190, height: 76, label: t('Learnable queries', '可学习查询 Token') }),
    moduleNode(palette, { id: 'vl-qformer', kind: 'scientific-transformer', role: 'bridge', x: 500, y: 192, width: 110, height: 190, label: t('Querying\nTransformer', '查询\nTransformer'), description: t('cross attention', '交叉注意力'), fontSize: 14 }),
    moduleNode(palette, { id: 'vl-text', role: 'modality', x: 68, y: 410, width: 150, height: 76, label: t('Paired text', '配对文本') }),
    moduleNode(palette, { id: 'vl-objectives', role: 'loss', x: 278, y: 438, width: 260, height: 94, label: t('ITC · ITM · image-grounded text', '图文对比 · 匹配 · 生成'), description: t('joint representation objectives', '联合表征目标'), detail: 'standard' }),
    moduleNode(palette, { id: 'vl-image-two', kind: 'scientific-image-frame', role: 'modality', x: 700, y: 140, width: 145, height: 96, label: t('Image', '图像') }),
    moduleNode(palette, { id: 'vl-frozen-two', kind: 'scientific-frozen', role: 'encoder', x: 885, y: 132, width: 185, height: 112, label: t('Frozen vision encoder', '冻结视觉编码器') }),
    moduleNode(palette, { id: 'vl-qformer-two', role: 'bridge', x: 885, y: 296, width: 185, height: 96, label: t('Query bridge', '查询桥接器') }),
    moduleNode(palette, { id: 'vl-projection', role: 'token', x: 700, y: 318, width: 145, height: 70, label: t('Projection', '线性投影'), description: t('language space', '语言空间') }),
    moduleNode(palette, { id: 'vl-llm', kind: 'scientific-frozen', role: 'backbone', x: 1110, y: 196, width: 145, height: 220, label: options.backbone || t('Frozen LLM', '冻结大模型'), description: t('decoder or encoder-decoder', '解码器或编解码器'), fontSize: 16 }),
    moduleNode(palette, { id: 'vl-prompt', role: 'modality', x: 700, y: 450, width: 145, height: 72, label: t('Instruction', '文本指令') }),
    moduleNode(palette, { id: 'vl-output', role: 'action', x: 1102, y: 476, width: 162, height: 78, label: t('Generated response', '生成式输出') }),
    moduleNode(palette, { id: 'vl-freeze-note', kind: 'note', role: 'annotation', x: 878, y: 470, width: 194, height: 82, label: t('Frozen towers keep training efficient; only the bridge learns.', '冻结两端主干，仅训练桥接模块。'), detail: 'detailed', fontSize: 11, fontWeight: 500 }),
  ];
  const edges = [
    moduleEdge(palette, 'vl-images', 'vl-frozen-vision'),
    moduleEdge(palette, 'vl-frozen-vision', 'vl-qformer'),
    moduleEdge(palette, 'vl-queries', 'vl-qformer'),
    moduleEdge(palette, 'vl-text', 'vl-qformer'),
    moduleEdge(palette, 'vl-qformer', 'vl-objectives', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'vl-image-two', 'vl-frozen-two'),
    moduleEdge(palette, 'vl-frozen-two', 'vl-qformer-two'),
    moduleEdge(palette, 'vl-qformer-two', 'vl-projection'),
    moduleEdge(palette, 'vl-projection', 'vl-llm'),
    moduleEdge(palette, 'vl-prompt', 'vl-llm'),
    moduleEdge(palette, 'vl-llm', 'vl-output'),
  ];
  return { nodes, edges, width: 1320, height: 660 };
}

function buildVlaPolicy(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'vla-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1360, height: 690, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'vla-perception', kind: 'group', role: 'phase', x: 28, y: 70, width: 405, height: 540, label: t('Observation and encoding', '观察与编码') }),
    moduleNode(palette, { id: 'vla-reasoning', kind: 'group', role: 'phase', x: 458, y: 70, width: 500, height: 540, label: t('Multimodal reasoning', '多模态推理') }),
    moduleNode(palette, { id: 'vla-control', kind: 'group', role: 'phase', x: 984, y: 70, width: 348, height: 540, label: t('Action and embodiment', '动作与机器人') }),
    moduleNode(palette, { id: 'vla-image', kind: 'scientific-image-frame', role: 'modality', x: 62, y: 118, width: 145, height: 98, label: t('Camera observation', '相机观察') }),
    moduleNode(palette, { id: 'vla-language', role: 'modality', x: 62, y: 254, width: 145, height: 78, label: t('Language instruction', '语言指令') }),
    moduleNode(palette, { id: 'vla-state', role: 'modality', x: 62, y: 380, width: 145, height: 78, label: t('Proprioceptive state', '本体状态') }),
    moduleNode(palette, { id: 'vla-vision', role: 'encoder', x: 244, y: 128, width: 150, height: 78, label: t('Vision encoders', '视觉编码器'), description: t('global + local features', '全局 + 局部特征') }),
    moduleNode(palette, { id: 'vla-tokenizer', role: 'encoder', x: 244, y: 254, width: 150, height: 78, label: t('Text tokenizer', '文本分词器') }),
    moduleNode(palette, { id: 'vla-state-projector', role: 'bridge', x: 244, y: 380, width: 150, height: 78, label: t('State projector', '状态投影器') }),
    moduleNode(palette, { id: 'vla-token-sequence', kind: 'scientific-token-strip', role: 'token', x: 495, y: 116, width: 425, height: 82, label: t('[VISION]  instruction  [STATE]  action queries', '[视觉] 指令 [状态] 动作查询'), description: t('shared embedding sequence', '统一嵌入序列') }),
    moduleNode(palette, { id: 'vla-backbone', kind: 'scientific-transformer', role: 'backbone', x: 510, y: 242, width: 250, height: 190, label: options.backbone || t('VLM backbone', 'VLM 主干'), description: t('language-conditioned visual reasoning', '语言条件视觉推理'), fontSize: 18 }),
    moduleNode(palette, { id: 'vla-action-expert', kind: 'scientific-layer-stack', role: 'policy', x: 792, y: 242, width: 130, height: 190, label: t('Action\nexpert', '动作\n专家'), description: t('flow / diffusion', '流匹配 / 扩散'), fontSize: 15 }),
    moduleNode(palette, { id: 'vla-training-loss', role: 'loss', x: 570, y: 488, width: 270, height: 72, label: t('Action objective + language loss', '动作目标 + 语言损失'), detail: 'detailed' }),
    moduleNode(palette, { id: 'vla-action-chunk', kind: 'scientific-action-chunk', role: 'action', x: 1020, y: 144, width: 276, height: 86, label: t('Action chunk', '动作块'), description: t('T x {pose, gripper, base}', 'T × {位姿, 夹爪, 底盘}') }),
    moduleNode(palette, { id: 'vla-safety', role: 'policy', x: 1020, y: 286, width: 132, height: 72, label: t('Safety filter', '安全过滤'), detail: 'standard' }),
    moduleNode(palette, { id: 'vla-controller', role: 'action', x: 1164, y: 286, width: 132, height: 72, label: t('Controller', '控制器') }),
    moduleNode(palette, { id: 'vla-robot', kind: 'scientific-robot-arm', role: 'environment', x: 1072, y: 412, width: 172, height: 146, label: t('Robot + environment', '机器人 + 环境'), description: t('closed-loop execution', '闭环执行') }),
    moduleNode(palette, { id: 'vla-feedback', kind: 'note', role: 'annotation', x: 1008, y: 560, width: 296, height: 42, label: t('New observation at every control step', '每个控制步返回新的观察'), detail: 'detailed', fontSize: 11, fontWeight: 500 }),
  ];
  const edges = [
    moduleEdge(palette, 'vla-image', 'vla-vision'),
    moduleEdge(palette, 'vla-language', 'vla-tokenizer'),
    moduleEdge(palette, 'vla-state', 'vla-state-projector'),
    moduleEdge(palette, 'vla-vision', 'vla-token-sequence'),
    moduleEdge(palette, 'vla-tokenizer', 'vla-token-sequence'),
    moduleEdge(palette, 'vla-state-projector', 'vla-token-sequence'),
    moduleEdge(palette, 'vla-token-sequence', 'vla-backbone'),
    moduleEdge(palette, 'vla-token-sequence', 'vla-action-expert'),
    moduleEdge(palette, 'vla-backbone', 'vla-action-expert'),
    moduleEdge(palette, 'vla-action-expert', 'vla-action-chunk'),
    moduleEdge(palette, 'vla-action-chunk', 'vla-safety'),
    moduleEdge(palette, 'vla-action-chunk', 'vla-controller'),
    moduleEdge(palette, 'vla-safety', 'vla-robot'),
    moduleEdge(palette, 'vla-controller', 'vla-robot'),
    moduleEdge(palette, 'vla-training-loss', 'vla-action-expert', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'vla-robot', 'vla-image', { routing: 'bezier', feedback: true, label: t('observation', '新观察') }),
    moduleEdge(palette, 'vla-robot', 'vla-state', { routing: 'bezier', feedback: true }),
  ];
  return { nodes, edges, width: 1360, height: 690 };
}

function buildPromptAgent(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'pa-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1280, height: 660, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'pa-prompt-phase', kind: 'group', role: 'phase', x: 30, y: 72, width: 330, height: 540, label: t('Multimodal task prompt', '多模态任务提示') }),
    moduleNode(palette, { id: 'pa-agent-phase', kind: 'group', role: 'phase', x: 385, y: 72, width: 520, height: 540, label: t('Prompt-conditioned controller', '提示条件控制器') }),
    moduleNode(palette, { id: 'pa-world-phase', kind: 'group', role: 'phase', x: 930, y: 72, width: 320, height: 540, label: t('Embodied interaction', '具身交互') }),
    moduleNode(palette, { id: 'pa-text-prompt', role: 'modality', x: 65, y: 128, width: 120, height: 70, label: t('Text goal', '文本目标') }),
    moduleNode(palette, { id: 'pa-image-prompt', kind: 'scientific-image-frame', role: 'modality', x: 205, y: 116, width: 120, height: 94, label: t('Image prompt', '图像提示') }),
    moduleNode(palette, { id: 'pa-demo-prompt', kind: 'scientific-timeline', role: 'modality', x: 65, y: 230, width: 260, height: 92, label: t('Video / demonstration frames', '视频 / 示范帧'), detail: 'standard' }),
    moduleNode(palette, { id: 'pa-prompt-encoder', role: 'encoder', x: 86, y: 360, width: 218, height: 100, label: t('Prompt encoder', '提示编码器'), description: t('language + object tokens', '语言 + 对象 Token') }),
    moduleNode(palette, { id: 'pa-prompt-tokens', kind: 'scientific-token-strip', role: 'token', x: 86, y: 496, width: 218, height: 74, label: t('Prompt tokens', '提示 Token') }),
    moduleNode(palette, { id: 'pa-history', kind: 'scientific-timeline', role: 'memory', x: 425, y: 126, width: 180, height: 98, label: t('Interaction history', '交互历史'), description: t('observations + actions', '观察 + 动作') }),
    moduleNode(palette, { id: 'pa-controller', kind: 'scientific-transformer', role: 'backbone', x: 626, y: 176, width: 235, height: 250, label: options.backbone || t('Causal transformer', '因果 Transformer'), description: t('alternating self-attention', '交替自注意力'), fontSize: 17 }),
    moduleNode(palette, { id: 'pa-cross-attn', role: 'bridge', x: 425, y: 296, width: 180, height: 96, label: t('Cross-attention', '交叉注意力'), description: t('prompt conditioning', '提示条件化') }),
    moduleNode(palette, { id: 'pa-action-token', kind: 'scientific-action-chunk', role: 'action', x: 664, y: 480, width: 160, height: 80, label: t('Motor command token', '运动指令 Token') }),
    moduleNode(palette, { id: 'pa-observation', kind: 'scientific-image-frame', role: 'modality', x: 972, y: 124, width: 230, height: 98, label: t('Current observation', '当前观察') }),
    moduleNode(palette, { id: 'pa-robot', kind: 'scientific-robot-arm', role: 'environment', x: 1000, y: 288, width: 174, height: 148, label: t('Robot workspace', '机器人工作空间') }),
    moduleNode(palette, { id: 'pa-result', role: 'action', x: 972, y: 500, width: 230, height: 64, label: t('Task progress', '任务进展'), description: t('next interaction step', '下一交互步') }),
    moduleNode(palette, { id: 'pa-generalization', kind: 'note', role: 'annotation', x: 430, y: 488, width: 190, height: 70, label: t('Prompt structure enables compositional task reuse.', '提示结构支持组合式任务复用。'), detail: 'detailed', fontSize: 11, fontWeight: 500 }),
  ];
  const edges = [
    moduleEdge(palette, 'pa-text-prompt', 'pa-prompt-encoder'),
    moduleEdge(palette, 'pa-image-prompt', 'pa-prompt-encoder'),
    moduleEdge(palette, 'pa-demo-prompt', 'pa-prompt-encoder'),
    moduleEdge(palette, 'pa-prompt-encoder', 'pa-prompt-tokens'),
    moduleEdge(palette, 'pa-prompt-tokens', 'pa-cross-attn'),
    moduleEdge(palette, 'pa-history', 'pa-controller'),
    moduleEdge(palette, 'pa-cross-attn', 'pa-controller'),
    moduleEdge(palette, 'pa-controller', 'pa-action-token'),
    moduleEdge(palette, 'pa-action-token', 'pa-robot'),
    moduleEdge(palette, 'pa-robot', 'pa-result'),
    moduleEdge(palette, 'pa-result', 'pa-observation', { routing: 'bezier', feedback: true }),
    moduleEdge(palette, 'pa-observation', 'pa-history', { routing: 'bezier', feedback: true }),
  ];
  return { nodes, edges, width: 1280, height: 660 };
}

function buildEmbodiedLoop(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'el-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1200, height: 700, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'el-perception', kind: 'scientific-camera', role: 'encoder', x: 100, y: 144, width: 190, height: 116, label: t('Multimodal perception', '多模态感知'), description: t('vision · audio · touch', '视觉 · 听觉 · 触觉') }),
    moduleNode(palette, { id: 'el-state-estimate', kind: 'scientific-voxel-grid', role: 'token', x: 320, y: 238, width: 190, height: 100, label: t('State estimate', '状态估计'), description: t('objects + relations', '对象 + 关系') }),
    moduleNode(palette, { id: 'el-world-model', kind: 'scientific-transformer', role: 'backbone', x: 390, y: 94, width: 230, height: 126, label: t('World model', '世界模型'), description: t('latent state + dynamics', '潜在状态 + 动力学'), fontSize: 17 }),
    moduleNode(palette, { id: 'el-goal', role: 'modality', x: 760, y: 54, width: 220, height: 50, label: t('Task goal + constraints', '任务目标 + 约束') }),
    moduleNode(palette, { id: 'el-planner', kind: 'hexagon', role: 'policy', x: 760, y: 130, width: 220, height: 112, label: t('Reasoning and planning', '推理与规划'), description: t('goals · constraints · substeps', '目标 · 约束 · 子任务') }),
    moduleNode(palette, { id: 'el-policy', kind: 'scientific-action-chunk', role: 'policy', x: 890, y: 340, width: 196, height: 104, label: options.backbone || t('Policy', '策略模型'), description: t('select action chunk', '选择动作块') }),
    moduleNode(palette, { id: 'el-actuation', kind: 'scientific-trajectory', role: 'action', x: 650, y: 522, width: 210, height: 94, label: t('Control and actuation', '控制与执行'), description: t('trajectory · gripper · base', '轨迹 · 夹爪 · 底盘') }),
    moduleNode(palette, { id: 'el-environment', kind: 'scientific-robot-arm', role: 'environment', x: 420, y: 410, width: 190, height: 162, label: t('Robot in environment', '环境中的机器人'), description: t('physical state changes', '物理状态变化'), fontSize: 16 }),
    moduleNode(palette, { id: 'el-memory', kind: 'database', role: 'memory', x: 112, y: 390, width: 170, height: 112, label: t('Episodic memory', '情景记忆'), description: t('experience + retrieval', '经验 + 检索'), detail: 'standard' }),
    moduleNode(palette, { id: 'el-safety', role: 'loss', x: 908, y: 520, width: 156, height: 74, label: t('Safety guard', '安全约束'), description: t('monitor + veto', '监控 + 否决'), detail: 'standard' }),
    moduleNode(palette, { id: 'el-imagination', kind: 'note', role: 'annotation', x: 410, y: 274, width: 200, height: 70, label: t('Imagine candidate futures before acting.', '行动前预测候选未来。'), detail: 'detailed', fontSize: 11, fontWeight: 500 }),
    moduleNode(palette, { id: 'el-feedback-label', kind: 'note', role: 'annotation', x: 104, y: 566, width: 190, height: 62, label: t('Continuous sensing closes the loop.', '持续感知闭合控制回路。'), detail: 'detailed', fontSize: 11, fontWeight: 500 }),
  ];
  const edges = [
    moduleEdge(palette, 'el-perception', 'el-state-estimate'),
    moduleEdge(palette, 'el-state-estimate', 'el-world-model'),
    moduleEdge(palette, 'el-world-model', 'el-planner'),
    moduleEdge(palette, 'el-goal', 'el-planner'),
    moduleEdge(palette, 'el-planner', 'el-policy'),
    moduleEdge(palette, 'el-policy', 'el-actuation'),
    moduleEdge(palette, 'el-actuation', 'el-environment'),
    moduleEdge(palette, 'el-environment', 'el-perception', { routing: 'bezier', feedback: true, label: t('new observation', '新观察') }),
    moduleEdge(palette, 'el-perception', 'el-memory', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'el-memory', 'el-world-model', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'el-world-model', 'el-imagination', { lineStyle: 'dotted', arrowEnd: 'open' }),
    moduleEdge(palette, 'el-safety', 'el-policy', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'el-safety', 'el-actuation', { lineStyle: 'dashed', arrowEnd: 'open' }),
  ];
  return { nodes, edges, width: 1200, height: 700 };
}

function buildTrainDeploy(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'td-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1360, height: 700, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'td-train', kind: 'group', role: 'phase', x: 28, y: 70, width: 775, height: 580, label: t('Offline training', '离线训练') }),
    moduleNode(palette, { id: 'td-deploy', kind: 'group', role: 'phase', x: 828, y: 70, width: 504, height: 580, label: t('Online deployment', '在线部署') }),
    moduleNode(palette, { id: 'td-internet', kind: 'scientific-dataset-stack', role: 'dataset', x: 66, y: 118, width: 170, height: 108, label: t('Image-text data', '图文数据') }),
    moduleNode(palette, { id: 'td-oxe', kind: 'scientific-dataset-stack', role: 'dataset', x: 66, y: 266, width: 170, height: 108, label: t('Open robot data', '开放机器人数据') }),
    moduleNode(palette, { id: 'td-private', kind: 'scientific-dataset-stack', role: 'dataset', x: 66, y: 414, width: 170, height: 108, label: t('Target robot data', '目标机器人数据'), detail: 'standard' }),
    moduleNode(palette, { id: 'td-mixture', role: 'bridge', x: 282, y: 246, width: 174, height: 130, label: t('Data mixture', '数据混合'), description: t('sampling + normalization', '采样 + 归一化') }),
    moduleNode(palette, { id: 'td-pretrain', kind: 'scientific-transformer', role: 'backbone', x: 500, y: 148, width: 190, height: 130, label: t('VLM pretraining', 'VLM 预训练'), description: t('visual-language priors', '视觉语言先验') }),
    moduleNode(palette, { id: 'td-policy-train', kind: 'scientific-trainable', role: 'policy', x: 500, y: 348, width: 190, height: 130, label: t('Policy adaptation', '策略适配'), description: t('action expert + embodiment', '动作专家 + 机体适配') }),
    moduleNode(palette, { id: 'td-loss', role: 'loss', x: 300, y: 462, width: 160, height: 72, label: t('Training objectives', '训练目标'), description: t('language + action', '语言 + 动作'), detail: 'detailed' }),
    moduleNode(palette, { id: 'td-checkpoint', kind: 'document', role: 'memory', x: 716, y: 258, width: 62, height: 128, label: t('Model\ncheckpoint', '模型\n检查点'), fontSize: 11 }),
    moduleNode(palette, { id: 'td-observation', role: 'modality', x: 866, y: 134, width: 150, height: 72, label: t('Observation', '环境观察') }),
    moduleNode(palette, { id: 'td-instruction', role: 'modality', x: 866, y: 250, width: 150, height: 72, label: t('Instruction', '任务指令') }),
    moduleNode(palette, { id: 'td-model', kind: 'scientific-transformer', role: 'backbone', x: 1050, y: 166, width: 225, height: 168, label: options.backbone || t('Generalist policy', '通用策略模型'), description: t('shared weights, robot adapters', '共享权重 + 机器人适配'), fontSize: 17 }),
    moduleNode(palette, { id: 'td-action', kind: 'scientific-action-chunk', role: 'action', x: 1110, y: 382, width: 166, height: 84, label: t('Action chunk', '动作块') }),
    moduleNode(palette, { id: 'td-robot', kind: 'scientific-mobile-robot', role: 'environment', x: 892, y: 430, width: 162, height: 138, label: t('Robot embodiment', '机器人机体'), description: t('arm · mobile · dual-arm', '机械臂 · 移动 · 双臂') }),
    moduleNode(palette, { id: 'td-monitor', role: 'annotation', x: 1110, y: 516, width: 166, height: 66, label: t('Rollout metrics', '在线评估指标'), detail: 'standard' }),
    moduleNode(palette, { id: 'td-feedback-note', kind: 'note', role: 'annotation', x: 858, y: 574, width: 432, height: 48, label: t('Curated failures can return to the target-robot dataset.', '筛选后的失败样本可回流目标机器人数据。'), detail: 'detailed', fontSize: 11, fontWeight: 500 }),
  ];
  const edges = [
    moduleEdge(palette, 'td-internet', 'td-mixture'),
    moduleEdge(palette, 'td-oxe', 'td-mixture'),
    moduleEdge(palette, 'td-private', 'td-mixture'),
    moduleEdge(palette, 'td-mixture', 'td-pretrain'),
    moduleEdge(palette, 'td-mixture', 'td-policy-train'),
    moduleEdge(palette, 'td-pretrain', 'td-policy-train'),
    moduleEdge(palette, 'td-loss', 'td-policy-train', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'td-policy-train', 'td-checkpoint'),
    moduleEdge(palette, 'td-checkpoint', 'td-model'),
    moduleEdge(palette, 'td-observation', 'td-model'),
    moduleEdge(palette, 'td-instruction', 'td-model'),
    moduleEdge(palette, 'td-model', 'td-action'),
    moduleEdge(palette, 'td-action', 'td-robot'),
    moduleEdge(palette, 'td-robot', 'td-observation', { routing: 'bezier', feedback: true }),
    moduleEdge(palette, 'td-robot', 'td-monitor'),
    moduleEdge(palette, 'td-monitor', 'td-private', { routing: 'bezier', feedback: true, label: t('curated failures', '失败回流') }),
  ];
  return { nodes, edges, width: 1360, height: 700 };
}

function buildLlmTrainingPipeline(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'lt-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1500, height: 720, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'lt-data-phase', kind: 'group', role: 'phase', x: 24, y: 66, width: 250, height: 610, label: t('1 · Corpus curation', '1 · 语料策展') }),
    moduleNode(palette, { id: 'lt-pretrain-phase', kind: 'group', role: 'phase', x: 290, y: 66, width: 250, height: 610, label: t('2 · Pretraining', '2 · 预训练') }),
    moduleNode(palette, { id: 'lt-sft-phase', kind: 'group', role: 'phase', x: 556, y: 66, width: 250, height: 610, label: t('3 · Instruction tuning', '3 · 指令微调') }),
    moduleNode(palette, { id: 'lt-align-phase', kind: 'group', role: 'phase', x: 822, y: 66, width: 286, height: 610, label: t('4 · Preference alignment', '4 · 偏好对齐') }),
    moduleNode(palette, { id: 'lt-eval-phase', kind: 'group', role: 'phase', x: 1124, y: 66, width: 352, height: 610, label: t('5 · Evaluate and deploy', '5 · 评测与部署') }),
    moduleNode(palette, { id: 'lt-raw-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 60, y: 126, width: 180, height: 118, label: t('Raw web + code + books', '网页 + 代码 + 书籍') }),
    moduleNode(palette, { id: 'lt-curation', role: 'bridge', x: 65, y: 286, width: 170, height: 76, label: t('Filter · deduplicate', '过滤 · 去重'), description: t('quality + safety', '质量 + 安全') }),
    moduleNode(palette, { id: 'lt-mixture', kind: 'scientific-dataset-stack', role: 'dataset', x: 60, y: 410, width: 180, height: 118, label: t('Pretraining mixture', '预训练数据混合') }),
    moduleNode(palette, { id: 'lt-base-model', kind: 'scientific-transformer', role: 'backbone', x: 325, y: 190, width: 180, height: 158, label: options.backbone || t('Base model', '基础模型') }),
    moduleNode(palette, { id: 'lt-next-token', kind: 'scientific-loss-target', role: 'loss', x: 352, y: 438, width: 126, height: 118, label: t('Next-token loss', '下一 Token 损失') }),
    moduleNode(palette, { id: 'lt-instruction-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 592, y: 130, width: 180, height: 112, label: t('Instruction data', '指令数据') }),
    moduleNode(palette, { id: 'lt-sft-model', kind: 'scientific-trainable', role: 'backbone', x: 606, y: 310, width: 154, height: 124, label: t('SFT checkpoint', 'SFT 检查点') }),
    moduleNode(palette, { id: 'lt-sft-loss', kind: 'scientific-loss-target', role: 'loss', x: 626, y: 494, width: 116, height: 106, label: t('SFT loss', 'SFT 损失'), detail: 'standard' }),
    moduleNode(palette, { id: 'lt-preference-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 852, y: 126, width: 170, height: 112, label: t('Preference pairs', '偏好对') }),
    moduleNode(palette, { id: 'lt-reward', kind: 'scientific-loss-target', role: 'loss', x: 846, y: 310, width: 120, height: 112, label: t('Reward / DPO', '奖励 / DPO') }),
    moduleNode(palette, { id: 'lt-aligned-model', kind: 'scientific-trainable', role: 'policy', x: 972, y: 306, width: 116, height: 126, label: t('Aligned model', '对齐模型') }),
    moduleNode(palette, { id: 'lt-safety-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 906, y: 488, width: 160, height: 108, label: t('Safety red-team', '安全红队数据'), detail: 'standard' }),
    moduleNode(palette, { id: 'lt-capability-plot', kind: 'scientific-mini-plot', role: 'action', x: 1152, y: 132, width: 140, height: 128, label: t('Capability', '能力评测') }),
    moduleNode(palette, { id: 'lt-safety-plot', kind: 'scientific-mini-plot', role: 'loss', x: 1310, y: 132, width: 140, height: 128, label: t('Safety', '安全评测') }),
    moduleNode(palette, { id: 'lt-deploy-model', kind: 'scientific-transformer', role: 'backbone', x: 1200, y: 330, width: 186, height: 158, label: t('Aligned checkpoint', '对齐后检查点') }),
    moduleNode(palette, { id: 'lt-response', kind: 'scientific-token-strip', role: 'action', x: 1190, y: 548, width: 206, height: 76, label: t('Response tokens', '回答 Token') }),
  ];
  const edges = [
    moduleEdge(palette, 'lt-raw-data', 'lt-curation'),
    moduleEdge(palette, 'lt-curation', 'lt-mixture'),
    moduleEdge(palette, 'lt-mixture', 'lt-base-model'),
    moduleEdge(palette, 'lt-next-token', 'lt-base-model', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'lt-base-model', 'lt-sft-model', { width: 2.4, label: t('base', '基础') }),
    moduleEdge(palette, 'lt-instruction-data', 'lt-sft-model'),
    moduleEdge(palette, 'lt-sft-loss', 'lt-sft-model', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'lt-sft-model', 'lt-aligned-model', { width: 2.4, label: t('instruct', '指令版') }),
    moduleEdge(palette, 'lt-preference-data', 'lt-reward'),
    moduleEdge(palette, 'lt-reward', 'lt-aligned-model'),
    moduleEdge(palette, 'lt-safety-data', 'lt-aligned-model', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'lt-aligned-model', 'lt-deploy-model', { width: 2.4, label: t('aligned', '对齐版') }),
    moduleEdge(palette, 'lt-deploy-model', 'lt-capability-plot'),
    moduleEdge(palette, 'lt-deploy-model', 'lt-safety-plot'),
    moduleEdge(palette, 'lt-deploy-model', 'lt-response'),
  ];
  return { nodes, edges, width: 1500, height: 720 };
}

function buildMoeRouting(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'moe-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1320, height: 700, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'moe-input-phase', kind: 'group', role: 'phase', x: 28, y: 70, width: 230, height: 570, label: t('Token input', 'Token 输入') }),
    moduleNode(palette, { id: 'moe-router-phase', kind: 'group', role: 'phase', x: 280, y: 70, width: 240, height: 570, label: t('Sparse routing', '稀疏路由') }),
    moduleNode(palette, { id: 'moe-expert-phase', kind: 'group', role: 'phase', x: 542, y: 70, width: 450, height: 570, label: t('Expert bank', '专家阵列') }),
    moduleNode(palette, { id: 'moe-output-phase', kind: 'group', role: 'phase', x: 1014, y: 70, width: 278, height: 570, label: t('Weighted output', '加权输出') }),
    moduleNode(palette, { id: 'moe-input', kind: 'scientific-token-strip', role: 'token', x: 58, y: 142, width: 170, height: 82, label: t('Input tokens', '输入 Token') }),
    moduleNode(palette, { id: 'moe-layer-inset', kind: 'scientific-transformer', role: 'backbone', x: 72, y: 344, width: 144, height: 150, label: t('Transformer layer', 'Transformer 层') }),
    moduleNode(palette, { id: 'moe-router', role: 'bridge', x: 316, y: 150, width: 168, height: 86, label: t('Top-k router', 'Top-k 路由器'), description: t('token-wise gates', '逐 Token 门控') }),
    moduleNode(palette, { id: 'moe-gates', kind: 'scientific-mini-plot', role: 'token', x: 320, y: 330, width: 160, height: 130, label: t('Gate scores', '门控分数') }),
    moduleNode(palette, { id: 'moe-balance', kind: 'scientific-loss-target', role: 'loss', x: 342, y: 510, width: 116, height: 102, label: t('Load balance', '负载均衡'), detail: 'standard' }),
    moduleNode(palette, { id: 'moe-expert-1', kind: 'scientific-layer-stack', role: 'encoder', x: 580, y: 116, width: 150, height: 126, label: t('Expert 1 · selected', '专家 1 · 已选择') }),
    moduleNode(palette, { id: 'moe-expert-2', kind: 'scientific-layer-stack', role: 'encoder', x: 784, y: 116, width: 150, height: 126, label: t('Expert 2 · selected', '专家 2 · 已选择') }),
    moduleNode(palette, { id: 'moe-expert-3', kind: 'scientific-layer-stack', role: 'annotation', x: 580, y: 330, width: 150, height: 126, label: t('Expert 3 · inactive', '专家 3 · 未激活') }),
    moduleNode(palette, { id: 'moe-expert-4', kind: 'scientific-layer-stack', role: 'annotation', x: 784, y: 330, width: 150, height: 126, label: t('Expert 4 · inactive', '专家 4 · 未激活') }),
    moduleNode(palette, { id: 'moe-shared', kind: 'scientific-layer-stack', role: 'backbone', x: 682, y: 492, width: 150, height: 126, label: t('Shared expert', '共享专家'), detail: 'standard' }),
    moduleNode(palette, { id: 'moe-merge', kind: 'summing-junction', role: 'action', x: 1050, y: 194, width: 76, height: 76, label: 'Σ', fontSize: 20 }),
    moduleNode(palette, { id: 'moe-output', kind: 'scientific-token-strip', role: 'token', x: 1140, y: 192, width: 126, height: 82, label: t('Output tokens', '输出 Token') }),
    moduleNode(palette, { id: 'moe-throughput', kind: 'scientific-mini-plot', role: 'action', x: 1070, y: 396, width: 170, height: 138, label: t('Capacity / latency', '容量 / 延迟'), detail: 'standard' }),
  ];
  const edges = [
    moduleEdge(palette, 'moe-input', 'moe-router'),
    moduleEdge(palette, 'moe-router', 'moe-gates'),
    moduleEdge(palette, 'moe-router', 'moe-expert-1', { label: '0.62', width: 2.2 }),
    moduleEdge(palette, 'moe-router', 'moe-expert-2', { label: '0.31', width: 2.2 }),
    moduleEdge(palette, 'moe-router', 'moe-expert-3', { lineStyle: 'dotted', arrowEnd: 'open' }),
    moduleEdge(palette, 'moe-router', 'moe-expert-4', { lineStyle: 'dotted', arrowEnd: 'open' }),
    moduleEdge(palette, 'moe-router', 'moe-shared', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'moe-expert-1', 'moe-merge'),
    moduleEdge(palette, 'moe-expert-2', 'moe-merge'),
    moduleEdge(palette, 'moe-shared', 'moe-merge', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'moe-merge', 'moe-output'),
    moduleEdge(palette, 'moe-balance', 'moe-router', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'moe-layer-inset', 'moe-router', { lineStyle: 'dotted', arrowEnd: 'open', label: t('replaces FFN', '替换 FFN') }),
    moduleEdge(palette, 'moe-output', 'moe-throughput', { lineStyle: 'dashed', arrowEnd: 'open' }),
  ];
  return { nodes, edges, width: 1320, height: 700 };
}

function buildRagToolAgent(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'rag-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1420, height: 720, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'rag-input-phase', kind: 'group', role: 'phase', x: 28, y: 70, width: 250, height: 600, label: t('Question and plan', '问题与计划') }),
    moduleNode(palette, { id: 'rag-resource-phase', kind: 'group', role: 'phase', x: 300, y: 70, width: 430, height: 600, label: t('External resources', '外部资源') }),
    moduleNode(palette, { id: 'rag-context-phase', kind: 'group', role: 'phase', x: 752, y: 70, width: 370, height: 600, label: t('Evidence-grounded model', '证据增强模型') }),
    moduleNode(palette, { id: 'rag-answer-phase', kind: 'group', role: 'phase', x: 1144, y: 70, width: 248, height: 600, label: t('Answer and citation', '回答与引用') }),
    moduleNode(palette, { id: 'rag-question', kind: 'callout', role: 'modality', x: 62, y: 132, width: 180, height: 92, label: t('User question', '用户问题'), description: t('intent + constraints', '意图 + 约束') }),
    moduleNode(palette, { id: 'rag-planner', kind: 'decision', role: 'policy', x: 78, y: 292, width: 150, height: 126, label: t('Plan / route', '规划 / 路由') }),
    moduleNode(palette, { id: 'rag-memory', kind: 'scientific-dataset-stack', role: 'memory', x: 74, y: 504, width: 160, height: 116, label: t('Conversation memory', '对话记忆'), detail: 'standard' }),
    moduleNode(palette, { id: 'rag-query', kind: 'scientific-token-strip', role: 'token', x: 340, y: 120, width: 160, height: 78, label: t('Search query', '检索查询') }),
    moduleNode(palette, { id: 'rag-retriever', role: 'encoder', x: 528, y: 124, width: 160, height: 76, label: t('Retriever', '检索器'), description: t('dense + lexical', '稠密 + 词法') }),
    moduleNode(palette, { id: 'rag-knowledge', kind: 'scientific-dataset-stack', role: 'dataset', x: 420, y: 250, width: 182, height: 118, label: t('Vector + document store', '向量 + 文档库') }),
    moduleNode(palette, { id: 'rag-tool', kind: 'arch-api', role: 'environment', x: 338, y: 460, width: 150, height: 92, label: t('Search / API / code', '搜索 / API / 代码') }),
    moduleNode(palette, { id: 'rag-observation', kind: 'scientific-timeline', role: 'memory', x: 510, y: 454, width: 180, height: 96, label: t('Tool observation', '工具观察') }),
    moduleNode(palette, { id: 'rag-evidence', kind: 'scientific-token-strip', role: 'token', x: 794, y: 136, width: 284, height: 84, label: t('[Question] [Doc 1] [Doc 2] [Tool result]', '[问题] [文档1] [文档2] [工具结果]') }),
    moduleNode(palette, { id: 'rag-llm', kind: 'scientific-transformer', role: 'backbone', x: 842, y: 280, width: 190, height: 170, label: options.backbone || t('Grounded LLM', '证据增强 LLM') }),
    moduleNode(palette, { id: 'rag-verifier', kind: 'scientific-loss-target', role: 'loss', x: 874, y: 510, width: 130, height: 112, label: t('Evidence check', '证据校验'), detail: 'standard' }),
    moduleNode(palette, { id: 'rag-answer', kind: 'callout', role: 'action', x: 1180, y: 160, width: 178, height: 112, label: t('Grounded answer', '基于证据的回答') }),
    moduleNode(palette, { id: 'rag-citations', kind: 'multiple-documents', role: 'dataset', x: 1196, y: 346, width: 146, height: 112, label: t('Citations', '引用来源') }),
    moduleNode(palette, { id: 'rag-confidence', kind: 'scientific-mini-plot', role: 'annotation', x: 1190, y: 514, width: 160, height: 118, label: t('Confidence', '置信度'), detail: 'detailed' }),
  ];
  const edges = [
    moduleEdge(palette, 'rag-question', 'rag-planner'),
    moduleEdge(palette, 'rag-memory', 'rag-planner', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'rag-planner', 'rag-query', { label: t('retrieve', '检索') }),
    moduleEdge(palette, 'rag-query', 'rag-retriever'),
    moduleEdge(palette, 'rag-knowledge', 'rag-retriever'),
    moduleEdge(palette, 'rag-retriever', 'rag-evidence', { label: 'top-k' }),
    moduleEdge(palette, 'rag-planner', 'rag-tool', { label: t('call', '调用') }),
    moduleEdge(palette, 'rag-tool', 'rag-observation'),
    moduleEdge(palette, 'rag-observation', 'rag-planner', { routing: 'bezier', feedback: true }),
    moduleEdge(palette, 'rag-observation', 'rag-evidence'),
    moduleEdge(palette, 'rag-question', 'rag-evidence'),
    moduleEdge(palette, 'rag-evidence', 'rag-llm'),
    moduleEdge(palette, 'rag-llm', 'rag-verifier', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'rag-verifier', 'rag-llm', { routing: 'bezier', feedback: true }),
    moduleEdge(palette, 'rag-llm', 'rag-answer'),
    moduleEdge(palette, 'rag-answer', 'rag-citations'),
    moduleEdge(palette, 'rag-citations', 'rag-confidence', { lineStyle: 'dotted', arrowEnd: 'open' }),
  ];
  return { nodes, edges, width: 1420, height: 720 };
}

function buildReasoningTrace(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'rt-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1380, height: 720, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'rt-summary-phase', kind: 'group', role: 'phase', x: 28, y: 68, width: 1324, height: 236, label: t('Abstract reasoning path', '抽象推理路径') }),
    moduleNode(palette, { id: 'rt-trace-phase', kind: 'group', role: 'phase', x: 28, y: 326, width: 1324, height: 346, label: t('Readable example trace', '可读样例轨迹') }),
    moduleNode(palette, { id: 'rt-problem', kind: 'callout', role: 'modality', x: 68, y: 128, width: 190, height: 104, label: t('Problem + constraints', '问题 + 约束') }),
    moduleNode(palette, { id: 'rt-reasoner', kind: 'scientific-transformer', role: 'backbone', x: 344, y: 104, width: 180, height: 164, label: options.backbone || t('Reasoner', '推理模型') }),
    moduleNode(palette, { id: 'rt-timeline', kind: 'scientific-timeline', role: 'token', x: 610, y: 130, width: 260, height: 104, label: t('Thought · Action · Observation', '思考 · 动作 · 观察') }),
    moduleNode(palette, { id: 'rt-verifier', kind: 'scientific-loss-target', role: 'loss', x: 956, y: 112, width: 130, height: 138, label: t('Verifier', '校验器') }),
    moduleNode(palette, { id: 'rt-answer', kind: 'scientific-token-strip', role: 'action', x: 1164, y: 140, width: 150, height: 86, label: t('Final answer', '最终回答') }),
    moduleNode(palette, { id: 'rt-step-1', kind: 'callout', role: 'token', x: 64, y: 390, width: 220, height: 116, label: t('Thought 1', '思考 1'), description: t('decompose the task', '拆解任务') }),
    moduleNode(palette, { id: 'rt-step-2', kind: 'arch-api', role: 'environment', x: 330, y: 410, width: 176, height: 90, label: t('Action · search/tool', '动作 · 搜索/工具') }),
    moduleNode(palette, { id: 'rt-step-3', kind: 'callout', role: 'modality', x: 552, y: 390, width: 220, height: 116, label: t('Observation', '观察'), description: t('returned evidence', '返回的证据') }),
    moduleNode(palette, { id: 'rt-step-4', kind: 'callout', role: 'token', x: 818, y: 390, width: 220, height: 116, label: t('Thought 2', '思考 2'), description: t('revise the hypothesis', '修正假设') }),
    moduleNode(palette, { id: 'rt-candidate', kind: 'scientific-token-strip', role: 'action', x: 1088, y: 406, width: 210, height: 84, label: t('Candidate answer', '候选回答') }),
    moduleNode(palette, { id: 'rt-reject', kind: 'note', role: 'loss', x: 410, y: 554, width: 210, height: 72, label: t('Rejected: evidence conflict', '拒绝：与证据冲突'), detail: 'standard', fontSize: 11 }),
    moduleNode(palette, { id: 'rt-accept', kind: 'note', role: 'environment', x: 900, y: 554, width: 210, height: 72, label: t('Accepted: consistent trace', '接受：轨迹一致'), detail: 'standard', fontSize: 11 }),
  ];
  const edges = [
    moduleEdge(palette, 'rt-problem', 'rt-reasoner'),
    moduleEdge(palette, 'rt-reasoner', 'rt-timeline'),
    moduleEdge(palette, 'rt-timeline', 'rt-verifier'),
    moduleEdge(palette, 'rt-verifier', 'rt-answer'),
    moduleEdge(palette, 'rt-verifier', 'rt-reasoner', { routing: 'bezier', feedback: true, label: t('revise', '修正') }),
    moduleEdge(palette, 'rt-step-1', 'rt-step-2'),
    moduleEdge(palette, 'rt-step-2', 'rt-step-3'),
    moduleEdge(palette, 'rt-step-3', 'rt-step-4'),
    moduleEdge(palette, 'rt-step-4', 'rt-candidate'),
    moduleEdge(palette, 'rt-step-3', 'rt-reject', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'rt-candidate', 'rt-accept'),
    moduleEdge(palette, 'rt-reject', 'rt-step-1', { routing: 'bezier', feedback: true }),
  ];
  return { nodes, edges, width: 1380, height: 720 };
}

function buildRobotDataCollection(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'rd-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1500, height: 720, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'rd-acquire-phase', kind: 'group', role: 'phase', x: 28, y: 68, width: 342, height: 610, label: t('1 · Acquisition rig', '1 · 采集硬件') }),
    moduleNode(palette, { id: 'rd-episode-phase', kind: 'group', role: 'phase', x: 392, y: 68, width: 480, height: 610, label: t('2 · Multi-view episode', '2 · 多视角 Episode') }),
    moduleNode(palette, { id: 'rd-curate-phase', kind: 'group', role: 'phase', x: 894, y: 68, width: 270, height: 610, label: t('3 · Curate and label', '3 · 策展与标注') }),
    moduleNode(palette, { id: 'rd-data-phase', kind: 'group', role: 'phase', x: 1186, y: 68, width: 286, height: 610, label: t('4 · Dataset release', '4 · 数据集发布') }),
    moduleNode(palette, { id: 'rd-camera', kind: 'scientific-camera', role: 'modality', x: 68, y: 126, width: 112, height: 102, label: t('External RGB-D', '外部 RGB-D') }),
    moduleNode(palette, { id: 'rd-wrist-camera', kind: 'scientific-camera', role: 'modality', x: 218, y: 126, width: 112, height: 102, label: t('Wrist camera', '腕部相机') }),
    moduleNode(palette, { id: 'rd-robot', kind: 'scientific-robot-arm', role: 'environment', x: 96, y: 290, width: 152, height: 154, label: t('Collection robot', '采集机器人') }),
    moduleNode(palette, { id: 'rd-teleop', kind: 'scientific-trajectory', role: 'action', x: 76, y: 516, width: 222, height: 94, label: t('Teleoperation path', '遥操作轨迹') }),
    moduleNode(palette, { id: 'rd-view-1', kind: 'scientific-image-frame', role: 'modality', x: 430, y: 126, width: 126, height: 112, label: t('External view', '外部视角') }),
    moduleNode(palette, { id: 'rd-view-2', kind: 'scientific-image-frame', role: 'modality', x: 570, y: 126, width: 126, height: 112, label: t('Wrist view', '腕部视角') }),
    moduleNode(palette, { id: 'rd-view-3', kind: 'scientific-image-frame', role: 'modality', x: 710, y: 126, width: 126, height: 112, label: t('Depth / state', '深度 / 状态') }),
    moduleNode(palette, { id: 'rd-episode', kind: 'scientific-timeline', role: 'token', x: 450, y: 314, width: 360, height: 112, label: t('Episode t0 … tT', 'Episode t0 … tT') }),
    moduleNode(palette, { id: 'rd-actions', kind: 'scientific-action-chunk', role: 'action', x: 494, y: 502, width: 272, height: 86, label: t('Joint + gripper actions', '关节 + 夹爪动作') }),
    moduleNode(palette, { id: 'rd-sync', role: 'bridge', x: 934, y: 132, width: 190, height: 74, label: t('Synchronize + segment', '同步 + 切分') }),
    moduleNode(palette, { id: 'rd-filter', kind: 'scientific-loss-target', role: 'loss', x: 966, y: 266, width: 128, height: 116, label: t('Quality filter', '质量过滤') }),
    moduleNode(palette, { id: 'rd-label', kind: 'annotation', role: 'annotation', x: 934, y: 436, width: 190, height: 92, label: t('Task · success · language', '任务 · 成功 · 语言') }),
    moduleNode(palette, { id: 'rd-reject', kind: 'note', role: 'loss', x: 942, y: 566, width: 174, height: 64, label: t('Rejected / negative', '剔除 / 负例'), detail: 'standard', fontSize: 11 }),
    moduleNode(palette, { id: 'rd-dataset', kind: 'scientific-dataset-stack', role: 'dataset', x: 1238, y: 136, width: 178, height: 130, label: t('Robot dataset', '机器人数据集') }),
    moduleNode(palette, { id: 'rd-mixture', kind: 'scientific-dataset-stack', role: 'dataset', x: 1238, y: 330, width: 178, height: 130, label: t('Cross-task mixture', '跨任务数据混合') }),
    moduleNode(palette, { id: 'rd-stats', kind: 'scientific-mini-plot', role: 'action', x: 1242, y: 520, width: 170, height: 126, label: t('Task distribution', '任务分布'), detail: 'standard' }),
  ];
  const edges = [
    moduleEdge(palette, 'rd-camera', 'rd-view-1'),
    moduleEdge(palette, 'rd-wrist-camera', 'rd-view-2'),
    moduleEdge(palette, 'rd-robot', 'rd-view-3'),
    moduleEdge(palette, 'rd-teleop', 'rd-robot'),
    moduleEdge(palette, 'rd-view-1', 'rd-episode'),
    moduleEdge(palette, 'rd-view-2', 'rd-episode'),
    moduleEdge(palette, 'rd-view-3', 'rd-episode'),
    moduleEdge(palette, 'rd-episode', 'rd-actions'),
    moduleEdge(palette, 'rd-episode', 'rd-sync'),
    moduleEdge(palette, 'rd-actions', 'rd-sync'),
    moduleEdge(palette, 'rd-sync', 'rd-filter'),
    moduleEdge(palette, 'rd-filter', 'rd-label'),
    moduleEdge(palette, 'rd-filter', 'rd-reject', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'rd-label', 'rd-dataset'),
    moduleEdge(palette, 'rd-dataset', 'rd-mixture'),
    moduleEdge(palette, 'rd-mixture', 'rd-stats'),
  ];
  return { nodes, edges, width: 1500, height: 720 };
}

function buildWorldModelRollout(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'wm-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1460, height: 740, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'wm-observe-phase', kind: 'group', role: 'phase', x: 28, y: 70, width: 252, height: 620, label: t('Current state', '当前状态') }),
    moduleNode(palette, { id: 'wm-state-phase', kind: 'group', role: 'phase', x: 302, y: 70, width: 270, height: 620, label: t('Spatial world state', '空间世界状态') }),
    moduleNode(palette, { id: 'wm-rollout-phase', kind: 'group', role: 'phase', x: 594, y: 70, width: 532, height: 620, label: t('Candidate future rollouts', '候选未来展开') }),
    moduleNode(palette, { id: 'wm-act-phase', kind: 'group', role: 'phase', x: 1148, y: 70, width: 284, height: 620, label: t('Select and execute', '选择与执行') }),
    moduleNode(palette, { id: 'wm-observation', kind: 'scientific-image-frame', role: 'modality', x: 72, y: 124, width: 164, height: 132, label: t('Current observation', '当前观察') }),
    moduleNode(palette, { id: 'wm-goal', kind: 'callout', role: 'modality', x: 68, y: 306, width: 172, height: 86, label: t('Task goal', '任务目标') }),
    moduleNode(palette, { id: 'wm-state-token', kind: 'scientific-token-strip', role: 'token', x: 58, y: 470, width: 190, height: 82, label: t('Robot state tokens', '机器人状态 Token') }),
    moduleNode(palette, { id: 'wm-voxel', kind: 'scientific-voxel-grid', role: 'encoder', x: 350, y: 132, width: 174, height: 154, label: t('3D latent state', '3D 潜在状态') }),
    moduleNode(palette, { id: 'wm-coordinate', kind: 'scientific-coordinate-frame', role: 'annotation', x: 382, y: 330, width: 110, height: 112, label: t('Robot frame', '机器人坐标系') }),
    moduleNode(palette, { id: 'wm-model', kind: 'scientific-transformer', role: 'backbone', x: 346, y: 492, width: 182, height: 158, label: options.backbone || t('World model', '世界模型') }),
    moduleNode(palette, { id: 'wm-rollout-a', kind: 'scientific-timeline', role: 'action', x: 636, y: 128, width: 330, height: 108, label: t('Future A · reachable', '未来 A · 可达') }),
    moduleNode(palette, { id: 'wm-score-a', kind: 'scientific-loss-target', role: 'environment', x: 982, y: 126, width: 110, height: 112, label: t('Score 0.86', '评分 0.86') }),
    moduleNode(palette, { id: 'wm-rollout-b', kind: 'scientific-timeline', role: 'action', x: 636, y: 310, width: 330, height: 108, label: t('Future B · collision', '未来 B · 碰撞') }),
    moduleNode(palette, { id: 'wm-score-b', kind: 'scientific-loss-target', role: 'loss', x: 982, y: 308, width: 110, height: 112, label: t('Score 0.21', '评分 0.21') }),
    moduleNode(palette, { id: 'wm-rollout-c', kind: 'scientific-timeline', role: 'annotation', x: 636, y: 492, width: 330, height: 108, label: t('Future C · uncertain', '未来 C · 不确定'), detail: 'standard' }),
    moduleNode(palette, { id: 'wm-score-c', kind: 'scientific-loss-target', role: 'annotation', x: 982, y: 490, width: 110, height: 112, label: t('Score 0.44', '评分 0.44'), detail: 'standard' }),
    moduleNode(palette, { id: 'wm-action', kind: 'scientific-action-chunk', role: 'policy', x: 1192, y: 140, width: 196, height: 88, label: t('Selected action chunk', '已选动作块') }),
    moduleNode(palette, { id: 'wm-trajectory', kind: 'scientific-trajectory', role: 'action', x: 1182, y: 304, width: 216, height: 98, label: t('Control trajectory', '控制轨迹') }),
    moduleNode(palette, { id: 'wm-robot', kind: 'scientific-robot-arm', role: 'environment', x: 1216, y: 470, width: 150, height: 156, label: t('Robot + environment', '机器人 + 环境') }),
  ];
  const edges = [
    moduleEdge(palette, 'wm-observation', 'wm-voxel'),
    moduleEdge(palette, 'wm-goal', 'wm-model'),
    moduleEdge(palette, 'wm-state-token', 'wm-model'),
    moduleEdge(palette, 'wm-voxel', 'wm-model'),
    moduleEdge(palette, 'wm-coordinate', 'wm-voxel', { lineStyle: 'dotted', arrowEnd: 'open' }),
    moduleEdge(palette, 'wm-model', 'wm-rollout-a'),
    moduleEdge(palette, 'wm-model', 'wm-rollout-b'),
    moduleEdge(palette, 'wm-model', 'wm-rollout-c', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'wm-rollout-a', 'wm-score-a'),
    moduleEdge(palette, 'wm-rollout-b', 'wm-score-b'),
    moduleEdge(palette, 'wm-rollout-c', 'wm-score-c', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'wm-score-a', 'wm-action', { width: 2.4, label: t('select', '选择') }),
    moduleEdge(palette, 'wm-score-b', 'wm-action', { lineStyle: 'dotted', arrowEnd: 'open' }),
    moduleEdge(palette, 'wm-action', 'wm-trajectory'),
    moduleEdge(palette, 'wm-trajectory', 'wm-robot'),
    moduleEdge(palette, 'wm-robot', 'wm-observation', { routing: 'bezier', feedback: true, label: t('next observation', '新观察') }),
  ];
  return { nodes, edges, width: 1460, height: 740 };
}

function buildSimToReal(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'sr-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1400, height: 720, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'sr-sim-phase', kind: 'group', role: 'phase', x: 28, y: 68, width: 410, height: 610, label: t('Simulation domain', '仿真域') }),
    moduleNode(palette, { id: 'sr-bridge-phase', kind: 'group', role: 'phase', x: 462, y: 68, width: 446, height: 610, label: t('Domain bridge', '域桥接') }),
    moduleNode(palette, { id: 'sr-real-phase', kind: 'group', role: 'phase', x: 932, y: 68, width: 440, height: 610, label: t('Real deployment', '真实部署') }),
    moduleNode(palette, { id: 'sr-sim-world', kind: 'scientific-voxel-grid', role: 'modality', x: 76, y: 124, width: 158, height: 150, label: t('Randomized world', '随机化世界') }),
    moduleNode(palette, { id: 'sr-sim-robot', kind: 'scientific-humanoid', role: 'environment', x: 270, y: 122, width: 126, height: 158, label: t('Sim robot', '仿真机器人') }),
    moduleNode(palette, { id: 'sr-rollouts', kind: 'scientific-dataset-stack', role: 'dataset', x: 88, y: 356, width: 170, height: 128, label: t('Simulation rollouts', '仿真 Rollout') }),
    moduleNode(palette, { id: 'sr-sim-trajectory', kind: 'scientific-trajectory', role: 'action', x: 84, y: 536, width: 276, height: 92, label: t('Expert trajectories', '专家轨迹') }),
    moduleNode(palette, { id: 'sr-randomize', kind: 'scientific-trainable', role: 'bridge', x: 500, y: 124, width: 150, height: 120, label: t('Domain randomization', '域随机化') }),
    moduleNode(palette, { id: 'sr-policy', kind: 'scientific-transformer', role: 'backbone', x: 704, y: 112, width: 170, height: 154, label: options.backbone || t('Shared policy', '共享策略') }),
    moduleNode(palette, { id: 'sr-calibrate', kind: 'scientific-coordinate-frame', role: 'annotation', x: 512, y: 330, width: 120, height: 120, label: t('Sensor calibration', '传感器标定') }),
    moduleNode(palette, { id: 'sr-adapter', kind: 'scientific-trainable', role: 'policy', x: 704, y: 328, width: 164, height: 126, label: t('Real-world adapter', '真实域适配器') }),
    moduleNode(palette, { id: 'sr-gap', kind: 'scientific-mini-plot', role: 'loss', x: 572, y: 520, width: 190, height: 132, label: t('Sim / real gap', '仿真 / 真实差距'), detail: 'standard' }),
    moduleNode(palette, { id: 'sr-real-camera', kind: 'scientific-camera', role: 'modality', x: 974, y: 126, width: 118, height: 106, label: t('Real sensors', '真实传感器') }),
    moduleNode(palette, { id: 'sr-real-robot', kind: 'scientific-humanoid', role: 'environment', x: 1170, y: 108, width: 144, height: 180, label: t('Real humanoid', '真实人形机器人') }),
    moduleNode(palette, { id: 'sr-real-action', kind: 'scientific-action-chunk', role: 'action', x: 982, y: 350, width: 210, height: 84, label: t('Deployed actions', '部署动作') }),
    moduleNode(palette, { id: 'sr-real-trajectory', kind: 'scientific-trajectory', role: 'action', x: 1080, y: 500, width: 230, height: 96, label: t('Measured motion', '实测运动') }),
    moduleNode(palette, { id: 'sr-real-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 950, y: 522, width: 126, height: 112, label: t('Real demos', '真机示范'), detail: 'standard' }),
  ];
  const edges = [
    moduleEdge(palette, 'sr-sim-world', 'sr-rollouts'),
    moduleEdge(palette, 'sr-sim-robot', 'sr-rollouts'),
    moduleEdge(palette, 'sr-sim-trajectory', 'sr-rollouts'),
    moduleEdge(palette, 'sr-rollouts', 'sr-randomize'),
    moduleEdge(palette, 'sr-randomize', 'sr-policy'),
    moduleEdge(palette, 'sr-policy', 'sr-adapter'),
    moduleEdge(palette, 'sr-calibrate', 'sr-adapter', { lineStyle: 'dashed' }),
    moduleEdge(palette, 'sr-adapter', 'sr-real-action'),
    moduleEdge(palette, 'sr-real-camera', 'sr-adapter'),
    moduleEdge(palette, 'sr-real-action', 'sr-real-robot'),
    moduleEdge(palette, 'sr-real-robot', 'sr-real-trajectory'),
    moduleEdge(palette, 'sr-real-data', 'sr-adapter', { routing: 'bezier', feedback: true }),
    moduleEdge(palette, 'sr-real-trajectory', 'sr-gap', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'sr-rollouts', 'sr-gap', { lineStyle: 'dashed', arrowEnd: 'open' }),
  ];
  return { nodes, edges, width: 1400, height: 720 };
}

function buildMultiEmbodimentPolicy(options: ScientificSchematicOptions, provenance: ScientificProvenance): Blueprint {
  const palette = PALETTES[options.style];
  const t = (en: string, zh: string) => text(options.language, en, zh);
  const nodes = [
    moduleNode(palette, { id: 'me-root', kind: 'group', role: 'frame', x: 0, y: 0, width: 1500, height: 740, label: options.title, scientificRole: 'schematic-root', provenance }),
    moduleNode(palette, { id: 'me-data-phase', kind: 'group', role: 'phase', x: 28, y: 70, width: 392, height: 620, label: t('Multi-embodiment data', '多机体数据') }),
    moduleNode(palette, { id: 'me-common-phase', kind: 'group', role: 'phase', x: 442, y: 70, width: 360, height: 620, label: t('Unified representation', '统一表示') }),
    moduleNode(palette, { id: 'me-expert-phase', kind: 'group', role: 'phase', x: 824, y: 70, width: 292, height: 620, label: t('Embodiment experts', '机体专家') }),
    moduleNode(palette, { id: 'me-robot-phase', kind: 'group', role: 'phase', x: 1138, y: 70, width: 334, height: 620, label: t('Robot platforms', '机器人平台') }),
    moduleNode(palette, { id: 'me-arm-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 62, y: 118, width: 158, height: 116, label: t('Arm episodes', '机械臂 Episode') }),
    moduleNode(palette, { id: 'me-mobile-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 62, y: 300, width: 158, height: 116, label: t('Mobile episodes', '移动机器人 Episode') }),
    moduleNode(palette, { id: 'me-human-data', kind: 'scientific-dataset-stack', role: 'dataset', x: 62, y: 482, width: 158, height: 116, label: t('Humanoid episodes', '人形机器人 Episode') }),
    moduleNode(palette, { id: 'me-arm-norm', kind: 'scientific-action-chunk', role: 'bridge', x: 246, y: 136, width: 142, height: 82, label: t('7-DoF normalize', '7-DoF 归一化') }),
    moduleNode(palette, { id: 'me-mobile-norm', kind: 'scientific-action-chunk', role: 'bridge', x: 246, y: 318, width: 142, height: 82, label: t('Base normalize', '底盘归一化') }),
    moduleNode(palette, { id: 'me-human-norm', kind: 'scientific-action-chunk', role: 'bridge', x: 246, y: 500, width: 142, height: 82, label: t('Whole-body normalize', '全身归一化') }),
    moduleNode(palette, { id: 'me-token', kind: 'scientific-token-strip', role: 'token', x: 482, y: 124, width: 280, height: 90, label: t('[vision] [language] [state] [action]', '[视觉] [语言] [状态] [动作]') }),
    moduleNode(palette, { id: 'me-backbone', kind: 'scientific-transformer', role: 'backbone', x: 526, y: 294, width: 192, height: 178, label: options.backbone || t('Shared policy backbone', '共享策略主干') }),
    moduleNode(palette, { id: 'me-mixture', kind: 'scientific-mini-plot', role: 'dataset', x: 536, y: 526, width: 172, height: 128, label: t('Data mixture', '数据占比'), detail: 'standard' }),
    moduleNode(palette, { id: 'me-arm-head', kind: 'scientific-action-chunk', role: 'policy', x: 862, y: 126, width: 216, height: 86, label: t('Arm action expert', '机械臂动作专家') }),
    moduleNode(palette, { id: 'me-mobile-head', kind: 'scientific-action-chunk', role: 'policy', x: 862, y: 308, width: 216, height: 86, label: t('Mobile action expert', '移动动作专家') }),
    moduleNode(palette, { id: 'me-human-head', kind: 'scientific-action-chunk', role: 'policy', x: 862, y: 490, width: 216, height: 86, label: t('Whole-body expert', '全身动作专家') }),
    moduleNode(palette, { id: 'me-arm', kind: 'scientific-robot-arm', role: 'environment', x: 1182, y: 106, width: 142, height: 152, label: t('Robot arm', '机械臂') }),
    moduleNode(palette, { id: 'me-arm-path', kind: 'scientific-trajectory', role: 'action', x: 1320, y: 142, width: 126, height: 86, label: t('Pick path', '抓取轨迹') }),
    moduleNode(palette, { id: 'me-mobile', kind: 'scientific-mobile-robot', role: 'environment', x: 1178, y: 296, width: 150, height: 128, label: t('Mobile robot', '移动机器人') }),
    moduleNode(palette, { id: 'me-mobile-path', kind: 'scientific-trajectory', role: 'action', x: 1320, y: 318, width: 126, height: 86, label: t('Nav path', '导航轨迹') }),
    moduleNode(palette, { id: 'me-human', kind: 'scientific-humanoid', role: 'environment', x: 1186, y: 468, width: 136, height: 158, label: t('Humanoid', '人形机器人') }),
    moduleNode(palette, { id: 'me-human-path', kind: 'scientific-trajectory', role: 'action', x: 1320, y: 506, width: 126, height: 86, label: t('Motion', '全身运动') }),
  ];
  const edges = [
    moduleEdge(palette, 'me-arm-data', 'me-arm-norm'),
    moduleEdge(palette, 'me-mobile-data', 'me-mobile-norm'),
    moduleEdge(palette, 'me-human-data', 'me-human-norm'),
    moduleEdge(palette, 'me-arm-norm', 'me-token'),
    moduleEdge(palette, 'me-mobile-norm', 'me-token'),
    moduleEdge(palette, 'me-human-norm', 'me-token'),
    moduleEdge(palette, 'me-token', 'me-backbone', { width: 2.4 }),
    moduleEdge(palette, 'me-mixture', 'me-backbone', { lineStyle: 'dashed', arrowEnd: 'open' }),
    moduleEdge(palette, 'me-backbone', 'me-arm-head'),
    moduleEdge(palette, 'me-backbone', 'me-mobile-head'),
    moduleEdge(palette, 'me-backbone', 'me-human-head'),
    moduleEdge(palette, 'me-arm-head', 'me-arm'),
    moduleEdge(palette, 'me-mobile-head', 'me-mobile'),
    moduleEdge(palette, 'me-human-head', 'me-human'),
    moduleEdge(palette, 'me-arm', 'me-arm-path'),
    moduleEdge(palette, 'me-mobile', 'me-mobile-path'),
    moduleEdge(palette, 'me-human', 'me-human-path'),
  ];
  return { nodes, edges, width: 1500, height: 740 };
}

const BUILDERS: Record<ScientificSchematicTemplateId, (options: ScientificSchematicOptions, provenance: ScientificProvenance) => Blueprint> = {
  'multimodal-foundation': buildMultimodal,
  'vision-language-bridge': buildVisionLanguageBridge,
  'vla-policy': buildVlaPolicy,
  'prompt-conditioned-agent': buildPromptAgent,
  'embodied-loop': buildEmbodiedLoop,
  'train-deploy': buildTrainDeploy,
  'llm-training-pipeline': buildLlmTrainingPipeline,
  'moe-routing': buildMoeRouting,
  'rag-tool-agent': buildRagToolAgent,
  'reasoning-trace': buildReasoningTrace,
  'robot-data-collection': buildRobotDataCollection,
  'world-model-rollout': buildWorldModelRollout,
  'sim-to-real': buildSimToReal,
  'multi-embodiment-policy': buildMultiEmbodimentPolicy,
};

export function getScientificSchematicTemplate(id: ScientificSchematicTemplateId): ScientificSchematicTemplate {
  return SCIENTIFIC_SCHEMATIC_TEMPLATES.find((template) => template.id === id) ?? SCIENTIFIC_SCHEMATIC_TEMPLATES[0];
}

export function defaultScientificSchematicTitle(
  templateId: ScientificSchematicTemplateId,
  language: ScientificSchematicLanguage,
): string {
  const template = getScientificSchematicTemplate(templateId);
  return language === 'zh' ? template.name : template.nameEn.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function createScientificSchematic(input: ScientificSchematicOptions): EditableScientificSchematic {
  const template = getScientificSchematicTemplate(input.templateId);
  const options: ScientificSchematicOptions = {
    ...input,
    title: input.title.trim() || defaultScientificSchematicTitle(input.templateId, input.language),
    backbone: input.backbone.trim(),
  };
  const provenance: ScientificProvenance = {
    id: createId('provenance'),
    kind: 'scientific-schematic',
    sourceName: template.name,
    sourceFormat: 'Flowloom native schematic',
    sourceData: JSON.stringify(options),
    engine: 'Flowloom schematic grammar 1',
    generatedAt: new Date().toISOString(),
    schematic: {
      templateId: options.templateId,
      style: options.style,
      density: options.density,
      language: options.language,
      backbone: options.backbone || undefined,
      references: template.references.map((reference) => reference.arxivId),
      generatedBy: 'template',
    },
  };
  const blueprint = BUILDERS[options.templateId](options, provenance);
  const allowedRank = densityRank(options.density);
  const nodes = blueprint.nodes.filter((node) => densityRank(node.data.schematicDetail ?? 'compact') <= allowedRank);
  const ids = new Set(nodes.map((node) => node.id));
  const graph = normalizeGraph(nodes, blueprint.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)));
  return {
    title: options.title,
    templateId: options.templateId,
    nodes: graph.nodes.map((node) => ({ ...node, selected: false })),
    edges: graph.edges.map((edge) => ({ ...edge, selected: false })),
    width: blueprint.width,
    height: blueprint.height,
    references: template.references,
  };
}
