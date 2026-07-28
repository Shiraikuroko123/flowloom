import type { TopLevelSpec } from 'vega-lite';
import type {
  FlowNode,
  ScientificAuditIssue,
  ScientificChartType,
  ScientificFieldMap,
  ScientificFigureSpec,
  ScientificProvenance,
  SvgPrimitiveTag,
} from '../types';
import { createFlowNode } from './diagram';
import { createId } from './id';
import { parseEditableSvg } from './svgImport';

export const CSS_PIXELS_PER_INCH = 96;
export const MILLIMETERS_PER_INCH = 25.4;
export const OKABE_ITO_PALETTE = [
  '#0072B2',
  '#E69F00',
  '#009E73',
  '#D55E00',
  '#CC79A7',
  '#56B4E9',
  '#F0E442',
  '#000000',
] as const;

export interface ScientificFigurePreset {
  id: string;
  label: string;
  detail: string;
  widthMm: number;
  heightMm: number;
}

export const SCIENTIFIC_FIGURE_PRESETS: ScientificFigurePreset[] = [
  { id: 'single-column', label: '单栏图', detail: '89 × 70 mm', widthMm: 89, heightMm: 70 },
  { id: 'double-column', label: '双栏图', detail: '180 × 120 mm', widthMm: 180, heightMm: 120 },
  { id: 'square', label: '方形图版', detail: '150 × 150 mm', widthMm: 150, heightMm: 150 },
  { id: 'a4-content', label: 'A4 内容区', detail: '180 × 247 mm', widthMm: 180, heightMm: 247 },
  { id: 'presentation', label: '16:9 图版', detail: '180 × 101.25 mm', widthMm: 180, heightMm: 101.25 },
];

export interface ScientificTable {
  headers: string[];
  rows: Array<Record<string, string | number | null>>;
  numericFields: string[];
  delimiter: ',' | '\t' | ';';
}

export interface ScientificChartOptions {
  title: string;
  sourceName: string;
  sourceData: string;
  chartType: ScientificChartType;
  fields: ScientificFieldMap;
  units: Record<string, string>;
  uncertaintyDefinition: string;
}

export interface EditableScientificChart {
  nodes: FlowNode[];
  warnings: string[];
  width: number;
  height: number;
}

export function mmToPx(value: number): number {
  return value * CSS_PIXELS_PER_INCH / MILLIMETERS_PER_INCH;
}

export function pxToMm(value: number): number {
  return value * MILLIMETERS_PER_INCH / CSS_PIXELS_PER_INCH;
}

function detectDelimiter(source: string): ScientificTable['delimiter'] {
  const firstRecord = source.split(/\r?\n/, 1)[0] ?? '';
  const candidates: ScientificTable['delimiter'][] = [',', '\t', ';'];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstRecord.split(delimiter).length - 1 }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter ?? ',';
}

function parseDelimitedRows(source: string, delimiter: ScientificTable['delimiter']): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      record.push(field.trim());
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      record.push(field.trim());
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      field = '';
    } else {
      field += character;
    }
  }
  record.push(field.trim());
  if (record.some((value) => value.length > 0)) records.push(record);
  return records;
}

export function parseScientificTable(source: string): ScientificTable {
  const delimiter = detectDelimiter(source);
  const records = parseDelimitedRows(source.replace(/^\uFEFF/, ''), delimiter);
  if (records.length < 2) throw new Error('数据至少需要一行表头和一行记录。');
  const headers = records[0].map((header, index) => header || `字段 ${index + 1}`);
  if (new Set(headers).size !== headers.length) throw new Error('CSV 表头不能包含重名字段。');
  const rawRows = records.slice(1).map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])));
  const numericFields = headers.filter((header) => {
    const values = rawRows.map((row) => row[header]).filter((value) => value !== '');
    return values.length > 0 && values.every((value) => Number.isFinite(Number(value)));
  });
  const numeric = new Set(numericFields);
  const rows = rawRows.map((row) => Object.fromEntries(headers.map((header) => {
    const value = row[header];
    if (value === '') return [header, null];
    return [header, numeric.has(header) ? Number(value) : value];
  })));
  return { headers, rows, numericFields, delimiter };
}

function fieldType(table: ScientificTable, field: string, categorical = false): 'quantitative' | 'nominal' {
  return !categorical && table.numericFields.includes(field) ? 'quantitative' : 'nominal';
}

function axisTitle(field: string, units: Record<string, string>): string {
  const unit = units[field]?.trim();
  return unit ? `${field} (${unit})` : field;
}

