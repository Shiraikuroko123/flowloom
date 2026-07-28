import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FlowEdge, FlowNode, ScientificFigureSpec } from '../types';
import { ShapeVisual } from '../components/ShapeVisual';
import { estimateSvgTextWidth } from './diagram';
import { getShapeDefinition } from './shapeRegistry';
import { mmToPx } from './scientific';

interface NodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function numeric(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function linearSrgb(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function channelHex(value: number): string {
  return Math.round(linearSrgb(value) * 255).toString(16).padStart(2, '0');
}

function portableColor(value: string): string {
  const color = value.trim();
  if (!color || color === 'none' || color === 'transparent' || !color.toLowerCase().startsWith('oklch(')) return color || 'none';
  const match = color.match(/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i);
  if (!match) return color;
  const lightness = Number(match[1]) > 1 ? Number(match[1]) / 100 : Number(match[1]);
  const chroma = Number(match[2]);
  const hue = Number(match[3]) * Math.PI / 180;
  const alphaValue = match[4]
    ? Number.parseFloat(match[4]) / (match[4].endsWith('%') ? 100 : 1)
    : 1;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const hex = `#${channelHex(red)}${channelHex(green)}${channelHex(blue)}`;
  return alphaValue < 1 ? `${hex}${Math.round(Math.max(0, Math.min(1, alphaValue)) * 255).toString(16).padStart(2, '0')}` : hex;
}

function absolutePosition(node: FlowNode, byId: Map<string, FlowNode>): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  const seen = new Set<string>();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

function effectiveZIndex(node: FlowNode, byId: Map<string, FlowNode>): number {
  let value = node.zIndex ?? 0;
  let parentId = node.parentId;
  const seen = new Set<string>();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    value += parent.zIndex ?? 0;
    parentId = parent.parentId;
  }
  return value;
}

function nodeBox(node: FlowNode, byId: Map<string, FlowNode>, origin: { x: number; y: number }): NodeBox {
  const position = absolutePosition(node, byId);
  return {
    x: position.x - origin.x,
    y: position.y - origin.y,
    width: numeric(node.style?.width, node.measured?.width ?? node.width ?? 1),
    height: numeric(node.style?.height, node.measured?.height ?? node.height ?? 1),
  };
}

function transformForBox(box: NodeBox, rotation: number): string {
  return rotation
    ? ` transform="rotate(${rotation} ${box.x + box.width / 2} ${box.y + box.height / 2})"`
    : '';
}

function serializeAttributes(attributes: Record<string, string | number>): string {
  return Object.entries(attributes)
    .filter(([name]) => !name.toLowerCase().startsWith('on'))
    .map(([name, value]) => `${escapeXml(name)}="${escapeXml(value)}"`)
    .join(' ');
}

function wrapText(value: string, maxWidth: number, fontSize: number): string[] {
  const explicit = value.split(/\r?\n/);
  const lines: string[] = [];
  for (const paragraph of explicit) {
    if (estimateSvgTextWidth(paragraph, fontSize) <= maxWidth) {
      lines.push(paragraph);
      continue;
    }
    let line = '';
    for (const character of Array.from(paragraph)) {
      if (line && estimateSvgTextWidth(line + character, fontSize) > maxWidth) {
        lines.push(line);
        line = character.trimStart();
      } else {
        line += character;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [''];
}

function serializeNodeText(node: FlowNode, box: NodeBox): string {
  if (!node.data.label.trim() || node.data.kind === 'vector' || node.data.kind === 'image' || node.data.textColor === 'transparent') return '';
  const definition = getShapeDefinition(node.data.kind);
  const fontSize = node.data.fontSize;
  const lines = wrapText(node.data.label, Math.max(1, box.width - 20), fontSize);
  const lineHeight = fontSize * 1.2;
  const textAnchor = node.data.textAlign === 'left' ? 'start' : node.data.textAlign === 'right' ? 'end' : 'middle';
  const x = node.data.textAlign === 'left' ? box.x + 10 : node.data.textAlign === 'right' ? box.x + box.width - 10 : box.x + box.width / 2;
  const placement = definition.textPlacement;
  const totalHeight = Math.max(1, lines.length) * lineHeight;
  const startY = placement === 'header' || placement === 'lane' || node.data.verticalAlign === 'top'
    ? box.y + fontSize + 8
    : placement === 'footer' || node.data.verticalAlign === 'bottom'
      ? box.y + box.height - totalHeight + fontSize - 8
      : box.y + (box.height - totalHeight) / 2 + fontSize;
  const tspans = lines.map((line, index) => `<tspan x="${x}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`).join('');
  const label = `<text fill="${escapeXml(portableColor(node.data.textColor))}" font-family="Segoe UI, Microsoft YaHei UI, Arial, sans-serif" font-size="${fontSize}" font-weight="${node.data.fontWeight}" text-anchor="${textAnchor}">${tspans}</text>`;
  if (!node.data.description?.trim()) return label;
  const descriptionY = Math.min(box.y + box.height - 5, startY + lines.length * lineHeight + fontSize * 0.7);
  return `${label}<text x="${x}" y="${descriptionY}" fill="${escapeXml(portableColor(node.data.textColor))}" fill-opacity="0.72" font-family="Segoe UI, Microsoft YaHei UI, Arial, sans-serif" font-size="${Math.max(7, fontSize * 0.78)}" text-anchor="${textAnchor}">${escapeXml(node.data.description)}</text>`;
}

function serializeVectorNode(node: FlowNode, box: NodeBox): string {
  const vector = node.data.vector;
  if (!vector) return '';
  const attributes = { ...vector.attributes };
  attributes.fill = portableColor(vector.tag === 'text' ? node.data.textColor : node.data.fill);
  attributes.stroke = portableColor(node.data.stroke);
  attributes['stroke-width'] = node.data.borderWidth;
  attributes['vector-effect'] = 'non-scaling-stroke';
  if (vector.tag === 'text') {
    attributes['font-size'] = node.data.fontSize;
    attributes['font-weight'] = node.data.fontWeight;
    attributes['text-anchor'] = node.data.textAlign === 'center' ? 'middle' : node.data.textAlign === 'right' ? 'end' : 'start';
    attributes['dominant-baseline'] = node.data.verticalAlign === 'middle' ? 'central' : node.data.verticalAlign === 'top' ? 'hanging' : 'auto';
  }
  const content = vector.tag === 'text' ? escapeXml(node.data.label) : '';
  const primitive = `<${vector.tag} ${serializeAttributes(attributes)}>${content}</${vector.tag}>`;
  return `<g opacity="${node.data.opacity}"${transformForBox(box, node.data.rotation ?? 0)}><svg x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" viewBox="${vector.viewBox.join(' ')}" preserveAspectRatio="none" overflow="visible">${primitive}</svg></g>`;
}

function serializeShapeNode(node: FlowNode, box: NodeBox): string {
  if (node.data.kind === 'image') {
    if (!node.data.imageUrl) return '';
    return `<g opacity="${node.data.opacity}"${transformForBox(box, node.data.rotation ?? 0)}><image x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" href="${escapeXml(node.data.imageUrl)}" preserveAspectRatio="none"/></g>`;
  }
  const fill = portableColor(node.data.fill);
  const stroke = portableColor(node.data.stroke);
  const visibleGeometry = !['none', 'transparent'].includes(fill) || !['none', 'transparent'].includes(stroke);
  let shape = '';
  if (visibleGeometry) {
    const markup = renderToStaticMarkup(createElement(ShapeVisual, {
      kind: node.data.kind,
      fill,
      stroke,
      strokeWidth: node.data.borderWidth,
      radius: node.data.radius,
    }));
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const root = parsed.documentElement;
    if (!parsed.querySelector('parsererror')) {
      root.setAttribute('x', String(box.x));
      root.setAttribute('y', String(box.y));
      root.setAttribute('width', String(box.width));
      root.setAttribute('height', String(box.height));
      root.removeAttribute('class');
      root.removeAttribute('aria-hidden');
      root.removeAttribute('focusable');
      shape = new XMLSerializer().serializeToString(root);
    }
  }
  const text = serializeNodeText(node, box);
  if (!shape && !text) return '';
  return `<g opacity="${node.data.opacity}"${transformForBox(box, node.data.rotation ?? 0)}>${shape}${text}</g>`;
}

function connectionPoint(box: NodeBox, handle: string | null | undefined, other: NodeBox): { x: number; y: number } {
  const normalized = handle?.toLowerCase();
  if (normalized === 'top') return { x: box.x + box.width / 2, y: box.y };
  if (normalized === 'right') return { x: box.x + box.width, y: box.y + box.height / 2 };
  if (normalized === 'bottom') return { x: box.x + box.width / 2, y: box.y + box.height };
  if (normalized === 'left') return { x: box.x, y: box.y + box.height / 2 };
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
  const dx = otherCenter.x - center.x;
  const dy = otherCenter.y - center.y;
  if (Math.abs(dx) > Math.abs(dy)) return { x: dx >= 0 ? box.x + box.width : box.x, y: center.y };
  return { x: center.x, y: dy >= 0 ? box.y + box.height : box.y };
}

function edgePath(edge: FlowEdge, source: { x: number; y: number }, target: { x: number; y: number }): string {
  if (edge.data?.routing === 'straight') return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  if (edge.data?.routing === 'bezier') {
    const offset = Math.max(40, Math.abs(target.x - source.x) * 0.45);
    return `M ${source.x} ${source.y} C ${source.x + offset} ${source.y}, ${target.x - offset} ${target.y}, ${target.x} ${target.y}`;
  }
  const vertical = Math.abs(target.y - source.y) >= Math.abs(target.x - source.x);
  if (vertical) {
    const middleY = (source.y + target.y) / 2;
    return `M ${source.x} ${source.y} L ${source.x} ${middleY} L ${target.x} ${middleY} L ${target.x} ${target.y}`;
  }
  const middleX = (source.x + target.x) / 2;
  return `M ${source.x} ${source.y} L ${middleX} ${source.y} L ${middleX} ${target.y} L ${target.x} ${target.y}`;
}

function serializeEdges(edges: FlowEdge[], boxes: Map<string, NodeBox>): string {
  const values: string[] = [];
  for (const edge of edges) {
    if (edge.hidden) continue;
    const sourceBox = boxes.get(edge.source);
    const targetBox = boxes.get(edge.target);
    if (!sourceBox || !targetBox) continue;
    const source = connectionPoint(sourceBox, edge.sourceHandle, targetBox);
    const target = connectionPoint(targetBox, edge.targetHandle, sourceBox);
    const color = portableColor(edge.data?.color ?? '#555555');
    const width = edge.data?.width ?? 1.75;
    const dash = edge.data?.lineStyle === 'dashed' ? ' stroke-dasharray="8 6"' : edge.data?.lineStyle === 'dotted' ? ' stroke-dasharray="2 5"' : '';
    const id = edge.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const markerStart = edge.data?.arrowStart && edge.data.arrowStart !== 'none' ? ` marker-start="url(#marker-start-${id})"` : '';
    const markerEnd = edge.data?.arrowEnd && edge.data.arrowEnd !== 'none' ? ` marker-end="url(#marker-end-${id})"` : '';
    const markers = [
      edge.data?.arrowStart && edge.data.arrowStart !== 'none' ? `<marker id="marker-start-${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 10 1 L 1 5 L 10 9${edge.data.arrowStart === 'closed' ? ' Z' : ''}" fill="${edge.data.arrowStart === 'closed' ? color : 'none'}" stroke="${color}" stroke-width="1.2"/></marker>` : '',
      edge.data?.arrowEnd && edge.data.arrowEnd !== 'none' ? `<marker id="marker-end-${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9${edge.data.arrowEnd === 'closed' ? ' Z' : ''}" fill="${edge.data.arrowEnd === 'closed' ? color : 'none'}" stroke="${color}" stroke-width="1.2"/></marker>` : '',
    ].join('');
    const path = edgePath(edge, source, target);
    const label = String(edge.data?.label ?? edge.label ?? '').trim();
    const labelMarkup = label
      ? `<text x="${(source.x + target.x) / 2}" y="${(source.y + target.y) / 2 - 5}" text-anchor="middle" fill="${color}" stroke="#ffffff" stroke-width="4" paint-order="stroke" font-family="Segoe UI, Microsoft YaHei UI, Arial, sans-serif" font-size="11" font-weight="600">${escapeXml(label)}</text>`
      : '';
    values.push(`<defs>${markers}</defs><path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash}${markerStart}${markerEnd}/>${labelMarkup}`);
  }
  return values.join('');
}

export function serializePublicationSvg(
  title: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  spec: ScientificFigureSpec,
  options: { origin?: { x: number; y: number } } = {},
): string {
  const width = mmToPx(spec.widthMm);
  const height = mmToPx(spec.heightMm);
  const figureNode = nodes.find((node) => node.data.scientificRole === 'figure-background');
  const origin = options.origin ?? figureNode?.position ?? { x: 0, y: 0 };
  const visibleNodes = nodes.filter((node) => !node.hidden && !node.data.hidden && !node.data.exportExcluded);
  const byId = new Map(visibleNodes.map((node) => [node.id, node]));
  const boxes = new Map(visibleNodes.map((node) => [node.id, nodeBox(node, byId, origin)]));
  const sortedNodes = visibleNodes
    .filter((node) => node.data.scientificRole !== 'figure-background')
    .sort((left, right) => effectiveZIndex(left, byId) - effectiveZIndex(right, byId));
  const background = spec.background === 'transparent' ? '' : `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`;
  const serializeNodes = (values: FlowNode[]) => values.map((node) => {
    const box = boxes.get(node.id)!;
    return node.data.kind === 'vector' ? serializeVectorNode(node, box) : serializeShapeNode(node, box);
  }).join('');
  const backgroundNodes = sortedNodes.filter((node) => node.data.schematicRole === 'frame' || node.data.schematicRole === 'phase');
  const foregroundNodes = sortedNodes.filter((node) => node.data.schematicRole !== 'frame' && node.data.schematicRole !== 'phase');
  const provenance = visibleNodes
    .filter((node) => node.data.provenance)
    .map((node) => ({
      id: node.data.provenance!.id,
      kind: node.data.provenance!.kind,
      sourceName: node.data.provenance!.sourceName,
      chartType: node.data.provenance!.chartType,
      fields: node.data.provenance!.fields,
      engine: node.data.provenance!.engine,
      schematic: node.data.provenance!.schematic,
      generatedAt: node.data.provenance!.generatedAt,
    }));
  const metadata = escapeXml(JSON.stringify({ title, figure: spec, provenance }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${spec.widthMm}mm" height="${spec.heightMm}mm" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}"><title>${escapeXml(title)}</title><metadata>${metadata}</metadata>${background}${serializeNodes(backgroundNodes)}${serializeEdges(edges, boxes)}${serializeNodes(foregroundNodes)}</svg>\n`;
}
