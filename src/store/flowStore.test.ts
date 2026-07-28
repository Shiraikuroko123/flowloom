import { beforeEach, describe, expect, it } from 'vitest';
import { createFlowEdge, createFlowNode } from '../lib/diagram';
import { useFlowStore } from './flowStore';

describe('flow store safety', () => {
  beforeEach(() => {
    useFlowStore.setState({
      title: 'test',
      nodes: [],
      edges: [],
      past: [],
      future: [],
      transactionStart: null,
      dirty: false,
      lastSavedAt: null,
    });
  });

  it('keeps unselected locked nodes when deleting a selection', () => {
    const locked = createFlowNode('process', { x: 0, y: 0 }, '受保护', { id: 'locked' });
    locked.data = { ...locked.data, locked: true };
    locked.draggable = false;
    const selected = createFlowNode('process', { x: 200, y: 0 }, '待删除', { id: 'selected', selected: true });
    useFlowStore.setState({ nodes: [locked, selected], edges: [createFlowEdge('locked', 'selected')] });

    useFlowStore.getState().deleteSelection();

    expect(useFlowStore.getState().nodes.map((node) => node.id)).toEqual(['locked']);
    expect(useFlowStore.getState().edges).toHaveLength(0);
  });

  it('updates React Flow drag behavior when a node is locked or unlocked', () => {
    const node = createFlowNode('process', { x: 0, y: 0 }, '可编辑', { id: 'node' });
    useFlowStore.setState({ nodes: [node] });

    useFlowStore.getState().updateNodeData('node', { locked: true });
    expect(useFlowStore.getState().nodes[0].draggable).toBe(false);

    useFlowStore.getState().updateNodeData('node', { locked: false });
    expect(useFlowStore.getState().nodes[0].draggable).toBe(true);
  });
});
