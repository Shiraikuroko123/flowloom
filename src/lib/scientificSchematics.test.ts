import { describe, expect, it } from 'vitest';
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
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.paperCount).toBe(100);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.parsedFigureCount).toBe(1289);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.llmFigureCount).toBe(656);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.embodiedFigureCount).toBe(633);

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

        for (const node of schematic.nodes.filter((candidate) => candidate.data.kind.startsWith('scientific-'))) {
          const width = Number(node.style?.width ?? 0);
          const height = Number(node.style?.height ?? 0);
          const content = layoutScientificNodeContent(node.data, width, height);
          const definition = getShapeDefinition(node.data.kind);
          expect(content.labelLines.some((line) => line.endsWith('...')), `${templateId}:${format.expected}:${node.id}:label`).toBe(false);
          expect(content.descriptionLines.some((line) => line.endsWith('...')), `${templateId}:${format.expected}:${node.id}:description`).toBe(false);
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
          if (definition.textPlacement === 'footer') {
            const labelTop = content.labelStartY - node.data.fontSize * 0.86;
            expect(content.visualHeight, `${templateId}:${format.expected}:${node.id}:visual`).toBeLessThanOrEqual(labelTop + 0.01);
            if (format.expected === 'single-column') {
              expect(content.visualHeight / height, `${templateId}:${node.id}:visible-pictogram`).toBeGreaterThanOrEqual(0.3);
            }
          } else {
            expect(content.visualHeight, `${templateId}:${format.expected}:${node.id}:center`).toBe(height);
          }
          const lastBaseline = content.descriptionLines.length
            ? content.descriptionStartY + (content.descriptionLines.length - 1) * content.descriptionLineHeight
            : content.labelStartY + (content.labelLines.length - 1) * content.labelLineHeight;
          const lastFontSize = content.descriptionLines.length ? content.descriptionFontSize : node.data.fontSize;
          expect(lastBaseline + lastFontSize * 0.24, `${templateId}:${format.expected}:${node.id}:bottom`).toBeLessThanOrEqual(height + 0.01);
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
        expect(blockers, `${templateId}:${format.expected}`).toEqual([]);
      }
    }
    expect(splitLabelWords, 'scientific labels must wrap only between complete words').toEqual([]);
  });

  it('exports phase backgrounds before edges and foreground modules', () => {
    const schematic = createScientificSchematic(options({ templateId: 'vla-policy' }));
    const figure: ScientificFigureSpec = {
      widthMm: 360,
      heightMm: 185,
      dpi: 300,
      rows: 1,
      columns: 1,
      marginMm: 0,
      gapMm: 0,
      panelLabels: false,
      labelStyle: 'uppercase',
      background: 'transparent',
      updatedAt: '2026-07-28T00:00:00.000Z',
    };
    const svg = serializePublicationSvg(schematic.title, schematic.nodes, schematic.edges, figure);
    const phaseIndex = svg.indexOf('A Observe');
    const edgeIndex = svg.indexOf('<defs><marker');
    const foregroundIndex = svg.indexOf('data-flowloom-node-id="vla-scene"', edgeIndex);

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
    const heading = document.querySelector('[data-flowloom-node-id="wm-pr-c"] text');

    expect(Array.from(heading?.querySelectorAll('tspan') ?? []).map((line) => line.textContent)).toEqual([
      'C Counterfactual futures',
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

    for (const [nodeId, expected] of [['wm-rollout-b', 'collision'], ['wm-rollout-c', 'occluded']] as const) {
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
      'vla-policy': { 'vla-controller': 'Closed-loop controller' },
      'world-model-rollout': { 'wm-pr-c': 'C  Future rollouts' },
      'llm-training-pipeline': {
        'lt-pr-a': 'A  Reference policy',
        'lt-pr-b': 'B  Alignment alternatives',
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

  it('keeps the compact LLM alignment branches and talk-layout data stages visibly separated', () => {
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

    const split = box(single, 'lt-alignment-split');
    const sft = box(single, 'lt-sft-model');
    const dpo = box(single, 'lt-dpo-objective');
    const dpoCheckpoint = box(single, 'lt-dpo-checkpoint');
    const rlhf = box(single, 'lt-rlhf-objective');
    const rlhfCheckpoint = box(single, 'lt-rlhf-checkpoint');
    expect(split.left - sft.right).toBeGreaterThanOrEqual(12);
    expect(dpo.left - split.right).toBeGreaterThanOrEqual(12);
    expect(dpoCheckpoint.left - dpo.right).toBeGreaterThanOrEqual(12);
    expect(rlhfCheckpoint.left - rlhf.right).toBeGreaterThanOrEqual(12);
    expect(rlhf.top - dpo.bottom).toBeGreaterThanOrEqual(10);
    expect(single.nodes.find((node) => node.id === 'lt-dpo-checkpoint')?.data.label).toBe('DPO θ_D');
    expect(single.nodes.find((node) => node.id === 'lt-rlhf-checkpoint')?.data.label).toBe('RL θ_RL');

    const vlaPhases = double.nodes.filter((node) => node.data.schematicRole === 'phase');
    expect(new Set(vlaPhases.map((node) => node.data.fontSize)).size).toBe(1);
    for (const phase of vlaPhases) {
      const width = Number(phase.style?.width ?? 0);
      expect(estimateSvgTextWidth(phase.data.label, phase.data.fontSize), phase.id).toBeLessThanOrEqual(width - 12);
    }

    const source = box(talk, 'lt-raw-data');
    const curation = box(talk, 'lt-curation');
    expect(curation.left - source.right).toBeGreaterThanOrEqual(40);
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
          }
        }
      }
    }
  });
});
