import dagre from '@dagrejs/dagre';
import { MarkerType, type XYPosition } from '@xyflow/react';
import type {
  ArrowHead,
  EdgeRouting,
  FlowEdge,
  FlowEdgeData,
  FlowNode,
  FlowNodeData,
  ShapeKind,
} from '../types';
import { SHAPE_KINDS } from '../types';
import { createId } from './id';
import { getShapeDefinition, isShapeKind } from './shapeRegistry';

export const SHAPE_DIMENSIONS = Object.fromEntries(
  SHAPE_KINDS.map((kind) => {
    const definition = getShapeDefinition(kind);
    return [kind, { width: definition.width, height: definition.height }];
  }),
) as Record<ShapeKind, { width: number; height: number }>;

export const SHAPE_LABELS = Object.fromEntries(
  SHAPE_KINDS.map((kind) => [kind, getShapeDefinition(kind).label]),
) as Record<ShapeKind, string>;

function defaultNodeColors(kind: ShapeKind): Pick<FlowNodeData, 'fill' | 'stroke' | 'textColor'> {
  const category = getShapeDefinition(kind).category;
  if (kind === 'start' || kind === 'bpmn-start-event') {
    return { fill: 'oklch(0.935 0.050 172)', stroke: 'oklch(0.430 0.105 172)', textColor: 'oklch(0.240 0.055 172)' };
  }
  if (kind === 'decision' || kind.includes('gateway')) {
    return { fill: 'oklch(0.955 0.045 76)', stroke: 'oklch(0.560 0.155 72)', textColor: 'oklch(0.290 0.055 70)' };
  }
  if (kind === 'document' || kind === 'multiple-documents' || kind === 'bpmn-data-object') {
    return { fill: 'oklch(0.955 0.025 245)', stroke: 'oklch(0.500 0.110 245)', textColor: 'oklch(0.260 0.055 245)' };
  }
  if (kind === 'data' || kind.includes('storage') || kind === 'database') {
    return { fill: 'oklch(0.940 0.036 172)', stroke: 'oklch(0.430 0.105 172)', textColor: 'oklch(0.240 0.055 172)' };
  }
  if (kind === 'manual' || kind === 'manual-operation' || kind === 'bpmn-user-task') {
    return { fill: 'oklch(0.965 0.030 36)', stroke: 'oklch(0.560 0.135 36)', textColor: 'oklch(0.300 0.060 36)' };
  }
  if (kind === 'note' || kind === 'uml-note' || kind === 'annotation') {
    return { fill: 'oklch(0.965 0.065 95)', stroke: 'oklch(0.620 0.115 88)', textColor: 'oklch(0.300 0.050 82)' };
  }
  if (category === 'container' || kind === 'bpmn-pool') {
    return { fill: 'oklch(0.975 0.004 76)', stroke: 'oklch(0.700 0.018 70)', textColor: 'oklch(0.330 0.018 70)' };
  }
  return { fill: 'oklch(1 0 0)', stroke: 'oklch(0.540 0.018 70)', textColor: 'oklch(0.220 0.018 70)' };
}

export const DEFAULT_NODE_COLORS = Object.fromEntries(
  SHAPE_KINDS.map((kind) => [kind, defaultNodeColors(kind)]),
) as Record<ShapeKind, Pick<FlowNodeData, 'fill' | 'stroke' | 'textColor'>>;

export function createNodeData(kind: ShapeKind, label?: string): FlowNodeData {
  const colors = DEFAULT_NODE_COLORS[kind];
  const category = getShapeDefinition(kind).category;
  return {
    label: label ?? SHAPE_LABELS[kind],
    kind,
    ...colors,
    borderWidth: category === 'container' ? 1 : kind === 'bpmn-end-event' ? 2.5 : 1.5,
    radius: kind === 'start' ? 28 : kind === 'rounded-rectangle' || kind.startsWith('bpmn-') || kind === 'uml-state' ? 10 : 0,
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
    verticalAlign: 'middle',
    opacity: 1,
  };
}

export function createFlowNode(
  kind: ShapeKind,
  position: XYPosition,
  label?: string,
  overrides: Partial<FlowNode> = {},
): FlowNode {
  const dimensions = SHAPE_DIMENSIONS[kind];
  return {
    id: createId('node'),
    type: 'flowNode',
    position,
    data: createNodeData(kind, label),
    style: { width: dimensions.width, height: dimensions.height },
    ...overrides,
  };
}

export function createFlowEdge(
  source: string,
  target: string,
  label?: string,
  routing: EdgeRouting = 'smoothstep',
): FlowEdge {
  const color = 'oklch(0.430 0.025 70)';
  const data: FlowEdgeData = {
    label,
    color,
    width: 1.75,
    lineStyle: 'solid',
    routing,
    arrowStart: 'none',
    arrowEnd: 'closed',
  };

  return {
    id: createId('edge'),
    source,
    target,
    type: routing,
    label,
    data,
    markerStart: createEdgeMarker(data.arrowStart, color),
    markerEnd: createEdgeMarker(data.arrowEnd, color),
    style: { stroke: color, strokeWidth: data.width },
  };
}

export function sanitizeKind(value: unknown): ShapeKind {
  return isShapeKind(value) ? value : 'process';
}

