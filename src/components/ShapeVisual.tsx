import { memo, type ReactNode } from 'react';
import type { ShapeKind } from '../types';

interface ShapeVisualProps {
  kind: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  className?: string;
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
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
  x,
  y,
  width,
  height,
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
    case 'bpmn-send-task':
    case 'bpmn-receive-task':
    case 'bpmn-manual-task':
    case 'bpmn-business-rule-task':
    case 'bpmn-script-task':
    case 'bpmn-call-activity':
    case 'bpmn-transaction':
    case 'uml-state':
    case 'uml-activity':
    case 'arch-service':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" rx={kind.startsWith('bpmn-') ? 10 : Math.max(10, softRadius)} {...outline} />
          {kind === 'bpmn-call-activity' && <rect x="6" y="6" width="88" height="88" rx="7" {...detail} />}
          {kind === 'bpmn-transaction' && <rect x="7" y="7" width="86" height="86" rx="7" {...detail} />}
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
          {(kind === 'bpmn-send-task' || kind === 'bpmn-receive-task') && (
            <g {...detail}>
              <rect x="7" y="22" width="22" height="17" fill={kind === 'bpmn-send-task' ? stroke : 'none'} />
              <path d="M8 23L18 31L28 23" stroke={kind === 'bpmn-send-task' ? fill : stroke} />
            </g>
          )}
          {kind === 'bpmn-manual-task' && <path d="M7 40V25C7 20 12 20 12 25V32V20C12 15 17 15 17 20V31V22C17 17 22 17 22 22V34L25 29C28 25 33 29 30 34L24 43H13Z" {...detail} />}
          {kind === 'bpmn-business-rule-task' && (
            <g {...detail}>
              <rect x="7" y="20" width="23" height="24" />
              <path d="M7 28H30M14 20V44M22 28V44" />
            </g>
          )}
          {kind === 'bpmn-script-task' && <path d="M8 20H29C25 25 32 30 28 35S31 43 27 45H8C12 40 5 36 9 31S5 24 8 20ZM13 28H24M13 34H23M13 40H21" {...detail} />}
          {kind === 'arch-service' && (
            <g {...detail}>
              <circle cx="18" cy="32" r="8" />
              <circle cx="18" cy="32" r="3" />
              <path d="M18 19V24M18 40V45M5 32H10M26 32H31M9 23L13 27M23 37L27 41M27 23L23 27M13 37L9 41" />
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
    case 'bpmn-message-event':
    case 'bpmn-timer-event':
    case 'bpmn-error-event':
    case 'bpmn-signal-event':
      geometry = (
        <>
          <circle cx="50" cy="50" r="46" {...outline} />
          {kind === 'bpmn-message-event' && <path d="M25 34H75V66H25ZM26 35L50 54L74 35" {...detail} />}
          {kind === 'bpmn-timer-event' && (
            <g {...detail}>
              <circle cx="50" cy="50" r="23" />
              <path d="M50 27V33M50 67V73M27 50H33M67 50H73M50 50V36M50 50L61 57" />
            </g>
          )}
          {kind === 'bpmn-error-event' && <path d="M32 72L44 48L41 29L65 41L55 55L59 72Z" {...heavy} />}
          {kind === 'bpmn-signal-event' && <polygon points="50,27 73,68 27,68" {...detail} />}
        </>
      );
      break;
    case 'bpmn-exclusive-gateway':
    case 'bpmn-parallel-gateway':
    case 'bpmn-inclusive-gateway':
    case 'bpmn-event-gateway':
    case 'bpmn-complex-gateway':
      geometry = (
        <>
          <polygon points="50,2 98,50 50,98 2,50" {...outline} />
          {kind === 'bpmn-exclusive-gateway' && <path d="M34 34L66 66M66 34L34 66" {...heavy} />}
          {kind === 'bpmn-parallel-gateway' && <path d="M50 28V72M28 50H72" {...heavy} />}
          {kind === 'bpmn-inclusive-gateway' && <circle cx="50" cy="50" r="20" {...heavy} />}
          {kind === 'bpmn-event-gateway' && (
            <>
              <circle cx="50" cy="50" r="22" {...detail} />
              <circle cx="50" cy="50" r="17" {...detail} />
              <polygon points="50,37 63,47 58,62 42,62 37,47" {...detail} />
            </>
          )}
          {kind === 'bpmn-complex-gateway' && <path d="M50 28V72M31 39L69 61M31 61L69 39" {...heavy} />}
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
    case 'uml-interface':
      geometry = (
        <g {...detail}>
          <circle cx="50" cy="26" r="20" fill={fill} />
          <path d="M50 46V78" />
        </g>
      );
      break;
    case 'uml-object':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" {...outline} />
          <path d="M22 66H78" {...detail} />
        </>
      );
      break;
    case 'uml-artifact':
      geometry = (
        <>
          <path d="M10 2H72L92 22V98H10Z" {...outline} />
          <path d="M72 2V22H92M28 70H74M28 80H66" {...detail} />
          <circle cx="24" cy="40" r="6" {...detail} />
          <path d="M30 40H39" {...detail} />
        </>
      );
      break;
    case 'uml-node':
      geometry = (
        <>
          <path d="M16 18L34 2H98V82L80 98H16Z" {...outline} />
          <path d="M16 18H80L98 2M80 18V98" {...detail} />
        </>
      );
      break;
    case 'uml-decision':
      geometry = <polygon points="50,2 98,50 50,98 2,50" {...outline} />;
      break;
    case 'uml-final-state':
      geometry = (
        <>
          <circle cx="50" cy="50" r="46" {...outline} />
          <circle cx="50" cy="50" r="31" fill={stroke} stroke="none" />
        </>
      );
      break;
    case 'uml-lifeline':
      geometry = (
        <>
          <rect x="8" y="2" width="84" height="24" {...outline} />
          <path d="M50 26V98" strokeDasharray="6 5" {...detail} />
        </>
      );
      break;
    case 'erd-entity':
      geometry = <rect x="2" y="2" width="96" height="96" {...outline} />;
      break;
    case 'erd-weak-entity':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" {...outline} />
          <rect x="7" y="7" width="86" height="86" {...detail} />
        </>
      );
      break;
    case 'erd-relationship':
    case 'erd-identifying-relationship':
      geometry = (
        <>
          <polygon points="50,2 98,50 50,98 2,50" {...outline} />
          {kind === 'erd-identifying-relationship' && <polygon points="50,10 90,50 50,90 10,50" {...detail} />}
        </>
      );
      break;
    case 'erd-attribute':
    case 'erd-key-attribute':
    case 'erd-multivalued-attribute':
      geometry = (
        <>
          <ellipse cx="50" cy="50" rx="48" ry="44" {...outline} />
          {kind === 'erd-multivalued-attribute' && <ellipse cx="50" cy="50" rx="42" ry="37" {...detail} />}
          {kind === 'erd-key-attribute' && <path d="M24 68H76" {...detail} />}
        </>
      );
      break;
    case 'erd-table':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" {...outline} />
          <path d="M2 26H98M2 50H98M2 74H98M31 26V98" {...detail} />
        </>
      );
      break;
    case 'arch-api':
      geometry = (
        <>
          <polygon points="18,2 82,2 98,50 82,98 18,98 2,50" {...outline} />
          <path d="M25 50H75M62 37L75 50L62 63" {...detail} />
        </>
      );
      break;
    case 'arch-server':
      geometry = (
        <>
          <rect x="10" y="4" width="80" height="92" rx="4" {...outline} />
          <path d="M10 34H90M10 64H90" {...detail} />
          <circle cx="23" cy="20" r="3" fill={stroke} /><circle cx="23" cy="49" r="3" fill={stroke} /><circle cx="23" cy="79" r="3" fill={stroke} />
          <path d="M35 20H75M35 49H75M35 79H75" {...detail} />
        </>
      );
      break;
    case 'arch-database':
    case 'arch-cache':
      geometry = (
        <>
          <path d="M8 18C8 8 27 2 50 2S92 8 92 18V82C92 92 73 98 50 98S8 92 8 82Z" {...outline} />
          <ellipse cx="50" cy="18" rx="42" ry="16" {...detail} />
          {kind === 'arch-cache' && <path d="M26 54H74M34 42L26 54L34 66M66 42L74 54L66 66" {...heavy} />}
        </>
      );
      break;
    case 'arch-queue':
      geometry = (
        <>
          <rect x="2" y="2" width="96" height="96" rx="4" {...outline} />
          <path d="M18 28H82M18 50H82M18 72H82" {...detail} />
          <circle cx="13" cy="28" r="3" fill={stroke} /><circle cx="13" cy="50" r="3" fill={stroke} /><circle cx="13" cy="72" r="3" fill={stroke} />
        </>
      );
      break;
    case 'arch-storage':
      geometry = (
        <>
          <path d="M2 18H38V6H64L76 18H98V94H2Z" {...outline} />
          <path d="M20 46H80M20 62H72" {...detail} />
        </>
      );
      break;
    case 'arch-load-balancer':
      geometry = (
        <>
          <circle cx="50" cy="50" r="46" {...outline} />
          <path d="M50 22V78M50 30L30 50M50 30L70 50M30 50V72M70 50V72M22 72H38M62 72H78" {...heavy} />
        </>
      );
      break;
    case 'arch-firewall':
      geometry = (
        <>
          <rect x="2" y="8" width="96" height="84" {...outline} />
          <path d="M2 29H98M2 50H98M2 71H98M25 8V29M73 8V29M14 29V50M50 29V50M86 29V50M25 50V71M73 50V71M14 71V92M50 71V92M86 71V92" {...detail} />
        </>
      );
      break;
    case 'arch-client':
      geometry = (
        <>
          <rect x="8" y="8" width="84" height="62" rx="4" {...outline} />
          <path d="M50 70V84M30 90H70" {...heavy} />
          <path d="M16 18H84V60H16Z" {...detail} />
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
    case 'scientific-image-frame':
      geometry = (
        <>
          <rect x="3" y="4" width="94" height="76" rx="4" {...outline} />
          <circle cx="74" cy="25" r="8" {...detail} />
          <path d="M8 70L31 43L45 57L58 39L92 70ZM8 70H92" {...detail} />
          <path d="M8 86H38M62 86H92" {...detail} />
        </>
      );
      break;
    case 'scientific-token-strip':
      geometry = (
        <>
          <rect x="2" y="10" width="96" height="57" rx="7" {...outline} />
          {[7, 22, 37, 52, 67, 82].map((tokenX, index) => (
            <rect key={tokenX} x={tokenX} y={index % 2 === 0 ? 21 : 27} width="11" height={index % 2 === 0 ? 26 : 20} rx="3" {...detail} />
          ))}
          <path d="M8 76H89M84 71L90 76L84 81" {...detail} />
        </>
      );
      break;
    case 'scientific-transformer':
      geometry = (
        <>
          <rect x="5" y="3" width="90" height="82" rx="7" {...outline} />
          <rect x="15" y="12" width="70" height="16" rx="3" {...detail} />
          <rect x="15" y="36" width="70" height="16" rx="3" {...detail} />
          <rect x="15" y="60" width="70" height="16" rx="3" {...detail} />
          <path d="M50 28V36M50 52V60M9 20H15M85 68H91" {...detail} />
          <circle cx="50" cy="32" r="2.5" fill={stroke} stroke="none" />
          <circle cx="50" cy="56" r="2.5" fill={stroke} stroke="none" />
        </>
      );
      break;
    case 'scientific-layer-stack':
      geometry = (
        <>
          <rect x="24" y="5" width="70" height="62" rx="5" {...detail} />
          <rect x="15" y="13" width="70" height="62" rx="5" {...detail} />
          <rect x="6" y="21" width="70" height="62" rx="5" {...outline} />
          <path d="M17 36H65M17 49H65M17 62H65" {...detail} />
          <text x="84" y="39" fill={stroke} stroke="none" fontSize="10" fontWeight="700">N×</text>
        </>
      );
      break;
    case 'scientific-dataset-stack':
      geometry = (
        <>
          <rect x="18" y="5" width="76" height="55" rx="4" {...detail} />
          <rect x="10" y="14" width="76" height="55" rx="4" {...detail} />
          <rect x="3" y="23" width="76" height="55" rx="4" {...outline} />
          <path d="M12 36H69M12 48H69M12 60H55" {...detail} />
          <circle cx="72" cy="84" r="5" {...detail} />
          <path d="M58 84H67M77 84H92" {...detail} />
        </>
      );
      break;
    case 'scientific-frozen':
      geometry = (
        <>
          <rect x="4" y="4" width="92" height="76" rx="8" strokeDasharray="5 4" {...outline} />
          <path d="M50 17V63M30 28L70 52M30 52L70 28M44 22L50 28L56 22M44 58L50 52L56 58M32 34L40 36L38 28M62 52L60 44L68 46M38 52L40 44L32 46M68 34L60 36L62 28" {...detail} />
        </>
      );
      break;
    case 'scientific-trainable':
      geometry = (
        <>
          <rect x="4" y="4" width="92" height="76" rx="8" {...outline} />
          <path d="M23 61L40 44L52 53L75 28M62 28H75V41" {...heavy} />
          <path d="M20 67H80M20 67V18" {...detail} />
          <circle cx="40" cy="44" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="52" cy="53" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </>
      );
      break;
    case 'scientific-camera':
      geometry = (
        <>
          <path d="M10 27H30L38 18H64L72 27H89V70H10Z" {...outline} />
          <circle cx="50" cy="49" r="15" {...detail} />
          <circle cx="50" cy="49" r="7" {...detail} />
          <path d="M25 70V79M17 79H33M80 35H84" {...detail} />
        </>
      );
      break;
    case 'scientific-robot-arm':
      geometry = (
        <>
          <path d="M12 78H50V88H8V84Z" {...outline} />
          <path d="M29 78L35 58L55 48L67 25" {...heavy} />
          <circle cx="29" cy="77" r="8" {...outline} />
          <circle cx="36" cy="57" r="7" {...outline} />
          <circle cx="56" cy="47" r="7" {...outline} />
          <circle cx="68" cy="24" r="6" {...outline} />
          <path d="M73 21L84 13M73 27L86 32M84 13L91 18M86 32L93 27" {...detail} />
        </>
      );
      break;
    case 'scientific-humanoid':
      geometry = (
        <g {...detail}>
          <circle cx="50" cy="16" r="10" fill={fill} />
          <path d="M38 31H62L66 58L57 66H43L34 58ZM38 36L20 53M62 36L80 53M44 66L32 88M56 66L68 88" />
          <circle cx="19" cy="54" r="4" fill={fill} />
          <circle cx="81" cy="54" r="4" fill={fill} />
          <path d="M25 89H36M64 89H75" {...heavy} />
        </g>
      );
      break;
    case 'scientific-mobile-robot':
      geometry = (
        <>
          <path d="M16 49H84L91 72H9Z" {...outline} />
          <circle cx="27" cy="76" r="10" {...outline} />
          <circle cx="73" cy="76" r="10" {...outline} />
          <path d="M50 49V27H69V42H50M56 27V16H73L83 22L73 28" {...detail} />
          <circle cx="75" cy="22" r="4" {...detail} />
        </>
      );
      break;
    case 'scientific-trajectory':
      geometry = (
        <>
          <path d="M7 65C20 20 40 78 57 42C67 20 78 30 91 16" {...heavy} />
          {[{ x: 9, y: 61 }, { x: 29, y: 45 }, { x: 49, y: 53 }, { x: 68, y: 29 }].map((point) => (
            <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ))}
          <path d="M80 15L92 15L90 27" {...detail} />
          <path d="M8 78H92" strokeDasharray="3 5" {...detail} />
        </>
      );
      break;
    case 'scientific-voxel-grid':
      geometry = (
        <>
          <path d="M50 7L91 28L50 50L9 28ZM9 28V68L50 91L91 68V28M50 50V91" {...outline} />
          <path d="M29 18L70 40M70 18L29 40M29 39V79M70 39V79M9 48L50 70L91 48M9 58L50 80L91 58" {...detail} />
          <rect x="42" y="31" width="16" height="16" fill={stroke} opacity="0.18" stroke="none" />
          <rect x="58" y="51" width="13" height="13" fill={stroke} opacity="0.32" stroke="none" />
        </>
      );
      break;
    case 'scientific-coordinate-frame':
      geometry = (
        <>
          <circle cx="35" cy="68" r="4" fill={stroke} stroke="none" />
          <path d="M35 68L85 68M35 68L35 17M35 68L12 88M79 63L87 68L79 73M30 23L35 15L40 23M17 78L10 90L23 86" {...heavy} />
          <text x="88" y="72" fill={stroke} stroke="none" fontSize="11" fontWeight="700">x</text>
          <text x="31" y="13" fill={stroke} stroke="none" fontSize="11" fontWeight="700">y</text>
          <text x="5" y="94" fill={stroke} stroke="none" fontSize="11" fontWeight="700">z</text>
        </>
      );
      break;
    case 'scientific-timeline':
      geometry = (
        <>
          {[5, 29, 53, 77].map((frameX, index) => (
            <g key={frameX}>
              <rect x={frameX} y={index % 2 === 0 ? 12 : 19} width="18" height="35" rx="3" {...detail} />
              <circle cx={frameX + 9} cy="62" r="3.5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            </g>
          ))}
          <path d="M8 62H91M85 57L92 62L85 67" {...detail} />
          <path d="M14 51V58M38 54V58M62 51V58M86 54V58" {...detail} />
        </>
      );
      break;
    case 'scientific-mini-plot':
      geometry = (
        <>
          <rect x="4" y="4" width="92" height="80" rx="3" {...outline} />
          <path d="M17 68H88M17 68V14M17 50H88M17 32H88M40 14V68M64 14V68" strokeDasharray="2 4" opacity="0.5" {...detail} />
          <path d="M18 61C32 58 37 36 48 42S66 54 87 19" {...heavy} />
          <path d="M18 54C30 39 44 56 55 34S73 25 87 28" {...detail} />
        </>
      );
      break;
    case 'scientific-action-chunk':
      geometry = (
        <>
          <rect x="2" y="12" width="96" height="55" rx="9" {...outline} />
          {[8, 21, 34, 47, 60, 73, 86].map((actionX, index) => (
            <rect key={actionX} x={actionX} y={index % 3 === 1 ? 25 : 20} width="9" height={index % 3 === 1 ? 24 : 34} rx="4" {...detail} />
          ))}
          <path d="M8 76H91M85 71L92 76L85 81" {...detail} />
        </>
      );
      break;
    case 'scientific-loss-target':
      geometry = (
        <>
          <circle cx="48" cy="42" r="34" {...outline} />
          <circle cx="48" cy="42" r="22" {...detail} />
          <circle cx="48" cy="42" r="9" {...detail} />
          <path d="M80 10L58 32M72 9H81V18" {...heavy} />
          <path d="M17 84H82" {...detail} />
        </>
      );
      break;
    case 'vector':
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
      x={x}
      y={y}
      width={width}
      height={height}
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
