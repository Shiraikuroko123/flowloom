import vlaApproach from '../assets/scientific/vla-approach-print.jpg?inline';
import vlaGrasp from '../assets/scientific/vla-grasp-print.jpg?inline';
import vlaObserve from '../assets/scientific/vla-observe-print.jpg?inline';
import vlaPlace from '../assets/scientific/vla-place-print.jpg?inline';
import worldCollision from '../assets/scientific/world-collision-print.jpg?inline';
import worldCurrent from '../assets/scientific/world-observed-print.jpg?inline';
import worldSuccess from '../assets/scientific/world-success-print.jpg?inline';
import worldUncertain from '../assets/scientific/world-occluded-print.jpg?inline';
import type {
  FlowEdge,
  FlowNode,
  ScientificProvenance,
  ScientificSchematicLayout,
  ScientificSchematicOptions,
  ScientificSchematicRole,
  ShapeKind,
} from '../types';
import {
  buildTopVenueFlagship as buildPreviousFlagship,
  dimensionsFor,
  makeCaption,
  makeEdge,
  makeImage,
  makeNode,
  makeRoot,
  makeStage,
  paletteFor,
  type Box,
  type FlagshipPalette,
  type PublicationFlagshipBlueprint,
  type Tone,
} from './scientificFlagshipsV3';

/*
 * Generation five deliberately treats whitespace as routing infrastructure.
 * Each flagship has one primary reading path, one reserved feedback lane, and
 * no labels attached to connectors. This keeps the SVG, canvas, and PDF in
 * agreement while leaving every component independently editable.
 */

const VLA_PROMPT_REF = 'docs/research/SYNTHETIC_ASSET_PROVENANCE.md#vla-storyboard';
const WORLD_PROMPT_REF = 'docs/research/SYNTHETIC_ASSET_PROVENANCE.md#world-model-counterfactuals';

interface ModuleInput {
  id: string;
  role: ScientificSchematicRole;
  box: Box;
  label: string;
  description?: string;
  tone?: Tone;
  kind?: ShapeKind;
  fontSize?: number;
  fontWeight?: number;
  borderWidth?: number;
  variant?: FlowNode['data']['scientificVariant'];
  detail?: FlowNode['data']['schematicDetail'];
  textPaddingX?: number;
  textPaddingY?: number;
}

type EdgeInput = Omit<Parameters<typeof makeEdge>[1], 'source' | 'target'>;

interface SemanticEdgeSpec extends EdgeInput {
  source: string;
  target: string;
}

function moduleNode(palette: FlagshipPalette, input: ModuleInput): FlowNode {
  return makeNode(palette, {
    ...input,
    tone: input.tone ?? 'neutral',
    kind: input.kind ?? 'rounded-rectangle',
    detail: input.detail ?? 'compact',
    fontSize: input.fontSize ?? 28,
    fontWeight: input.fontWeight,
    borderWidth: input.borderWidth ?? 2.2,
    textPaddingX: input.textPaddingX ?? 6,
    textPaddingY: input.textPaddingY ?? 5,
  });
}

function imageNode(
  palette: FlagshipPalette,
  input: Omit<ModuleInput, 'kind'> & {
    imageUrl: string;
    sourceRef: string;
    promptRef: string;
    imageFit?: FlowNode['data']['imageFit'];
    rasterWidthPx?: number;
    rasterHeightPx?: number;
  },
): FlowNode {
  return makeImage(palette, {
    ...input,
    imageUrl: input.imageUrl,
    imageFit: input.imageFit ?? 'cover',
    // These assets are the checked 800 x 1200 publication variants. Keep
    // their intrinsic dimensions with the editable image node for DPI audit.
    rasterWidthPx: input.rasterWidthPx ?? 800,
    rasterHeightPx: input.rasterHeightPx ?? 1200,
    sourceRef: input.sourceRef,
    promptRef: input.promptRef,
    fontSize: input.fontSize ?? 20,
    borderWidth: input.borderWidth ?? 2,
  });
}

function stageNode(palette: FlagshipPalette, id: string, box: Box, label: string, fontSize: number): FlowNode {
  return makeStage(palette, id, box, label, fontSize);
}

function sectionPanel(palette: FlagshipPalette, id: string, box: Box, tone: Tone): FlowNode {
  const monochrome = palette.ink === '#111111';
  const fill = monochrome
    ? '#FAFAFA'
    : tone === 'coral'
      ? '#FFF8F6'
      : tone === 'violet'
        ? '#FAF8FC'
        : '#F7F9FA';
  return makeNode(palette, {
    id,
    role: 'frame',
    box,
    label: '',
    kind: 'rectangle',
    fill,
    stroke: 'none',
    borderWidth: 0,
    radius: 4,
    zIndex: -15,
  });
}

function edge(
  palette: FlagshipPalette,
  source: string,
  target: string,
  input: EdgeInput = {},
): FlowEdge {
  return makeEdge(palette, {
    source,
    target,
    routing: 'straight',
    ...input,
  });
}

function contractEdges(
  palette: FlagshipPalette,
  contract: readonly SemanticEdgeSpec[],
  overrides: Readonly<Record<string, EdgeInput>>,
): FlowEdge[] {
  return contract.map(({ source, target, ...base }) => edge(
    palette,
    source,
    target,
    { ...base, ...overrides[`${source}->${target}`] },
  ));
}

function root(
  palette: FlagshipPalette,
  options: ScientificSchematicOptions,
  provenance: ScientificProvenance,
  layout: ScientificSchematicLayout,
): { nodes: FlowNode[]; width: number; height: number } {
  const { width, height } = dimensionsFor(layout);
  return { nodes: [makeRoot(palette, options, provenance, width, height)], width, height };
}

function wideMetrics(layout: Extract<ScientificSchematicLayout, 'double-column' | 'presentation'>) {
  const double = layout === 'double-column';
  return {
    double,
    stageY: double ? 42 : 24,
    panelY: double ? 124 : 100,
    contentY: double ? 174 : 150,
    panelHeight: double ? 590 : 450,
    feedbackY: double ? 808 : 620,
    footerY: double ? 920 : 766,
    stageSize: double ? 35 : 34,
    moduleSize: double ? 29 : 28,
  };
}

export const FLAGSHIP_SEMANTIC_NODE_IDS = {
  'vla-policy': [
    'vla-observation', 'vla-task', 'vla-state', 'vla-tokens', 'vla-backbone',
    'vla-object', 'vla-constraints', 'vla-policy', 'vla-action', 'vla-integrator',
    'vla-execution', 'vla-trajectory', 'vla-rollout-a', 'vla-rollout-b', 'vla-rollout-c',
    'vla-feedback-note',
  ],
  'world-model-rollout': [
    'wm-scene', 'wm-goal', 'wm-encode', 'wm-latent', 'wm-actions', 'wm-model', 'wm-rollout',
    'wm-rollout-safe', 'wm-rollout-contact', 'wm-rollout-uncertain', 'wm-score',
    'wm-action', 'wm-execute', 'wm-residual', 'wm-update',
  ],
  'llm-training-pipeline': [
    'llm-base', 'llm-data', 'llm-sft', 'llm-prompt', 'llm-pair', 'llm-objective',
    'llm-policy', 'llm-suite', 'llm-gate', 'llm-rm', 'llm-rollout', 'llm-ppo',
  ],
} as const;

