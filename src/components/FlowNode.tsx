import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  Handle,
  NodeResizer,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from '@xyflow/react';
import { FileImage, LockKeyhole } from 'lucide-react';
import type { FlowNode as FlowNodeType } from '../types';
import { useFlowStore } from '../store/flowStore';

const positions = [Position.Top, Position.Right, Position.Bottom, Position.Left];

export function FlowNode({ id, data, selected }: NodeProps<FlowNodeType>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const beginTransaction = useFlowStore((state) => state.beginTransaction);
  const endTransaction = useFlowStore((state) => state.endTransaction);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => setDraft(data.label), [data.label]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const finishEditing = () => {
    const next = draft.trim() || '未命名';
    updateNodeData(id, { label: next });
    endTransaction();
    setEditing(false);
    updateNodeInternals(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') finishEditing();
    if (event.key === 'Escape') {
      setDraft(data.label);
      endTransaction();
      setEditing(false);
    }
  };

  const variables = {
    '--node-fill': data.fill,
    '--node-stroke': data.stroke,
    '--node-text': data.textColor,
    '--node-border-width': `${data.borderWidth}px`,
    '--node-radius': `${data.radius}px`,
    '--node-font-size': `${data.fontSize}px`,
    '--node-font-weight': data.fontWeight,
    '--node-opacity': data.opacity,
  } as CSSProperties;

  const visualContent = data.kind === 'image' ? (
    <div className="flow-node__image-wrap">
      {data.imageUrl?.startsWith('data:application/pdf') ? (
        <object className="flow-node__object" data={data.imageUrl} type="application/pdf" aria-label={data.label} />
      ) : data.imageUrl ? (
        <img className="flow-node__image" src={data.imageUrl} alt={data.label} draggable={false} />
      ) : (
        <FileImage aria-hidden="true" />
      )}
      {data.imageUrl
        ? <span className="sr-only">{data.label}</span>
        : <span className="flow-node__image-label">{data.label}</span>}
    </div>
  ) : editing ? (
    <input
      ref={inputRef}
      className="flow-node__editor nodrag"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={finishEditing}
      onKeyDown={handleKeyDown}
      aria-label="图形文字"
    />
  ) : (
    <>
      <span className="flow-node__label">{data.label}</span>
      {data.description && <span className="flow-node__description">{data.description}</span>}
    </>
  );

  return (
    <div
      className={`flow-node flow-node--${data.kind} ${selected ? 'is-selected' : ''} ${data.locked ? 'is-locked' : ''}`}
      style={variables}
      onDoubleClick={(event) => {
        if (data.locked || data.kind === 'image') return;
        event.stopPropagation();
        beginTransaction();
        setEditing(true);
      }}
      aria-label={`${data.label}，${data.kind}`}
    >
      <NodeResizer
        color="oklch(0.560 0.155 72)"
        isVisible={selected && !data.locked}
        minWidth={data.kind === 'group' ? 220 : 72}
        minHeight={data.kind === 'group' ? 140 : 44}
        onResizeStart={beginTransaction}
        onResizeEnd={endTransaction}
      />
      {positions.map((position) => (
        <Handle
          key={position}
          id={position.toLowerCase()}
          type="source"
          position={position}
          className="flow-node__handle"
          isConnectable={!data.locked}
        />
      ))}
      <div className="flow-node__content">{visualContent}</div>
      {data.locked && <LockKeyhole className="flow-node__lock" size={13} aria-hidden="true" />}
    </div>
  );
}
