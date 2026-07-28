import JSZip from 'jszip';
import pako from 'pako';
import { parse as parseYaml } from 'yaml';
import type {
  FlowEdge,
  FlowNode,
  ImportResult,
  ShapeKind,
} from '../types';
import {
  createFlowEdge,
  createFlowNode,
  layoutGraph,
  normalizeGraph,
  sanitizeKind,
  SHAPE_DIMENSIONS,
} from './diagram';
import { createId } from './id';

const STRUCTURED_EXTENSIONS = new Set([
  'json',
  'flow',
  'drawio',
  'xml',
  'mmd',
  'mermaid',
  'dot',
  'gv',
  'bpmn',
  'excalidraw',
  'svg',
  'csv',
  'yaml',
  'yml',
  'puml',
  'plantuml',
]);

function extensionOf(name: string): string {
  return name.toLowerCase().split('.').pop() ?? '';
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('无法读取 ' + file.name));
    reader.readAsText(file);
  });
}

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('无法读取 ' + file.name));
    reader.readAsArrayBuffer(file);
  });
}

function textContent(value: string): string {
  const document = new DOMParser().parseFromString(`<body>${value}</body>`, 'text/html');
  return (document.body.textContent ?? '').trim();
}

function parseStyle(style: string | null): Record<string, string> {
  return Object.fromEntries(
    (style ?? '')
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const [key, ...rest] = entry.split('=');
        return [key, rest.join('=')];
      }),
  );
}

function mapMxShape(style: Record<string, string>): ShapeKind {
  const shape = `${style.shape ?? ''} ${Object.keys(style).join(' ')}`.toLowerCase();
  if (shape.includes('rhombus') || shape.includes('diamond')) return 'decision';
  if (shape.includes('cylinder') || shape.includes('database')) return 'database';
  if (shape.includes('document')) return 'document';
  if (shape.includes('parallelogram') || shape.includes('data')) return 'data';
  if (shape.includes('manual')) return 'manual';
  if (shape.includes('note')) return 'note';
  if (shape.includes('swimlane') || shape.includes('group')) return 'group';
  if (style.ellipse === '1' || shape.includes('ellipse') || shape.includes('terminator')) return 'start';
  return 'process';
}

function decodeDrawioPayload(payload: string): string {
  const compact = payload.trim();
  if (compact.startsWith('<mxGraphModel')) return compact;
  const binary = atob(compact);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const inflated = pako.inflateRaw(bytes, { to: 'string' });
  try {
    return decodeURIComponent(inflated);
  } catch {
    return inflated;
  }
}

function importDrawio(source: string, title: string): ImportResult {
  const outer = new DOMParser().parseFromString(source, 'application/xml');
  if (outer.querySelector('parsererror')) throw new Error('draw.io XML 无法解析。');

  let graphDocument = outer;
  if (!outer.querySelector('mxGraphModel')) {
    const diagram = outer.querySelector('diagram');
    if (!diagram?.textContent?.trim()) throw new Error('文件中没有可读取的 draw.io 图页。');
    graphDocument = new DOMParser().parseFromString(decodeDrawioPayload(diagram.textContent), 'application/xml');
  }

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const warnings: string[] = [];
  const cells = Array.from(graphDocument.querySelectorAll('mxCell'));

  for (const cell of cells) {
    const id = cell.getAttribute('id') ?? createId('node');
    const geometry = cell.querySelector(':scope > mxGeometry') ?? cell.querySelector('mxGeometry');
    if (cell.getAttribute('vertex') === '1' && geometry) {
      const style = parseStyle(cell.getAttribute('style'));
      const kind = mapMxShape(style);
      const width = Number(geometry.getAttribute('width')) || SHAPE_DIMENSIONS[kind].width;
      const height = Number(geometry.getAttribute('height')) || SHAPE_DIMENSIONS[kind].height;
      const node = createFlowNode(
        kind,
        {
          x: Number(geometry.getAttribute('x')) || 0,
          y: Number(geometry.getAttribute('y')) || 0,
        },
        textContent(cell.getAttribute('value') ?? '') || '未命名',
        { id, style: { width, height } },
      );
      node.data = {
        ...node.data,
        fill: style.fillColor && style.fillColor !== 'none' ? style.fillColor : node.data.fill,
        stroke: style.strokeColor && style.strokeColor !== 'none' ? style.strokeColor : node.data.stroke,
        textColor: style.fontColor ?? node.data.textColor,
        borderWidth: Number(style.strokeWidth) || node.data.borderWidth,
        fontSize: Number(style.fontSize) || node.data.fontSize,
        fontWeight: style.fontStyle === '1' ? 700 : node.data.fontWeight,
        radius: style.rounded === '1' ? 10 : node.data.radius,
      };
      nodes.push(node);
    }

    if (cell.getAttribute('edge') === '1') {
      const source = cell.getAttribute('source');
      const target = cell.getAttribute('target');
      if (!source || !target) {
        warnings.push(`跳过了未绑定两端的连接线 ${id}。`);
        continue;
      }
      const style = parseStyle(cell.getAttribute('style'));
      const routing = style.edgeStyle?.includes('orthogonal') ? 'smoothstep' : style.curved === '1' ? 'bezier' : 'straight';
      const edge = createFlowEdge(source, target, textContent(cell.getAttribute('value') ?? ''), routing);
      edge.id = id;
      if (style.strokeColor) {
        edge.data = { ...edge.data!, color: style.strokeColor };
        edge.style = { ...edge.style, stroke: style.strokeColor };
      }
      edges.push(edge);
    }
  }

  const graph = normalizeGraph(nodes, edges);
  if (graph.nodes.length === 0) throw new Error('draw.io 文件中没有找到可编辑图元。');
  return {
    title,
    ...graph,
    fidelity: warnings.length ? 'hybrid' : 'structural',
    sourceFormat: 'draw.io',
    warnings,
  };
}