const VLA_EDGE_CONTRACT = [
  { source: 'vla-observation', target: 'vla-tokens', semantic: 'data' },
  { source: 'vla-task', target: 'vla-tokens', semantic: 'data' },
  { source: 'vla-state', target: 'vla-policy', semantic: 'data' },
  { source: 'vla-tokens', target: 'vla-backbone', semantic: 'data' },
  { source: 'vla-backbone', target: 'vla-object', semantic: 'control' },
  { source: 'vla-object', target: 'vla-policy', semantic: 'control' },
  { source: 'vla-constraints', target: 'vla-policy', semantic: 'data' },
  { source: 'vla-policy', target: 'vla-action', semantic: 'control' },
  { source: 'vla-action', target: 'vla-integrator', semantic: 'control' },
  { source: 'vla-integrator', target: 'vla-execution', semantic: 'temporal' },
  { source: 'vla-execution', target: 'vla-trajectory', semantic: 'temporal' },
  { source: 'vla-execution', target: 'vla-rollout-a', semantic: 'temporal' },
  { source: 'vla-rollout-a', target: 'vla-rollout-b', semantic: 'temporal' },
  { source: 'vla-rollout-b', target: 'vla-rollout-c', semantic: 'temporal' },
  { source: 'vla-rollout-c', target: 'vla-feedback-note', semantic: 'feedback', lineStyle: 'dashed' },
] as const satisfies readonly SemanticEdgeSpec[];

const WORLD_EDGE_CONTRACT = [
  { source: 'wm-scene', target: 'wm-encode', semantic: 'data' },
  { source: 'wm-goal', target: 'wm-actions', semantic: 'control' },
  { source: 'wm-encode', target: 'wm-latent', semantic: 'data' },
  { source: 'wm-latent', target: 'wm-model', semantic: 'control' },
  { source: 'wm-actions', target: 'wm-model', semantic: 'control' },
  { source: 'wm-model', target: 'wm-rollout', semantic: 'control' },
  { source: 'wm-rollout', target: 'wm-rollout-safe', semantic: 'broadcast' },
  { source: 'wm-rollout', target: 'wm-rollout-contact', semantic: 'broadcast' },
  { source: 'wm-rollout', target: 'wm-rollout-uncertain', semantic: 'broadcast' },
  { source: 'wm-rollout-safe', target: 'wm-score', semantic: 'control' },
  { source: 'wm-rollout-contact', target: 'wm-score', semantic: 'control' },
  { source: 'wm-rollout-uncertain', target: 'wm-score', semantic: 'control' },
  { source: 'wm-score', target: 'wm-action', semantic: 'control' },
  { source: 'wm-action', target: 'wm-execute', semantic: 'temporal' },
  { source: 'wm-execute', target: 'wm-residual', semantic: 'feedback', lineStyle: 'dashed' },
  { source: 'wm-residual', target: 'wm-update', semantic: 'feedback', lineStyle: 'dashed' },
] as const satisfies readonly SemanticEdgeSpec[];

const LLM_EDGE_CONTRACT = [
  { source: 'llm-base', target: 'llm-sft', semantic: 'temporal' },
  { source: 'llm-data', target: 'llm-sft', semantic: 'data' },
  { source: 'llm-sft', target: 'llm-objective', semantic: 'control' },
  { source: 'llm-prompt', target: 'llm-pair', semantic: 'data' },
  { source: 'llm-pair', target: 'llm-objective', semantic: 'control' },
  { source: 'llm-objective', target: 'llm-policy', semantic: 'gradient' },
  { source: 'llm-policy', target: 'llm-suite', semantic: 'temporal' },
  { source: 'llm-policy', target: 'llm-gate', semantic: 'control' },
  { source: 'llm-suite', target: 'llm-gate', semantic: 'data' },
  { source: 'llm-sft', target: 'llm-rollout', semantic: 'optional', lineStyle: 'dotted' },
  { source: 'llm-rm', target: 'llm-ppo', semantic: 'optional', lineStyle: 'dotted' },
  { source: 'llm-rollout', target: 'llm-ppo', semantic: 'optional', lineStyle: 'dotted' },
  { source: 'llm-ppo', target: 'llm-policy', semantic: 'optional', lineStyle: 'dotted' },
] as const satisfies readonly SemanticEdgeSpec[];

export const FLAGSHIP_SEMANTIC_EDGE_PAIRS = {
  'vla-policy': VLA_EDGE_CONTRACT.map(({ source, target }) => `${source}->${target}`),
  'world-model-rollout': WORLD_EDGE_CONTRACT.map(({ source, target }) => `${source}->${target}`),
  'llm-training-pipeline': LLM_EDGE_CONTRACT.map(({ source, target }) => `${source}->${target}`),
} as const;

