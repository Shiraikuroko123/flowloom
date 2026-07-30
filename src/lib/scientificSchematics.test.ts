import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ScientificSchematicOptions } from '../types';
import { estimateSvgTextWidth } from './diagram';
import {
  DEFAULT_SCIENTIFIC_SCHEMATIC_OPTIONS,
  SCIENTIFIC_SCHEMATIC_TEMPLATES,
  createScientificSchematic,
  defaultScientificSchematicBackbone,
} from './scientificSchematics';
import { serializePublicationSvg } from './scientificExport';
import { parseEditableSvg } from './svgImport';
import {
  layoutScientificNodeContent,
  layoutSchematicNodeContent,
  scientificNodeTextMaxWidth,
} from './scientificNodeLayout';
import {
  ARXIV_FIGURE_CORPUS_SUMMARY,
  SCIENTIFIC_FIGURE_RECIPES,
} from './scientificFigureRecipes';
import { getShapeDefinition } from './shapeRegistry';
import { auditScientificFigure, createScientificFigureLayout, mmToPx, scientificUnitsToPoints } from './scientific';
import type { ScientificFigureSpec } from '../types';

function options(overrides: Partial<ScientificSchematicOptions> = {}): ScientificSchematicOptions {
  return { ...DEFAULT_SCIENTIFIC_SCHEMATIC_OPTIONS, ...overrides };
}

function hasDirectedPath(edges: Array<{ source: string; target: string }>, source: string, target: string): boolean {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  const queue = [source];
  const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...(outgoing.get(current) ?? []));
  }
  return false;
}

