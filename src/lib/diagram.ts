import dagre from '@dagrejs/dagre';
import { MarkerType, type XYPosition } from '@xyflow/react';
import type {
  EdgeRouting,
  FlowEdge,
  FlowEdgeData,
  FlowNode,
  FlowNodeData,
  ShapeKind,
} from '../types';
import { createId } from './id';

export const SHAPE_DIMENSIONS: Record<ShapeKind, { width: number; height: number }> = {
  start: { width: 148, height: 56 },
  process: { width: 176, height: 72 },
  decision: { width: 144, height: 112 },
  document: { width: 176, height: 82 },
  data: { width: 176, height: 72 },
  database: { width: 148, height: 92 },
  manual: { width: 176, height: 72 },
  note: { width: 176, height: 96 },
  group: { width: 420, height: 280 },
  image: { width: 420, height: 280 },
};

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  start: '开始 / 结束',
  process: '处理步骤',
  decision: '判断',
  document: '文档',
  data: '数据输入',
  database: '数据库',
  manual: '人工操作',
  note: '注释',
  group: '分组 / 泳道',
  image: '视觉参考',
};

export const DEFAULT_NODE_COLORS: Record<ShapeKind, Pick<FlowNodeData, 'fill' | 'stroke' | 'textColor'>> = {
  start: { fill: 'oklch(0.935 0.050 172)', stroke: 'oklch(0.430 0.105 172)', textColor: 'oklch(0.240 0.055 172)' },
  process: { fill: 'oklch(1 0 0)', stroke: 'oklch(0.580 0.018 70)', textColor: 'oklch(0.220 0.018 70)' },
  decision: { fill: 'oklch(0.955 0.045 76)', stroke: 'oklch(0.560 0.155 72)', textColor: 'oklch(0.290 0.055 70)' },
  document: { fill: 'oklch(0.955 0.025 245)', stroke: 'oklch(0.500 0.110 245)', textColor: 'oklch(0.260 0.055 245)' },
  data: { fill: 'oklch(0.955 0.026 300)', stroke: 'oklch(0.510 0.105 300)', textColor: 'oklch(0.270 0.050 300)' },
  database: { fill: 'oklch(0.940 0.036 172)', stroke: 'oklch(0.430 0.105 172)', textColor: 'oklch(0.240 0.055 172)' },
  manual: { fill: 'oklch(0.965 0.030 36)', stroke: 'oklch(0.560 0.135 36)', textColor: 'oklch(0.300 0.060 36)' },
  note: { fill: 'oklch(0.965 0.065 95)', stroke: 'oklch(0.620 0.115 88)', textColor: 'oklch(0.300 0.050 82)' },
  group: { fill: 'oklch(0.975 0.004 76)', stroke: 'oklch(0.760 0.018 70)', textColor: 'oklch(0.390 0.018 70)' },
  image: { fill: 'oklch(0.975 0.004 76)', stroke: 'oklch(0.760 0.018 70)', textColor: 'oklch(0.220 0.018 70)' },
};

export function createNodeData(kind: ShapeKind, label?: string): FlowNodeData {
  const colors = DEFAULT_NODE_COLORS[kind];
  return {
    label: label ?? SHAPE_LABELS[kind],
    kind,
    ...colors,
    borderWidth: kind === 'group' ? 1 : 1.5,
    radius: kind === 'start' ? 28 : 6,
    fontSize: 14,
    fontWeight: 600,
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
  };

  return {
    id: createId('edge'),
    source,
    target,
    type: routing,
    label,
    data,
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
    style: { stroke: color, strokeWidth: data.width },
  };
}

export function sanitizeKind(value: unknown): ShapeKind {
  const kinds: ShapeKind[] = [
    'start',
    'process',
    'decision',
    'document',
    'data',
    'database',
    'manual',
    'note',
    'group',
    'image',
  ];
  return kinds.includes(value as ShapeKind) ? (value as ShapeKind) : 'process';
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
        },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
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

export function cloneGraph<T>(value: T): T {
  return structuredClone(value);
}