function vlaSingle(options: ScientificSchematicOptions, provenance: ScientificProvenance): PublicationFlagshipBlueprint {
  const palette = paletteFor(options);
  const { nodes, width, height } = root(palette, options, provenance, 'single-column');
  nodes.push(
    stageNode(palette, 'vla-01', [20, 16, 154, 50], 'A  Context', 24),
    stageNode(palette, 'vla-02', [194, 16, 180, 50], 'B  Encode', 24),
    stageNode(palette, 'vla-03', [388, 16, 198, 50], 'C  Flow policy', 24),
    stageNode(palette, 'vla-04', [606, 16, 144, 50], 'D  Act', 24),
    sectionPanel(palette, 'vla-contribution-panel', [188, 76, 400, 288], 'neutral'),
    imageNode(palette, {
      id: 'vla-observation', role: 'environment', box: [20, 90, 150, 105], label: 'RGB-D',
      imageUrl: vlaObserve, sourceRef: 'vla-observe-print.jpg', promptRef: VLA_PROMPT_REF,
      fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-task', role: 'modality', box: [20, 214, 150, 70], label: 'Instruction', description: 'cube → tray', tone: 'amber', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-state', role: 'modality', box: [20, 292, 150, 54], label: 'State sₜ', tone: 'neutral', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-tokens', role: 'token', kind: 'scientific-token-strip', box: [206, 92, 154, 72], label: 'Tokens', tone: 'amber', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-backbone', role: 'backbone', kind: 'scientific-transformer', box: [206, 180, 154, 80], label: 'VLM', tone: 'violet', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-object', role: 'token', kind: 'scientific-attention-map', box: [206, 280, 154, 68], label: 'Object zₜ', tone: 'neutral', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-constraints', role: 'token', box: [386, 92, 184, 52], label: 'Safety', tone: 'neutral', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-policy', role: 'policy', kind: 'scientific-layer-stack', box: [386, 158, 184, 108],
      label: 'Flow policy', description: 'vθ(aτ | cₜ, τ)', tone: 'coral', fontSize: 19, borderWidth: 3,
    }),
    moduleNode(palette, {
      id: 'vla-action', role: 'action', kind: 'scientific-action-chunk', box: [386, 280, 184, 76],
      label: 'aₜ:ₜ₊H', description: '∈ ℝ⁷', tone: 'blue', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'vla-integrator', role: 'policy', box: [610, 92, 130, 52], label: 'MPC', tone: 'blue', fontSize: 18,
    }),
    imageNode(palette, {
      id: 'vla-execution', role: 'environment', box: [610, 164, 130, 110], label: 'Act',
      imageUrl: vlaApproach, sourceRef: 'vla-approach-print.jpg', promptRef: VLA_PROMPT_REF,
      fontSize: 16,
    }),
    moduleNode(palette, {
      id: 'vla-trajectory', role: 'action', kind: 'scientific-trajectory', box: [610, 294, 130, 62], label: 'TCP path', tone: 'blue', fontSize: 18,
    }),
    stageNode(palette, 'vla-05', [20, 390, 145, 44], 'E  Rollout', 22),
    imageNode(palette, {
      id: 'vla-rollout-a', role: 'environment', box: [506, 450, 120, 90], label: 't',
      imageUrl: vlaObserve, sourceRef: 'vla-observe-print.jpg', promptRef: VLA_PROMPT_REF,
    }),
    imageNode(palette, {
      id: 'vla-rollout-b', role: 'environment', box: [354, 450, 120, 90], label: 't + 4',
      imageUrl: vlaGrasp, sourceRef: 'vla-grasp-print.jpg', promptRef: VLA_PROMPT_REF,
    }),
    imageNode(palette, {
      id: 'vla-rollout-c', role: 'environment', box: [202, 450, 120, 90], label: 't + 8',
      imageUrl: vlaPlace, sourceRef: 'vla-place-print.jpg', promptRef: VLA_PROMPT_REF,
    }),
    makeCaption(palette, 'vla-feedback-note', [157, 548, 210, 36], 'next RGB-D', 16, undefined, 'center'),
  );

  const edges = contractEdges(palette, VLA_EDGE_CONTRACT, {
    'vla-observation->vla-tokens': { sourceHandle: 'right', targetHandle: 'left' },
    'vla-task->vla-tokens': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: 25 },
      routeWaypoints: [{ origin: 'source', dx: 18, dy: 0 }, { origin: 'target', dx: -18, dy: 0 }],
    },
    'vla-state->vla-policy': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: 35 },
      routeWaypoints: [
        { origin: 'source', dx: 0, dy: 55 },
        { origin: 'target', dx: -10, dy: 121 },
        { origin: 'target', dx: -10, dy: 0 },
      ],
    },
    'vla-tokens->vla-backbone': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-backbone->vla-object': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-object->vla-policy': { sourceHandle: 'right', targetHandle: 'left' },
    'vla-constraints->vla-policy': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-policy->vla-action': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-action->vla-integrator': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 10, dy: 0 }, { origin: 'target', dx: -30, dy: 0 }],
    },
    'vla-integrator->vla-execution': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-execution->vla-trajectory': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-execution->vla-rollout-a': {
      sourceHandle: 'left', targetHandle: 'top',
      routeWaypoints: [
        { origin: 'source', dx: -10, dy: 0 },
        { origin: 'target', dx: 34, dy: -20 },
        { origin: 'target', dx: 0, dy: -20 },
      ],
    },
    'vla-rollout-a->vla-rollout-b': { sourceHandle: 'left', targetHandle: 'right' },
    'vla-rollout-b->vla-rollout-c': { sourceHandle: 'left', targetHandle: 'right' },
    'vla-rollout-c->vla-feedback-note': { sourceHandle: 'bottom', targetHandle: 'top' },
  });
  return { nodes, edges, width, height };
}