interface ParsedTextGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction: 'TB' | 'LR';
  warnings: string[];
}

function addTextNode(map: Map<string, FlowNode>, id: string, label = id, kind: ShapeKind = 'process') {
  if (map.has(id)) {
    const current = map.get(id)!;
    const isPlainReference = label === id && kind === 'process';
    current.data = {
      ...current.data,
      label: isPlainReference ? current.data.label : label || current.data.label,
      kind: isPlainReference ? current.data.kind : kind,
    };
    return;
  }
  map.set(id, createFlowNode(kind, { x: 0, y: 0 }, label || id, { id }));
}

function mermaidNode(rawId: string, rawShape?: string, rawLabel?: string) {
  let kind: ShapeKind = 'process';
  const shape = rawShape ?? '';
  if (shape.startsWith('{')) kind = 'decision';
  else if (shape.startsWith('((') || shape.startsWith('([') || shape.startsWith('>')) kind = 'start';
  else if (shape.startsWith('[(')) kind = 'database';
  else if (shape.startsWith('[/')) kind = 'data';
  const label = (rawLabel ?? rawId).replace(/^['"]|['"]$/g, '').trim();
  return { id: rawId.trim(), label, kind };
}

function parseMermaid(source: string): ParsedTextGraph {
  const map = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const warnings: string[] = [];
  const direction: 'TB' | 'LR' = /(?:flowchart|graph)\s+(LR|RL)/i.test(source) ? 'LR' : 'TB';
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const definition = /^([\w.-]+)\s*(\(\(|\(\[|\[\(|\[\/|\{|\[|\()(.+?)(\)\)|\]\)|\)\]|\/\]|\}|\]|\))$/;
  const reference = /^([\w.-]+)(?:\s*(\(\(|\(\[|\[\(|\[\/|\{|\[|\()(.+?)(\)\)|\]\)|\)\]|\/\]|\}|\]|\)))?$/;
  const edgePattern = /^(.*?)\s*(-->|---|-.->|==>)\s*(?:\|([^|]+)\|\s*)?(.*?)$/;

  for (const line of lines) {
    if (/^(flowchart|graph|subgraph|end|%%)/i.test(line)) continue;
    const edgeMatch = line.match(edgePattern);
    if (edgeMatch) {
      const left = edgeMatch[1].trim().match(reference);
      const right = edgeMatch[4].trim().match(reference);
      if (!left || !right) {
        warnings.push(`未识别 Mermaid 语句：${line}`);
        continue;
      }
      const leftNode = mermaidNode(left[1], left[2], left[3]);
      const rightNode = mermaidNode(right[1], right[2], right[3]);
      addTextNode(map, leftNode.id, leftNode.label, leftNode.kind);
      addTextNode(map, rightNode.id, rightNode.label, rightNode.kind);
      const edge = createFlowEdge(leftNode.id, rightNode.id, edgeMatch[3]?.trim());
      if (edgeMatch[2] === '-.->') edge.data = { ...edge.data!, lineStyle: 'dashed' };
      if (edgeMatch[2] === '==>') edge.data = { ...edge.data!, width: 3 };
      edges.push(edge);
      continue;
    }
    const nodeMatch = line.match(definition);
    if (nodeMatch) {
      const parsed = mermaidNode(nodeMatch[1], nodeMatch[2], nodeMatch[3]);
      addTextNode(map, parsed.id, parsed.label, parsed.kind);
    }
  }

  return { nodes: [...map.values()], edges, direction, warnings };
}

function parseDot(source: string): ParsedTextGraph {
  const map = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const warnings: string[] = [];
  const direction: 'TB' | 'LR' = /rankdir\s*=\s*(LR|RL)/i.test(source) ? 'LR' : 'TB';
  const body = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  const nodePattern = /(?:^|[;{}\n])\s*([\w.-]+)\s*\[([^\]]*)\]/g;
  for (const match of body.matchAll(nodePattern)) {
    const attrs = match[2];
    const label = attrs.match(/label\s*=\s*"([^"]*)"/i)?.[1] ?? match[1];
    const shape = attrs.match(/shape\s*=\s*([\w]+)/i)?.[1]?.toLowerCase();
    const kind: ShapeKind = shape === 'diamond' ? 'decision' : shape === 'ellipse' || shape === 'oval' ? 'start' : shape === 'cylinder' ? 'database' : 'process';
    addTextNode(map, match[1], label, kind);
  }

  const edgePattern = /([\w.-]+)\s*->\s*([\w.-]+)(?:\s*\[([^\]]*)\])?/g;
  for (const match of body.matchAll(edgePattern)) {
    addTextNode(map, match[1]);
    addTextNode(map, match[2]);
    const label = match[3]?.match(/label\s*=\s*"([^"]*)"/i)?.[1];
    edges.push(createFlowEdge(match[1], match[2], label));
  }

  if (map.size === 0) warnings.push('DOT 文件中没有识别出节点。');
  return { nodes: [...map.values()], edges, direction, warnings };
}