describe('scientific schematic templates', () => {
  it('builds every research-paper template as a connected editable graph', () => {
    for (const template of SCIENTIFIC_SCHEMATIC_TEMPLATES) {
      const schematic = createScientificSchematic(options({ templateId: template.id }));
      const ids = new Set(schematic.nodes.map((node) => node.id));
      const root = schematic.nodes.find((node) => node.data.scientificRole === 'schematic-root');

      expect(schematic.nodes.length, template.id).toBeGreaterThan(10);
      expect(schematic.edges.length, template.id).toBeGreaterThan(7);
      expect(ids.size, template.id).toBe(schematic.nodes.length);
      expect(root?.data.kind, template.id).toBe('group');
      expect(root?.data.provenance?.kind, template.id).toBe('scientific-schematic');
      expect(root?.data.provenance?.schematic?.references?.length, template.id).toBeGreaterThan(0);
      expect(schematic.edges.every((edge) => ids.has(edge.source) && ids.has(edge.target)), template.id).toBe(true);
      expect(schematic.nodes.every((node) => node.selected === false), template.id).toBe(true);
    }
  });

  it('ships an evidence-backed drawing recipe for every schematic template', () => {
    const corpus = JSON.parse(readFileSync('docs/research/arxiv-figure-corpus.json', 'utf8')) as {
      domains: {
        llm: { summary: { representativeComposition: Record<string, number> } };
        embodied: { summary: { representativeComposition: Record<string, number>; representativeElements: Record<string, number> } };
      };
    };
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.paperCount).toBe(100);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.parsedFigureCount).toBe(1289);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.llmFigureCount).toBe(656);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.embodiedFigureCount).toBe(633);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.representativePatterns.llm.trainingPipeline)
      .toBe(corpus.domains.llm.summary.representativeComposition['training-pipeline']);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.representativePatterns.embodied.trainingPipeline)
      .toBe(corpus.domains.embodied.summary.representativeComposition['training-pipeline']);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.representativePatterns.embodied.robotEmbodiment)
      .toBe(corpus.domains.embodied.summary.representativeElements['robot-embodiment']);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.representativePatterns.embodied.actionTrajectory)
      .toBe(corpus.domains.embodied.summary.representativeElements['action-trajectory']);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.representativePatterns.embodied.imageStrip)
      .toBe(corpus.domains.embodied.summary.representativeElements['image-strip']);

    for (const template of SCIENTIFIC_SCHEMATIC_TEMPLATES) {
      const recipe = SCIENTIFIC_FIGURE_RECIPES[template.id];
      expect(recipe.templateId).toBe(template.id);
      expect(recipe.zones.length, template.id).toBeGreaterThanOrEqual(4);
      expect(recipe.elements.length, template.id).toBeGreaterThanOrEqual(4);
      expect(recipe.steps.length, template.id).toBeGreaterThanOrEqual(6);
      expect(recipe.arrowRules.length, template.id).toBeGreaterThanOrEqual(1);
      expect(recipe.colorRules.length, template.id).toBeGreaterThanOrEqual(1);
      expect(recipe.checks.length, template.id).toBeGreaterThanOrEqual(4);
      recipe.elements.forEach((element) => expect(getShapeDefinition(element.kind).kind).toBe(element.kind));
    }
  });

  it('uses native scientific pictograms in every corpus-derived template', () => {
    const corpusDerivedIds = [
      'llm-training-pipeline',
      'moe-routing',
      'rag-tool-agent',
      'reasoning-trace',
      'robot-data-collection',
      'world-model-rollout',
      'sim-to-real',
      'multi-embodiment-policy',
    ] as const;

    for (const templateId of corpusDerivedIds) {
      const schematic = createScientificSchematic(options({ templateId, density: 'detailed' }));
      expect(schematic.nodes.some((node) => node.data.kind.startsWith('scientific-')), templateId).toBe(true);
    }
  });

  it('keeps foreground modules inside the declared canvas', () => {
    for (const template of SCIENTIFIC_SCHEMATIC_TEMPLATES) {
      const schematic = createScientificSchematic(options({ templateId: template.id, density: 'detailed' }));
      const foreground = schematic.nodes.filter((node) => !['frame', 'phase'].includes(node.data.schematicRole ?? ''));
      for (const node of foreground) {
        const width = Number(node.style?.width ?? 0);
        const height = Number(node.style?.height ?? 0);
        expect(node.position.x, node.id).toBeGreaterThanOrEqual(0);
        expect(node.position.y, node.id).toBeGreaterThanOrEqual(0);
        expect(node.position.x + width, node.id).toBeLessThanOrEqual(schematic.width);
        expect(node.position.y + height, node.id).toBeLessThanOrEqual(schematic.height);
      }
    }
  });

  it('changes density without removing the core computation path', () => {
    const compact = createScientificSchematic(options({ density: 'compact' }));
    const detailed = createScientificSchematic(options({ density: 'detailed' }));

    expect(detailed.nodes.length).toBeGreaterThan(compact.nodes.length);
    expect(detailed.edges.length).toBeGreaterThanOrEqual(compact.edges.length);
    expect(compact.nodes.some((node) => node.data.schematicRole === 'backbone')).toBe(true);
    expect(compact.nodes.some((node) => node.data.schematicRole === 'action')).toBe(true);
    expect(compact.nodes.some((node) => node.data.schematicRole === 'environment')).toBe(true);
  });

  it('supports Chinese labels and a print-friendly monochrome palette', () => {
    const schematic = createScientificSchematic(options({
      templateId: 'embodied-loop',
      language: 'zh',
      style: 'monochrome',
      title: '',
    }));

    expect(schematic.title).toContain('具身智能');
    expect(schematic.nodes.some((node) => node.data.label.includes('世界模型'))).toBe(true);
    expect(schematic.nodes.every((node) => /^#[0-9A-F]{6}$/i.test(node.data.fill))).toBe(true);
    expect(schematic.edges.some((edge) => edge.data?.lineStyle === 'dashed')).toBe(true);
  });

  it('resolves template-specific backbone defaults and preserves custom names', () => {
    expect(defaultScientificSchematicBackbone('vla-policy', 'en')).toBe('VLM Backbone');
    expect(defaultScientificSchematicBackbone('world-model-rollout', 'en')).toBe('Latent World Model');
    expect(defaultScientificSchematicBackbone('llm-training-pipeline', 'en')).toBe('Base Model');

    for (const templateId of ['vla-policy', 'world-model-rollout', 'llm-training-pipeline'] as const) {
      const expected = defaultScientificSchematicBackbone(templateId, 'en');
      const schematic = createScientificSchematic(options({ templateId }));
      expect(schematic.nodes.some((node) => node.data.label === expected), templateId).toBe(true);
    }

    for (const template of SCIENTIFIC_SCHEMATIC_TEMPLATES) {
      const expected = defaultScientificSchematicBackbone(template.id, 'en');
      const schematic = createScientificSchematic(options({ templateId: template.id }));
      const root = schematic.nodes.find((node) => node.data.scientificRole === 'schematic-root');
      expect(root?.data.provenance?.schematic?.backbone, template.id).toBe(expected);
    }

    const custom = createScientificSchematic(options({
      templateId: 'world-model-rollout',
      backbone: 'Custom Dynamics Backbone',
    }));
    const root = custom.nodes.find((node) => node.data.scientificRole === 'schematic-root');
    expect(root?.data.provenance?.schematic?.backbone).toBe('Custom Dynamics Backbone');
    expect(custom.nodes.some((node) => node.data.label === 'Custom Dynamics Backbone')).toBe(true);
  });

  it('reflows flagship figures for physical single-column, double-column, and presentation formats', () => {
    const templates = ['vla-policy', 'world-model-rollout', 'llm-training-pipeline'] as const;
    const splitLabelWords: string[] = [];
    const truncatedText: string[] = [];
    const auditBlockers: string[] = [];
    const textOverflows: string[] = [];
    const pictogramOverlaps: string[] = [];
    const formats: Array<{ expected: 'single-column' | 'double-column' | 'presentation'; spec: ScientificFigureSpec }> = [
      {
        expected: 'single-column',
        spec: { widthMm: 89, heightMm: 70, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-28T00:00:00.000Z' },
      },
      {
        expected: 'double-column',
        spec: { widthMm: 180, heightMm: 120, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-28T00:00:00.000Z' },
      },
      {
        expected: 'presentation',
        spec: { widthMm: 180, heightMm: 101.25, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-28T00:00:00.000Z' },
      },
    ];

    for (const templateId of templates) {
      for (const format of formats) {
        const schematic = createScientificSchematic(options({ templateId, density: 'detailed' }), format.spec);
        expect(schematic.layout, `${templateId}:${format.expected}`).toBe(format.expected);
        expect(schematic.width, `${templateId}:${format.expected}`).toBeLessThanOrEqual(mmToPx(format.spec.widthMm - format.spec.marginMm * 2) + 0.01);
        expect(schematic.height, `${templateId}:${format.expected}`).toBeLessThanOrEqual(mmToPx(format.spec.heightMm - format.spec.marginMm * 2) + 0.01);
        const minimumLabelPoints = Math.min(...schematic.nodes
          .filter((node) => node.data.label.trim() && node.data.schematicRole !== 'annotation')
          .map((node) => scientificUnitsToPoints(node.data.fontSize)));
        expect(minimumLabelPoints, `${templateId}:${format.expected}`).toBeGreaterThanOrEqual(format.expected === 'presentation' ? 11 : 7);
        expect(schematic.nodes
          .filter((node) => node.data.schematicRole === 'frame' || node.data.schematicRole === 'phase')
          .every((node) => node.data.textAlign === 'left'), `${templateId}:${format.expected}:frame-alignment`).toBe(true);

        for (const node of schematic.nodes.filter((candidate) => (
          candidate.data.label.trim()
          && candidate.data.kind !== 'image'
          && !['frame'].includes(candidate.data.schematicRole ?? '')
        ))) {
          const width = Number(node.style?.width ?? 0);
          const height = Number(node.style?.height ?? 0);
          const content = node.data.kind.startsWith('scientific-')
            ? layoutScientificNodeContent(node.data, width, height)
            : layoutSchematicNodeContent(node.data, width, height);
          if (content.labelLines.some((line) => line.endsWith('...'))) {
            truncatedText.push(`${templateId}:${format.expected}:${node.id}:label`);
          }
          if (content.descriptionLines.some((line) => line.endsWith('...'))) {
            truncatedText.push(`${templateId}:${format.expected}:${node.id}:description`);
          }
          for (const [field, value, lines] of [
            ['label', node.data.label, content.labelLines],
            ['description', node.data.description ?? '', content.descriptionLines],
          ] as const) {
            for (const word of value.split(/\s+/).filter((candidate) => candidate.length >= 4)) {
              if (!lines.some((line) => line.includes(word))) {
                splitLabelWords.push(`${templateId}:${format.expected}:${node.id}:${field}:${word}`);
              }
            }
          }
          if (node.data.kind.startsWith('scientific-')) {
            const definition = getShapeDefinition(node.data.kind);
            if (definition.textPlacement === 'footer') {
              const labelTop = content.labelStartY - node.data.fontSize * 0.86;
              if (content.visualHeight > labelTop + 0.01) {
                pictogramOverlaps.push(`${templateId}:${format.expected}:${node.id}`);
              }
            }
          }
          if (node.data.schematicRole !== 'phase') {
            const lastBaseline = content.descriptionLines.length
              ? content.descriptionStartY + (content.descriptionLines.length - 1) * content.descriptionLineHeight
              : content.labelStartY + (content.labelLines.length - 1) * content.labelLineHeight;
            const lastFontSize = content.descriptionLines.length ? content.descriptionFontSize : node.data.fontSize;
            if (lastBaseline + lastFontSize * 0.24 > height + 0.01) {
              textOverflows.push(`${templateId}:${format.expected}:${node.id}`);
            }
          }
        }

        const layout = createScientificFigureLayout(format.spec);
        const origin = {
          x: (mmToPx(format.spec.widthMm) - schematic.width) / 2,
          y: (mmToPx(format.spec.heightMm) - schematic.height) / 2,
        };
        const positioned = schematic.nodes.map((node) => ({
          ...node,
          position: { x: node.position.x + origin.x, y: node.position.y + origin.y },
        }));
        const blockers = auditScientificFigure([...layout.nodes, ...positioned], format.spec, schematic.edges)
          .filter((issue) => issue.severity === 'error');
        const blockerDetails = blockers.map((issue) => ({
          ...issue,
          edges: issue.edgeIds?.map((id) => {
            const edge = schematic.edges.find((candidate) => candidate.id === id);
            const source = edge ? schematic.nodes.find((node) => node.id === edge.source) : undefined;
            const target = edge ? schematic.nodes.find((node) => node.id === edge.target) : undefined;
            return edge
              ? `${edge.source}[${edge.sourceHandle ?? 'auto'}] ${source?.position.y}+${source?.style?.height}->${edge.target}[${edge.targetHandle ?? 'auto'}] ${target?.position.y}+${target?.style?.height} (${edge.data?.routing ?? 'smart'})`
              : id;
          }),
        }));
        auditBlockers.push(...blockerDetails.map((issue) => `${templateId}:${format.expected}:${JSON.stringify(issue)}`));
      }
    }
    expect({ truncatedText, splitLabelWords, textOverflows, pictogramOverlaps, auditBlockers }).toEqual({
      truncatedText: [],
      splitLabelWords: [],
      textOverflows: [],
      pictogramOverlaps: [],
      auditBlockers: [],
    });
  });

  it('preserves the scientific dependency contract in every flagship layout', () => {
    const formats: ScientificFigureSpec[] = [
      { widthMm: 89, heightMm: 70, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-29T00:00:00.000Z' },
      { widthMm: 180, heightMm: 120, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-29T00:00:00.000Z' },
      { widthMm: 180, heightMm: 101.25, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-29T00:00:00.000Z' },
    ];

    for (const figure of formats) {
      const vla = createScientificSchematic(options({ templateId: 'vla-policy', density: 'detailed' }), figure);
      const vlaIds = new Set(vla.nodes.map((node) => node.id));
      for (const id of ['vla-state', 'vla-fusion', 'vla-action-expert', 'vla-decision', 'vla-action-chunk', 'vla-controller', 'vla-reobserve']) {
        expect(vlaIds.has(id), `${vla.layout}:${id}`).toBe(true);
      }
      expect(hasDirectedPath(vla.edges, 'vla-state', 'vla-action-expert'), `${vla.layout}:state-to-policy`).toBe(true);
      expect(hasDirectedPath(vla.edges, 'vla-action-expert', 'vla-decision'), `${vla.layout}:expert-to-risk`).toBe(true);
      expect(hasDirectedPath(vla.edges, 'vla-decision', 'vla-controller'), `${vla.layout}:risk-to-controller`).toBe(true);
      expect(hasDirectedPath(vla.edges, 'vla-controller', 'vla-reobserve'), `${vla.layout}:time-unfolded-rollout`).toBe(true);
      const reobserveFeedback = vla.edges.find((edge) => edge.source === 'vla-reobserve' && edge.target === 'vla-camera-front');
      expect(reobserveFeedback, `${vla.layout}:reobserve-feedback`).toBeDefined();
      expect(reobserveFeedback?.data?.scientificSemantic, `${vla.layout}:reobserve-feedback-semantic`).toBe('feedback');

      const world = createScientificSchematic(options({ templateId: 'world-model-rollout', density: 'detailed' }), figure);
      const worldIds = new Set(world.nodes.map((node) => node.id));
      for (const id of ['wm-context', 'wm-encoder', 'wm-model', 'wm-rollout-a', 'wm-rollout-b', 'wm-rollout-c', 'wm-decision', 'wm-action', 'wm-reobserve', 'wm-error', 'wm-update', 'wm-next-belief', 'wm-baseline']) {
        expect(worldIds.has(id), `${world.layout}:${id}`).toBe(true);
      }
      expect(hasDirectedPath(world.edges, 'wm-context', 'wm-encoder'), `${world.layout}:context-to-encoder`).toBe(true);
      expect(hasDirectedPath(world.edges, 'wm-encoder', 'wm-model'), `${world.layout}:encoder-to-model`).toBe(true);
      for (const id of ['wm-rollout-a', 'wm-rollout-b', 'wm-rollout-c']) {
        expect(hasDirectedPath(world.edges, 'wm-model', id), `${world.layout}:model-to-${id}`).toBe(true);
        expect(hasDirectedPath(world.edges, id, 'wm-decision'), `${world.layout}:${id}-to-decision`).toBe(true);
      }
      expect(hasDirectedPath(world.edges, 'wm-decision', 'wm-action'), `${world.layout}:decision-to-action`).toBe(true);
      expect(hasDirectedPath(world.edges, 'wm-action', 'wm-reobserve'), `${world.layout}:action-to-observation`).toBe(true);
      expect(hasDirectedPath(world.edges, 'wm-reobserve', 'wm-error'), `${world.layout}:observation-to-residual`).toBe(true);
      expect(hasDirectedPath(world.edges, 'wm-error', 'wm-update'), `${world.layout}:residual-to-update`).toBe(true);
      expect(hasDirectedPath(world.edges, 'wm-update', 'wm-next-belief'), `${world.layout}:belief-update-loop`).toBe(true);
      expect(world.edges.some((edge) => edge.source === 'wm-update' && edge.target === 'wm-model'), `${world.layout}:weights-fixed`).toBe(false);
      expect(hasDirectedPath(world.edges, 'wm-baseline', 'wm-action'), `${world.layout}:baseline-isolation`).toBe(false);
      expect(world.edges.filter((edge) => edge.source === 'wm-baseline' || edge.target === 'wm-baseline').every((edge) => edge.data?.lineStyle === 'dotted'), `${world.layout}:baseline-style`).toBe(true);
      const rolloutLabels = ['wm-rollout-a', 'wm-rollout-b', 'wm-rollout-c'].map((id) => world.nodes.find((candidate) => candidate.id === id)?.data.label);
      expect(rolloutLabels, `${world.layout}:concise-rollout-labels`).toEqual(['A', 'B', 'C']);
      const worldCopy = world.nodes.map((node) => `${node.data.label} ${node.data.description ?? ''}`).join(' ').toLowerCase();
      expect(worldCopy, `${world.layout}:goal-cost`).toContain('goal');
      expect(worldCopy, `${world.layout}:contact-cost`).toContain('contact');
      expect(worldCopy, `${world.layout}:epistemic-cost`).toContain('epistemic');
      for (const [source, target] of [['wm-decision', 'wm-action'], ['wm-action', 'wm-reobserve'], ['wm-reobserve', 'wm-error'], ['wm-error', 'wm-update'], ['wm-update', 'wm-next-belief']] as const) {
      expect(world.edges.find((edge) => edge.source === source && edge.target === target)?.data?.lineStyle, `${world.layout}:${source}-${target}-solid`).toBe('solid');
      }
      expect(world.edges.some((edge) => edge.source === 'wm-next-belief' && edge.target === 'wm-encoder'), `${world.layout}:next-cycle-feedback`).toBe(true);
      const rolloutFanout = world.nodes.find((node) => node.id === 'wm-rollout-fanout');
      if (rolloutFanout) expect(rolloutFanout.data.kind, `${world.layout}:broadcast-not-sum`).toBe('on-page-connector');
      expect(world.nodes.find((node) => node.id === 'wm-stage-rollout')?.data.label, `${world.layout}:illustrative-rollouts`).toContain('Illustrative');

      const llm = createScientificSchematic(options({ templateId: 'llm-training-pipeline', density: 'detailed' }), figure);
      const llmIds = new Set(llm.nodes.map((node) => node.id));
      for (const id of ['lt-instruction-data', 'lt-sft-objective', 'lt-sft-model', 'lt-preference-data', 'lt-dpo-objective', 'lt-dpo-checkpoint', 'lt-implicit-reward', 'lt-rlhf-objective', 'lt-reward-model', 'lt-rollout', 'lt-ppo-loop', 'lt-deploy-model', 'lt-release-gate']) {
        expect(llmIds.has(id), `${llm.layout}:${id}`).toBe(true);
      }
      expect(hasDirectedPath(llm.edges, 'lt-instruction-data', 'lt-sft-model'), `${llm.layout}:instructions-to-sft`).toBe(true);
      expect(hasDirectedPath(llm.edges, 'lt-sft-objective', 'lt-sft-model'), `${llm.layout}:objective-to-sft`).toBe(true);
      expect(hasDirectedPath(llm.edges, 'lt-preference-data', 'lt-dpo-objective'), `${llm.layout}:prefs-to-dpo`).toBe(true);
      expect(hasDirectedPath(llm.edges, 'lt-sft-model', 'lt-dpo-objective'), `${llm.layout}:reference-to-dpo`).toBe(true);
      expect(hasDirectedPath(llm.edges, 'lt-dpo-objective', 'lt-dpo-checkpoint'), `${llm.layout}:dpo-optimization`).toBe(true);
      expect(hasDirectedPath(llm.edges, 'lt-dpo-checkpoint', 'lt-deploy-model'), `${llm.layout}:checkpoint-to-deployment`).toBe(true);
      const dpoOptimization = llm.edges.find((edge) => edge.source === 'lt-dpo-objective' && edge.target === 'lt-dpo-checkpoint');
      expect(dpoOptimization?.data?.lineStyle, `${llm.layout}:gradient-style`).toBe('dashed');
      expect(dpoOptimization?.data?.scientificSemantic, `${llm.layout}:gradient-semantic`).toBe('gradient');
      expect(dpoOptimization?.label, `${llm.layout}:optimization-label`).toBe('optimize');
      const freezeCheckpoint = llm.edges.find((edge) => edge.source === 'lt-dpo-checkpoint' && edge.target === 'lt-deploy-model');
      expect(freezeCheckpoint?.data?.lineStyle, `${llm.layout}:checkpoint-style`).toBe('solid');
      expect(freezeCheckpoint?.label, `${llm.layout}:checkpoint-label`).toMatch(/freeze/);
      expect(llm.edges.some((edge) => edge.source === 'lt-implicit-reward' || edge.target === 'lt-implicit-reward'), `${llm.layout}:implicit-reward-annotation`).toBe(false);
      const implicitReward = llm.nodes.find((node) => node.id === 'lt-implicit-reward');
      expect(`${implicitReward?.data.label ?? ''} ${implicitReward?.data.description ?? ''}`, `${llm.layout}:diagnostic-reward`).toMatch(/diagnostic/);
      const baselineIds = new Set(['lt-rlhf-objective', 'lt-reward-model', 'lt-rollout', 'lt-ppo-loop', 'lt-rlhf-checkpoint']);
      const baselineEdges = llm.edges.filter((edge) => baselineIds.has(edge.source) || baselineIds.has(edge.target));
      expect(baselineEdges.length, `${llm.layout}:baseline-edges`).toBeGreaterThan(0);
      expect(baselineEdges.every((edge) => edge.data?.lineStyle === 'dotted'), `${llm.layout}:baseline-style`).toBe(true);
      for (const id of baselineIds) {
        if (llmIds.has(id)) expect(hasDirectedPath(llm.edges, id, 'lt-deploy-model'), `${llm.layout}:${id}-deployment-isolation`).toBe(false);
      }
      if (llm.layout === 'presentation') {
        expect(baselineEdges.every((edge) => baselineIds.has(edge.source) && baselineIds.has(edge.target)), 'presentation:isolated-baseline-inset').toBe(true);
      }

      for (const schematic of [vla, world, llm]) {
        const visibleText = schematic.nodes.map((node) => `${node.data.label} ${node.data.description ?? ''}`).join('\n');
        expect(visibleText, `${schematic.templateId}:${schematic.layout}:math-typography`)
          .not.toMatch(/theta_|r_phi|L_NLL|z_hat|L_pred|\bbeta\b/);
      }
    }
  });

  it('exports phase backgrounds before edges and foreground modules', () => {
    const figure: ScientificFigureSpec = {
      widthMm: 180,
      heightMm: 120,
      dpi: 300,
      rows: 1,
      columns: 1,
      marginMm: 6,
      gapMm: 0,
      panelLabels: false,
      labelStyle: 'uppercase',
      background: 'transparent',
      updatedAt: '2026-07-28T00:00:00.000Z',
    };
    const schematic = createScientificSchematic(options({ templateId: 'vla-policy' }), figure);
    const svg = serializePublicationSvg(schematic.title, schematic.nodes, schematic.edges, figure);
    const phaseIndex = svg.indexOf('data-flowloom-node-id="vla-stage-input"');
    const edgeIndex = svg.indexOf('<defs><marker');
    const foregroundIndex = svg.indexOf('data-flowloom-node-id="vla-camera-front"', edgeIndex);

    expect(phaseIndex).toBeGreaterThan(0);
    expect(edgeIndex).toBeGreaterThan(phaseIndex);
    expect(foregroundIndex).toBeGreaterThan(edgeIndex);
    expect(svg).toContain('2406.09246');
  });

  it('keeps responsive flagship phase headings on whole words in SVG', () => {
    const figure: ScientificFigureSpec = {
      widthMm: 180,
      heightMm: 120,
      dpi: 300,
      rows: 1,
      columns: 1,
      marginMm: 6,
      gapMm: 0,
      panelLabels: false,
      labelStyle: 'uppercase',
      background: '#ffffff',
      updatedAt: '2026-07-28T00:00:00.000Z',
    };
    const schematic = createScientificSchematic(options({ templateId: 'world-model-rollout' }), figure);
    const svg = serializePublicationSvg(schematic.title, schematic.nodes, schematic.edges, figure);
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const heading = document.querySelector('[data-flowloom-node-id="wm-stage-rollout"] text');

    expect(Array.from(heading?.querySelectorAll('tspan') ?? []).map((line) => line.textContent)).toEqual([
      'C Illustrative rollouts',
    ]);
    expect(heading?.hasAttribute('stroke')).toBe(false);
    expect(heading?.hasAttribute('paint-order')).toBe(false);
  });

  it('keeps presentation outcome descriptions on whole words in rendered SVG tspans', () => {
    const figure: ScientificFigureSpec = {
      widthMm: 180,
      heightMm: 101.25,
      dpi: 300,
      rows: 1,
      columns: 1,
      marginMm: 6,
      gapMm: 0,
      panelLabels: false,
      labelStyle: 'uppercase',
      background: '#ffffff',
      updatedAt: '2026-07-28T00:00:00.000Z',
    };
    const schematic = createScientificSchematic(options({ templateId: 'world-model-rollout' }), figure);
    const svg = serializePublicationSvg(schematic.title, schematic.nodes, schematic.edges, figure);
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');

    for (const [nodeId, expected] of [['wm-rollout-b', 'B'], ['wm-rollout-c', 'C']] as const) {
      const group = document.querySelector(`[data-flowloom-node-id="${nodeId}"]`);
      const lines = Array.from(group?.querySelectorAll('text tspan') ?? []).map((line) => line.textContent);
      expect(lines, nodeId).toContain(expected);
    }
  });

  it('keeps concise presentation labels inside the same layout used by SVG export', () => {
    const figure: ScientificFigureSpec = {
      widthMm: 180,
      heightMm: 101.25,
      dpi: 300,
      rows: 1,
      columns: 1,
      marginMm: 6,
      gapMm: 0,
      panelLabels: false,
      labelStyle: 'uppercase',
      background: '#ffffff',
      updatedAt: '2026-07-28T00:00:00.000Z',
    };
    const expectedLabels = {
      'vla-policy': { 'vla-stage-control': 'D  Receding-horizon MPC', 'vla-controller': 'MPC · K=4' },
      'world-model-rollout': { 'wm-stage-rollout': 'C  Illustrative rollouts', 'wm-rollout-c': 'C' },
      'llm-training-pipeline': {
        'lt-stage-method': 'C  CW-DPO',
        'lt-stage-baseline': 'E  RM + PPO baseline',
      },
    } as const;

    for (const templateId of ['vla-policy', 'world-model-rollout', 'llm-training-pipeline'] as const) {
      const schematic = createScientificSchematic(options({ templateId }), figure);
      const svg = serializePublicationSvg(schematic.title, schematic.nodes, schematic.edges, figure);
      const document = new DOMParser().parseFromString(svg, 'image/svg+xml');

      for (const [nodeId, label] of Object.entries(expectedLabels[templateId])) {
        expect(schematic.nodes.find((node) => node.id === nodeId)?.data.label, nodeId).toBe(label);
      }
      for (const phase of schematic.nodes.filter((node) => node.data.schematicRole === 'phase')) {
        const width = Number(phase.style?.width ?? 0);
        const height = Number(phase.style?.height ?? 0);
        const layout = layoutSchematicNodeContent(phase.data, width, height);
        const exportedLines = Array.from(
          document.querySelectorAll(`[data-flowloom-node-id="${phase.id}"] text:first-of-type tspan`),
        ).map((line) => line.textContent ?? '');

        expect(exportedLines, `${templateId}:${phase.id}:parity`).toEqual(layout.labelLines);
        expect(layout.labelLines.length, `${templateId}:${phase.id}:line-count`).toBeLessThanOrEqual(2);
        for (const line of layout.labelLines) {
          expect(
            estimateSvgTextWidth(line, phase.data.fontSize),
            `${templateId}:${phase.id}:${line}`,
          ).toBeLessThanOrEqual(scientificNodeTextMaxWidth(phase.data, width));
        }
      }
    }
  });

  it('keeps flagship comparison and deployment regions visibly separated', () => {
    const singleFigure: ScientificFigureSpec = {
      widthMm: 89,
      heightMm: 70,
      dpi: 300,
      rows: 1,
      columns: 1,
      marginMm: 6,
      gapMm: 0,
      panelLabels: false,
      labelStyle: 'uppercase',
      background: '#ffffff',
      updatedAt: '2026-07-28T00:00:00.000Z',
    };
    const talkFigure: ScientificFigureSpec = { ...singleFigure, widthMm: 180, heightMm: 101.25 };
    const single = createScientificSchematic(options({ templateId: 'llm-training-pipeline' }), singleFigure);
    const talk = createScientificSchematic(options({ templateId: 'llm-training-pipeline' }), talkFigure);
    const double = createScientificSchematic(
      options({ templateId: 'vla-policy' }),
      { ...singleFigure, widthMm: 180, heightMm: 120 },
    );
    const box = (schematic: typeof single, id: string) => {
      const node = schematic.nodes.find((candidate) => candidate.id === id);
      expect(node, id).toBeDefined();
      return {
        left: node!.position.x,
        right: node!.position.x + Number(node!.style?.width ?? 0),
        top: node!.position.y,
        bottom: node!.position.y + Number(node!.style?.height ?? 0),
      };
    };

    const methodPanel = box(single, 'lt-method-panel');
    const baselinePanel = box(single, 'lt-baseline-panel');
    const dpo = box(single, 'lt-dpo-objective');
    const dpoCheckpoint = box(single, 'lt-dpo-checkpoint');
    const deployStage = box(single, 'lt-stage-deploy');
    expect(baselinePanel.left).toBeGreaterThan(methodPanel.right);
    expect(dpoCheckpoint.top).toBeGreaterThan(dpo.bottom);
    expect(dpoCheckpoint.left).toBeGreaterThanOrEqual(methodPanel.left);
    expect(dpoCheckpoint.right).toBeLessThanOrEqual(methodPanel.right);
    expect(deployStage.top).toBeGreaterThanOrEqual(Math.min(methodPanel.bottom, baselinePanel.bottom));
    expect(single.nodes.find((node) => node.id === 'lt-dpo-checkpoint')?.data.label).toBe('Trainable π(θ)');
    expect(single.nodes.find((node) => node.id === 'lt-implicit-reward')?.data.schematicRole).toBe('annotation');

    const vlaPhases = double.nodes.filter((node) => node.data.schematicRole === 'phase');
    expect(new Set(vlaPhases.map((node) => node.data.fontSize)).size).toBe(1);
    for (const phase of vlaPhases) {
      const width = Number(phase.style?.width ?? 0);
      expect(estimateSvgTextWidth(phase.data.label, phase.data.fontSize), phase.id).toBeLessThanOrEqual(width - 12);
    }

    const talkBaseline = box(talk, 'lt-baseline-panel');
    const talkDeploy = box(talk, 'lt-deploy-model');
    expect(talkDeploy.left).toBeGreaterThan(talkBaseline.right);
    expect(talk.nodes.some((node) => node.id === 'lt-method-identity')).toBe(false);
    expect(talk.nodes.some((node) => node.id === 'lt-claim-note')).toBe(false);
    expect(hasDirectedPath(talk.edges, 'lt-ppo-loop', 'lt-deploy-model')).toBe(false);
  });

  it('round-trips every flagship layout and palette without losing editable scientific semantics', () => {
    const templates = ['vla-policy', 'world-model-rollout', 'llm-training-pipeline'] as const;
    const styles = ['conference', 'monochrome'] as const;
    const figures: ScientificFigureSpec[] = [
      { widthMm: 89, heightMm: 70, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-28T00:00:00.000Z' },
      { widthMm: 180, heightMm: 120, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-28T00:00:00.000Z' },
      { widthMm: 180, heightMm: 101.25, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 0, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: '2026-07-28T00:00:00.000Z' },
    ];

    for (const templateId of templates) {
      for (const style of styles) {
        for (const figure of figures) {
          const schematic = createScientificSchematic(options({ templateId, style }), figure);
          const svg = serializePublicationSvg(schematic.title, schematic.nodes, schematic.edges, figure);
          const restored = parseEditableSvg(svg, `${templateId}-${style}-${schematic.layout}.svg`);
          const originalById = new Map(schematic.nodes.map((node) => [node.id, node]));
          const originalEdgeById = new Map(schematic.edges.map((edge) => [edge.id, edge]));
          const context = `${templateId}:${style}:${schematic.layout}`;

          expect(restored.nodes, `${context}:nodes`).toHaveLength(schematic.nodes.length);
          expect(restored.edges, `${context}:edges`).toHaveLength(schematic.edges.length);
          for (const node of restored.nodes) {
            const original = originalById.get(node.id);
            expect(original, `${context}:${node.id}`).toBeDefined();
            expect(node.data.label, `${context}:${node.id}:label`).toBe(original?.data.label);
            expect(node.data.schematicRole, `${context}:${node.id}:role`).toBe(original?.data.schematicRole);
            expect(node.data.scientificVariant, `${context}:${node.id}:variant`).toBe(original?.data.scientificVariant);
            expect(node.data.scientificEvidence, `${context}:${node.id}:evidence`).toBe(original?.data.scientificEvidence);
            expect(node.position.x, `${context}:${node.id}:x`).toBeCloseTo(original?.position.x ?? 0, 5);
            expect(node.position.y, `${context}:${node.id}:y`).toBeCloseTo(original?.position.y ?? 0, 5);
            expect(Number(node.style?.width), `${context}:${node.id}:width`).toBeCloseTo(Number(original?.style?.width), 5);
            expect(Number(node.style?.height), `${context}:${node.id}:height`).toBeCloseTo(Number(original?.style?.height), 5);
          }
          for (const edge of restored.edges) {
            const original = originalEdgeById.get(edge.id);
            expect(original, `${context}:${edge.id}`).toBeDefined();
            expect(edge.source, `${context}:${edge.id}:source`).toBe(original?.source);
            expect(edge.target, `${context}:${edge.id}:target`).toBe(original?.target);
            expect(edge.sourceHandle, `${context}:${edge.id}:source-handle`).toBe(original?.sourceHandle);
            expect(edge.targetHandle, `${context}:${edge.id}:target-handle`).toBe(original?.targetHandle);
            expect(edge.data?.routing, `${context}:${edge.id}:routing`).toBe(original?.data?.routing);
            expect(edge.data?.scientificSemantic, `${context}:${edge.id}:semantic`).toBe(original?.data?.scientificSemantic);
            expect(edge.data?.routeSide, `${context}:${edge.id}:route-side`).toBe(original?.data?.routeSide);
            expect(edge.data?.routeWaypoints, `${context}:${edge.id}:route-waypoints`).toEqual(original?.data?.routeWaypoints);
          }
        }
      }
    }
  });
});