function vlaWide(
  options: ScientificSchematicOptions,
  provenance: ScientificProvenance,
  layout: Extract<ScientificSchematicLayout, 'double-column' | 'presentation'>,
): PublicationFlagshipBlueprint {
  const palette = paletteFor(options);
  const { nodes, width, height } = root(palette, options, provenance, layout);
  const m = wideMetrics(layout);
  const y = m.contentY;
  const tall = layout === 'double-column';
  const observationHeight = tall ? 176 : 154;
  const taskOffset = tall ? 214 : 184;
  const stateOffset = tall ? 330 : 286;
  const stateNodeOffset = tall ? stateOffset : stateOffset + 10;
  const backboneHeight = tall ? 180 : 160;
  const objectOffset = tall ? 220 : 190;
  const policyOffset = tall ? 122 : 110;
  const policyHeight = tall ? 180 : 154;
  const rolloutY = tall ? 730 : 620;
  const rolloutHeight = tall ? 110 : 88;
  const feedbackY = tall ? 900 : 772;
  const stateCenterY = y + stateNodeOffset + (tall ? 36 : 33);
  const policyTargetY = y + policyOffset + policyHeight / 2 + 50;
  const stateLaneY = tall ? y + 440 : y + 360;
  nodes.push(
    stageNode(palette, 'vla-01', [40, m.stageY, 250, 62], 'A  Context', m.stageSize),
    stageNode(palette, 'vla-02', [350, m.stageY, 380, 62], 'B  Encode', m.stageSize),
    stageNode(palette, 'vla-03', [760, m.stageY, 520, 62], 'C  Flow policy', m.stageSize),
    stageNode(palette, 'vla-04', [1320, m.stageY, 300, 62], 'D  Act', m.stageSize),
    sectionPanel(palette, 'vla-contribution-panel', [330, y - 22, 970, tall ? 470 : 390], 'neutral'),
    imageNode(palette, {
      id: 'vla-observation', role: 'environment', box: [40, y, 250, observationHeight], label: 'RGB-D oₜ',
      imageUrl: vlaObserve, sourceRef: 'vla-observe-print.jpg', promptRef: VLA_PROMPT_REF, fontSize: 24,
    }),
    moduleNode(palette, {
      id: 'vla-task', role: 'modality', box: [40, y + taskOffset, 250, tall ? 90 : 102], label: 'Instruction', description: 'cube → tray', tone: 'amber', fontSize: 25,
    }),
    moduleNode(palette, {
      id: 'vla-state', role: 'modality', box: [40, y + stateNodeOffset, 250, tall ? 72 : 66], label: 'State sₜ', tone: 'neutral', fontSize: 24,
    }),
    moduleNode(palette, {
      id: 'vla-tokens', role: 'token', kind: 'scientific-token-strip', box: [360, y + 10, 180, tall ? 140 : 120], label: 'Tokens', tone: 'amber', fontSize: 24,
    }),
    moduleNode(palette, {
      id: 'vla-backbone', role: 'backbone', kind: 'scientific-transformer', box: [570, y + 10, 230, backboneHeight], label: options.backbone, tone: 'violet', fontSize: m.moduleSize,
    }),
    moduleNode(palette, {
      id: 'vla-object', role: 'token', kind: 'scientific-attention-map', box: [570, y + objectOffset, 230, tall ? 112 : 96], label: 'Object zₜ', tone: 'neutral', fontSize: 24,
    }),
    moduleNode(palette, {
      id: 'vla-policy', role: 'policy', kind: 'scientific-layer-stack', box: [830, y + policyOffset, 270, policyHeight],
      label: 'Flow policy', description: 'vθ(aτ | cₜ, τ)', tone: 'coral', fontSize: m.moduleSize, borderWidth: 3.4,
    }),
    moduleNode(palette, {
      id: 'vla-action', role: 'action', kind: 'scientific-action-chunk', box: [1120, y + policyOffset + 10, 170, tall ? 160 : 146],
      label: 'aₜ:ₜ₊H', description: '∈ ℝ⁷', tone: 'blue', fontSize: 24,
    }),
    moduleNode(palette, {
      id: 'vla-constraints', role: 'token', box: [850, y + 10, 190, tall ? 76 : 70], label: 'Safety', tone: 'neutral', fontSize: 24,
    }),
    moduleNode(palette, {
      id: 'vla-integrator', role: 'policy', box: [1110, y + 10, 180, tall ? 76 : 70], label: 'MPC', tone: 'blue', fontSize: 24,
    }),
    imageNode(palette, {
      id: 'vla-execution', role: 'environment', box: [1360, y + 10, 240, tall ? 170 : 150], label: 'Act',
      imageUrl: vlaApproach, sourceRef: 'vla-approach-print.jpg', promptRef: VLA_PROMPT_REF, fontSize: 23,
    }),
    moduleNode(palette, {
      id: 'vla-trajectory', role: 'action', kind: 'scientific-trajectory', box: [1360, y + (tall ? 220 : 188), 240, tall ? 118 : 100], label: 'TCP path', tone: 'blue', fontSize: 24,
    }),
    stageNode(palette, 'vla-05', [520, rolloutY - 68, 700, 52], 'E  Closed-loop rollout', m.stageSize),
    imageNode(palette, {
      id: 'vla-rollout-a', role: 'environment', box: [1220, rolloutY, 150, rolloutHeight], label: 't',
      imageUrl: vlaObserve, sourceRef: 'vla-observe-print.jpg', promptRef: VLA_PROMPT_REF,
    }),
    imageNode(palette, {
      id: 'vla-rollout-b', role: 'environment', box: [920, rolloutY, 150, rolloutHeight], label: 't + 4',
      imageUrl: vlaGrasp, sourceRef: 'vla-grasp-print.jpg', promptRef: VLA_PROMPT_REF,
    }),
    imageNode(palette, {
      id: 'vla-rollout-c', role: 'environment', box: [620, rolloutY, 150, rolloutHeight], label: 't + 8',
      imageUrl: vlaPlace, sourceRef: 'vla-place-print.jpg', promptRef: VLA_PROMPT_REF,
    }),
    makeCaption(palette, 'vla-feedback-note', [570, feedbackY - (tall ? 50 : 60), 250, tall ? 42 : 48], 'next RGB-D', 22, undefined, 'center'),
  );

  const edges = contractEdges(palette, VLA_EDGE_CONTRACT, {
    'vla-observation->vla-tokens': { sourceHandle: 'right', targetHandle: 'left' },
    'vla-task->vla-tokens': {
      sourceHandle: 'right', targetHandle: 'bottom',
      routeWaypoints: [{ origin: 'source', dx: 30, dy: 0 }, { origin: 'target', dx: 0, dy: 26 }],
    },
    'vla-state->vla-policy': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: 50 },
      routeWaypoints: [
        { origin: 'source', dx: 0, dy: stateLaneY - stateCenterY },
        { origin: 'target', dx: -20, dy: stateLaneY - policyTargetY },
        { origin: 'target', dx: -20, dy: 0 },
      ],
    },
    'vla-tokens->vla-backbone': { sourceHandle: 'right', targetHandle: 'left' },
    'vla-backbone->vla-object': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-object->vla-policy': { sourceHandle: 'right', targetHandle: 'left' },
    'vla-constraints->vla-policy': {
      sourceHandle: 'bottom', targetHandle: 'top',
      routeWaypoints: [{ origin: 'source', dx: 0, dy: 20 }, { origin: 'target', dx: 0, dy: -20 }],
    },
    'vla-policy->vla-action': { sourceHandle: 'right', targetHandle: 'left' },
    'vla-action->vla-integrator': {
      sourceHandle: 'top', targetHandle: 'bottom',
      routeWaypoints: [{ origin: 'source', dx: 0, dy: -24 }, { origin: 'target', dx: 0, dy: 20 }],
    },
    'vla-integrator->vla-execution': { sourceHandle: 'right', targetHandle: 'left' },
    'vla-execution->vla-trajectory': { sourceHandle: 'bottom', targetHandle: 'top' },
    'vla-execution->vla-rollout-a': {
      sourceHandle: 'left', targetHandle: 'top',
      routeWaypoints: [
        { origin: 'source', dx: -25, dy: 0 },
        { origin: 'target', dx: 40, dy: -20 },
        { origin: 'target', dx: 0, dy: -20 },
      ],
    },
    'vla-rollout-a->vla-rollout-b': { sourceHandle: 'left', targetHandle: 'right' },
    'vla-rollout-b->vla-rollout-c': { sourceHandle: 'left', targetHandle: 'right' },
    'vla-rollout-c->vla-feedback-note': { sourceHandle: 'bottom', targetHandle: 'top' },
  });
  return { nodes, edges, width, height };
}

