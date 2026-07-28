import { describe, expect, it } from 'vitest';
import type { ScientificSchematicOptions } from '../types';
import {
  DEFAULT_SCIENTIFIC_SCHEMATIC_OPTIONS,
  SCIENTIFIC_SCHEMATIC_TEMPLATES,
  createScientificSchematic,
} from './scientificSchematics';
import { serializePublicationSvg } from './scientificExport';
import {
  ARXIV_FIGURE_CORPUS_SUMMARY,
  SCIENTIFIC_FIGURE_RECIPES,
} from './scientificFigureRecipes';
import { getShapeDefinition } from './shapeRegistry';
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
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.parsedFigureCount).toBe(2603);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.llmFigureCount).toBe(1448);
    expect(ARXIV_FIGURE_CORPUS_SUMMARY.embodiedFigureCount).toBe(1155);

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
    const phaseIndex = svg.indexOf('Observation and encoding');
    const edgeIndex = svg.indexOf('<defs><marker');
    const foregroundIndex = svg.indexOf('#E8F2FB');

    expect(phaseIndex).toBeGreaterThan(0);
    expect(edgeIndex).toBeGreaterThan(phaseIndex);
    expect(foregroundIndex).toBeGreaterThan(edgeIndex);
    expect(svg).toContain('2406.09246');
  });
});