function localElements(document: Document, name: string): Element[] {
  return Array.from(document.getElementsByTagName('*')).filter((element) => element.localName === name);
}

function parseBpmn(source: string): ParsedTextGraph {
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('BPMN XML 无法解析。');
  const nodeTypes: Record<string, ShapeKind> = {
    startEvent: 'start',
    endEvent: 'start',
    task: 'process',
    userTask: 'manual',
    serviceTask: 'process',
    scriptTask: 'process',
    sendTask: 'process',
    receiveTask: 'process',
    exclusiveGateway: 'decision',
    parallelGateway: 'decision',
    inclusiveGateway: 'decision',
    dataObjectReference: 'data',
    dataStoreReference: 'database',
    textAnnotation: 'note',
    subProcess: 'group',
  };
  const bounds = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const shape of localElements(document, 'BPMNShape')) {
    const id = shape.getAttribute('bpmnElement');
    const box = Array.from(shape.children).find((child) => child.localName === 'Bounds');
    if (id && box) {
      bounds.set(id, {
        x: Number(box.getAttribute('x')) || 0,
        y: Number(box.getAttribute('y')) || 0,
        width: Number(box.getAttribute('width')) || 176,
        height: Number(box.getAttribute('height')) || 72,
      });
    }
  }
  const nodes: FlowNode[] = [];
  for (const element of Array.from(document.getElementsByTagName('*'))) {
    const kind = nodeTypes[element.localName];
    const id = element.getAttribute('id');
    if (!kind || !id) continue;
    const box = bounds.get(id);
    const node = createFlowNode(kind, box ? { x: box.x, y: box.y } : { x: 0, y: 0 }, element.getAttribute('name') || element.textContent?.trim() || element.localName, { id });
    if (box) node.style = { width: box.width, height: box.height };
    nodes.push(node);
  }
  const edges = localElements(document, 'sequenceFlow')
    .map((element) => {
      const sourceId = element.getAttribute('sourceRef');
      const targetId = element.getAttribute('targetRef');
      return sourceId && targetId
        ? createFlowEdge(sourceId, targetId, element.getAttribute('name') || undefined)
        : null;
    })
    .filter((edge): edge is FlowEdge => Boolean(edge));

  return {
    nodes,
    edges,
    direction: 'LR',
    warnings: bounds.size < nodes.length ? ['部分 BPMN 图元缺少 DI 坐标，已为其自动布局。'] : [],
  };
}