function worldSingle(options: ScientificSchematicOptions, provenance: ScientificProvenance): PublicationFlagshipBlueprint {
  const palette = paletteFor(options);
  const { nodes, width, height } = root(palette, options, provenance, 'single-column');
  nodes.push(
    stageNode(palette, 'wm-01', [20, 14, 150, 42], 'A  Context', 23),
    stageNode(palette, 'wm-02', [188, 14, 184, 42], 'B  Dynamics', 23),
    stageNode(palette, 'wm-03', [386, 14, 202, 42], 'C  Futures', 23),
    stageNode(palette, 'wm-04', [606, 14, 144, 42], 'D  Act', 22),
    sectionPanel(palette, 'wm-panel-rollouts', [380, 72, 208, 484], 'coral'),
    imageNode(palette, {
      id: 'wm-scene', role: 'environment', box: [20, 86, 142, 110], label: 'oₜ',
      imageUrl: worldCurrent, sourceRef: 'world-observed-print.jpg', promptRef: WORLD_PROMPT_REF,
      fontSize: 18,
    }),
    moduleNode(palette, { id: 'wm-goal', role: 'modality', box: [20, 216, 142, 54], label: 'Goal g', tone: 'amber', fontSize: 19 }),
    moduleNode(palette, { id: 'wm-encode', role: 'token', kind: 'scientific-feature-map', box: [184, 86, 102, 90], label: 'Encode', tone: 'blue', fontSize: 18 }),
    moduleNode(palette, { id: 'wm-latent', role: 'token', kind: 'scientific-embedding-space', box: [290, 156, 82, 90], label: 'Belief bₜ', tone: 'neutral', fontSize: 18 }),
    moduleNode(palette, {
      id: 'wm-actions', role: 'action', kind: 'scientific-action-chunk', box: [396, 76, 184, 72],
      label: 'K actions', description: 'K × aₜ:ₜ₊H', tone: 'blue', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'wm-model', role: 'backbone', kind: 'scientific-transformer', box: [396, 156, 184, 100],
      label: 'World model', description: 'bₜ,aₖ → bₜ₊₁', tone: 'violet', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'wm-rollout', role: 'policy', kind: 'scientific-timeline', box: [396, 264, 184, 82],
      label: 'K rollouts', description: 'fθ(bₜ,aₖ)', tone: 'neutral', fontSize: 18,
    }),
    imageNode(palette, {
      id: 'wm-rollout-safe', role: 'environment', box: [390, 354, 58, 64], label: 'S',
      imageUrl: worldSuccess, sourceRef: 'world-success-print.jpg', promptRef: WORLD_PROMPT_REF,
      fontSize: 16,
    }),
    imageNode(palette, {
      id: 'wm-rollout-contact', role: 'environment', box: [456, 354, 58, 64], label: 'C',
      imageUrl: worldCollision, sourceRef: 'world-collision-print.jpg', promptRef: WORLD_PROMPT_REF, fontSize: 16,
    }),
    imageNode(palette, {
      id: 'wm-rollout-uncertain', role: 'environment', box: [522, 354, 58, 64], label: 'O',
      imageUrl: worldUncertain, sourceRef: 'world-occluded-print.jpg', promptRef: WORLD_PROMPT_REF, fontSize: 16,
    }),
    moduleNode(palette, {
      id: 'wm-score', role: 'policy', kind: 'scientific-decision-gate', box: [394, 438, 186, 112],
      label: 'argminₖ Jₖ', description: 'J: .18 · 1.42 · .86', tone: 'coral', fontSize: 18,
    }),
    moduleNode(palette, { id: 'wm-action', role: 'action', kind: 'scientific-action-chunk', box: [606, 86, 144, 70], label: 'aₜ = aₖ*', tone: 'green', fontSize: 18 }),
    imageNode(palette, {
      id: 'wm-execute', role: 'environment', box: [606, 180, 144, 92], label: 'oₜ₊₁',
      imageUrl: worldSuccess, sourceRef: 'world-success-print.jpg', promptRef: WORLD_PROMPT_REF, fontSize: 18,
    }),
    moduleNode(palette, { id: 'wm-residual', role: 'loss', box: [606, 294, 144, 52], label: 'rₜ', tone: 'coral', fontSize: 18 }),
    moduleNode(palette, { id: 'wm-update', role: 'token', kind: 'scientific-feature-map', box: [606, 370, 144, 66], label: 'Belief bₜ₊₁', tone: 'blue', fontSize: 17 }),
    makeCaption(palette, 'wm-outcome-key', [20, 402, 340, 40], 'S safe · C hit · O hidden', 14, undefined, 'left'),
  );
  const edges = contractEdges(palette, WORLD_EDGE_CONTRACT, {
    'wm-scene->wm-encode': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 10, dy: 0 }, { origin: 'target', dx: -12, dy: 0 }],
    },
    'wm-goal->wm-actions': {
      sourceHandle: 'left', targetHandle: 'top',
      routeWaypoints: [
        { origin: 'source', dx: -10, dy: 0 },
        { origin: 'source', dx: -10, dy: -175 },
        { origin: 'target', dx: 0, dy: -8 },
      ],
    },
    'wm-encode->wm-latent': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 2, dy: 0 }, { origin: 'target', dx: -2, dy: 0 }],
    },
    'wm-latent->wm-model': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: 0 },
      routeWaypoints: [{ origin: 'source', dx: 14, dy: 0 }, { origin: 'target', dx: -10, dy: 0 }],
    },
    'wm-actions->wm-model': {
      sourceHandle: 'bottom', targetHandle: 'top',
    },
    'wm-model->wm-rollout': {
      sourceHandle: 'bottom', targetHandle: 'top',
    },
    'wm-rollout->wm-rollout-safe': { sourceHandle: 'bottom', targetHandle: 'top', sourceAnchorOffset: { dx: -69, dy: 0 } },
    'wm-rollout->wm-rollout-contact': { sourceHandle: 'bottom', targetHandle: 'top', sourceAnchorOffset: { dx: -3, dy: 0 } },
    'wm-rollout->wm-rollout-uncertain': { sourceHandle: 'bottom', targetHandle: 'top', sourceAnchorOffset: { dx: 63, dy: 0 } },
    'wm-rollout-safe->wm-score': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: -68, dy: 0 } },
    'wm-rollout-contact->wm-score': { sourceHandle: 'bottom', targetHandle: 'top' },
    'wm-rollout-uncertain->wm-score': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: 64, dy: 0 } },
    'wm-score->wm-action': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 16, dy: 0 }, { origin: 'target', dx: -10, dy: 0 }],
    },
    'wm-action->wm-execute': { sourceHandle: 'bottom', targetHandle: 'top' },
    'wm-execute->wm-residual': { sourceHandle: 'bottom', targetHandle: 'top' },
    'wm-residual->wm-update': { sourceHandle: 'bottom', targetHandle: 'top' },
  });
  return { nodes, edges, width, height };
}

