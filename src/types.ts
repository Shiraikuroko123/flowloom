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
  'bpmn-message-event',
  'bpmn-timer-event',
  'bpmn-error-event',
  'bpmn-signal-event',
  'bpmn-send-task',
  'bpmn-receive-task',
  'bpmn-manual-task',
  'bpmn-business-rule-task',
  'bpmn-script-task',
  'bpmn-call-activity',
  'bpmn-event-gateway',
  'bpmn-complex-gateway',
  'bpmn-transaction',
  'uml-actor',
  'uml-use-case',
  'uml-class',
  'uml-package',
  'uml-component',
  'uml-state',
  'uml-note',
  'uml-interface',
  'uml-object',
  'uml-artifact',
  'uml-node',
  'uml-activity',
  'uml-decision',
  'uml-final-state',
  'uml-lifeline',
  'erd-entity',
  'erd-weak-entity',
  'erd-relationship',
  'erd-identifying-relationship',
  'erd-attribute',
  'erd-key-attribute',
  'erd-multivalued-attribute',
  'erd-table',
  'arch-service',
  'arch-api',
  'arch-server',
  'arch-database',
  'arch-cache',
  'arch-queue',
  'arch-storage',
  'arch-load-balancer',
  'arch-firewall',
  'arch-client',
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
  'vector',
  'image',
] as const;

export type ShapeKind = (typeof SHAPE_KINDS)[number];

export type EdgeRouting = 'smoothstep' | 'straight' | 'bezier';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowHead = 'none' | 'open' | 'closed';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type FidelityLevel = 'structural' | 'hybrid' | 'visual';
export type SvgPrimitiveTag = 'rect' | 'ellipse' | 'circle' | 'line' | 'polyline' | 'polygon' | 'path' | 'text';

export interface SvgVectorElement {
  tag: SvgPrimitiveTag;
  viewBox: [number, number, number, number];
  attributes: Record<string, string | number>;
  text?: string;
  sourceElementId?: string;
}

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
  rotation: number;
  layerId?: string;
  hidden?: boolean;
  vector?: SvgVectorElement;
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

export interface DiagramLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface DiagramPage {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  layers: DiagramLayer[];
}

export interface DiagramDocument {
  version: 2;
  title: string;
  activePageId: string;
  pages: DiagramPage[];
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
  pages?: DiagramPage[];
  activePageId?: string;
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
