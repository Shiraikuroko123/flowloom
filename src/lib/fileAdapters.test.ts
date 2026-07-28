import { describe, expect, it } from 'vitest';
import {
  aiPayloadToGraph,
  importDiagramFile,
  serializeDocument,
  serializeDrawio,
  serializeMermaid,
} from './fileAdapters';
import { createFlowEdge, createFlowNode } from './diagram';
import { VISIBLE_SHAPES } from './shapeRegistry';

describe('diagram file adapters', () => {
  it('imports Mermaid nodes, decisions, labels, and edges', async () => {
    const source = `flowchart LR
      start([开始]) --> check{资料完整？}
      check -->|是| done([完成])
      check -->|否| retry[补充资料]
      retry --> check`;
    const result = await importDiagramFile(new File([source], 'approval.mmd', { type: 'text/plain' }));

    expect(result.sourceFormat).toBe('Mermaid');
    expect(result.fidelity).toBe('structural');
    expect(result.nodes).toHaveLength(4);
    expect(result.nodes.find((node) => node.id === 'check')?.data.kind).toBe('decision');
    expect(result.edges).toHaveLength(4);
    expect(result.edges.some((edge) => edge.data?.label === '是')).toBe(true);
    expect(result.nodes.some((node) => node.position.x !== 0)).toBe(true);
  });

  it('imports uncompressed draw.io XML with geometry and style', async () => {
    const source = `<mxfile><diagram name="Page-1"><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/>
      <mxCell id="a" value="开始" style="ellipse=1;fillColor=#ffffff;strokeColor=#008060;" vertex="1" parent="1"><mxGeometry x="20" y="30" width="120" height="52" as="geometry"/></mxCell>
      <mxCell id="b" value="审核" style="rhombus;fillColor=#fff3c4;" vertex="1" parent="1"><mxGeometry x="220" y="20" width="100" height="80" as="geometry"/></mxCell>
      <mxCell id="e" value="提交" edge="1" source="a" target="b" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
    </root></mxGraphModel></diagram></mxfile>`;
    const result = await importDiagramFile(new File([source], 'review.drawio', { type: 'application/xml' }));

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.find((node) => node.id === 'a')?.position).toEqual({ x: 20, y: 30 });
    expect(result.nodes.find((node) => node.id === 'b')?.data.kind).toBe('decision');
    expect(result.edges[0].data?.label).toBe('提交');
  });

  it('round-trips the native editable document schema', async () => {
    const first = createFlowNode('start', { x: 10, y: 20 }, '开始', { id: 'first' });
    const second = createFlowNode('process', { x: 200, y: 20 }, '处理', { id: 'second' });
    const edge = createFlowEdge('first', 'second', '继续');
    const serialized = serializeDocument('测试流程', [first, second], [edge]);
    const result = await importDiagramFile(new File([serialized], 'test.flow.json', { type: 'application/json' }));

    expect(result.title).toBe('测试流程');
    expect(result.nodes.map((node) => node.data.label)).toEqual(['开始', '处理']);
    expect(result.edges[0].source).toBe('first');
  });

  it('imports Excalidraw bound shapes and arrows', async () => {
    const source = JSON.stringify({
      type: 'excalidraw',
      elements: [
        { id: 'box', type: 'rectangle', x: 10, y: 20, width: 180, height: 70, backgroundColor: '#fff', strokeColor: '#222' },
        { id: 'label', type: 'text', containerId: 'box', text: '处理订单' },
        { id: 'end', type: 'ellipse', x: 300, y: 20, width: 120, height: 60, backgroundColor: '#fff', strokeColor: '#222' },
        { id: 'arrow', type: 'arrow', startBinding: { elementId: 'box' }, endBinding: { elementId: 'end' } },
      ],
    });
    const result = await importDiagramFile(new File([source], 'flow.excalidraw', { type: 'application/json' }));

    expect(result.nodes.find((node) => node.id === 'box')?.data.label).toBe('处理订单');
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({ source: 'box', target: 'end' });
  });

  it('converts and exports AI graph payloads without orphaning valid edges', () => {
    const graph = aiPayloadToGraph({
      title: '退款审批',
      direction: 'TB',
      nodes: [
        { id: 'start', label: '提交申请', kind: 'start' },
        { id: 'risk', label: '风险检查', kind: 'decision' },
        { id: 'done', label: '退款完成', kind: 'start' },
      ],
      edges: [
        { source: 'start', target: 'risk' },
        { source: 'risk', target: 'done', label: '通过' },
      ],
    });

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(serializeMermaid(graph.nodes, graph.edges)).toContain('|通过|');
    expect(serializeDrawio(graph.title, graph.nodes, graph.edges)).toContain('<mxGraphModel');
  });

  it('round-trips every registered editable shape through draw.io', async () => {
    const nodes = VISIBLE_SHAPES.map((definition, index) => createFlowNode(
      definition.kind,
      { x: (index % 8) * 220, y: Math.floor(index / 8) * 150 },
      definition.label,
      { id: `shape-${index}` },
    ));
    nodes[0].data = {
      ...nodes[0].data,
      description: '保留说明；包含特殊字符',
      fontWeight: 700,
      textAlign: 'right',
      verticalAlign: 'bottom',
      locked: true,
    };
    const edge = createFlowEdge(nodes[0].id, nodes[1].id, '双向');
    edge.data = { ...edge.data!, arrowStart: 'open', arrowEnd: 'closed', lineStyle: 'dotted', width: 2.5 };

    const source = serializeDrawio('完整图形库', nodes, [edge]);
    const result = await importDiagramFile(new File([source], 'all-shapes.drawio', { type: 'application/xml' }));

    expect(result.nodes.map((node) => node.data.kind)).toEqual(VISIBLE_SHAPES.map((definition) => definition.kind));
    expect(result.nodes[0].data).toMatchObject({
      description: '保留说明；包含特殊字符',
      fontWeight: 700,
      textAlign: 'right',
      verticalAlign: 'bottom',
      locked: true,
    });
    expect(result.edges[0].data).toMatchObject({ arrowStart: 'open', arrowEnd: 'closed', lineStyle: 'dotted', width: 2.5 });
  });
});
