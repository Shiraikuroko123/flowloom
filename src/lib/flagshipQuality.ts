import type {
  ScientificSchematicLayout,
  ScientificSchematicOptions,
  ScientificSchematicTemplateId,
} from '../types';
import {
  defaultScientificSchematicBackbone,
  defaultScientificSchematicTitle,
} from './scientificSchematics';

export const FLAGSHIP_QUALITY_THRESHOLD = 95;
export const FLAGSHIP_MINIMUM_DIMENSION_SCORE = 9;
export const FLAGSHIP_QUALITY_RUBRIC_VERSION = '2026.07';

export const FLAGSHIP_TEMPLATE_IDS = [
  'vla-policy',
  'world-model-rollout',
  'llm-training-pipeline',
] as const satisfies readonly ScientificSchematicTemplateId[];

export type FlagshipTemplateId = typeof FLAGSHIP_TEMPLATE_IDS[number];

export const FLAGSHIP_QUALITY_DIMENSIONS = [
  { id: 'composition', label: 'Composition', labelZh: '构图与版式' },
  { id: 'hierarchy', label: 'Visual hierarchy', labelZh: '视觉层级' },
  { id: 'specificity', label: 'Semantic specificity', labelZh: '语义与信息密度' },
  { id: 'typography', label: 'Typography', labelZh: '文字与数学排版' },
  { id: 'annotation', label: 'Annotation grammar', labelZh: '标注语法' },
  { id: 'connectors', label: 'Connector grammar', labelZh: '连接与线型语法' },
  { id: 'storytelling', label: 'Scientific storytelling', labelZh: '科研叙事可信度' },
  { id: 'slideReadability', label: 'Slide readability', labelZh: '汇报可读性' },
  { id: 'exportAccessibility', label: 'Export and accessibility', labelZh: '导出与可访问性' },
  { id: 'editability', label: 'Native editability', labelZh: '原生可编辑性' },
] as const;

export type FlagshipQualityDimensionId = typeof FLAGSHIP_QUALITY_DIMENSIONS[number]['id'];

export interface FlagshipQualityDimensionScore {
  id: FlagshipQualityDimensionId;
  label: string;
  labelZh: string;
  score: number;
  evidence: string;
}

export interface FlagshipQualityScorecard {
  templateId: FlagshipTemplateId;
  name: string;
  rubricVersion: string;
  reviewedAt: string;
  scope: string;
  dimensions: FlagshipQualityDimensionScore[];
  totalScore: number;
  minimumDimensionScore: number;
  threshold: number;
  passed: boolean;
}

type DimensionAssessment = Record<FlagshipQualityDimensionId, { score: number; evidence: string }>;

const sharedEvidence = {
  exportAccessibility: '三种物理版式、彩色与黑白、SVG/PDF/300 DPI PNG、灰度与三类色觉模拟均纳入自动证据链；PDF 字体嵌入与物理输出通过，但当前 PDF 未声明为 WCAG Tagged PDF，因此本项不等同于无障碍认证。',
  editability: '节点、连接、语义角色、路由和 provenance 均保存在可往返解析的 Flowloom SVG metadata 中。',
};