function worldWide(
  options: ScientificSchematicOptions,
  provenance: ScientificProvenance,
  layout: Extract<ScientificSchematicLayout, 'double-column' | 'presentation'>,
): PublicationFlagshipBlueprint {
  const palette = paletteFor(options);
  const { nodes, width, height } = root(palette, options, provenance, layout);
  const m = wideMetrics(layout);
  const y = m.contentY;
  const tall = layout === 'double-column';
  const futureHeight = tall ? 132 : 108;
  const modelOffset = tall ? 158 : 144;
  const futureOffset = tall ? 370 : 324;
  const selectorOffset = tall ? 540 : 464;
  const executeOffset = tall ? 142 : 124;
  const residualOffset = tall ? 342 : 292;
  const updateOffset = tall ? 438 : 366;
  const updateHeight = tall ? 92 : 104;
  nodes.push(
    stageNode(palette, 'wm-01', [40, m.stageY, 250, 56], 'A  Context', m.stageSize),
    stageNode(palette, 'wm-02', [330, m.stageY, 390, 56], 'B  Dynamics', m.stageSize),
    stageNode(palette, 'wm-03', [740, m.stageY, 610, 56], 'C  Futures', m.stageSize),
    stageNode(palette, 'wm-04', [1370, m.stageY, 250, 56], 'D  Act', m.stageSize),
    sectionPanel(palette, 'wm-panel-rollouts', [680, y - 22, 670, tall ? 710 : 640], 'coral'),
    imageNode(palette, {
      id: 'wm-scene', role: 'environment', box: [50, y + (tall ? 120 : 100), 240, tall ? 176 : 154], label: 'oₜ',
      imageUrl: worldCurrent, sourceRef: 'world-observed-print.jpg', promptRef: WORLD_PROMPT_REF, fontSize: 23,
    }),
    moduleNode(palette, { id: 'wm-goal', role: 'modality', box: [50, y, 240, tall ? 78 : 70], label: 'Goal g', tone: 'amber', fontSize: 25 }),
    moduleNode(palette, { id: 'wm-encode', role: 'token', kind: 'scientific-feature-map', box: [340, y + (tall ? 120 : 100), 140, tall ? 128 : 112], label: 'Encode', tone: 'blue', fontSize: 24 }),
    moduleNode(palette, { id: 'wm-latent', role: 'token', kind: 'scientific-embedding-space', box: [510, y + (tall ? 120 : 100), 150, tall ? 128 : 112], label: 'Belief bₜ', tone: 'neutral', fontSize: 25 }),
    moduleNode(palette, {
      id: 'wm-actions', role: 'action', kind: 'scientific-action-chunk', box: [700, y, 230, tall ? 132 : 140],
      label: 'K actions', description: 'aₜ:ₜ₊H, k=1…K', tone: 'blue', fontSize: tall ? 25 : 23,
    }),
    moduleNode(palette, {
      id: 'wm-model', role: 'backbone', kind: 'scientific-transformer', box: [700, y + modelOffset, 230, tall ? 190 : 186],
      label: options.backbone, description: 'p(bₜ₊₁ | bₜ, aₖ)', tone: 'violet', fontSize: 23,
    }),
    moduleNode(palette, {
      id: 'wm-rollout', role: 'policy', kind: 'scientific-timeline', box: [960, y + modelOffset, 360, tall ? 190 : 174],
      label: 'Conditioned rollouts', description: 'fθ(bₜ, aₖ)', tone: 'neutral', fontSize: 26,
    }),
    imageNode(palette, {
      id: 'wm-rollout-safe', role: 'environment', box: [930, y + futureOffset, 125, futureHeight], label: 'S',
      imageUrl: worldSuccess, sourceRef: 'world-success-print.jpg', promptRef: WORLD_PROMPT_REF,
    }),
    imageNode(palette, {
      id: 'wm-rollout-contact', role: 'environment', box: [1065, y + futureOffset, 125, futureHeight], label: 'C',
      imageUrl: worldCollision, sourceRef: 'world-collision-print.jpg', promptRef: WORLD_PROMPT_REF,
    }),
    imageNode(palette, {
      id: 'wm-rollout-uncertain', role: 'environment', box: [1200, y + futureOffset, 125, futureHeight], label: 'O',
      imageUrl: worldUncertain, sourceRef: 'world-occluded-print.jpg', promptRef: WORLD_PROMPT_REF,
    }),
    moduleNode(palette, {
      id: 'wm-score', role: 'policy', kind: 'scientific-decision-gate', box: [930, y + selectorOffset, 400, tall ? 126 : 138],
      label: 'k* = argminₖ Jₖ', description: 'J: .18 · 1.42 · .86', tone: 'coral', fontSize: tall ? 27 : 24,
    }),
    moduleNode(palette, { id: 'wm-action', role: 'action', kind: 'scientific-action-chunk', box: [1380, y, 240, tall ? 88 : 78], label: 'aₜ = aₖ*', tone: 'green', fontSize: 26 }),
    imageNode(palette, {
      id: 'wm-execute', role: 'environment', box: [1380, y + executeOffset, 240, tall ? 150 : 132], label: 'oₜ₊₁',
      imageUrl: worldSuccess, sourceRef: 'world-success-print.jpg', promptRef: WORLD_PROMPT_REF, fontSize: 22,
    }),
    moduleNode(palette, { id: 'wm-residual', role: 'loss', box: [1380, y + residualOffset, 240, tall ? 72 : 64], label: 'Residual rₜ', tone: 'coral', fontSize: 23 }),
    moduleNode(palette, { id: 'wm-update', role: 'token', kind: 'scientific-feature-map', box: [1380, y + updateOffset, 240, updateHeight], label: 'Belief bₜ₊₁', tone: 'blue', fontSize: 23 }),
    makeCaption(palette, 'wm-outcome-key', [700, y + (tall ? 735 : 646), 620, 48], 'S safe · C contact · O occluded', 24, undefined, 'center'),
  );
  const edges = contractEdges(palette, WORLD_EDGE_CONTRACT, {
    'wm-scene->wm-encode': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 40, dy: 0 }, { origin: 'target', dx: -10, dy: 0 }],
    },
    'wm-goal->wm-actions': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [
        { origin: 'source', dx: 20, dy: 0 },
        { origin: 'target', dx: -20, dy: -(tall ? 27 : 35) },
        { origin: 'target', dx: -20, dy: 0 },
      ],
    },
    'wm-encode->wm-latent': { sourceHandle: 'right', targetHandle: 'left' },
    'wm-latent->wm-model': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 12, dy: 0 }, { origin: 'target', dx: -28, dy: 0 }],
    },
    'wm-actions->wm-model': { sourceHandle: 'bottom', targetHandle: 'top' },
    'wm-model->wm-rollout': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 15, dy: 0 }, { origin: 'target', dx: -15, dy: 0 }],
    },
    'wm-rollout->wm-rollout-safe': { sourceHandle: 'bottom', targetHandle: 'top', sourceAnchorOffset: { dx: -148, dy: 0 } },
    'wm-rollout->wm-rollout-contact': { sourceHandle: 'bottom', targetHandle: 'top', sourceAnchorOffset: { dx: -12, dy: 0 } },
    'wm-rollout->wm-rollout-uncertain': { sourceHandle: 'bottom', targetHandle: 'top', sourceAnchorOffset: { dx: 123, dy: 0 } },
    'wm-rollout-safe->wm-score': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: -138, dy: 0 } },
    'wm-rollout-contact->wm-score': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: -2, dy: 0 } },
    'wm-rollout-uncertain->wm-score': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: 133, dy: 0 } },
    'wm-score->wm-action': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 25, dy: 0 }, { origin: 'target', dx: -25, dy: 0 }],
    },
    'wm-action->wm-execute': { sourceHandle: 'bottom', targetHandle: 'top' },
    'wm-execute->wm-residual': { sourceHandle: 'bottom', targetHandle: 'top' },
    'wm-residual->wm-update': { sourceHandle: 'bottom', targetHandle: 'top' },
  });
  return { nodes, edges, width, height };
}