function parsePlantUml(source: string): ParsedTextGraph {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const warnings: string[] = [];
  let previous: FlowNode | null = null;
  const decisionStack: FlowNode[] = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^@(?:start|end)uml/i.test(line) || /^skinparam/i.test(line)) continue;
    let kind: ShapeKind | null = null;
    let label = '';
    if (/^start$/i.test(line)) {
      kind = 'start';
      label = '开始';
    } else if (/^(stop|end)$/i.test(line)) {
      kind = 'start';
      label = '结束';
    } else if (/^:[\s\S]*;$/i.test(line)) {
      kind = 'process';
      label = line.slice(1, -1).trim();
    } else if (/^if\s*\((.+)\)/i.test(line)) {
      kind = 'decision';
      label = line.match(/^if\s*\((.+)\)/i)?.[1] ?? '判断';
    } else if (/^(else|elseif)/i.test(line)) {
      previous = decisionStack.at(-1) ?? previous;
      continue;
    } else if (/^endif/i.test(line)) {
      decisionStack.pop();
      continue;
    } else if (/^note\s+/i.test(line)) {
      kind = 'note';
      label = line.replace(/^note\s+(?:left|right|top|bottom)?\s*/i, '') || '注释';
    } else {
      warnings.push(`未识别 PlantUML 语句：${line}`);
    }
    if (!kind) continue;
    const current = createFlowNode(kind, { x: 0, y: 0 }, label);
    nodes.push(current);
    if (previous) edges.push(createFlowEdge(previous.id, current.id));
    previous = current;
    if (kind === 'decision') decisionStack.push(current);
  }
  return { nodes, edges, direction: 'TB', warnings };
}

function parseCsv(source: string): ParsedTextGraph {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index <= source.length; index += 1) {
    const char = source[index] ?? '\n';
    if (char === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field.trim());
      field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  const headers = rows.shift()?.map((value) => value.toLowerCase()) ?? [];
  const sourceIndex = headers.findIndex((value) => ['source', 'from', '起点'].includes(value));
  const targetIndex = headers.findIndex((value) => ['target', 'to', '终点'].includes(value));
  const labelIndex = headers.findIndex((value) => ['label', 'name', '标签'].includes(value));
  if (sourceIndex < 0 || targetIndex < 0) throw new Error('CSV 需要 source 和 target 两列。');
  const map = new Map<string, FlowNode>();
  const edges = rows.flatMap((values) => {
    const sourceId = values[sourceIndex];
    const targetId = values[targetIndex];
    if (!sourceId || !targetId) return [];
    addTextNode(map, sourceId);
    addTextNode(map, targetId);
    return [createFlowEdge(sourceId, targetId, labelIndex >= 0 ? values[labelIndex] : undefined)];
  });
  return { nodes: [...map.values()], edges, direction: 'LR', warnings: [] };
}

function parseExcalidraw(value: Record<string, unknown>): ParsedTextGraph {
  const elements = Array.isArray(value.elements) ? (value.elements as Array<Record<string, unknown>>) : [];
  const textByContainer = new Map<string, string>();
  for (const element of elements) {
    if (element.type === 'text' && typeof element.containerId === 'string') {
      textByContainer.set(element.containerId, String(element.text ?? ''));
    }
  }
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const warnings: string[] = [];
  for (const element of elements) {
    if (element.isDeleted) continue;
    const id = String(element.id ?? createId('node'));
    if (['rectangle', 'diamond', 'ellipse'].includes(String(element.type))) {
      const kind: ShapeKind = element.type === 'diamond' ? 'decision' : element.type === 'ellipse' ? 'start' : 'process';
      const node = createFlowNode(kind, { x: Number(element.x) || 0, y: Number(element.y) || 0 }, textByContainer.get(id) || '未命名', {
        id,
        style: { width: Math.max(48, Number(element.width) || 176), height: Math.max(36, Number(element.height) || 72) },
      });
      node.data = {
        ...node.data,
        fill: String(element.backgroundColor || node.data.fill),
        stroke: String(element.strokeColor || node.data.stroke),
        borderWidth: Number(element.strokeWidth) || node.data.borderWidth,
        opacity: Math.max(0, Math.min(1, Number(element.opacity ?? 100) / 100)),
      };
      nodes.push(node);
    }
    if (element.type === 'arrow') {
      const source = (element.startBinding as Record<string, unknown> | null)?.elementId;
      const target = (element.endBinding as Record<string, unknown> | null)?.elementId;
      if (typeof source === 'string' && typeof target === 'string') {
        const edge = createFlowEdge(source, target, undefined, 'straight');
        edge.id = id;
        edges.push(edge);
      } else {
        warnings.push(`跳过了未绑定图元的箭头 ${id}。`);
      }
    }
  }
  return { nodes, edges, direction: 'TB', warnings };
}