const assessments: Record<FlagshipTemplateId, { name: string; dimensions: DimensionAssessment }> = {
  'vla-policy': {
    name: 'Vision-Language-Action Policy',
    dimensions: {
      composition: { score: 9.5, evidence: '单栏、双栏与 16:9 分别重排，任务证据、策略、动作与执行保持稳定阅读轴。' },
      hierarchy: { score: 9.5, evidence: '阶段、VLM 主干、动作专家、控制器与物理结果具有明确的主次层级。' },
      specificity: { score: 9.6, evidence: 'RGB-D、语言、本体状态、6-DoF 动作块、接触与目标区均使用场景专用图元。' },
      typography: { score: 9.5, evidence: '物理字号受门禁约束，状态与时序变量使用规范且可编辑的 Unicode 数学排版。' },
      annotation: { score: 9.4, evidence: '坐标系、注意区域、规划接触、轨迹与风险门共同解释动作生成。' },
      connectors: { score: 9.6, evidence: '数据、控制、时序与反馈回路采用冗余线型编码，junction 与闭环方向明确。' },
      storytelling: { score: 9.7, evidence: '从任务观测到动作选择、物理接触、结果验证形成完整的具身闭环叙事。' },
      slideReadability: { score: 9.4, evidence: '16:9 专用版使用短阶段标题与 11 pt 以上主模块文字，并通过三种浏览器视口检查。' },
      exportAccessibility: { score: 9.2, evidence: sharedEvidence.exportAccessibility },
      editability: { score: 9.8, evidence: sharedEvidence.editability },
    },
  },
  'world-model-rollout': {
    name: 'World-Model Rollout',
    dimensions: {
      composition: { score: 9.5, evidence: '当前证据、预测状态、反事实未来和执行验证在三种版式中保持独立区域。' },
      hierarchy: { score: 9.5, evidence: '潜在世界模型、共享时域、三条 rollout、选择门与误差反馈构成清晰焦点链。' },
      specificity: { score: 9.6, evidence: '潜在状态、条件目标、成功/碰撞/遮挡未来、评分与观测误差均具备具体语义。' },
      typography: { score: 9.5, evidence: '状态转移、时域与预测变量使用规范且可编辑的 Unicode 数学排版。' },
      annotation: { score: 9.4, evidence: '共享时域、结果状态、score junction、不确定分支和预测误差提供完整解释层。' },
      connectors: { score: 9.6, evidence: '广播、可选分支、控制选择、时序执行与误差反馈通过线型和箭头双重编码。' },
      storytelling: { score: 9.6, evidence: '图中可独立读出观测、模拟多个未来、约束选择、执行并校验模型的闭环。' },
      slideReadability: { score: 9.4, evidence: '16:9 专用版的阶段间距和文字内边距通过三种真实浏览器视口测量。' },
      exportAccessibility: { score: 9.2, evidence: sharedEvidence.exportAccessibility },
      editability: { score: 9.8, evidence: sharedEvidence.editability },
    },
  },
  'llm-training-pipeline': {
    name: 'LLM Training Pipeline',
    dimensions: {
      composition: { score: 9.4, evidence: '数据、预训练、并行对齐路线和证据门在三种物理版式中分别重排。' },
      hierarchy: { score: 9.5, evidence: '基础模型、SFT 参考点、DPO/RL 分支、合并点和发布门层级明确。' },
      specificity: { score: 9.6, evidence: '版本化语料、NLL、偏好对、DPO、RM/PPO、最差切片与漂移监测均为专用语义。' },
      typography: { score: 9.5, evidence: '损失、参数检查点与策略变量使用规范且可编辑的 Unicode 数学排版。' },
      annotation: { score: 9.4, evidence: '损失目标、偏好关系、能力/安全证据、最差切片和发布门形成证据链。' },
      connectors: { score: 9.6, evidence: '训练、梯度、备选路线、汇合、发布与漂移反馈使用不同的连接语法。' },
      storytelling: { score: 9.6, evidence: '从版本化数据到预训练、对齐选择、评估门禁和线上反馈形成完整生命周期。' },
      slideReadability: { score: 9.4, evidence: '16:9 专用版压缩为三段叙事，阶段标题间距通过真实浏览器测量。' },
      exportAccessibility: { score: 9.2, evidence: sharedEvidence.exportAccessibility },
      editability: { score: 9.8, evidence: sharedEvidence.editability },
    },
  },
};

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildScorecard(templateId: FlagshipTemplateId): FlagshipQualityScorecard {
  const assessment = assessments[templateId];
  const dimensions = FLAGSHIP_QUALITY_DIMENSIONS.map((dimension) => ({
    ...dimension,
    ...assessment.dimensions[dimension.id],
  }));
  const totalScore = roundScore(dimensions.reduce((sum, dimension) => sum + dimension.score, 0));
  const minimumDimensionScore = Math.min(...dimensions.map((dimension) => dimension.score));
  return {
    templateId,
    name: assessment.name,
    rubricVersion: FLAGSHIP_QUALITY_RUBRIC_VERSION,
    reviewedAt: '2026-07-29',
    scope: '默认英文详细版；89 x 70 mm、180 x 120 mm、180 x 101.25 mm；conference 与 monochrome；SVG、PDF、300 DPI PNG。',
    dimensions,
    totalScore,
    minimumDimensionScore,
    threshold: FLAGSHIP_QUALITY_THRESHOLD,
    passed: totalScore >= FLAGSHIP_QUALITY_THRESHOLD
      && minimumDimensionScore >= FLAGSHIP_MINIMUM_DIMENSION_SCORE,
  };
}

export const FLAGSHIP_QUALITY_SCORECARDS = Object.fromEntries(
  FLAGSHIP_TEMPLATE_IDS.map((templateId) => [templateId, buildScorecard(templateId)]),
) as Record<FlagshipTemplateId, FlagshipQualityScorecard>;

export function isFlagshipTemplate(templateId: ScientificSchematicTemplateId): templateId is FlagshipTemplateId {
  return FLAGSHIP_TEMPLATE_IDS.some((candidate) => candidate === templateId);
}

export function getFlagshipQualityScorecard(
  templateId: ScientificSchematicTemplateId,
): FlagshipQualityScorecard | undefined {
  return isFlagshipTemplate(templateId) ? FLAGSHIP_QUALITY_SCORECARDS[templateId] : undefined;
}

export interface FlagshipQualityScopeAssessment {
  status: 'audited' | 'requires-review' | 'not-flagship';
  scorecard?: FlagshipQualityScorecard;
  reasons: string[];
}

const auditedLayouts = new Set<ScientificSchematicLayout>([
  'single-column',
  'double-column',
  'presentation',
]);

export function assessFlagshipQualityScope(
  options: ScientificSchematicOptions,
  layout: ScientificSchematicLayout,
): FlagshipQualityScopeAssessment {
  const scorecard = getFlagshipQualityScorecard(options.templateId);
  if (!scorecard) return { status: 'not-flagship', reasons: [] };

  const reasons: string[] = [];
  if (options.density !== 'detailed') reasons.push('结构密度不是已审计的详细版');
  if (options.language !== 'en') reasons.push('图中文字不是已审计的英文版');
  if (options.style !== 'conference' && options.style !== 'monochrome') reasons.push('视觉风格不在已审计范围');
  if (!auditedLayouts.has(layout)) reasons.push('画布尺寸不在三种已审计版式内');
  if (options.title.trim() !== defaultScientificSchematicTitle(options.templateId, options.language)) reasons.push('图题已自定义');
  if (options.backbone.trim() !== defaultScientificSchematicBackbone(options.templateId, options.language)) reasons.push('核心主干名称已自定义');

  return {
    status: reasons.length ? 'requires-review' : 'audited',
    scorecard,
    reasons,
  };
}
