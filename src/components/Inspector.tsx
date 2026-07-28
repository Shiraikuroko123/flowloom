import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowRightToLine,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import type { FlowEdge, FlowNode, LineStyle, ShapeKind } from '../types';
import { SHAPE_LABELS } from '../lib/diagram';
import { useFlowStore } from '../store/flowStore';
import { IconButton } from './IconButton';

const swatches = [
  'oklch(1 0 0)',
  'oklch(0.955 0.045 76)',
  'oklch(0.935 0.050 172)',
  'oklch(0.955 0.025 245)',
  'oklch(0.955 0.026 300)',
  'oklch(0.965 0.030 36)',
  'oklch(0.965 0.065 95)',
  'oklch(0.220 0.018 70)',
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="field-label">{children}</span>;
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset className="color-control">
      <legend>{label}</legend>
      <div className="swatch-row">
        {swatches.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${value === color ? 'is-active' : ''}`}
            style={{ background: color }}
            aria-label={`${label} ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
      <input value={value} onChange={(event) => onChange(event.target.value)} aria-label={`${label} CSS 颜色值`} />
    </fieldset>
  );
}

interface InspectorProps {
  open: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onOpenAi: () => void;
}

export function Inspector({ open, nodes, edges, onOpenAi }: InspectorProps) {
  const selectedNodes = nodes.filter((node) => node.selected);
  const selectedEdges = edges.filter((edge) => edge.selected);
  const beginTransaction = useFlowStore((state) => state.beginTransaction);
  const endTransaction = useFlowStore((state) => state.endTransaction);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const updateNodeStyle = useFlowStore((state) => state.updateNodeStyle);
  const updateEdge = useFlowStore((state) => state.updateEdge);
  const alignSelection = useFlowStore((state) => state.alignSelection);
  const distributeSelection = useFlowStore((state) => state.distributeSelection);
  const layout = useFlowStore((state) => state.layout);
  const selectionCount = selectedNodes.length + selectedEdges.length;

  const transactionProps = {
    onFocus: beginTransaction,
    onBlur: endTransaction,
  };

  return (
    <aside
      className={open ? 'inspector is-open' : 'inspector'}
      aria-label="属性检查器"
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <div className="inspector__header">
        <div>
          <span className="inspector__eyebrow">属性</span>
          <strong>{selectionCount ? `已选择 ${selectionCount} 项` : '画布'}</strong>
        </div>
        <IconButton label="使用 AI 生成" icon={<Sparkles size={17} />} onClick={onOpenAi} />
      </div>

      <div className="inspector__body">
        {selectedNodes.length > 1 && (
          <section className="inspector-section">
            <h2>对齐</h2>
            <div className="icon-control-grid">
              <IconButton label="左对齐" icon={<AlignStartVertical size={16} />} onClick={() => alignSelection('left')} />
              <IconButton label="水平居中" icon={<AlignCenterVertical size={16} />} onClick={() => alignSelection('center-x')} />
              <IconButton label="右对齐" icon={<AlignEndVertical size={16} />} onClick={() => alignSelection('right')} />
              <IconButton label="顶部对齐" icon={<AlignStartHorizontal size={16} />} onClick={() => alignSelection('top')} />
              <IconButton label="垂直居中" icon={<AlignCenterHorizontal size={16} />} onClick={() => alignSelection('center-y')} />
              <IconButton label="底部对齐" icon={<AlignEndHorizontal size={16} />} onClick={() => alignSelection('bottom')} />
              <IconButton label="水平等距" icon={<AlignHorizontalDistributeCenter size={16} />} onClick={() => distributeSelection('horizontal')} />
              <IconButton label="垂直等距" icon={<AlignVerticalDistributeCenter size={16} />} onClick={() => distributeSelection('vertical')} />
            </div>
          </section>
        )}

        {selectedNodes.length === 1 && selectedEdges.length === 0 && (() => {
          const node = selectedNodes[0];
          const width = Number(node.measured?.width ?? node.width ?? node.style?.width ?? 176);
          const height = Number(node.measured?.height ?? node.height ?? node.style?.height ?? 72);
          return (
            <>
              <section className="inspector-section">
                <h2>内容</h2>
                <label className="field-stack">
                  <FieldLabel>文字</FieldLabel>
                  <textarea
                    value={node.data.label}
                    onChange={(event) => updateNodeData(node.id, { label: event.target.value })}
                    rows={2}
                    {...transactionProps}
                  />
                </label>
                <label className="field-stack">
                  <FieldLabel>说明</FieldLabel>
                  <textarea
                    value={node.data.description ?? ''}
                    onChange={(event) => updateNodeData(node.id, { description: event.target.value })}
                    rows={3}
                    placeholder="可选"
                    {...transactionProps}
                  />
                </label>
                <label className="field-stack">
                  <FieldLabel>图形</FieldLabel>
                  <select
                    value={node.data.kind}
                    onChange={(event) => updateNodeData(node.id, { kind: event.target.value as ShapeKind })}
                    {...transactionProps}
                  >
                    {(Object.entries(SHAPE_LABELS) as [ShapeKind, string][]).filter(([kind]) => kind !== 'image').map(([kind, label]) => (
                      <option key={kind} value={kind}>{label}</option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="inspector-section">
                <h2>尺寸与文字</h2>
                <div className="field-pair">
                  <label><FieldLabel>宽度</FieldLabel><input type="number" min="48" value={Math.round(width)} onChange={(event) => updateNodeStyle(node.id, { width: Number(event.target.value) })} {...transactionProps} /></label>
                  <label><FieldLabel>高度</FieldLabel><input type="number" min="36" value={Math.round(height)} onChange={(event) => updateNodeStyle(node.id, { height: Number(event.target.value) })} {...transactionProps} /></label>
                </div>
                <div className="field-pair">
                  <label><FieldLabel>字号</FieldLabel><input type="number" min="10" max="48" value={node.data.fontSize} onChange={(event) => updateNodeData(node.id, { fontSize: Number(event.target.value) })} {...transactionProps} /></label>
                  <label><FieldLabel>圆角</FieldLabel><input type="number" min="0" max="48" value={node.data.radius} onChange={(event) => updateNodeData(node.id, { radius: Number(event.target.value) })} {...transactionProps} /></label>
                </div>
              </section>

              <section className="inspector-section">
                <h2>外观</h2>
                <ColorControl label="填充" value={node.data.fill} onChange={(fill) => updateNodeData(node.id, { fill })} />
                <ColorControl label="边框" value={node.data.stroke} onChange={(stroke) => updateNodeData(node.id, { stroke })} />
                <ColorControl label="文字" value={node.data.textColor} onChange={(textColor) => updateNodeData(node.id, { textColor })} />
                <label className="field-stack">
                  <FieldLabel>透明度 {Math.round(node.data.opacity * 100)}%</FieldLabel>
                  <input type="range" min="0.1" max="1" step="0.05" value={node.data.opacity} onChange={(event) => updateNodeData(node.id, { opacity: Number(event.target.value) })} {...transactionProps} />
                </label>
                <label className="toggle-row">
                  <input type="checkbox" checked={Boolean(node.data.locked)} onChange={(event) => updateNodeData(node.id, { locked: event.target.checked })} />
                  <LockKeyhole size={15} aria-hidden="true" /> 锁定图形
                </label>
              </section>
            </>
          );
        })()}

        {selectedEdges.length === 1 && selectedNodes.length === 0 && (() => {
          const edge = selectedEdges[0];
          return (
            <>
              <section className="inspector-section">
                <h2>连接线</h2>
                <label className="field-stack">
                  <FieldLabel>标签</FieldLabel>
                  <input value={String(edge.data?.label ?? edge.label ?? '')} onChange={(event) => updateEdge(edge.id, { label: event.target.value })} {...transactionProps} />
                </label>
                <fieldset className="segmented-field">
                  <legend>路径</legend>
                  {(['smoothstep', 'straight', 'bezier'] as const).map((routing) => (
                    <button key={routing} type="button" className={edge.data?.routing === routing ? 'is-active' : ''} onClick={() => updateEdge(edge.id, { routing })}>
                      {routing === 'smoothstep' ? '折线' : routing === 'straight' ? '直线' : '曲线'}
                    </button>
                  ))}
                </fieldset>
                <fieldset className="segmented-field">
                  <legend>线型</legend>
                  {(['solid', 'dashed', 'dotted'] as LineStyle[]).map((lineStyle) => (
                    <button key={lineStyle} type="button" className={edge.data?.lineStyle === lineStyle ? 'is-active' : ''} onClick={() => updateEdge(edge.id, { lineStyle })}>
                      {lineStyle === 'solid' ? '实线' : lineStyle === 'dashed' ? '虚线' : '点线'}
                    </button>
                  ))}
                </fieldset>
                <label className="field-stack">
                  <FieldLabel>线宽 {edge.data?.width ?? 1.75}px</FieldLabel>
                  <input type="range" min="1" max="6" step="0.25" value={edge.data?.width ?? 1.75} onChange={(event) => updateEdge(edge.id, { width: Number(event.target.value) })} {...transactionProps} />
                </label>
                <ColorControl label="线条" value={edge.data?.color ?? 'oklch(0.430 0.025 70)'} onChange={(color) => updateEdge(edge.id, { color })} />
              </section>
            </>
          );
        })()}

        {selectionCount === 0 && (
          <>
            <section className="inspector-section inspector-section--summary">
              <div><span>节点</span><strong>{nodes.length}</strong></div>
              <div><span>连线</span><strong>{edges.length}</strong></div>
            </section>
            <section className="inspector-section">
              <h2>自动布局</h2>
              <div className="layout-actions">
                <button className="secondary-button" onClick={() => layout('TB')}><ArrowDownToLine size={16} /> 纵向</button>
                <button className="secondary-button" onClick={() => layout('LR')}><ArrowRightToLine size={16} /> 横向</button>
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
