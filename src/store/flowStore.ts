import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  reconnectEdge,
} from '@xyflow/react';
import { create } from 'zustand';
import type { DiagramDocument, FlowEdge, FlowEdgeData, FlowNode, FlowNodeData } from '../types';
import { cloneGraph, createEdgeMarker, createFlowEdge, layoutGraph, normalizeGraph } from '../lib/diagram';
import { getTemplate } from '../data/templates';

interface Snapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowState {
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  past: Snapshot[];
  future: Snapshot[];
  transactionStart: Snapshot | null;
  dirty: boolean;
  lastSavedAt: number | null;
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  setTitle: (title: string) => void;
  beginTransaction: () => void;
  endTransaction: () => void;
  addNode: (node: FlowNode) => void;
  updateNodeData: (id: string, patch: Partial<FlowNodeData>) => void;
  updateNodeStyle: (id: string, patch: Record<string, string | number>) => void;
  updateNodePosition: (id: string, patch: Partial<FlowNode['position']>) => void;
  arrangeNode: (id: string, direction: 'front' | 'forward' | 'backward' | 'back') => void;
  updateEdge: (id: string, patch: Partial<FlowEdgeData>) => void;
  reverseEdge: (id: string) => void;
  reconnect: (edge: FlowEdge, connection: Connection) => void;
  insertGraph: (nodes: FlowNode[], edges: FlowEdge[], offset?: number) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  alignSelection: (axis: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
  distributeSelection: (axis: 'horizontal' | 'vertical') => void;
  layout: (direction: 'TB' | 'LR') => void;
  loadGraph: (title: string, nodes: FlowNode[], edges: FlowEdge[]) => void;
  loadTemplate: (id: string) => void;
  restoreDraft: (draft: Pick<DiagramDocument, 'title' | 'nodes' | 'edges'>) => void;
  newDocument: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
}

const MAX_HISTORY = 80;
const initialTemplate = getTemplate('release-approval');

function snapshot(state: Pick<FlowState, 'nodes' | 'edges'>): Snapshot {
  return cloneGraph({ nodes: state.nodes, edges: state.edges });
}

function withCheckpoint(state: FlowState, next: Snapshot): Partial<FlowState> {
  return {
    ...next,
    past: [...state.past.slice(-(MAX_HISTORY - 1)), snapshot(state)],
    future: [],
    dirty: true,
  };
}

function nodeSize(node: FlowNode) {
  const width = Number(node.measured?.width ?? node.width ?? node.style?.width ?? 176);
  const height = Number(node.measured?.height ?? node.height ?? node.style?.height ?? 72);
  return { width, height };
}

export const useFlowStore = create<FlowState>((set, get) => ({
  title: initialTemplate.name,
  nodes: cloneGraph(initialTemplate.nodes),
  edges: cloneGraph(initialTemplate.edges),
  past: [],
  future: [],
  transactionStart: null,
  dirty: false,
  lastSavedAt: null,

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      dirty: changes.some((change) => change.type !== 'select' && change.type !== 'dimensions') || state.dirty,
    }));
  },

  onEdgesChange: (changes) => {
    const structural = changes.some((change) => change.type !== 'select');
    set((state) => {
      const nextEdges = applyEdgeChanges(changes, state.edges);
      return structural
        ? withCheckpoint(state, { nodes: state.nodes, edges: nextEdges })
        : { edges: nextEdges };
    });
  },

  onConnect: (connection) => {
    set((state) => {
      const edge = createFlowEdge(connection.source, connection.target);
      edge.sourceHandle = connection.sourceHandle;
      edge.targetHandle = connection.targetHandle;
      return withCheckpoint(state, { nodes: state.nodes, edges: addEdge(edge, state.edges) });
    });
  },

  setTitle: (title) => set({ title, dirty: true }),

  beginTransaction: () => {
    if (!get().transactionStart) set({ transactionStart: snapshot(get()) });
  },

  endTransaction: () => {
    const state = get();
    if (!state.transactionStart) return;
    const changed = JSON.stringify(state.transactionStart) !== JSON.stringify(snapshot(state));
    set({
      transactionStart: null,
      past: changed
        ? [...state.past.slice(-(MAX_HISTORY - 1)), state.transactionStart]
        : state.past,
      future: changed ? [] : state.future,
      dirty: changed || state.dirty,
    });
  },

  addNode: (node) => {
    set((state) => withCheckpoint(state, {
      nodes: [
        ...state.nodes.map((current) => ({ ...current, selected: false })),
        { ...node, selected: true },
      ],
      edges: state.edges.map((edge) => ({ ...edge, selected: false })),
    }));
  },

  updateNodeData: (id, patch) => {
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, ...patch },
              draggable: patch.locked === undefined ? node.draggable : !patch.locked,
            }
          : node,
      );
      if (state.transactionStart) return { nodes, dirty: true };
      return withCheckpoint(state, { nodes, edges: state.edges });
    });
  },

  updateNodeStyle: (id, patch) => {
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === id ? { ...node, style: { ...node.style, ...patch } } : node,
      );
      if (state.transactionStart) return { nodes, dirty: true };
      return withCheckpoint(state, { nodes, edges: state.edges });
    });
  },

  updateNodePosition: (id, patch) => {
    set((state) => {
      const nodes = state.nodes.map((node) => (
        node.id === id ? { ...node, position: { ...node.position, ...patch } } : node
      ));
      if (state.transactionStart) return { nodes, dirty: true };
      return withCheckpoint(state, { nodes, edges: state.edges });
    });
  },

  arrangeNode: (id, direction) => {
    set((state) => {
      const target = state.nodes.find((node) => node.id === id);
      if (!target) return state;
      const values = state.nodes.map((node) => node.zIndex ?? 0);
      const current = target.zIndex ?? 0;
      const nextZ = direction === 'front'
        ? Math.max(...values) + 1
        : direction === 'back'
          ? Math.min(...values) - 1
          : direction === 'forward'
            ? current + 1
            : current - 1;
      const nodes = state.nodes.map((node) => node.id === id ? { ...node, zIndex: nextZ } : node);
      return withCheckpoint(state, { nodes, edges: state.edges });
    });
  },

  updateEdge: (id, patch) => {
    set((state) => {
      const edges = state.edges.map((edge) => {
        if (edge.id !== id) return edge;
        const data: FlowEdgeData = {
          label: patch.label ?? edge.data?.label,
          color: patch.color ?? edge.data?.color ?? 'oklch(0.430 0.025 70)',
          width: patch.width ?? edge.data?.width ?? 1.75,
          lineStyle: patch.lineStyle ?? edge.data?.lineStyle ?? 'solid',
          routing: patch.routing ?? edge.data?.routing ?? 'smoothstep',
          arrowStart: patch.arrowStart ?? edge.data?.arrowStart ?? 'none',
          arrowEnd: patch.arrowEnd ?? edge.data?.arrowEnd ?? 'closed',
        };
        const color = data.color;
        const lineStyle = data.lineStyle;
        return {
          ...edge,
          type: data.routing ?? edge.type,
          label: data.label,
          data,
          markerStart: createEdgeMarker(data.arrowStart, color),
          markerEnd: createEdgeMarker(data.arrowEnd, color),
          style: {
            ...edge.style,
            stroke: color,
            strokeWidth: data.width,
            strokeDasharray: lineStyle === 'dashed' ? '8 6' : lineStyle === 'dotted' ? '2 5' : undefined,
          },
        };
      });
      if (state.transactionStart) return { edges, dirty: true };
      return withCheckpoint(state, { nodes: state.nodes, edges });
    });
  },

  reverseEdge: (id) => {
    set((state) => {
      const edges = state.edges.map((edge) => {
        if (edge.id !== id) return edge;
        const color = edge.data?.color ?? 'oklch(0.430 0.025 70)';
        const arrowStart = edge.data?.arrowEnd ?? 'closed';
        const arrowEnd = edge.data?.arrowStart ?? 'none';
        return {
          ...edge,
          source: edge.target,
          target: edge.source,
          sourceHandle: edge.targetHandle,
          targetHandle: edge.sourceHandle,
          data: { ...edge.data!, arrowStart, arrowEnd },
          markerStart: createEdgeMarker(arrowStart, color),
          markerEnd: createEdgeMarker(arrowEnd, color),
        };
      });
      return withCheckpoint(state, { nodes: state.nodes, edges });
    });
  },

  reconnect: (edge, connection) => {
    set((state) => withCheckpoint(state, {
      nodes: state.nodes,
      edges: reconnectEdge(edge, connection, state.edges),
    }));
  },

  insertGraph: (incomingNodes, incomingEdges, offset = 36) => {
    set((state) => {
      if (incomingNodes.length === 0) return state;
      const idMap = new Map<string, string>();
      const stamp = Date.now().toString(36);
      const nodes = incomingNodes.map((node, index) => {
        const id = node.id + '-paste-' + stamp + '-' + index;
        idMap.set(node.id, id);
        return {
          ...cloneGraph(node),
          id,
          position: { x: node.position.x + offset, y: node.position.y + offset },
          selected: true,
        };
      });
      const edges = incomingEdges.flatMap((edge, index) => {
        const source = idMap.get(edge.source);
        const target = idMap.get(edge.target);
        if (!source || !target) return [];
        return [{
          ...cloneGraph(edge),
          id: edge.id + '-paste-' + stamp + '-' + index,
          source,
          target,
          selected: true,
        }];
      });
      return withCheckpoint(state, {
        nodes: [...state.nodes.map((node) => ({ ...node, selected: false })), ...nodes],
        edges: [...state.edges.map((edge) => ({ ...edge, selected: false })), ...edges],
      });
    });
  },

  deleteSelection: () => {
    set((state) => {
      const selectedIds = new Set(
        state.nodes.filter((node) => node.selected && !node.data.locked).map((node) => node.id),
      );
      const nodes = state.nodes.filter((node) => !node.selected || node.data.locked);
      const edges = state.edges.filter(
        (edge) => !edge.selected && !selectedIds.has(edge.source) && !selectedIds.has(edge.target),
      );
      if (nodes.length === state.nodes.length && edges.length === state.edges.length) return state;
      return withCheckpoint(state, { nodes, edges });
    });
  },

  duplicateSelection: () => {
    set((state) => {
      const selectedNodes = state.nodes.filter((node) => node.selected);
      if (selectedNodes.length === 0) return state;
      const idMap = new Map<string, string>();
      const duplicates = selectedNodes.map((node) => {
        const id = `${node.id}-copy-${Date.now().toString(36)}`;
        idMap.set(node.id, id);
        return {
          ...cloneGraph(node),
          id,
          position: { x: node.position.x + 32, y: node.position.y + 32 },
          selected: true,
        };
      });
      const edges = state.edges.map((edge) => ({ ...edge, selected: false }));
      const duplicatedEdges = state.edges
        .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
        .map((edge) => ({
          ...cloneGraph(edge),
          id: `${edge.id}-copy-${Date.now().toString(36)}`,
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!,
          selected: true,
        }));
      const nodes = [
        ...state.nodes.map((node) => ({ ...node, selected: false })),
        ...duplicates,
      ];
      return withCheckpoint(state, { nodes, edges: [...edges, ...duplicatedEdges] });
    });
  },

  selectAll: () => set((state) => ({
    nodes: state.nodes.map((node) => ({ ...node, selected: true })),
    edges: state.edges.map((edge) => ({ ...edge, selected: true })),
  })),

  clearSelection: () => set((state) => ({
    nodes: state.nodes.map((node) => ({ ...node, selected: false })),
    edges: state.edges.map((edge) => ({ ...edge, selected: false })),
  })),

  alignSelection: (axis) => {
    set((state) => {
      const selected = state.nodes.filter((node) => node.selected && !node.data.locked);
      if (selected.length < 2) return state;
      const boxes = selected.map((node) => ({ node, ...nodeSize(node) }));
      const left = Math.min(...boxes.map(({ node }) => node.position.x));
      const right = Math.max(...boxes.map(({ node, width }) => node.position.x + width));
      const top = Math.min(...boxes.map(({ node }) => node.position.y));
      const bottom = Math.max(...boxes.map(({ node, height }) => node.position.y + height));
      const nodes = state.nodes.map((node) => {
        if (!node.selected || node.data.locked) return node;
        const { width, height } = nodeSize(node);
        const position = { ...node.position };
        if (axis === 'left') position.x = left;
        if (axis === 'center-x') position.x = (left + right - width) / 2;
        if (axis === 'right') position.x = right - width;
        if (axis === 'top') position.y = top;
        if (axis === 'center-y') position.y = (top + bottom - height) / 2;
        if (axis === 'bottom') position.y = bottom - height;
        return { ...node, position };
      });
      return withCheckpoint(state, { nodes, edges: state.edges });
    });
  },

  distributeSelection: (axis) => {
    set((state) => {
      const selected = state.nodes.filter((node) => node.selected && !node.data.locked);
      if (selected.length < 3) return state;
      const sorted = [...selected].sort((a, b) =>
        axis === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y,
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = axis === 'horizontal'
        ? last.position.x - first.position.x
        : last.position.y - first.position.y;
      const step = span / (sorted.length - 1);
      const positions = new Map(sorted.map((node, index) => [
        node.id,
        axis === 'horizontal'
          ? { ...node.position, x: first.position.x + step * index }
          : { ...node.position, y: first.position.y + step * index },
      ]));
      const nodes = state.nodes.map((node) => positions.has(node.id) ? { ...node, position: positions.get(node.id)! } : node);
      return withCheckpoint(state, { nodes, edges: state.edges });
    });
  },

  layout: (direction) => {
    set((state) => withCheckpoint(state, layoutGraph(state.nodes, state.edges, direction)));
  },

  loadGraph: (title, nodes, edges) => {
    const graph = normalizeGraph(nodes, edges);
    set((state) => ({
      ...withCheckpoint(state, graph),
      title,
      transactionStart: null,
    }));
  },

  loadTemplate: (id) => {
    const template = getTemplate(id);
    set((state) => ({
      ...withCheckpoint(state, {
        nodes: cloneGraph(template.nodes),
        edges: cloneGraph(template.edges),
      }),
      title: template.name,
    }));
  },

  restoreDraft: (draft) => {
    const graph = normalizeGraph(draft.nodes, draft.edges);
    set({ title: draft.title, ...graph, past: [], future: [], dirty: false });
  },

  newDocument: () => {
    set((state) => ({
      ...withCheckpoint(state, { nodes: [], edges: [] }),
      title: '未命名流程图',
    }));
  },

  undo: () => {
    set((state) => {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...cloneGraph(previous),
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, MAX_HISTORY),
        transactionStart: null,
        dirty: true,
      };
    });
  },

  redo: () => {
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...cloneGraph(next),
        past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
        future: state.future.slice(1),
        transactionStart: null,
        dirty: true,
      };
    });
  },

  markSaved: () => set({ dirty: false, lastSavedAt: Date.now() }),
}));
