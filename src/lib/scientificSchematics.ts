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
    moduleNode(palette, { id: 'mm-image', role: 'modality', x: 66, y: 128, width: 160, height: 70, label: t('Images / video', '图像 / 视频'), description: t('spatial observations', '空间观察') }),
    moduleNode(palette, { id: 'mm-text', role: 'modality', x: 66, y: 238, width: 160, height: 70, label: t('Language', '语言'), description: t('instruction + context', '指令 + 上下文') }),
    moduleNode(palette, { id: 'mm-audio', role: 'modality', x: 66, y: 348, width: 160, height: 70, label: t('Audio', '音频'), description: t('events + speech', '事件 + 语音'), detail: 'standard' }),
    moduleNode(palette, { id: 'mm-state', role: 'modality', x: 66, y: 458, width: 160, height: 70, label: t('Robot state', '机器人状态'), description: t('joints + sensors', '关节 + 传感器') }),
    moduleNode(palette, { id: 'mm-vision-encoder', role: 'encoder', x: 325, y: 128, width: 180, height: 70, label: t('Vision encoder', '视觉编码器') }),
    moduleNode(palette, { id: 'mm-tokenizer', role: 'encoder', x: 325, y: 238, width: 180, height: 70, label: t('Tokenizer', '文本分词器') }),
    moduleNode(palette, { id: 'mm-audio-encoder', role: 'encoder', x: 325, y: 348, width: 180, height: 70, label: t('Audio encoder', '音频编码器'), detail: 'standard' }),
    moduleNode(palette, { id: 'mm-state-projector', role: 'bridge', x: 325, y: 458, width: 180, height: 70, label: t('State projector', '状态投影器') }),
    moduleNode(palette, { id: 'mm-token-stream', role: 'token', x: 610, y: 125, width: 320, height: 72, label: t('[IMG]  text  [STATE]  text  [AUDIO]', '[图像] 文本 [状态] 文本 [音频]'), description: t('interleaved token sequence', '交错 Token 序列') }),
    moduleNode(palette, { id: 'mm-backbone', role: 'backbone', x: 615, y: 245, width: 310, height: 220, label: options.backbone || t('Multimodal LLM', '多模态大模型'), description: t('shared attention and reasoning', '共享注意力与推理'), fontSize: 18 }),
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
    moduleNode(palette, { id: 'vl-images', role: 'modality', x: 68, y: 162, width: 150, height: 84, label: t('Image batch', '图像批次') }),
    moduleNode(palette, { id: 'vl-frozen-vision', role: 'encoder', x: 270, y: 145, width: 190, height: 116, label: t('Frozen vision encoder', '冻结视觉编码器'), description: t('patch features', '图像块特征') }),
    moduleNode(palette, { id: 'vl-queries', role: 'token', x: 270, y: 318, width: 190, height: 64, label: t('Learnable queries', '可学习查询 Token') }),
    moduleNode(palette, { id: 'vl-qformer', role: 'bridge', x: 500, y: 192, width: 110, height: 190, label: t('Querying\nTransformer', '查询\nTransformer'), description: t('cross attention', '交叉注意力'), fontSize: 14 }),
    moduleNode(palette, { id: 'vl-text', role: 'modality', x: 68, y: 410, width: 150, height: 76, label: t('Paired text', '配对文本') }),
    moduleNode(palette, { id: 'vl-objectives', role: 'loss', x: 278, y: 438, width: 260, height: 94, label: t('ITC · ITM · image-grounded text', '图文对比 · 匹配 · 生成'), description: t('joint representation objectives', '联合表征目标'), detail: 'standard' }),
    moduleNode(palette, { id: 'vl-image-two', role: 'modality', x: 700, y: 150, width: 145, height: 78, label: t('Image', '图像') }),
    moduleNode(palette, { id: 'vl-frozen-two', role: 'encoder', x: 885, y: 132, width: 185, height: 112, label: t('Frozen vision encoder', '冻结视觉编码器') }),
    moduleNode(palette, { id: 'vl-qformer-two', role: 'bridge', x: 885, y: 296, width: 185, height: 96, label: t('Query bridge', '查询桥接器') }),
    moduleNode(palette, { id: 'vl-projection', role: 'token', x: 700, y: 318, width: 145, height: 70, label: t('Projection', '线性投影'), description: t('language space', '语言空间') }),
    moduleNode(palette, { id: 'vl-llm', role: 'backbone', x: 1110, y: 196, width: 145, height: 220, label: options.backbone || t('Frozen LLM', '冻结大模型'), description: t('decoder or encoder-decoder', '解码器或编解码器'), fontSize: 16 }),
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
    moduleNode(palette, { id: 'vla-image', role: 'modality', x: 62, y: 128, width: 145, height: 78, label: t('Camera observation', '相机观察') }),
    moduleNode(palette, { id: 'vla-language', role: 'modality', x: 62, y: 254, width: 145, height: 78, label: t('Language instruction', '语言指令') }),
    moduleNode(palette, { id: 'vla-state', role: 'modality', x: 62, y: 380, width: 145, height: 78, label: t('Proprioceptive state', '本体状态') }),
    moduleNode(palette, { id: 'vla-vision', role: 'encoder', x: 244, y: 128, width: 150, height: 78, label: t('Vision encoders', '视觉编码器'), description: t('global + local features', '全局 + 局部特征') }),
    moduleNode(palette, { id: 'vla-tokenizer', role: 'encoder', x: 244, y: 254, width: 150, height: 78, label: t('Text tokenizer', '文本分词器') }),
    moduleNode(palette, { id: 'vla-state-projector', role: 'bridge', x: 244, y: 380, width: 150, height: 78, label: t('State projector', '状态投影器') }),
    moduleNode(palette, { id: 'vla-token-sequence', role: 'token', x: 495, y: 120, width: 425, height: 72, label: t('[VISION]  instruction  [STATE]  action queries', '[视觉] 指令 [状态] 动作查询'), description: t('shared embedding sequence', '统一嵌入序列') }),
    moduleNode(palette, { id: 'vla-backbone', role: 'backbone', x: 510, y: 242, width: 250, height: 190, label: options.backbone || t('VLM backbone', 'VLM 主干'), description: t('language-conditioned visual reasoning', '语言条件视觉推理'), fontSize: 18 }),
    moduleNode(palette, { id: 'vla-action-expert', role: 'policy', x: 792, y: 242, width: 130, height: 190, label: t('Action\nexpert', '动作\n专家'), description: t('flow / diffusion', '流匹配 / 扩散'), fontSize: 15 }),
    moduleNode(palette, { id: 'vla-training-loss', role: 'loss', x: 570, y: 488, width: 270, height: 72, label: t('Action objective + language loss', '动作目标 + 语言损失'), detail: 'detailed' }),
    moduleNode(palette, { id: 'vla-action-chunk', role: 'action', x: 1020, y: 144, width: 276, height: 86, label: t('Action chunk', '动作块'), description: t('T x {pose, gripper, base}', 'T × {位姿, 夹爪, 底盘}') }),
    moduleNode(palette, { id: 'vla-safety', role: 'policy', x: 1020, y: 286, width: 132, height: 72, label: t('Safety filter', '安全过滤'), detail: 'standard' }),
    moduleNode(palette, { id: 'vla-controller', role: 'action', x: 1164, y: 286, width: 132, height: 72, label: t('Controller', '控制器') }),
    moduleNode(palette, { id: 'vla-robot', kind: 'ellipse', role: 'environment', x: 1058, y: 426, width: 200, height: 116, label: t('Robot + environment', '机器人 + 环境'), description: t('closed-loop execution', '闭环执行') }),
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
    moduleNode(palette, { id: 'pa-image-prompt', role: 'modality', x: 205, y: 128, width: 120, height: 70, label: t('Image prompt', '图像提示') }),
    moduleNode(palette, { id: 'pa-demo-prompt', role: 'modality', x: 65, y: 236, width: 260, height: 76, label: t('Video / demonstration frames', '视频 / 示范帧'), detail: 'standard' }),
    moduleNode(palette, { id: 'pa-prompt-encoder', role: 'encoder', x: 86, y: 360, width: 218, height: 100, label: t('Prompt encoder', '提示编码器'), description: t('language + object tokens', '语言 + 对象 Token') }),
    moduleNode(palette, { id: 'pa-prompt-tokens', role: 'token', x: 86, y: 504, width: 218, height: 58, label: t('Prompt tokens', '提示 Token') }),
    moduleNode(palette, { id: 'pa-history', role: 'memory', x: 425, y: 132, width: 180, height: 86, label: t('Interaction history', '交互历史'), description: t('observations + actions', '观察 + 动作') }),
    moduleNode(palette, { id: 'pa-controller', role: 'backbone', x: 626, y: 176, width: 235, height: 250, label: options.backbone || t('Causal transformer', '因果 Transformer'), description: t('alternating self-attention', '交替自注意力'), fontSize: 17 }),
    moduleNode(palette, { id: 'pa-cross-attn', role: 'bridge', x: 425, y: 296, width: 180, height: 96, label: t('Cross-attention', '交叉注意力'), description: t('prompt conditioning', '提示条件化') }),
    moduleNode(palette, { id: 'pa-action-token', role: 'action', x: 664, y: 486, width: 160, height: 68, label: t('Motor command token', '运动指令 Token') }),
    moduleNode(palette, { id: 'pa-observation', role: 'modality', x: 972, y: 132, width: 230, height: 82, label: t('Current observation', '当前观察') }),
    moduleNode(palette, { id: 'pa-robot', kind: 'ellipse', role: 'environment', x: 986, y: 304, width: 202, height: 120, label: t('Robot workspace', '机器人工作空间') }),
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
    moduleNode(palette, { id: 'el-perception', role: 'encoder', x: 100, y: 156, width: 190, height: 96, label: t('Multimodal perception', '多模态感知'), description: t('vision · audio · touch', '视觉 · 听觉 · 触觉') }),
    moduleNode(palette, { id: 'el-state-estimate', role: 'token', x: 320, y: 254, width: 190, height: 68, label: t('State estimate', '状态估计'), description: t('objects + relations', '对象 + 关系') }),
    moduleNode(palette, { id: 'el-world-model', role: 'backbone', x: 390, y: 94, width: 230, height: 126, label: t('World model', '世界模型'), description: t('latent state + dynamics', '潜在状态 + 动力学'), fontSize: 17 }),
    moduleNode(palette, { id: 'el-goal', role: 'modality', x: 760, y: 54, width: 220, height: 50, label: t('Task goal + constraints', '任务目标 + 约束') }),
    moduleNode(palette, { id: 'el-planner', kind: 'hexagon', role: 'policy', x: 760, y: 130, width: 220, height: 112, label: t('Reasoning and planning', '推理与规划'), description: t('goals · constraints · substeps', '目标 · 约束 · 子任务') }),
    moduleNode(palette, { id: 'el-policy', role: 'policy', x: 890, y: 340, width: 196, height: 104, label: options.backbone || t('Policy', '策略模型'), description: t('select action chunk', '选择动作块') }),
    moduleNode(palette, { id: 'el-actuation', role: 'action', x: 650, y: 522, width: 210, height: 94, label: t('Control and actuation', '控制与执行'), description: t('trajectory · gripper · base', '轨迹 · 夹爪 · 底盘') }),
    moduleNode(palette, { id: 'el-environment', kind: 'ellipse', role: 'environment', x: 400, y: 420, width: 230, height: 142, label: t('Robot in environment', '环境中的机器人'), description: t('physical state changes', '物理状态变化'), fontSize: 16 }),
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
    moduleNode(palette, { id: 'td-internet', kind: 'database', role: 'dataset', x: 66, y: 124, width: 170, height: 96, label: t('Image-text data', '图文数据') }),
    moduleNode(palette, { id: 'td-oxe', kind: 'database', role: 'dataset', x: 66, y: 272, width: 170, height: 96, label: t('Open robot data', '开放机器人数据') }),
    moduleNode(palette, { id: 'td-private', kind: 'database', role: 'dataset', x: 66, y: 420, width: 170, height: 96, label: t('Target robot data', '目标机器人数据'), detail: 'standard' }),
    moduleNode(palette, { id: 'td-mixture', role: 'bridge', x: 282, y: 246, width: 174, height: 130, label: t('Data mixture', '数据混合'), description: t('sampling + normalization', '采样 + 归一化') }),
    moduleNode(palette, { id: 'td-pretrain', role: 'backbone', x: 500, y: 154, width: 190, height: 118, label: t('VLM pretraining', 'VLM 预训练'), description: t('visual-language priors', '视觉语言先验') }),
    moduleNode(palette, { id: 'td-policy-train', role: 'policy', x: 500, y: 354, width: 190, height: 118, label: t('Policy adaptation', '策略适配'), description: t('action expert + embodiment', '动作专家 + 机体适配') }),
    moduleNode(palette, { id: 'td-loss', role: 'loss', x: 300, y: 462, width: 160, height: 72, label: t('Training objectives', '训练目标'), description: t('language + action', '语言 + 动作'), detail: 'detailed' }),
    moduleNode(palette, { id: 'td-checkpoint', kind: 'document', role: 'memory', x: 716, y: 258, width: 62, height: 128, label: t('Model\ncheckpoint', '模型\n检查点'), fontSize: 11 }),
    moduleNode(palette, { id: 'td-observation', role: 'modality', x: 866, y: 134, width: 150, height: 72, label: t('Observation', '环境观察') }),
    moduleNode(palette, { id: 'td-instruction', role: 'modality', x: 866, y: 250, width: 150, height: 72, label: t('Instruction', '任务指令') }),
    moduleNode(palette, { id: 'td-model', role: 'backbone', x: 1050, y: 166, width: 225, height: 168, label: options.backbone || t('Generalist policy', '通用策略模型'), description: t('shared weights, robot adapters', '共享权重 + 机器人适配'), fontSize: 17 }),
    moduleNode(palette, { id: 'td-action', role: 'action', x: 1110, y: 388, width: 166, height: 72, label: t('Action chunk', '动作块') }),
    moduleNode(palette, { id: 'td-robot', kind: 'ellipse', role: 'environment', x: 878, y: 440, width: 190, height: 118, label: t('Robot embodiment', '机器人机体'), description: t('arm · mobile · dual-arm', '机械臂 · 移动 · 双臂') }),
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

const BUILDERS: Record<ScientificSchematicTemplateId, (options: ScientificSchematicOptions, provenance: ScientificProvenance) => Blueprint> = {
  'multimodal-foundation': buildMultimodal,
  'vision-language-bridge': buildVisionLanguageBridge,
  'vla-policy': buildVlaPolicy,
  'prompt-conditioned-agent': buildPromptAgent,
  'embodied-loop': buildEmbodiedLoop,
  'train-deploy': buildTrainDeploy,
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
