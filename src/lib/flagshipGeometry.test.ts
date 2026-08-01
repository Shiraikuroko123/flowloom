import { describe, expect, it } from 'vitest';
import type { FlowEdge, FlowNode, ScientificFigureSpec, ScientificSchematicOptions } from '../types';
import { layoutSchematicNodeContent } from './scientificNodeLayout';
import { routeScientificEdge, scientificConnectionPoint } from './scientificRouting';
import {
  createScientificSchematic,
  defaultScientificSchematicBackbone,
  defaultScientificSchematicTitle,
} from './scientificSchematics';

interface Point { x: number; y: number }
interface Box { x: number; y: number; width: number; height: number }

const FIGURES: Array<{ name: string; spec: ScientificFigureSpec }> = [
  {
    name: 'single-column',
    spec: { widthMm: 89, heightMm: 70, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 5, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: new Date(0).toISOString() },
  },
  {
    name: 'double-column',
    spec: { widthMm: 180, heightMm: 120, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 5, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: new Date(0).toISOString() },
  },
  {
    name: 'presentation',
    spec: { widthMm: 180, heightMm: 101.25, dpi: 300, rows: 1, columns: 1, marginMm: 6, gapMm: 5, panelLabels: false, labelStyle: 'uppercase', background: '#ffffff', updatedAt: new Date(0).toISOString() },
  },
];

const FLAGSHIPS = ['vla-policy', 'world-model-rollout', 'llm-training-pipeline'] as const;

function boxFor(node: FlowNode): Box {
  return {
    x: node.position.x,
    y: node.position.y,
    width: Number(node.style?.width ?? 1),
    height: Number(node.style?.height ?? 1),
  };
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return Math.min(a.x, c.x) - 0.001 <= b.x
    && b.x <= Math.max(a.x, c.x) + 0.001
    && Math.min(a.y, c.y) - 0.001 <= b.y
    && b.y <= Math.max(a.y, c.y) + 0.001;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  if (((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0))) return true;
  return (Math.abs(abC) < 0.001 && onSegment(a, c, b))
    || (Math.abs(abD) < 0.001 && onSegment(a, d, b))
    || (Math.abs(cdA) < 0.001 && onSegment(c, a, d))
    || (Math.abs(cdB) < 0.001 && onSegment(c, b, d));
}

function intersectsBox(a: Point, b: Point, box: Box): boolean {
  const strictlyInside = (point: Point) => (
    point.x > box.x + 0.01
    && point.x < box.x + box.width - 0.01
    && point.y > box.y + 0.01
    && point.y < box.y + box.height - 0.01
  );
  if (strictlyInside(a) || strictlyInside(b)) return true;
  const topLeft = { x: box.x, y: box.y };
  const topRight = { x: box.x + box.width, y: box.y };
  const bottomLeft = { x: box.x, y: box.y + box.height };
  const bottomRight = { x: box.x + box.width, y: box.y + box.height };
  return segmentsIntersect(a, b, topLeft, topRight)
    || segmentsIntersect(a, b, topRight, bottomRight)
    || segmentsIntersect(a, b, bottomRight, bottomLeft)
    || segmentsIntersect(a, b, bottomLeft, topLeft);
}

function pointsFor(edge: FlowEdge, boxes: Map<string, Box>): Point[] {
  const source = boxes.get(edge.source);
  const target = boxes.get(edge.target);
  if (!source || !target) return [];
  const from = scientificConnectionPoint(source, edge.sourceHandle, target);
  const to = scientificConnectionPoint(target, edge.targetHandle, source);
  return routeScientificEdge(edge, from, to).points;
}

function options(templateId: typeof FLAGSHIPS[number]): ScientificSchematicOptions {
  return {
    templateId,
    title: defaultScientificSchematicTitle(templateId, 'en'),
    backbone: defaultScientificSchematicBackbone(templateId, 'en'),
    style: 'conference',
    density: 'detailed',
    language: 'en',
  };
}

