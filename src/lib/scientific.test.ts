import { describe, expect, it } from 'vitest';
import { createFlowEdge, createFlowNode } from './diagram';
import { serializePublicationSvg } from './scientificExport';
import {
  auditScientificFigure,
  buildScientificChartSpec,
  createEditableScientificChart,
  createScientificFigureLayout,
  mmToPx,
  parseScientificTable,
  type ScientificChartOptions,
} from './scientific';
import type { ScientificFigureSpec } from '../types';

const figure: ScientificFigureSpec = {
  widthMm: 180,
  heightMm: 120,
  dpi: 300,
  rows: 2,
  columns: 2,
  marginMm: 6,
  gapMm: 5,
  panelLabels: true,
  labelStyle: 'uppercase',
  background: '#ffffff',
  updatedAt: '2026-07-28T00:00:00.000Z',
};

describe('scientific data tables', () => {
  it('parses quoted CSV, missing values, and numeric columns', () => {
    const table = parseScientificTable('group,label,value\nA,"alpha, beta",1.5\nB,gamma,');
    expect(table.headers).toEqual(['group', 'label', 'value']);
    expect(table.numericFields).toEqual(['value']);
    expect(table.rows[0]).toMatchObject({ group: 'A', label: 'alpha, beta', value: 1.5 });
    expect(table.rows[1].value).toBeNull();
  });

  it('builds a colorblind-friendly spec with redundant group encoding', () => {
    const sourceData = 'group,time,value\nA,0,1\nB,0,2\nA,1,3\nB,1,4';
    const table = parseScientificTable(sourceData);
    const options = {
      title: 'Response',
      sourceName: 'response.csv',
      sourceData,
      chartType: 'line' as const,
      fields: { x: 'time', y: 'value', color: 'group' },
      units: { time: 'h', value: 'a.u.' },
      uncertaintyDefinition: '',
    };
    const spec = buildScientificChartSpec(table, options);
    const encoding = spec.encoding as Record<string, unknown>;
    expect(encoding.color).toBeTruthy();
    expect(encoding.strokeDash).toBeTruthy();
    expect(JSON.stringify(spec)).toContain('a.u.');
  });
});

describe('scientific figure layout', () => {
  it('converts millimeters and creates export-safe panel guides', () => {
    const layout = createScientificFigureLayout(figure);
    expect(mmToPx(25.4)).toBeCloseTo(96, 6);
    expect(layout.nodes).toHaveLength(9);
    const background = layout.nodes.find((node) => node.data.scientificRole === 'figure-background');
    const guides = layout.nodes.filter((node) => node.data.scientificRole === 'panel-guide');
    const labels = layout.nodes.filter((node) => node.data.scientificRole === 'panel-label');
    expect(Number(background?.style?.width)).toBeCloseTo(mmToPx(180), 5);
    expect(guides).toHaveLength(4);
    expect(guides.every((node) => node.data.exportExcluded && node.data.locked)).toBe(true);
    expect(labels.map((node) => node.data.label)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('wraps SVG primitives as an editable chart with provenance', () => {
    const sourceData = 'x,y\n1,2';
    const options: ScientificChartOptions = {
      title: 'Test chart',
      sourceName: 'test.csv',
      sourceData,
      chartType: 'scatter',
      fields: { x: 'x', y: 'y' },
      units: { x: 's', y: 'm' },
      uncertaintyDefinition: '',
    };
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect x="10" y="10" width="180" height="80" fill="#fff"/><circle cx="50" cy="50" r="5" fill="#0072B2"/><text x="70" y="55">value</text></svg>';
    const chart = createEditableScientificChart(svg, { mark: 'point' }, options);
    const root = chart.nodes[0];
    expect(root.data.scientificRole).toBe('chart-root');
    expect(root.data.provenance?.sourceData).toBe(sourceData);
    expect(chart.nodes.slice(1).every((node) => node.parentId === root.id)).toBe(true);
    expect(chart.nodes.slice(1).every((node) => node.data.provenanceRef === root.data.provenance?.id)).toBe(true);
  });
});

describe('scientific quality checks', () => {
  it('reports small text, thin strokes, raster uncertainty, and overflow', () => {
    const small = createFlowNode('process', { x: 700, y: 20 }, 'Small text', { style: { width: 100, height: 60 } });
    small.data = { ...small.data, fontSize: 8, borderWidth: 0.4 };
    const image = createFlowNode('image', { x: 20, y: 20 }, 'Raster');
    const issues = auditScientificFigure([small, image], figure);
    expect(issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      'small-text',
      'thin-stroke',
      'raster-resolution',
      'outside-figure',
    ]));
  });
});

describe('publication SVG export', () => {
  it('writes physical dimensions with native SVG primitives and no foreignObject', () => {
    const layout = createScientificFigureLayout({ ...figure, rows: 1, columns: 1 });
    const first = createFlowNode('process', { x: 40, y: 60 }, 'Collect', { id: 'collect' });
    const second = createFlowNode('decision', { x: 280, y: 60 }, 'Valid?', { id: 'valid' });
    const edge = createFlowEdge(first.id, second.id, 'yes');
    const svg = serializePublicationSvg('Methods', [...layout.nodes, first, second], [edge], figure);
    expect(svg).toContain('width="180mm"');
    expect(svg).toContain('height="120mm"');
    expect(svg).toContain('<metadata>');
    expect(svg).toContain('<path');
    expect(svg).toContain('<text');
    expect(svg).not.toContain('foreignObject');
    expect(new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror')).toBeNull();
  });
});