function tooltipEncoding(table: ScientificTable) {
  return table.headers.map((field) => ({ field, type: fieldType(table, field), title: field }));
}

export function buildScientificChartSpec(table: ScientificTable, options: ScientificChartOptions): Record<string, unknown> {
  const { chartType, fields, units } = options;
  if (!table.headers.includes(fields.x) || !table.headers.includes(fields.y)) throw new Error('请选择有效的 X 和 Y 字段。');
  if (['scatter', 'line', 'errorbar'].includes(chartType) && !table.numericFields.includes(fields.y)) {
    throw new Error('当前图表的 Y 字段必须是数值。');
  }
  if (chartType === 'heatmap' && (!fields.color || !table.numericFields.includes(fields.color))) {
    throw new Error('热图需要选择一个数值颜色字段。');
  }
  if (chartType === 'errorbar' && (!fields.error || !table.numericFields.includes(fields.error))) {
    throw new Error('误差线图需要选择一个数值误差字段。');
  }

  const x = { field: fields.x, type: fieldType(table, fields.x, ['bar', 'boxplot', 'heatmap'].includes(chartType)), title: axisTitle(fields.x, units) };
  const y = { field: fields.y, type: fieldType(table, fields.y, chartType === 'heatmap'), title: axisTitle(fields.y, units) };
  const group = fields.color && chartType !== 'heatmap'
    ? { field: fields.color, type: fieldType(table, fields.color), scale: { range: [...OKABE_ITO_PALETTE] }, title: fields.color }
    : undefined;
  const tooltip = tooltipEncoding(table);
  const shared = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    title: options.title.trim() || undefined,
    width: 520,
    height: 320,
    autosize: { type: 'pad', contains: 'padding' },
    data: { values: table.rows },
    config: {
      background: '#ffffff',
      font: 'Segoe UI, Microsoft YaHei UI, sans-serif',
      range: { category: [...OKABE_ITO_PALETTE] },
      view: { stroke: null },
      axis: {
        domainColor: '#333333',
        domainWidth: 1,
        gridColor: '#d8d8d8',
        gridOpacity: 0.55,
        gridWidth: 0.8,
        labelColor: '#202020',
        labelFontSize: 11,
        labelLimit: 180,
        tickColor: '#555555',
        tickSize: 4,
        titleColor: '#202020',
        titleFontSize: 12,
        titleFontWeight: 600,
        titlePadding: 10,
      },
      legend: { labelFontSize: 11, titleFontSize: 11, symbolStrokeWidth: 1.5 },
      title: { color: '#181818', fontSize: 15, fontWeight: 650, offset: 14 },
    },
  };

  if (chartType === 'scatter') {
    return {
      ...shared,
      mark: { type: 'point', filled: true, size: 68, opacity: 0.82, stroke: '#ffffff', strokeWidth: 0.6 },
      encoding: {
        x,
        y,
        color: group ?? { value: OKABE_ITO_PALETTE[0] },
        shape: group ? { field: fields.color, type: 'nominal', title: fields.color } : undefined,
        tooltip,
      },
    };
  }
  if (chartType === 'line') {
    return {
      ...shared,
      mark: { type: 'line', point: { filled: true, size: 48 }, strokeWidth: 2 },
      encoding: {
        x,
        y,
        color: group ?? { value: OKABE_ITO_PALETTE[0] },
        strokeDash: group ? { field: fields.color, type: 'nominal', title: fields.color } : undefined,
        shape: group ? { field: fields.color, type: 'nominal', title: fields.color } : undefined,
        tooltip,
      },
    };
  }
  if (chartType === 'bar') {
    return {
      ...shared,
      mark: { type: 'bar', cornerRadiusEnd: 1, opacity: 0.9 },
      encoding: {
        x: { ...x, type: 'nominal', sort: null },
        y: { ...y, type: 'quantitative' },
        color: group ?? { value: OKABE_ITO_PALETTE[0] },
        xOffset: group ? { field: fields.color } : undefined,
        tooltip,
      },
    };
  }
  if (chartType === 'boxplot') {
    return {
      ...shared,
      mark: { type: 'boxplot', extent: 'min-max', median: { color: '#111111' }, size: 38 },
      encoding: {
        x: { ...x, type: 'nominal', sort: null },
        y: { ...y, type: 'quantitative' },
        color: group ?? { field: fields.x, type: 'nominal', scale: { range: [...OKABE_ITO_PALETTE] }, legend: null },
        tooltip,
      },
    };
  }
  if (chartType === 'heatmap') {
    return {
      ...shared,
      mark: { type: 'rect', stroke: '#ffffff', strokeWidth: 0.75 },
      encoding: {
        x: { ...x, type: 'ordinal', sort: null },
        y: { ...y, type: 'ordinal', sort: null },
        color: { field: fields.color, type: 'quantitative', scale: { scheme: 'viridis' }, title: axisTitle(fields.color!, units) },
        tooltip,
      },
    };
  }
  return {
    ...shared,
    layer: [
      {
        mark: { type: 'errorbar', ticks: true, color: '#333333' },
        encoding: { x, y, yError: { field: fields.error }, color: group, tooltip },
      },
      {
        mark: { type: 'point', filled: true, size: 62, stroke: '#ffffff', strokeWidth: 0.6 },
        encoding: {
          x,
          y,
          color: group ?? { value: OKABE_ITO_PALETTE[0] },
          shape: group ? { field: fields.color, type: 'nominal' } : undefined,
          tooltip,
        },
      },
    ],
  };
}