function llmSingle(options: ScientificSchematicOptions, provenance: ScientificProvenance): PublicationFlagshipBlueprint {
  const palette = paletteFor(options);
  const { nodes, width, height } = root(palette, options, provenance, 'single-column');
  nodes.push(
    stageNode(palette, 'llm-01', [20, 14, 126, 42], 'A  Seed', 23),
    stageNode(palette, 'llm-02', [166, 14, 170, 42], 'B  SFT', 23),
    stageNode(palette, 'llm-03', [354, 14, 270, 42], 'C  DPO alignment', 23),
    stageNode(palette, 'llm-04', [636, 14, 114, 42], 'D  Verify', 22),
    sectionPanel(palette, 'llm-panel-align', [348, 66, 270, 286], 'coral'),
    moduleNode(palette, {
      id: 'llm-base', role: 'backbone', kind: 'scientific-frozen', box: [20, 78, 130, 110],
      label: options.backbone, description: 'θ₀', tone: 'violet', fontSize: 19,
    }),
    moduleNode(palette, { id: 'llm-data', role: 'dataset', kind: 'scientific-dataset-stack', box: [170, 78, 120, 72], label: 'SFT data', tone: 'amber', fontSize: 19 }),
    moduleNode(palette, { id: 'llm-sft', role: 'policy', kind: 'scientific-trainable', box: [170, 174, 120, 78], label: 'SFT πref', tone: 'blue', fontSize: 19 }),
    moduleNode(palette, { id: 'llm-prompt', role: 'token', kind: 'scientific-prompt-card', box: [366, 92, 58, 76], label: 'x', tone: 'blue', fontSize: 19 }),
    moduleNode(palette, {
      id: 'llm-pair', role: 'token', kind: 'scientific-preference-pair', box: [444, 92, 160, 76],
      label: 'y⁺ preferred', description: 'y⁻ rejected', tone: 'green', fontSize: 18,
    }),
    moduleNode(palette, {
      id: 'llm-objective', role: 'loss', kind: 'scientific-equation', box: [356, 190, 258, 140],
      label: 'DPO loss', description: 'rθ=log(πθ/πref)\nL=−log σ(β Δrθ)',
      tone: 'coral', fontSize: 18, borderWidth: 2.7,
    }),
    moduleNode(palette, {
      id: 'llm-policy', role: 'backbone', kind: 'scientific-trainable', box: [630, 78, 124, 92],
      label: 'Aligned θ*', tone: 'green', fontSize: 19,
    }),
    moduleNode(palette, { id: 'llm-suite', role: 'token', kind: 'scientific-metric-panel', box: [630, 188, 124, 64], label: 'Eval suite', tone: 'neutral', fontSize: 18 }),
    moduleNode(palette, { id: 'llm-gate', role: 'policy', kind: 'scientific-release-gate', box: [630, 270, 124, 68], label: 'Release gate', tone: 'green', fontSize: 18 }),
    stageNode(palette, 'llm-05', [20, 366, 210, 42], 'E  Optional PPO', 20),
    sectionPanel(palette, 'llm-baseline-panel', [145, 414, 475, 106], 'violet'),
    moduleNode(palette, { id: 'llm-rollout', role: 'policy', box: [160, 448, 140, 64], label: 'Samples τ', tone: 'blue', fontSize: 19 }),
    moduleNode(palette, { id: 'llm-rm', role: 'loss', box: [320, 448, 140, 64], label: 'Reward rφ', tone: 'coral', fontSize: 19 }),
    moduleNode(palette, { id: 'llm-ppo', role: 'policy', box: [480, 448, 140, 64], label: 'PPO θ', tone: 'violet', fontSize: 19 }),
  );
  const edges = contractEdges(palette, LLM_EDGE_CONTRACT, {
    'llm-base->llm-sft': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 10, dy: 0 }, { origin: 'target', dx: -10, dy: 0 }],
    },
    'llm-data->llm-sft': { sourceHandle: 'bottom', targetHandle: 'top' },
    'llm-sft->llm-objective': { sourceHandle: 'right', targetHandle: 'left' },
    'llm-prompt->llm-pair': { sourceHandle: 'right', targetHandle: 'left' },
    'llm-pair->llm-objective': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: 36, dy: 0 } },
    'llm-objective->llm-policy': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: -18 },
      routeWaypoints: [{ origin: 'source', dx: 6, dy: 0 }, { origin: 'target', dx: -10, dy: 0 }],
    },
    'llm-policy->llm-suite': { sourceHandle: 'bottom', targetHandle: 'top' },
    'llm-policy->llm-gate': {
      sourceHandle: 'right', targetHandle: 'right',
      routeWaypoints: [{ origin: 'source', dx: 2, dy: 0 }, { origin: 'target', dx: 2, dy: 0 }],
    },
    'llm-suite->llm-gate': { sourceHandle: 'bottom', targetHandle: 'top' },
    'llm-sft->llm-rollout': {
      sourceHandle: 'bottom', targetHandle: 'top',
    },
    'llm-rm->llm-ppo': {
      sourceHandle: 'right', targetHandle: 'left',
    },
    'llm-rollout->llm-ppo': {
      sourceHandle: 'bottom', targetHandle: 'bottom', targetAnchorOffset: { dx: -25, dy: 0 },
      routeWaypoints: [{ origin: 'source', dx: 0, dy: 18 }, { origin: 'target', dx: 0, dy: 18 }],
    },
    'llm-ppo->llm-policy': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: 20 },
      routeWaypoints: [
        { origin: 'source', dx: 6, dy: 0 },
        { origin: 'target', dx: -4, dy: 0 },
      ],
    },
  });
  return { nodes, edges, width, height };
}