describe('V5 flagship composition geometry', () => {
  for (const templateId of FLAGSHIPS) {
    for (const figure of FIGURES) {
      it(`${templateId}:${figure.name} keeps editable content and routing collision-free`, () => {
        const schematic = createScientificSchematic(options(templateId), figure.spec);
        const visibleNodes = schematic.nodes.filter((node) => !['frame', 'phase'].includes(node.data.schematicRole ?? ''));
        const boxes = new Map(schematic.nodes.map((node) => [node.id, boxFor(node)]));
        expect(visibleNodes.length, 'manageable visual density').toBeLessThanOrEqual(22);
        expect(schematic.edges.length, 'manageable connector density').toBeLessThanOrEqual(17);

        const truncatedText: string[] = [];
        for (let first = 0; first < visibleNodes.length; first += 1) {
          const left = visibleNodes[first];
          const leftBox = boxes.get(left.id)!;
          expect(leftBox.width, `${left.id}:width`).toBeGreaterThan(0);
          expect(leftBox.height, `${left.id}:height`).toBeGreaterThan(0);
          for (let second = first + 1; second < visibleNodes.length; second += 1) {
            const right = visibleNodes[second];
            const rightBox = boxes.get(right.id)!;
            const overlaps = leftBox.x < rightBox.x + rightBox.width
              && leftBox.x + leftBox.width > rightBox.x
              && leftBox.y < rightBox.y + rightBox.height
              && leftBox.y + leftBox.height > rightBox.y;
            expect(overlaps, `${left.id} overlaps ${right.id}`).toBe(false);
          }
          const renderedText = [left.data.label, left.data.description ?? ''].join('\n');
          expect(renderedText, `${left.id}:source text`).not.toContain('...');
          const textLayout = layoutSchematicNodeContent(left.data, leftBox.width, leftBox.height);
          const visibleText = [...textLayout.labelLines, ...textLayout.descriptionLines].join(' / ');
          if (left.data.kind !== 'image' && visibleText.includes('...')) truncatedText.push(`${left.id}: ${visibleText}`);
        }
        expect(truncatedText, 'rendered text must not be abbreviated').toEqual([]);

        const routed = schematic.edges.map((edge) => ({ edge, points: pointsFor(edge, boxes) }));
        for (const item of routed) {
          expect(item.points.length, `${item.edge.id}:route`).toBeGreaterThanOrEqual(2);
          for (let index = 1; index < item.points.length; index += 1) {
            const start = item.points[index - 1];
            const end = item.points[index];
            for (const node of visibleNodes) {
              if (node.id === item.edge.source || node.id === item.edge.target) continue;
              expect(
                intersectsBox(start, end, boxes.get(node.id)!),
                `${item.edge.id} crosses ${node.id}: ${JSON.stringify(item.points)}`,
              ).toBe(false);
            }
          }
          expect(String(item.edge.data?.label ?? item.edge.label ?? '').trim(), `${item.edge.id}:connector label`).toBe('');
        }

        for (let first = 0; first < routed.length; first += 1) {
          for (let second = first + 1; second < routed.length; second += 1) {
            const left = routed[first];
            const right = routed[second];
            if (left.edge.source === right.edge.source || left.edge.source === right.edge.target || left.edge.target === right.edge.source || left.edge.target === right.edge.target) continue;
            for (let leftIndex = 1; leftIndex < left.points.length; leftIndex += 1) {
              for (let rightIndex = 1; rightIndex < right.points.length; rightIndex += 1) {
                expect(
                  segmentsIntersect(left.points[leftIndex - 1], left.points[leftIndex], right.points[rightIndex - 1], right.points[rightIndex]),
                  `${left.edge.id} crosses ${right.edge.id}: ${JSON.stringify(left.points)} / ${JSON.stringify(right.points)}`,
                ).toBe(false);
              }
            }
          }
        }
      });
    }
  }

  it('uses separate, ordered anchors for the two LLM validation inputs', () => {
    for (const figure of FIGURES.filter((item) => item.name !== 'single-column')) {
      const schematic = createScientificSchematic(options('llm-training-pipeline'), figure.spec);
      const boxes = new Map(schematic.nodes.map((node) => [node.id, boxFor(node)]));
      const policyGate = schematic.edges.find((edge) => edge.source === 'llm-policy' && edge.target === 'llm-gate');
      const suiteGate = schematic.edges.find((edge) => edge.source === 'llm-suite' && edge.target === 'llm-gate');
      expect(policyGate, `${figure.name}: policy validation edge`).toBeDefined();
      expect(suiteGate, `${figure.name}: suite validation edge`).toBeDefined();
      const policyRoute = pointsFor(policyGate!, boxes);
      const suiteRoute = pointsFor(suiteGate!, boxes);
      expect(policyRoute.at(-1)?.x, `${figure.name}: policy target anchor`).toBeGreaterThan(suiteRoute.at(-1)?.x ?? 0);
    }
  });
});