function parseNative(value: Record<string, unknown>, title: string): ImportResult {
  if (Array.isArray(value.elements)) {
    const parsed = parseExcalidraw(value);
    const graph = normalizeGraph(parsed.nodes, parsed.edges);
    return { title, ...graph, fidelity: parsed.warnings.length ? 'hybrid' : 'structural', sourceFormat: 'Excalidraw', warnings: parsed.warnings };
  }
  const nodes = Array.isArray(value.nodes) ? (value.nodes as FlowNode[]) : [];
  const edges = Array.isArray(value.edges) ? (value.edges as FlowEdge[]) : [];
  if (nodes.length === 0) throw new Error('JSON 中没有可识别的 nodes 数组。');
  const graph = normalizeGraph(nodes, edges);
  return {
    title: typeof value.title === 'string' ? value.title : title,
    ...graph,
    fidelity: 'structural',
    sourceFormat: 'Flowloom JSON',
    warnings: [],
  };
}

function importTextGraph(parsed: ParsedTextGraph, title: string, sourceFormat: string): ImportResult {
  if (parsed.nodes.length === 0) throw new Error(`${sourceFormat} 中没有识别出可编辑节点。`);
  const hasPositions = parsed.nodes.some((node) => node.position.x !== 0 || node.position.y !== 0);
  const graph = hasPositions ? { nodes: parsed.nodes, edges: parsed.edges } : layoutGraph(parsed.nodes, parsed.edges, parsed.direction);
  return {
    title,
    ...normalizeGraph(graph.nodes, graph.edges),
    fidelity: parsed.warnings.length ? 'hybrid' : 'structural',
    sourceFormat,
    warnings: parsed.warnings,
  };
}

async function importVsdx(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(await readFileBuffer(file));
  const pageFiles = Object.values(zip.files).filter((entry) => /visio\/pages\/page\d+\.xml$/i.test(entry.name));
  if (pageFiles.length === 0) throw new Error('VSDX 中没有找到 Visio 页面数据。');
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const warnings = ['Visio 母版、复杂几何和主题效果将近似转换；原文件不会被修改。'];

  for (let pageIndex = 0; pageIndex < pageFiles.length; pageIndex += 1) {
    const source = await pageFiles[pageIndex].async('text');
    const document = new DOMParser().parseFromString(source, 'application/xml');
    const shapeIds = new Map<string, string>();
    const connectorIds = new Set<string>();
    for (const shape of localElements(document, 'Shape')) {
      const originalId = shape.getAttribute('ID');
      if (!originalId) continue;
      const cells = new Map(
        Array.from(shape.children)
          .filter((child) => child.localName === 'Cell')
          .map((cell) => [cell.getAttribute('N') ?? '', Number(cell.getAttribute('V')) || 0]),
      );
      const width = Math.max(48, (cells.get('Width') || 2) * 96);
      const height = Math.max(36, (cells.get('Height') || 0.75) * 96);
      const pinX = (cells.get('PinX') || 1) * 96;
      const pinY = (cells.get('PinY') || 1) * 96;
      const text = localElements(shape.ownerDocument, 'Text').find((element) => element.parentElement === shape)?.textContent?.trim();
      const isConnector = shape.getAttribute('NameU')?.toLowerCase().includes('connector') || shape.getAttribute('Type') === 'Foreign';
      if (isConnector) {
        connectorIds.add(originalId);
        continue;
      }
      const id = `p${pageIndex + 1}-${originalId}`;
      shapeIds.set(originalId, id);
      const name = shape.getAttribute('NameU')?.toLowerCase() ?? '';
      const kind: ShapeKind = name.includes('decision') || name.includes('diamond') ? 'decision' : name.includes('database') ? 'database' : name.includes('document') ? 'document' : name.includes('terminator') ? 'start' : 'process';
      nodes.push(createFlowNode(kind, { x: pinX - width / 2 + pageIndex * 80, y: Math.max(0, 900 - pinY - height / 2) }, text || shape.getAttribute('Name') || '未命名', { id, style: { width, height } }));
    }
    const connects = localElements(document, 'Connect');
    const byConnector = new Map<string, string[]>();
    for (const connect of connects) {
      const from = connect.getAttribute('FromSheet');
      const to = connect.getAttribute('ToSheet');
      if (!from || !to || !connectorIds.has(from) || !shapeIds.has(to)) continue;
      byConnector.set(from, [...(byConnector.get(from) ?? []), shapeIds.get(to)!]);
    }
    for (const targets of byConnector.values()) {
      if (targets.length >= 2) edges.push(createFlowEdge(targets[0], targets[1]));
    }
  }
  if (nodes.length === 0) throw new Error('VSDX 页面中没有识别出可编辑图元。');
  return { title: file.name.replace(/\.vsdx$/i, ''), nodes, edges, fidelity: 'hybrid', sourceFormat: 'Visio VSDX', warnings };
}