export function createEdgeMarker(kind: ArrowHead, color: string) {
  if (kind === 'none') return undefined;
  return {
    type: kind === 'closed' ? MarkerType.ArrowClosed : MarkerType.Arrow,
    color,
    width: 18,
    height: 18,
  };
}

export function normalizeNodes(nodes: FlowNode[]): FlowNode[] {
  return nodes.map((node, index) => {
    const kind = sanitizeKind(node.data?.kind);
    const dimensions = SHAPE_DIMENSIONS[kind];
    const data = {
      ...createNodeData(kind, String(node.data?.label ?? SHAPE_LABELS[kind])),
      ...node.data,
      kind,
    };
    return {
      ...node,
      id: String(node.id || createId('node')),
      type: 'flowNode',
      position: node.position ?? { x: (index % 4) * 220, y: Math.floor(index / 4) * 140 },
      data,
      draggable: !data.locked,
      style: {
        width: dimensions.width,
        height: dimensions.height,
        ...node.style,
      },
    };
  });
}

export function normalizeEdges(edges: FlowEdge[], nodeIds: Set<string>): FlowEdge[] {
  return edges
    .filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
    .map((edge) => {
      const routing = (edge.data?.routing ?? edge.type ?? 'smoothstep') as EdgeRouting;
      const color = edge.data?.color ?? 'oklch(0.430 0.025 70)';
      const width = edge.data?.width ?? 1.75;
      const arrowStart = edge.data?.arrowStart ?? 'none';
      const arrowEnd = edge.data?.arrowEnd ?? 'closed';
      return {
        ...edge,
        id: String(edge.id || createId('edge')),
        source: String(edge.source),
        target: String(edge.target),
        type: routing,
        label: edge.data?.label ?? (typeof edge.label === 'string' ? edge.label : undefined),
        data: {
          label: edge.data?.label ?? (typeof edge.label === 'string' ? edge.label : undefined),
          color,
          width,
          lineStyle: edge.data?.lineStyle ?? 'solid',
          routing,
          arrowStart,
          arrowEnd,
        },
        markerStart: createEdgeMarker(arrowStart, color),
        markerEnd: createEdgeMarker(arrowEnd, color),
        style: {
          ...edge.style,
          stroke: color,
          strokeWidth: width,
          strokeDasharray:
            edge.data?.lineStyle === 'dashed'
              ? '8 6'
              : edge.data?.lineStyle === 'dotted'
                ? '2 5'
                : undefined,
        },
      };
    });
}

export function normalizeGraph(nodes: FlowNode[], edges: FlowEdge[]) {
  const normalizedNodes = normalizeNodes(nodes);
  const nodeIds = new Set(normalizedNodes.map((node) => node.id));
  return { nodes: normalizedNodes, edges: normalizeEdges(edges, nodeIds) };
}

export function layoutGraph(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: 'TB' | 'LR' = 'TB',
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, ranksep: 78, nodesep: 44, marginx: 32, marginy: 32 });

  nodes.forEach((node) => {
    const dimensions = SHAPE_DIMENSIONS[node.data.kind];
    const width = Number(node.measured?.width ?? node.width ?? node.style?.width ?? dimensions.width);
    const height = Number(node.measured?.height ?? node.height ?? node.style?.height ?? dimensions.height);
    graph.setNode(node.id, { width, height });
  });
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  const laidOutNodes = nodes.map((node) => {
    const point = graph.node(node.id) as { x: number; y: number; width: number; height: number } | undefined;
    if (!point) return node;
    return {
      ...node,
      position: { x: point.x - point.width / 2, y: point.y - point.height / 2 },
    };
  });

  return { nodes: laidOutNodes, edges };
}

export function findOpenNodePosition(nodes: FlowNode[], kind: ShapeKind, center: XYPosition): XYPosition {
  const dimensions = SHAPE_DIMENSIONS[kind];
  const origin = {
    x: center.x - dimensions.width / 2,
    y: center.y - dimensions.height / 2,
  };
  const margin = 20;
  const step = 44;
  const collides = (position: XYPosition) => nodes.some((node) => {
    const nodeDimensions = SHAPE_DIMENSIONS[node.data.kind];
    const width = Number(node.measured?.width ?? node.width ?? node.style?.width ?? nodeDimensions.width);
    const height = Number(node.measured?.height ?? node.height ?? node.style?.height ?? nodeDimensions.height);
    return position.x < node.position.x + width + margin
      && position.x + dimensions.width + margin > node.position.x
      && position.y < node.position.y + height + margin
      && position.y + dimensions.height + margin > node.position.y;
  });

  if (!collides(origin)) return origin;
  for (let ring = 1; ring <= 8; ring += 1) {
    for (let x = -ring; x <= ring; x += 1) {
      for (const y of [-ring, ring]) {
        const candidate = { x: origin.x + x * step, y: origin.y + y * step };
        if (!collides(candidate)) return candidate;
      }
    }
    for (let y = -ring + 1; y < ring; y += 1) {
      for (const x of [-ring, ring]) {
        const candidate = { x: origin.x + x * step, y: origin.y + y * step };
        if (!collides(candidate)) return candidate;
      }
    }
  }
  return { x: origin.x + step * 9, y: origin.y + step * 9 };
}

export function cloneGraph<T>(value: T): T {
  return structuredClone(value);
}
