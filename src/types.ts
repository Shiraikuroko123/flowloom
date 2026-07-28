import type { Edge, Node, XYPosition } from '@xyflow/react';

export type ShapeKind =
  | 'start'
  | 'process'
  | 'decision'
  | 'document'
  | 'data'
  | 'database'
  | 'manual'
  | 'note'
  | 'group'
  | 'image';

export type EdgeRouting = 'smoothstep' | 'straight' | 'bezier';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
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