async function visualReference(file: File): Promise<ImportResult> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败。'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  let width = 720;
  let height = 480;
  if (file.type.startsWith('image/')) {
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = reject;
        image.src = dataUrl;
      });
      const scale = Math.min(1, 960 / Math.max(dimensions.width, dimensions.height));
      width = Math.max(240, dimensions.width * scale);
      height = Math.max(160, dimensions.height * scale);
    } catch {
      // The generic dimensions still preserve the source object.
    }
  }
  const node = createFlowNode('image', { x: 80, y: 80 }, file.name, {
    style: { width, height },
  });
  node.data = { ...node.data, imageUrl: dataUrl, sourceRef: file.name, locked: false };
  return {
    title: file.name.replace(/\.[^.]+$/, ''),
    nodes: [node],
    edges: [],
    fidelity: 'visual',
    sourceFormat: file.type || extensionOf(file.name).toUpperCase(),
    warnings: ['已按原貌导入为视觉参考对象。若要拆分为独立图元，请在 AI 面板中选择“重建当前参考图”。'],
  };
}

async function importPdf(file: File): Promise<ImportResult> {
  const [{ getDocument, GlobalWorkerOptions }, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = workerModule.default;

  const loadingTask = getDocument({ data: new Uint8Array(await readFileBuffer(file)) });
  const pdf = await loadingTask.promise;
  const title = file.name.replace(/\.pdf$/i, '');
  const nodes: FlowNode[] = [];
  let y = 80;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const naturalViewport = page.getViewport({ scale: 1 });
      const displayScale = Math.min(1, 960 / Math.max(naturalViewport.width, naturalViewport.height));
      const displayViewport = page.getViewport({ scale: displayScale });
      const rasterScale = Math.min(2, 2400 / Math.max(displayViewport.width, displayViewport.height));
      const renderViewport = page.getViewport({ scale: displayScale * rasterScale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(renderViewport.width));
      canvas.height = Math.max(1, Math.ceil(renderViewport.height));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error(`PDF 第 ${pageNumber} 页无法创建渲染画布。`);

      await page.render({ canvas, canvasContext: context, viewport: renderViewport, background: '#ffffff' }).promise;
      const label = pdf.numPages === 1 ? title : `${title} · 第 ${pageNumber} 页`;
      const node = createFlowNode('image', { x: 80, y }, label, {
        style: { width: displayViewport.width, height: displayViewport.height },
      });
      node.data = {
        ...node.data,
        imageUrl: canvas.toDataURL('image/png'),
        sourceRef: `${file.name}#page=${pageNumber}`,
        locked: false,
      };
      nodes.push(node);
      y += displayViewport.height + 48;
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  return {
    title,
    nodes,
    edges: [],
    fidelity: 'visual',
    sourceFormat: 'PDF',
    warnings: [`已将 ${nodes.length} 页 PDF 渲染为高分辨率视觉参考对象；页面内容不会被误标为独立可编辑图元。`],
  };
}

export async function importDiagramFile(file: File): Promise<ImportResult> {
  const extension = extensionOf(file.name);
  const title = file.name.replace(/\.[^.]+$/, '');
  if (extension === 'vsdx') return importVsdx(file);
  if (extension === 'pdf') return importPdf(file);
  if (!STRUCTURED_EXTENSIONS.has(extension)) return visualReference(file);
  const source = await readFileText(file);

  if (extension === 'drawio') return importDrawio(source, title);
  if (extension === 'bpmn') return importTextGraph(parseBpmn(source), title, 'BPMN 2.0');
  if (extension === 'mmd' || extension === 'mermaid') return importTextGraph(parseMermaid(source), title, 'Mermaid');
  if (extension === 'dot' || extension === 'gv') return importTextGraph(parseDot(source), title, 'Graphviz DOT');
  if (extension === 'puml' || extension === 'plantuml') return importTextGraph(parsePlantUml(source), title, 'PlantUML');
  if (extension === 'csv') return importTextGraph(parseCsv(source), title, 'CSV edge list');
  if (extension === 'svg') {
    const blob = new File([source], file.name, { type: 'image/svg+xml' });
    return visualReference(blob);
  }
  if (extension === 'yaml' || extension === 'yml') {
    const parsed = parseYaml(source) as Record<string, unknown>;
    return parseNative(parsed, title);
  }
  if (extension === 'json' || extension === 'flow' || extension === 'excalidraw') {
    return parseNative(JSON.parse(source) as Record<string, unknown>, title);
  }
  if (extension === 'xml') {
    if (/<(?:\w+:)?definitions\b/i.test(source) && /bpmn/i.test(source)) return importTextGraph(parseBpmn(source), title, 'BPMN 2.0');
    if (/<mx(?:file|GraphModel)\b/i.test(source)) return importDrawio(source, title);
  }

  return visualReference(file);
}

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function mxStyle(node: FlowNode): string {
  const shape: Record<ShapeKind, string> = {
    start: 'ellipse',
    process: 'rounded=1',
    decision: 'rhombus',
    document: 'shape=document',
    data: 'shape=parallelogram',
    database: 'shape=cylinder3',
    manual: 'shape=manualInput',
    note: 'shape=note',
    group: 'swimlane',
    image: 'rounded=0',
  };
  return `${shape[node.data.kind]};whiteSpace=wrap;html=1;fillColor=${node.data.fill};strokeColor=${node.data.stroke};fontColor=${node.data.textColor};strokeWidth=${node.data.borderWidth};fontSize=${node.data.fontSize};`;
}

export function serializeDrawio(title: string, nodes: FlowNode[], edges: FlowEdge[]): string {
  const nodeCells = nodes.map((node) => {
    const width = Number(node.measured?.width ?? node.width ?? node.style?.width ?? SHAPE_DIMENSIONS[node.data.kind].width);
    const height = Number(node.measured?.height ?? node.height ?? node.style?.height ?? SHAPE_DIMENSIONS[node.data.kind].height);
    return `<mxCell id="${xmlEscape(node.id)}" value="${xmlEscape(node.data.label)}" style="${xmlEscape(mxStyle(node))}" vertex="1" parent="1"><mxGeometry x="${node.position.x}" y="${node.position.y}" width="${width}" height="${height}" as="geometry"/></mxCell>`;
  }).join('');
  const edgeCells = edges.map((edge) => `<mxCell id="${xmlEscape(edge.id)}" value="${xmlEscape(edge.data?.label ?? edge.label ?? '')}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=${xmlEscape(edge.data?.color ?? '#555555')};" edge="1" parent="1" source="${xmlEscape(edge.source)}" target="${xmlEscape(edge.target)}"><mxGeometry relative="1" as="geometry"/></mxCell>`).join('');
  return `<mxfile host="Flowloom" modified="${new Date().toISOString()}"><diagram id="flowloom" name="${xmlEscape(title)}"><mxGraphModel grid="1" gridSize="10" page="1" pageScale="1" pageWidth="1169" pageHeight="827"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${nodeCells}${edgeCells}</root></mxGraphModel></diagram></mxfile>`;
}

function mermaidShape(node: FlowNode): string {
  const label = node.data.label.replaceAll('"', '&quot;');
  const shapes: Record<ShapeKind, string> = {
    start: `(["${label}"])`,
    process: `["${label}"]`,
    decision: `{\"${label}\"}`,
    document: `["${label}"]`,
    data: `[/\"${label}\"/]`,
    database: `[(\"${label}\")]`,
    manual: `["${label}"]`,
    note: `["${label}"]`,
    group: `["${label}"]`,
    image: `["${label}"]`,
  };
  return shapes[node.data.kind];
}

function safeDiagramId(id: string): string {
  return `n_${id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

export function serializeMermaid(nodes: FlowNode[], edges: FlowEdge[], direction: 'TB' | 'LR' = 'TB'): string {
  const lines = [`flowchart ${direction}`];
  nodes.forEach((node) => lines.push(`  ${safeDiagramId(node.id)}${mermaidShape(node)}`));
  edges.forEach((edge) => {
    const label = String(edge.data?.label ?? edge.label ?? '').replaceAll('|', '/');
    lines.push(`  ${safeDiagramId(edge.source)} -->${label ? `|${label}|` : ''} ${safeDiagramId(edge.target)}`);
  });
  return `${lines.join('\n')}\n`;
}

export function serializeDot(title: string, nodes: FlowNode[], edges: FlowEdge[]): string {
  const lines = [`digraph "${title.replaceAll('"', '\\"')}" {`, '  rankdir=TB;'];
  for (const node of nodes) {
    const shape = node.data.kind === 'decision' ? 'diamond' : node.data.kind === 'start' ? 'ellipse' : node.data.kind === 'database' ? 'cylinder' : 'box';
    lines.push(`  "${node.id}" [label="${node.data.label.replaceAll('"', '\\"')}", shape=${shape}];`);
  }
  for (const edge of edges) {
    const label = edge.data?.label ?? edge.label;
    lines.push(`  "${edge.source}" -> "${edge.target}"${label ? ` [label="${String(label).replaceAll('"', '\\"')}"]` : ''};`);
  }
  lines.push('}');
  return `${lines.join('\n')}\n`;
}

export function serializeCsv(nodes: FlowNode[], edges: FlowEdge[]): string {
  const labels = new Map(nodes.map((node) => [node.id, node.data.label]));
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return ['source,target,label,source_name,target_name', ...edges.map((edge) => [edge.source, edge.target, edge.data?.label ?? edge.label ?? '', labels.get(edge.source) ?? '', labels.get(edge.target) ?? ''].map(quote).join(','))].join('\n');
}

export function serializeDocument(title: string, nodes: FlowNode[], edges: FlowEdge[]): string {
  const now = new Date().toISOString();
  return JSON.stringify({ version: 1, title, nodes, edges, meta: { createdAt: now, updatedAt: now, sourceFormat: 'Flowloom', fidelity: 'structural' } }, null, 2);
}

export function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function supportedImportSummary(): string[] {
  return [
    'Flowloom JSON / YAML',
    'draw.io / diagrams.net XML',
    'Mermaid / Graphviz DOT / PlantUML',
    'BPMN 2.0 / Excalidraw / CSV edge list',
    'Visio VSDX（基础结构）',
    'SVG / PNG / JPG / WebP / PDF（视觉参考）',
  ];
}

export function detectReferenceNode(nodes: FlowNode[]): FlowNode | undefined {
  return nodes.find((node) => node.data.kind === 'image' && node.data.imageUrl);
}

export function aiPayloadToGraph(value: unknown): { title: string; nodes: FlowNode[]; edges: FlowEdge[]; direction: 'TB' | 'LR' } {
  if (!value || typeof value !== 'object') throw new Error('AI 返回内容不是有效对象。');
  const payload = value as Record<string, unknown>;
  const rawNodes = Array.isArray(payload.nodes) ? payload.nodes as Array<Record<string, unknown>> : [];
  const rawEdges = Array.isArray(payload.edges) ? payload.edges as Array<Record<string, unknown>> : [];
  if (rawNodes.length === 0) throw new Error('AI 返回内容没有 nodes。');
  const idMap = new Map<string, string>();
  const nodes = rawNodes.map((raw, index) => {
    const sourceId = String(raw.id ?? `node-${index + 1}`);
    const id = sourceId.replace(/\s+/g, '-');
    idMap.set(sourceId, id);
    const kind = sanitizeKind(raw.kind);
    const rawPosition = raw.position as Record<string, unknown> | undefined;
    const node = createFlowNode(kind, {
      x: Number(rawPosition?.x) || 0,
      y: Number(rawPosition?.y) || 0,
    }, String(raw.label ?? `步骤 ${index + 1}`), { id });
    node.data = {
      ...node.data,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      fill: typeof raw.fill === 'string' ? raw.fill : node.data.fill,
      stroke: typeof raw.stroke === 'string' ? raw.stroke : node.data.stroke,
    };
    return node;
  });
  const edges = rawEdges.flatMap((raw) => {
    const source = idMap.get(String(raw.source)) ?? String(raw.source ?? '');
    const target = idMap.get(String(raw.target)) ?? String(raw.target ?? '');
    if (!source || !target) return [];
    const edge = createFlowEdge(source, target, typeof raw.label === 'string' ? raw.label : undefined);
    if (typeof raw.id === 'string') edge.id = raw.id;
    return [edge];
  });
  return {
    title: typeof payload.title === 'string' ? payload.title : 'AI 生成流程图',
    nodes,
    edges,
    direction: payload.direction === 'LR' ? 'LR' : 'TB',
  };
}