export async function renderScientificChartSvg(spec: Record<string, unknown>): Promise<string> {
  const [{ compile }, { parse, View }] = await Promise.all([import('vega-lite'), import('vega')]);
  const runtime = compile(spec as unknown as TopLevelSpec).spec;
  const view = new View(parse(runtime), { renderer: 'none' }).initialize();
  try {
    await view.runAsync();
    const svg = await view.toSVG();
    return svg.replace('<svg ', '<svg data-flowloom-scientific-chart="true" ');
  } finally {
    view.finalize();
  }
}

function vectorNode(
  tag: SvgPrimitiveTag,
  bounds: { x: number; y: number; width: number; height: number },
  attributes: Record<string, string | number>,
  label: string,
  patch: Partial<FlowNode['data']>,
  zIndex: number,
): FlowNode {
  const node = createFlowNode('vector', { x: bounds.x, y: bounds.y }, label, {
    style: { width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) },
    zIndex,
  });
  node.data = {
    ...node.data,
    fill: 'transparent',
    stroke: 'none',
    borderWidth: 0,
    vector: { tag, viewBox: [bounds.x, bounds.y, bounds.width, bounds.height], attributes, text: tag === 'text' ? label : undefined },
    ...patch,
  };
  return node;
}

export function normalizeScientificFigureSpec(spec: ScientificFigureSpec): ScientificFigureSpec {
  return {
    ...spec,
    widthMm: Math.max(20, Math.min(500, Number(spec.widthMm) || 180)),
    heightMm: Math.max(20, Math.min(500, Number(spec.heightMm) || 120)),
    dpi: Math.max(72, Math.min(1200, Math.round(Number(spec.dpi) || 300))),
    rows: Math.max(1, Math.min(8, Math.round(Number(spec.rows) || 1))),
    columns: Math.max(1, Math.min(8, Math.round(Number(spec.columns) || 1))),
    marginMm: Math.max(0, Math.min(50, Number(spec.marginMm) || 0)),
    gapMm: Math.max(0, Math.min(50, Number(spec.gapMm) || 0)),
    updatedAt: new Date().toISOString(),
  };
}

