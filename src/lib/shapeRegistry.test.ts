import { describe, expect, it } from 'vitest';
import { SHAPE_KINDS } from '../types';
import { createFlowNode, findOpenNodePosition } from './diagram';
import { SHAPE_REGISTRY, VISIBLE_SHAPES, getShapeDefinition } from './shapeRegistry';

describe('shape registry', () => {
  it('defines every serialized shape kind exactly once', () => {
    const registeredKinds = SHAPE_REGISTRY.map((definition) => definition.kind);

    expect(new Set(registeredKinds).size).toBe(registeredKinds.length);
    expect(new Set(registeredKinds)).toEqual(new Set(SHAPE_KINDS));
    expect(VISIBLE_SHAPES.length).toBeGreaterThanOrEqual(55);
  });

  it('provides usable geometry metadata and defaults for every shape', () => {
    for (const kind of SHAPE_KINDS) {
      const definition = getShapeDefinition(kind);
      const node = createFlowNode(kind, { x: 0, y: 0 });

      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.standardName.length).toBeGreaterThan(0);
      expect(definition.width).toBeGreaterThanOrEqual(definition.minWidth);
      expect(definition.height).toBeGreaterThanOrEqual(definition.minHeight);
      expect(node.data.kind).toBe(kind);
      expect(node.data.textAlign).toBe('center');
      expect(node.data.verticalAlign).toBe('middle');
    }
  });

  it('avoids stacking repeated click-created shapes on top of existing nodes', () => {
    const existing = createFlowNode('process', { x: 0, y: 0 });
    const position = findOpenNodePosition([existing], 'process', { x: 88, y: 36 });

    expect(position).not.toEqual({ x: 0, y: 0 });
  });
});
