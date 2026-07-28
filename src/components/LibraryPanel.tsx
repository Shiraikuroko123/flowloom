import { useMemo, useState, type DragEvent } from 'react';
import {
  CircleStop,
  Database,
  Diamond,
  FileInput,
  FileText,
  Group,
  Image,
  Keyboard,
  RectangleHorizontal,
  Search,
  StickyNote,
} from 'lucide-react';
import type { ShapeKind } from '../types';
import { SHAPE_LABELS } from '../lib/diagram';
import { templates } from '../data/templates';

const shapeIcons: Record<ShapeKind, typeof CircleStop> = {
  start: CircleStop,
  process: RectangleHorizontal,
  decision: Diamond,
  document: FileText,
  data: FileInput,
  database: Database,
  manual: Keyboard,
  note: StickyNote,
  group: Group,
  image: Image,
};

const primaryShapes = (Object.keys(shapeIcons) as ShapeKind[]).filter((kind) => kind !== 'image');

interface LibraryPanelProps {
  open: boolean;
  onAddShape: (kind: ShapeKind) => void;
  onLoadTemplate: (id: string) => void;
}

export function LibraryPanel({ open, onAddShape, onLoadTemplate }: LibraryPanelProps) {
  const [tab, setTab] = useState<'shapes' | 'templates'>('shapes');
  const [query, setQuery] = useState('');
  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return templates;
    return templates.filter((template) => `${template.name} ${template.category} ${template.description}`.toLowerCase().includes(normalized));
  }, [query]);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, kind: ShapeKind) => {
    event.dataTransfer.setData('application/flowloom-shape', kind);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      className={open ? 'library-panel is-open' : 'library-panel'}
      aria-label="图形库"
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <div className="panel-tabs" role="tablist" aria-label="图形库视图">
        <button role="tab" aria-selected={tab === 'shapes'} className={tab === 'shapes' ? 'is-active' : ''} onClick={() => setTab('shapes')}>
          图形
        </button>
        <button role="tab" aria-selected={tab === 'templates'} className={tab === 'templates' ? 'is-active' : ''} onClick={() => setTab('templates')}>
          模板
        </button>
      </div>

      {tab === 'shapes' ? (
        <div className="library-panel__body">
          <div className="shape-grid">
            {primaryShapes.map((kind) => {
              const ShapeIcon = shapeIcons[kind];
              return (
                <button
                  key={kind}
                  className="shape-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, kind)}
                  onClick={() => onAddShape(kind)}
                >
                  <span className={`shape-item__preview shape-item__preview--${kind}`}><ShapeIcon size={21} aria-hidden="true" /></span>
                  <span>{SHAPE_LABELS[kind]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="library-panel__body">
          <label className="search-field">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">搜索模板</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板" />
          </label>
          <div className="template-list">
            {filteredTemplates.map((template) => (
              <button key={template.id} className="template-item" onClick={() => onLoadTemplate(template.id)}>
                <span className="template-item__meta">{template.category}</span>
                <strong>{template.name}</strong>
                <span>{template.description}</span>
                <small>{template.nodes.length} 个节点</small>
              </button>
            ))}
            {filteredTemplates.length === 0 && <p className="panel-empty">没有匹配的模板</p>}
          </div>
        </div>
      )}
    </aside>
  );
}
