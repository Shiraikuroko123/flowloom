import { memo, type ReactNode } from 'react';
import type { ShapeKind } from '../types';

interface ShapeVisualProps {
  kind: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  className?: string;
}

interface PrimitiveProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
  vectorEffect: 'non-scaling-stroke';
  strokeLinejoin: 'round';
  strokeLinecap: 'round';
}

function geometryProps(fill: string, stroke: string, strokeWidth: number): PrimitiveProps {
  return {
    fill,
    stroke,
    strokeWidth,
    vectorEffect: 'non-scaling-stroke',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  };
}

function ShapeVisualComponent({
  kind,
  fill = 'var(--surface-raised)',
  stroke = 'currentColor',
  strokeWidth = 1.5,
  radius = 6,
  className,
}: ShapeVisualProps) {
  const outline = geometryProps(fill, stroke, strokeWidth);
  const detail = geometryProps('none', stroke, strokeWidth);
  const heavy = geometryProps('none', stroke, Math.max(strokeWidth * 2.25, strokeWidth + 1));
  const softRadius = Math.max(0, Math.min(24, radius));
  let geometry: ReactNode;

  switch (kind) {
    case 'start':
      geometry = <rect x="2" y="2" width="96" height="96" rx="48" {...outline} />;
      break;
    case 'process':
    case 'rectangle':
      geometry = <rect x="2" y="2" width="96" height="96" rx={kind === 'process' ? Math.min(softRadius, 4) : 0} {...outline} />;
      break;
    case 'rounded-rectangle':
    case 'bpmn-task':
    case 'bpmn-user-task':
    case 'bpmn-service-task':
    case 'uml-state':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" rx={kind.startsWith('bpmn-') ? 10 : Math.max(10, softRadius)} {...outline} />
          {kind === 'bpmn-user-task' && (
            <g {...detail}>
              <circle cx="15" cy="24" r="5" />
              <path d="M7 43c1-9 15-9 16 0M10 32l5 5 5-5" />
            </g>
          )}
          {kind === 'bpmn-service-task' && (
            <g {...detail}>
              <circle cx="15" cy="31" r="8" />
              <circle cx="15" cy="31" r="3" />
              <path d="M15 18v5M15 39v5M2 31h5M23 31h5M6 22l4 4M20 36l4 4M24 22l-4 4M10 36l-4 4" />
            </g>
          )}
        </>
      );
      break;
    case 'decision':
      geometry = <polygon points="50,2 98,50 50,98 2,50" {...outline} />;
      break;
    case 'data':
      geometry = <polygon points="18,2 98,2 82,98 2,98" {...outline} />;
      break;
    case 'document':
      geometry = <path d="M2 2H98V78C78 66 66 96 44 82C28 72 18 91 2 84Z" {...outline} />;
      break;
    case 'multiple-documents':
      geometry = (
        <>
          <path d="M14 2H98V72C80 62 68 86 48 76C34 68 25 82 14 78Z" {...outline} />
          <path d="M8 10H92V80C74 70 62 94 42 84C28 76 19 90 8 86Z" {...outline} />
          <path d="M2 18H86V88C68 78 56 100 36 92C22 84 13 98 2 94Z" {...outline} />
        </>
      );
      break;
    case 'predefined-process':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" {...outline} />
          <path d="M16 2V98M84 2V98" {...detail} />
        </>
      );
      break;
    case 'preparation':
    case 'hexagon':
      geometry = <polygon points="18,2 82,2 98,50 82,98 18,98 2,50" {...outline} />;
      break;
    case 'manual':
      geometry = <polygon points="2,20 98,2 98,98 2,98" {...outline} />;
      break;
    case 'manual-operation':
      geometry = <polygon points="2,2 98,2 82,98 18,98" {...outline} />;
      break;
    case 'stored-data':
      geometry = <path d="M18 2H98C88 30 88 70 98 98H18C7 98 2 76 2 50S7 2 18 2Z" {...outline} />;
      break;
    case 'database':
    case 'bpmn-data-store':
      geometry = (
        <>
          <path d="M2 18C2 7 23 2 50 2S98 7 98 18V82C98 93 77 98 50 98S2 93 2 82Z" {...outline} />
          <path d="M2 18C2 29 23 34 50 34S98 29 98 18" {...detail} />
          {kind === 'bpmn-data-store' && <path d="M2 72C2 83 23 88 50 88S98 83 98 72" {...detail} />}
        </>
      );
      break;
    case 'internal-storage':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" {...outline} />
          <path d="M20 2V98M2 22H98" {...detail} />
        </>
      );
      break;
    case 'display':
      geometry = <path d="M20 2H78C92 2 98 25 98 50S92 98 78 98H20L2 50Z" {...outline} />;
      break;
    case 'delay':
      geometry = <path d="M2 2H50A48 48 0 0 1 50 98H2Z" {...outline} />;
      break;
    case 'on-page-connector':
    case 'ellipse':
    case 'uml-use-case':
      geometry = <ellipse cx="50" cy="50" rx="48" ry="48" {...outline} />;
      break;
    case 'off-page-connector':
      geometry = <polygon points="2,2 98,2 98,70 50,98 2,70" {...outline} />;
      break;
    case 'merge':
      geometry = <polygon points="2,2 98,2 50,98" {...outline} />;
      break;
    case 'extract':
    case 'triangle':
      geometry = <polygon points="50,2 98,98 2,98" {...outline} />;
      break;
    case 'sort':
      geometry = (
        <>
          <polygon points="50,2 98,50 50,98 2,50" {...outline} />
          <line x1="18" y1="50" x2="82" y2="50" {...detail} />
        </>
      );
      break;
    case 'collate':
      geometry = <path d="M2 2L98 2L50 50L98 98H2L50 50Z" {...outline} />;
      break;
    case 'summing-junction':
      geometry = (
        <>
          <circle cx="50" cy="50" r="48" {...outline} />
          <path d="M50 25V75M25 50H75" {...detail} />
        </>
      );
      break;
    case 'or-junction':
      geometry = (
        <>
          <circle cx="50" cy="50" r="48" {...outline} />
          <path d="M31 31L69 69M69 31L31 69" {...detail} />
        </>
      );
      break;
    case 'sequential-storage':
      geometry = (
        <>
          <circle cx="50" cy="48" r="44" {...outline} />
          <path d="M50 92H92V98" {...detail} />
        </>
      );
      break;
    case 'direct-storage':
      geometry = (
        <>
          <path d="M14 2H86C94 2 98 23 98 50S94 98 86 98H14C6 98 2 77 2 50S6 2 14 2Z" {...outline} />
          <path d="M14 2C22 2 26 23 26 50S22 98 14 98" {...detail} />
        </>
      );
      break;
    case 'paper-tape':
      geometry = <path d="M2 16C22 2 35 2 50 12S78 22 98 8V84C78 98 65 98 50 88S22 78 2 92Z" {...outline} />;
      break;
    case 'punched-card':
      geometry = <polygon points="20,2 98,2 98,98 2,98 2,20" {...outline} />;
      break;
    case 'loop-limit':
      geometry = <polygon points="16,2 84,2 98,20 98,98 2,98 2,20" {...outline} />;
      break;
    case 'annotation':
      geometry = (
        <>
          <path d="M2 2V98M2 2H20M2 98H20" {...detail} />
          <path d="M20 50H98" strokeDasharray="5 5" {...detail} />
        </>
      );
      break;
    case 'bpmn-start-event':
      geometry = <circle cx="50" cy="50" r="46" {...outline} />;
      break;
    case 'bpmn-intermediate-event':
      geometry = (
        <>
          <circle cx="50" cy="50" r="46" {...outline} />
          <circle cx="50" cy="50" r="38" {...detail} />
        </>
      );
      break;
    case 'bpmn-end-event':
      geometry = <circle cx="50" cy="50" r="44" {...heavy} fill={fill} />;
      break;
    case 'bpmn-exclusive-gateway':
    case 'bpmn-parallel-gateway':
    case 'bpmn-inclusive-gateway':
      geometry = (
        <>
          <polygon points="50,2 98,50 50,98 2,50" {...outline} />
          {kind === 'bpmn-exclusive-gateway' && <path d="M34 34L66 66M66 34L34 66" {...heavy} />}
          {kind === 'bpmn-parallel-gateway' && <path d="M50 28V72M28 50H72" {...heavy} />}
          {kind === 'bpmn-inclusive-gateway' && <circle cx="50" cy="50" r="20" {...heavy} />}
        </>
      );
      break;
    case 'bpmn-data-object':
      geometry = (
        <>
          <path d="M8 2H70L92 24V98H8Z" {...outline} />
          <path d="M70 2V24H92" {...detail} />
        </>
      );
      break;
    case 'bpmn-pool':
    case 'swimlane':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" {...outline} />
          <line x1="13" y1="2" x2="13" y2="98" {...detail} />
        </>
      );
      break;
    case 'uml-actor':
      geometry = (
        <g {...detail}>
          <circle cx="50" cy="17" r="11" fill={fill} />
          <path d="M50 28V62M28 42H72M50 62L31 86M50 62L69 86" />
        </g>
      );
      break;
    case 'uml-class':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" {...outline} />
          <path d="M2 28H98M2 62H98" {...detail} />
        </>
      );
      break;
    case 'uml-package':
      geometry = <path d="M2 18H38V2H70L82 18H98V98H2Z" {...outline} />;
      break;
    case 'uml-component':
      geometry = (
        <>
          <rect x="12" y="2" width="86" height="96" {...outline} />
          <rect x="2" y="24" width="22" height="17" {...outline} />
          <rect x="2" y="58" width="22" height="17" {...outline} />
        </>
      );
      break;
    case 'uml-note':
    case 'note':
      geometry = (
        <>
          <path d="M2 2H78L98 22V98H2Z" {...outline} />
          <path d="M78 2V22H98" {...detail} />
        </>
      );
      break;
    case 'cloud':
      geometry = <path d="M24 88C10 88 2 78 2 65C2 52 11 43 23 42C22 25 34 13 49 13C60 13 70 20 75 31C88 31 98 41 98 54C98 65 92 73 84 77C80 87 71 92 60 90C50 98 35 96 24 88Z" {...outline} />;
      break;
    case 'callout':
      geometry = <path d="M2 2H98V76H36L18 98L22 76H2Z" {...outline} />;
      break;
    case 'group':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" rx="2" strokeDasharray="6 4" {...outline} />
          <line x1="2" y1="16" x2="98" y2="16" strokeDasharray="6 4" {...detail} />
        </>
      );
      break;
    case 'image':
      geometry = <rect x="2" y="2" width="96" height="96" rx="2" {...outline} />;
      break;
    default: {
      const exhaustiveKind: never = kind;
      throw new Error(`Unsupported shape: ${exhaustiveKind}`);
    }
  }

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      {geometry}
    </svg>
  );
}

export const ShapeVisual = memo(ShapeVisualComponent);
ShapeVisual.displayName = 'ShapeVisual';
