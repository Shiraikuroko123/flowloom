import type { Edge, Node, XYPosition } from '@xyflow/react';

export const SHAPE_KINDS = [
  'start',
  'process',
  'decision',
  'document',
  'data',
  'database',
  'manual',
  'multiple-documents',
  'predefined-process',
  'preparation',
  'manual-operation',
  'stored-data',
  'internal-storage',
  'display',
  'delay',
  'on-page-connector',
  'off-page-connector',
  'merge',
  'extract',
  'sort',
  'collate',
  'summing-junction',
  'or-junction',
  'sequential-storage',
  'direct-storage',
  'paper-tape',
  'punched-card',
  'loop-limit',
  'annotation',
  'bpmn-start-event',
  'bpmn-intermediate-event',
  'bpmn-end-event',
  'bpmn-task',
  'bpmn-user-task',
  'bpmn-service-task',
  'bpmn-exclusive-gateway',
  'bpmn-parallel-gateway',
  'bpmn-inclusive-gateway',
  'bpmn-data-object',
  'bpmn-data-store',
  'bpmn-pool',
  'uml-actor',
  'uml-use-case',
  'uml-class',
  'uml-package',
  'uml-component',
  'uml-state',
  'uml-note',
  'rectangle',
  'rounded-rectangle',
  'ellipse',
  'triangle',
  'hexagon',
  'cloud',
  'callout',
  'note',
  'group',
  'swimlane',
  'image',
] as const;

export type ShapeKind = (typeof SHAPE_KINDS)[number];

export type EdgeRouting = 'smoothstep' | 'straight' | 'bezier';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowHead = 'none' | 'open' | 'closed';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type FidelityLevel = 'structural' | 'hybrid' | 'visual';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  kind: ShapeKind;
  fill: string;
  stroke: string;
  textColor: string;
  borderWidth: number;
  radius: number;
  fontSize: number;
  fontWeight: number;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  opacity: number;
  imageUrl?: string;
  sourceRef?: string;
  locked?: boolean;
}

export interface FlowEdgeData extends Record<string, unknown> {
  label?: string;
  color: string;
  width: number;
  lineStyle: LineStyle;
  routing: EdgeRouting;
  arrowStart: ArrowHead;
  arrowEnd: ArrowHead;
}

export type FlowNode = Node<FlowNodeData, 'flowNode'>;
export type FlowEdge = Edge<FlowEdgeData>;

export interface DiagramDocument {
  version: 1;
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  meta: {
    createdAt: string;
    updatedAt: string;
    sourceFormat?: string;
    fidelity?: FidelityLevel;
  };
}

export interface ImportResult {
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  fidelity: FidelityLevel;
  sourceFormat: string;
  warnings: string[];
}

export interface DiagramTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  rememberKey: boolean;
}

export interface AiAttachment {
  name: string;
  mimeType: string;
  content: string;
  kind: 'text' | 'image';
}

export interface AiDiagramRequest {
  prompt: string;
  scenario: string;
  attachments: AiAttachment[];
  config: AiConfig;
  signal?: AbortSignal;
}

export interface AiDiagramPayload {
  title?: string;
  direction?: 'TB' | 'LR';
  nodes: Array<{
    id?: string;
    label: string;
    description?: string;
    kind?: ShapeKind;
    position?: XYPosition;
    fill?: string;
    stroke?: string;
  }>;
  edges: Array<{
    id?: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

export interface ToastMessage {
  id: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
}
