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

  it('reverses connector endpoints and arrowheads as one undoable change', () => {
    const source = createFlowNode('process', { x: 0, y: 0 }, 'A', { id: 'a' });
    const target = createFlowNode('process', { x: 200, y: 0 }, 'B', { id: 'b' });
    const edge = createFlowEdge('a', 'b');
    edge.id = 'edge';
    edge.data = { ...edge.data!, arrowStart: 'open', arrowEnd: 'closed' };
    useFlowStore.setState({ nodes: [source, target], edges: [edge] });

    useFlowStore.getState().reverseEdge('edge');

    expect(useFlowStore.getState().edges[0]).toMatchObject({
      source: 'b',
      target: 'a',
      data: { arrowStart: 'closed', arrowEnd: 'open' },
    });
    expect(useFlowStore.getState().past).toHaveLength(1);
  });

  it('updates exact position and stacking order', () => {
    const first = createFlowNode('process', { x: 0, y: 0 }, 'A', { id: 'a', zIndex: 0 });
    const second = createFlowNode('process', { x: 200, y: 0 }, 'B', { id: 'b', zIndex: 2 });
    useFlowStore.setState({ nodes: [first, second] });

    useFlowStore.getState().updateNodePosition('a', { x: 48, y: 96 });
    useFlowStore.getState().arrangeNode('a', 'front');

    expect(useFlowStore.getState().nodes.find((node) => node.id === 'a')).toMatchObject({
      position: { x: 48, y: 96 },
      zIndex: 3,
    });
  });

  it('selects a newly added shape and clears the previous selection', () => {
    const existing = createFlowNode('process', { x: 0, y: 0 }, 'A', { id: 'a', selected: true });
    const added = createFlowNode('document', { x: 200, y: 0 }, 'B', { id: 'b' });
    useFlowStore.setState({ nodes: [existing] });

    useFlowStore.getState().addNode(added);

    expect(useFlowStore.getState().nodes.map((node) => [node.id, node.selected])).toEqual([
      ['a', false],
      ['b', true],
    ]);
  });
});