function panelLabel(index: number, style: ScientificFigureSpec['labelStyle']): string {
  if (style === 'numeric') return String(index + 1);
  let value = index;
  let result = '';
  do {
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return style === 'lowercase' ? result.toLowerCase() : result;
}

export function createScientificFigureLayout(specInput: ScientificFigureSpec): { spec: ScientificFigureSpec; nodes: FlowNode[] } {
  const spec = normalizeScientificFigureSpec(specInput);
  const width = mmToPx(spec.widthMm);
  const height = mmToPx(spec.heightMm);
  const margin = mmToPx(spec.marginMm);
  const gap = mmToPx(spec.gapMm);
  const panelWidth = (width - margin * 2 - gap * (spec.columns - 1)) / spec.columns;
  const panelHeight = (height - margin * 2 - gap * (spec.rows - 1)) / spec.rows;
  if (panelWidth < 12 || panelHeight < 12) throw new Error('边距和面板间距超过了图版可用尺寸。');

  const background = vectorNode(
    'rect',
    { x: 0, y: 0, width, height },
    { x: 0, y: 0, width, height },
    '科研图版背景',
    {
      fill: spec.background,
      stroke: 'none',
      scientificRole: 'figure-background',
      locked: true,
      sourceRef: `${spec.widthMm} × ${spec.heightMm} mm`,
    },
    -10_000,
  );
  const nodes: FlowNode[] = [background];
  for (let row = 0; row < spec.rows; row += 1) {
    for (let column = 0; column < spec.columns; column += 1) {
      const index = row * spec.columns + column;
      const x = margin + column * (panelWidth + gap);
      const y = margin + row * (panelHeight + gap);
      nodes.push(vectorNode(
        'rect',
        { x, y, width: panelWidth, height: panelHeight },
        { x, y, width: panelWidth, height: panelHeight, 'stroke-dasharray': '5 4' },
        `面板 ${panelLabel(index, spec.labelStyle)}`,
        {
          fill: 'transparent',
          stroke: '#8a8a8a',
          borderWidth: 1,
          opacity: 0.7,
          scientificRole: 'panel-guide',
          exportExcluded: true,
          locked: true,
        },
        -9_000,
      ));
      if (spec.panelLabels) {
        const label = panelLabel(index, spec.labelStyle);
        const fontSize = 16;
        const labelWidth = Math.max(20, label.length * fontSize * 0.72);
        const labelHeight = fontSize * 1.35;
        nodes.push(vectorNode(
          'text',
          { x: x + 4, y: y + 3, width: labelWidth, height: labelHeight },
          {
            x: x + 4,
            y: y + 3 + fontSize,
            'font-family': 'Arial, Helvetica, sans-serif',
            'font-size': fontSize,
            'font-weight': 700,
            'text-anchor': 'start',
          },
          label,
          {
            fill: '#111111',
            textColor: '#111111',
            fontSize,
            fontWeight: 700,
            textAlign: 'left',
            verticalAlign: 'bottom',
            scientificRole: 'panel-label',
          },
          9_000,
        ));
      }
    }
  }
  return { spec, nodes };
}

export function createEditableScientificChart(
  svg: string,
  spec: Record<string, unknown>,
  options: ScientificChartOptions,
): EditableScientificChart {
  const parsed = parseEditableSvg(svg, options.sourceName);
  if (parsed.nodes.length === 0) throw new Error('图表 SVG 中没有可编辑图元。');
  const provenanceId = createId('provenance');
  const groupId = createId('scientific-chart');
  const provenance: ScientificProvenance = {
    id: provenanceId,
    kind: 'data-chart',
    sourceName: options.sourceName,
    sourceFormat: 'CSV',
    sourceData: options.sourceData,
    chartType: options.chartType,
    chartSpec: spec,
    fields: options.fields,
    units: options.units,
    uncertainty: { field: options.fields.error, definition: options.uncertaintyDefinition.trim() || undefined },
    engine: 'Vega-Lite 6 / Vega 6',
    generatedAt: new Date().toISOString(),
  };
  const group = createFlowNode('group', { x: 0, y: 0 }, options.title.trim() || '科研数据图表', {
    id: groupId,
    selected: true,
    style: { width: parsed.sourceBounds.width, height: parsed.sourceBounds.height },
    zIndex: 100,
  });
  group.data = {
    ...group.data,
    fill: 'transparent',
    stroke: 'transparent',
    textColor: 'transparent',
    borderWidth: 0,
    scientificRole: 'chart-root',
    provenance,
    sourceRef: options.sourceName,
  };
  const children = parsed.nodes.map((node, index) => ({
    ...node,
    selected: false,
    parentId: groupId,
    extent: 'parent' as const,
    expandParent: true,
    position: {
      x: node.position.x - parsed.sourceBounds.x,
      y: node.position.y - parsed.sourceBounds.y,
    },
    zIndex: index + 1,
    data: {
      ...node.data,
      provenanceRef: provenanceId,
      sourceRef: options.sourceName,
    },
  }));
  return {
    nodes: [group, ...children],
    warnings: parsed.warnings,
    width: parsed.sourceBounds.width,
    height: parsed.sourceBounds.height,
  };
}

function numericStyle(value: unknown, fallback: number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function absolutePosition(node: FlowNode, byId: Map<string, FlowNode>): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  const visited = new Set<string>();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

export function auditScientificFigure(nodes: FlowNode[], spec?: ScientificFigureSpec): ScientificAuditIssue[] {
  const issues: ScientificAuditIssue[] = [];
  if (!spec) {
    issues.push({
      id: 'missing-figure-spec',
      severity: 'warning',
      category: 'layout',
      title: '尚未设置物理图版尺寸',
      detail: '设置宽高和目标 DPI 后，才能计算输出像素、越界对象与有效字号。',
    });
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const contentNodes = nodes.filter((node) => !node.data.exportExcluded && node.data.scientificRole !== 'figure-background');
  const smallText = contentNodes.filter((node) => node.data.label.trim() && node.data.fontSize * 72 / CSS_PIXELS_PER_INCH < 7);
  if (smallText.length) {
    issues.push({
      id: 'small-text',
      severity: 'warning',
      category: 'typography',
      title: `${smallText.length} 个文字对象小于 7 pt`,
      detail: '缩印后可能难以阅读；请按最终图版尺寸人工核对正文、坐标轴和图例。',
      nodeIds: smallText.map((node) => node.id),
    });
  }
  const thinStroke = contentNodes.filter((node) => node.data.stroke !== 'none' && node.data.stroke !== 'transparent' && node.data.borderWidth * 72 / CSS_PIXELS_PER_INCH < 0.5);
  if (thinStroke.length) {
    issues.push({
      id: 'thin-stroke',
      severity: 'warning',
      category: 'stroke',
      title: `${thinStroke.length} 个对象线宽小于 0.5 pt`,
      detail: '细线在缩印、PDF 栅格化或印刷中可能消失。',
      nodeIds: thinStroke.map((node) => node.id),
    });
  }
  const translucent = contentNodes.filter((node) => node.data.opacity < 1);
  if (translucent.length) {
    issues.push({
      id: 'transparency',
      severity: 'info',
      category: 'color',
      title: `${translucent.length} 个对象使用透明度`,
      detail: '部分出版流程会改变透明混合结果；导出后应在目标 PDF 查看器中复核。',
      nodeIds: translucent.map((node) => node.id),
    });
  }
  const raster = contentNodes.filter((node) => node.data.kind === 'image');
  if (raster.length) {
    issues.push({
      id: 'raster-resolution',
      severity: 'warning',
      category: 'raster',
      title: `${raster.length} 个位图对象需要核对有效 DPI`,
      detail: '当前文件未记录全部原始像素尺寸，无法自动证明位图满足投稿要求。',
      nodeIds: raster.map((node) => node.id),
    });
  }
  const charts = nodes.filter((node) => node.data.scientificRole === 'chart-root');
  const missingSource = charts.filter((node) => !node.data.provenance?.sourceData);
  if (missingSource.length) {
    issues.push({
      id: 'missing-source-data',
      severity: 'error',
      category: 'data',
      title: `${missingSource.length} 个图表缺少原始数据`,
      detail: '无法从图形追溯到生成数据；请重新从科研图表工作台插入。',
      nodeIds: missingSource.map((node) => node.id),
    });
  }
  const undefinedError = charts.filter((node) => node.data.provenance?.chartType === 'errorbar' && !node.data.provenance.uncertainty?.definition);
  if (undefinedError.length) {
    issues.push({
      id: 'undefined-error',
      severity: 'warning',
      category: 'data',
      title: `${undefinedError.length} 个误差线图未定义误差含义`,
      detail: '请说明误差值表示 SD、SEM、置信区间或其他统计量。',
      nodeIds: undefinedError.map((node) => node.id),
    });
  }
  if (charts.length === 0) {
    issues.push({
      id: 'no-provenance-chart',
      severity: 'info',
      category: 'data',
      title: '当前页没有带数据溯源的图表',
      detail: '手工示意图不受影响；数据图建议从科研工作台生成以保留 CSV 和字段映射。',
    });
  }
  if (spec) {
    const width = mmToPx(spec.widthMm);
    const height = mmToPx(spec.heightMm);
    const outside = contentNodes.filter((node) => {
      if (node.parentId) return false;
      const position = absolutePosition(node, byId);
      const nodeWidth = numericStyle(node.style?.width, node.measured?.width ?? 1);
      const nodeHeight = numericStyle(node.style?.height, node.measured?.height ?? 1);
      return position.x < -0.5 || position.y < -0.5 || position.x + nodeWidth > width + 0.5 || position.y + nodeHeight > height + 0.5;
    });
    if (outside.length) {
      issues.push({
        id: 'outside-figure',
        severity: 'error',
        category: 'layout',
        title: `${outside.length} 个顶层对象超出图版`,
        detail: '科研尺寸导出会裁掉图版边界之外的内容。',
        nodeIds: outside.map((node) => node.id),
      });
    }
    const pixelWidth = Math.round(spec.widthMm / MILLIMETERS_PER_INCH * spec.dpi);
    const pixelHeight = Math.round(spec.heightMm / MILLIMETERS_PER_INCH * spec.dpi);
    if (Math.max(pixelWidth, pixelHeight) > 8192) {
      issues.push({
        id: 'large-raster-export',
        severity: 'warning',
        category: 'raster',
        title: `目标位图为 ${pixelWidth} × ${pixelHeight} px`,
        detail: '尺寸可能超过部分浏览器的稳定画布上限；优先导出 SVG，或降低 DPI 后分面导出。',
      });
    }
  }
  return issues;
}