function llmWide(
  options: ScientificSchematicOptions,
  provenance: ScientificProvenance,
  layout: Extract<ScientificSchematicLayout, 'double-column' | 'presentation'>,
): PublicationFlagshipBlueprint {
  const palette = paletteFor(options);
  const { nodes, width, height } = root(palette, options, provenance, layout);
  const m = wideMetrics(layout);
  const y = m.contentY;
  const tall = layout === 'double-column';
  const baselineY = tall ? 660 : 560;
  nodes.push(
    stageNode(palette, 'llm-01', [40, m.stageY, 250, 56], 'A  Seed', m.stageSize),
    stageNode(palette, 'llm-02', [340, m.stageY, 320, 56], 'B  SFT reference', m.stageSize),
    stageNode(palette, 'llm-03', [700, m.stageY, 580, 56], 'C  Preference alignment', m.stageSize),
    stageNode(palette, 'llm-04', [1320, m.stageY, 300, 56], 'D  Verify', m.stageSize),
    sectionPanel(palette, 'llm-panel-align', [690, y - 22, 590, tall ? 442 : 404], 'coral'),
    moduleNode(palette, {
      id: 'llm-base', role: 'backbone', kind: 'scientific-frozen', box: [50, y + 40, 250, tall ? 160 : 146],
      label: options.backbone, description: 'θ₀', tone: 'violet', fontSize: 30, fontWeight: 680,
    }),
    moduleNode(palette, { id: 'llm-data', role: 'dataset', kind: 'scientific-dataset-stack', box: [360, y, 240, tall ? 116 : 104], label: 'SFT data', tone: 'amber', fontSize: 27 }),
    moduleNode(palette, {
      id: 'llm-sft', role: 'policy', kind: 'scientific-trainable', box: [360, y + (tall ? 174 : 154), 240, tall ? 146 : 150],
      label: 'SFT reference', description: 'πref', tone: 'blue', fontSize: 29, fontWeight: 680,
    }),
    moduleNode(palette, { id: 'llm-prompt', role: 'token', kind: 'scientific-prompt-card', box: [730, y + 20, 100, tall ? 116 : 104], label: 'x', tone: 'blue', fontSize: 24 }),
    moduleNode(palette, {
      id: 'llm-pair', role: 'token', kind: 'scientific-preference-pair', box: [860, y + 20, 370, tall ? 116 : 104],
      label: 'y⁺ preferred', description: 'y⁻ rejected', tone: 'green', fontSize: 27,
    }),
    moduleNode(palette, {
      id: 'llm-objective', role: 'loss', kind: 'scientific-equation', box: [760, y + (tall ? 186 : 166), 440, tall ? 178 : 162],
      label: 'DPO loss', description: 'rθ=log(πθ/πref)\nL=−log σ(β Δrθ)',
      tone: 'coral', fontSize: 29, fontWeight: 700, borderWidth: 3.1,
    }),
    moduleNode(palette, {
      id: 'llm-policy', role: 'backbone', kind: 'scientific-trainable', box: [1320, y + 40, tall ? 260 : 280, 140],
      label: 'Aligned policy θ*', tone: 'green', fontSize: 29, fontWeight: 680,
    }),
    moduleNode(palette, { id: 'llm-suite', role: 'token', kind: 'scientific-metric-panel', box: [1310, y + (tall ? 230 : 208), 130, tall ? 136 : 130], label: 'Eval suite', tone: 'blue', fontSize: 24 }),
    moduleNode(palette, { id: 'llm-gate', role: 'policy', kind: 'scientific-release-gate', box: [1460, y + (tall ? 230 : 208), 140, tall ? 136 : 130], label: 'Release gate', tone: 'green', fontSize: 24 }),
    stageNode(palette, 'llm-05', [40, baselineY + 18, 340, 50], 'E  Optional PPO', 23),
    sectionPanel(palette, 'llm-baseline-panel', [430, baselineY, 870, 124], 'violet'),
    moduleNode(palette, { id: 'llm-rollout', role: 'policy', box: [460, baselineY + 22, 220, 80], label: 'Samples τ', tone: 'blue', fontSize: 22 }),
    moduleNode(palette, { id: 'llm-rm', role: 'loss', box: [760, baselineY + 22, 210, 80], label: 'Reward rφ', tone: 'coral', fontSize: 22 }),
    moduleNode(palette, { id: 'llm-ppo', role: 'policy', box: [1060, baselineY + 22, 220, 80], label: 'PPO θ', tone: 'violet', fontSize: 22 }),
  );
  const edges = contractEdges(palette, LLM_EDGE_CONTRACT, {
    'llm-base->llm-sft': {
      sourceHandle: 'right', targetHandle: 'left',
      routeWaypoints: [{ origin: 'source', dx: 20, dy: 0 }, { origin: 'target', dx: -20, dy: 0 }],
    },
    'llm-data->llm-sft': { sourceHandle: 'bottom', targetHandle: 'top' },
    'llm-sft->llm-objective': { sourceHandle: 'right', targetHandle: 'left' },
    'llm-prompt->llm-pair': { sourceHandle: 'right', targetHandle: 'left' },
    'llm-pair->llm-objective': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: 65, dy: 0 } },
    'llm-objective->llm-policy': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: -20 },
      routeWaypoints: [
        { origin: 'source', dx: 45, dy: 0 },
        { origin: 'target', dx: -30, dy: 0 },
      ],
    },
    'llm-policy->llm-suite': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: 60, dy: 0 } },
    'llm-policy->llm-gate': { sourceHandle: 'bottom', targetHandle: 'top', targetAnchorOffset: { dx: -30, dy: 0 } },
    'llm-suite->llm-gate': { sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: 28 } },
    'llm-sft->llm-rollout': {
      sourceHandle: 'bottom', targetHandle: 'top',
      routeWaypoints: [
        { origin: 'source', dx: 0, dy: 42 },
        { origin: 'target', dx: -90, dy: -18 },
        { origin: 'target', dx: 0, dy: -18 },
      ],
    },
    'llm-rm->llm-ppo': {
      sourceHandle: 'right', targetHandle: 'left',
    },
    'llm-rollout->llm-ppo': {
      sourceHandle: 'bottom', targetHandle: 'bottom', targetAnchorOffset: { dx: -35, dy: 0 },
      routeWaypoints: [{ origin: 'source', dx: 0, dy: 18 }, { origin: 'target', dx: 0, dy: 18 }],
    },
    'llm-ppo->llm-policy': {
      sourceHandle: 'right', targetHandle: 'left', targetAnchorOffset: { dx: 0, dy: 30 },
      routeWaypoints: [
        { origin: 'source', dx: 20, dy: 0 },
        { origin: 'target', dx: -15, dy: 0 },
      ],
    },
  });
  return { nodes, edges, width, height };
}

export function buildTopVenueFlagship(
  options: ScientificSchematicOptions,
  provenance: ScientificProvenance,
  layout: ScientificSchematicLayout,
): PublicationFlagshipBlueprint | undefined {
  if (layout === 'freeform') return buildPreviousFlagship(options, provenance, layout);
  if (options.templateId === 'vla-policy') {
    return layout === 'single-column'
      ? vlaSingle(options, provenance)
      : vlaWide(options, provenance, layout);
  }
  if (options.templateId === 'world-model-rollout') {
    return layout === 'single-column'
      ? worldSingle(options, provenance)
      : worldWide(options, provenance, layout);
  }
  if (options.templateId === 'llm-training-pipeline') {
    return layout === 'single-column'
      ? llmSingle(options, provenance)
      : llmWide(options, provenance, layout);
  }
  return buildPreviousFlagship(options, provenance, layout);
}
