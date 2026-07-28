import type { ShapeKind } from '../types';

export type ShapeCategory = 'flowchart' | 'bpmn' | 'uml' | 'basic' | 'container' | 'internal';
export type ShapeTextPlacement = 'center' | 'left' | 'header' | 'lane' | 'footer';

export interface ShapeDefinition {
  kind: ShapeKind;
  label: string;
  standardName: string;
  category: ShapeCategory;
  keywords: string[];
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  textPlacement: ShapeTextPlacement;
  contentPadding: string;
  drawioStyle: string;
  visible: boolean;
}

export const SHAPE_CATEGORY_LABELS: Record<Exclude<ShapeCategory, 'internal'>, string> = {
  flowchart: '标准流程图',
  bpmn: 'BPMN 2.0',
  uml: 'UML',
  basic: '基础图形',
  container: '容器与标注',
};

const defaults = {
  minWidth: 56,
  minHeight: 40,
  textPlacement: 'center' as ShapeTextPlacement,
  contentPadding: '10px 14px',
  visible: true,
};

function define(
  kind: ShapeKind,
  label: string,
  standardName: string,
  category: ShapeCategory,
  width: number,
  height: number,
  drawioStyle: string,
  keywords: string[],
  overrides: Partial<Omit<ShapeDefinition, 'kind' | 'label' | 'standardName' | 'category' | 'width' | 'height' | 'drawioStyle' | 'keywords'>> = {},
): ShapeDefinition {
  return { kind, label, standardName, category, width, height, drawioStyle, keywords, ...defaults, ...overrides };
}

export const SHAPE_REGISTRY: ShapeDefinition[] = [
  define('start', '开始 / 结束', 'Terminator', 'flowchart', 148, 56, 'rounded=1;arcSize=50', ['终止符', '起止', 'terminator', 'start', 'end']),
  define('process', '处理', 'Process', 'flowchart', 176, 72, 'rounded=0', ['步骤', '动作', 'process', 'action']),
  define('decision', '判断', 'Decision', 'flowchart', 144, 112, 'rhombus', ['条件', '分支', 'diamond', 'decision'], { contentPadding: '20% 24%' }),
  define('data', '输入 / 输出', 'Input / Output', 'flowchart', 176, 72, 'shape=parallelogram', ['数据', '输入输出', 'parallelogram', 'input', 'output'], { contentPadding: '10px 24px' }),
  define('document', '文档', 'Document', 'flowchart', 176, 82, 'shape=document', ['文件', '报告', 'document'], { contentPadding: '10px 14px 18px' }),
  define('multiple-documents', '多文档', 'Multiple Documents', 'flowchart', 184, 96, 'shape=mxgraph.flowchart.multidocument', ['多个文档', '报表', 'multiple documents'], { contentPadding: '10px 18px 24px' }),
  define('predefined-process', '预定义过程', 'Predefined Process', 'flowchart', 176, 72, 'shape=process', ['子流程', '子程序', 'subroutine', 'predefined process'], { contentPadding: '10px 26px' }),
  define('preparation', '准备', 'Preparation', 'flowchart', 176, 72, 'shape=hexagon', ['初始化', '设置', 'preparation', 'setup'], { contentPadding: '10px 24px' }),
  define('manual', '手工输入', 'Manual Input', 'flowchart', 176, 72, 'shape=manualInput', ['键盘', '人工录入', 'manual input'], { contentPadding: '14px 20px 10px' }),
  define('manual-operation', '人工操作', 'Manual Operation', 'flowchart', 176, 72, 'shape=trapezoid;direction=south', ['人工步骤', '手动处理', 'manual operation'], { contentPadding: '10px 24px' }),
  define('stored-data', '存储数据', 'Stored Data', 'flowchart', 176, 72, 'shape=mxgraph.flowchart.stored_data', ['数据存储', 'stored data'], { contentPadding: '10px 24px' }),
  define('database', '数据库', 'Database', 'flowchart', 148, 92, 'shape=cylinder3', ['磁盘', '数据源', 'database', 'cylinder'], { contentPadding: '18px 14px 10px' }),
  define('internal-storage', '内部存储', 'Internal Storage', 'flowchart', 160, 84, 'shape=internalStorage', ['内存', 'memory', 'internal storage'], { contentPadding: '18px 14px 10px 24px' }),
  define('display', '显示', 'Display', 'flowchart', 176, 80, 'shape=display', ['屏幕', '界面输出', 'display'], { contentPadding: '10px 25px' }),
  define('delay', '延迟', 'Delay', 'flowchart', 160, 80, 'shape=delay', ['等待', '延时', 'delay', 'wait'], { contentPadding: '10px 30px 10px 14px' }),
  define('on-page-connector', '页内连接符', 'On-page Connector', 'flowchart', 72, 72, 'ellipse=1', ['连接点', '圆形', 'on-page connector'], { minWidth: 40, contentPadding: '15%' }),
  define('off-page-connector', '跨页连接符', 'Off-page Connector', 'flowchart', 88, 88, 'shape=offPageConnector', ['跨页', '链接', 'off-page connector'], { contentPadding: '10px 14px 24px' }),
  define('merge', '合并', 'Merge', 'flowchart', 92, 76, 'shape=triangle;direction=south', ['汇合', 'merge'], { contentPadding: '10px 18px 24px' }),
  define('extract', '提取', 'Extract', 'flowchart', 92, 76, 'shape=triangle;direction=north', ['拆分', 'extract'], { contentPadding: '25px 18px 8px' }),
  define('sort', '排序', 'Sort', 'flowchart', 100, 88, 'rhombus', ['排序', 'sort'], { contentPadding: '18% 24%' }),
  define('collate', '校对', 'Collate', 'flowchart', 100, 88, 'shape=mxgraph.flowchart.collate', ['整理', '核对', 'collate'], { contentPadding: '24px 22px' }),
  define('summing-junction', '汇总连接', 'Summing Junction', 'flowchart', 72, 72, 'ellipse=1', ['求和', '汇总', 'summing junction'], { minWidth: 40, contentPadding: '18%' }),
  define('or-junction', '或连接', 'Or Junction', 'flowchart', 72, 72, 'ellipse=1', ['逻辑或', 'or junction'], { minWidth: 40, contentPadding: '18%' }),
  define('sequential-storage', '顺序存储', 'Sequential Access Storage', 'flowchart', 96, 96, 'shape=mxgraph.flowchart.sequential_data', ['磁带', '顺序访问', 'sequential storage'], { contentPadding: '18%' }),
  define('direct-storage', '直接存储', 'Direct Access Storage', 'flowchart', 176, 76, 'shape=mxgraph.flowchart.direct_data', ['磁盘', '直接访问', 'direct storage'], { contentPadding: '10px 26px' }),
  define('paper-tape', '纸带', 'Paper Tape', 'flowchart', 176, 76, 'shape=mxgraph.flowchart.paper_tape', ['连续输入', 'paper tape'], { contentPadding: '16px 14px' }),
  define('punched-card', '穿孔卡片', 'Punched Card', 'flowchart', 176, 76, 'shape=card', ['卡片', 'punched card'], { contentPadding: '10px 14px 10px 26px' }),
  define('loop-limit', '循环界限', 'Loop Limit', 'flowchart', 176, 76, 'shape=mxgraph.flowchart.loop_limit', ['循环开始', '循环结束', 'loop limit'], { contentPadding: '16px 22px 10px' }),
  define('annotation', '批注范围', 'Annotation', 'flowchart', 176, 92, 'shape=mxgraph.flowchart.annotation_1', ['注解', '说明范围', 'annotation'], { textPlacement: 'left', contentPadding: '10px 24px 10px 8px' }),

  define('bpmn-start-event', '开始事件', 'BPMN Start Event', 'bpmn', 64, 64, 'ellipse=1', ['事件', '开始', 'bpmn start event'], { minWidth: 40, contentPadding: '16%' }),
  define('bpmn-intermediate-event', '中间事件', 'BPMN Intermediate Event', 'bpmn', 64, 64, 'ellipse=1;double=1', ['事件', '中间', 'bpmn intermediate event'], { minWidth: 40, contentPadding: '16%' }),
  define('bpmn-end-event', '结束事件', 'BPMN End Event', 'bpmn', 64, 64, 'ellipse=1;strokeWidth=3', ['事件', '结束', 'bpmn end event'], { minWidth: 40, contentPadding: '16%' }),
  define('bpmn-task', '任务', 'BPMN Task', 'bpmn', 176, 80, 'rounded=1;arcSize=12', ['活动', '任务', 'bpmn task']),
  define('bpmn-user-task', '用户任务', 'BPMN User Task', 'bpmn', 176, 80, 'rounded=1;arcSize=12', ['人员', '用户', 'user task'], { contentPadding: '10px 14px 10px 34px' }),
  define('bpmn-service-task', '服务任务', 'BPMN Service Task', 'bpmn', 176, 80, 'rounded=1;arcSize=12', ['自动化', '系统服务', 'service task'], { contentPadding: '10px 14px 10px 34px' }),
  define('bpmn-exclusive-gateway', '排他网关', 'BPMN Exclusive Gateway', 'bpmn', 92, 92, 'rhombus', ['异或', 'XOR', 'exclusive gateway'], { contentPadding: '26%' }),
  define('bpmn-parallel-gateway', '并行网关', 'BPMN Parallel Gateway', 'bpmn', 92, 92, 'rhombus', ['并行', 'AND', 'parallel gateway'], { contentPadding: '26%' }),
  define('bpmn-inclusive-gateway', '包容网关', 'BPMN Inclusive Gateway', 'bpmn', 92, 92, 'rhombus', ['包含', 'OR', 'inclusive gateway'], { contentPadding: '26%' }),
  define('bpmn-data-object', '数据对象', 'BPMN Data Object', 'bpmn', 112, 92, 'shape=document', ['数据对象', 'data object'], { contentPadding: '10px 18px 10px 12px' }),
  define('bpmn-data-store', '数据存储', 'BPMN Data Store', 'bpmn', 128, 92, 'shape=cylinder3', ['数据仓库', 'data store'], { contentPadding: '18px 12px 10px' }),
  define('bpmn-pool', '参与者池', 'BPMN Pool', 'bpmn', 440, 220, 'swimlane;horizontal=0;startSize=36', ['参与者', 'pool', 'participant'], { minWidth: 260, minHeight: 120, textPlacement: 'lane', contentPadding: '10px 8px' }),

  define('uml-actor', '参与者', 'UML Actor', 'uml', 92, 124, 'shape=umlActor', ['角色', '用户', 'actor'], { minWidth: 60, minHeight: 90, textPlacement: 'footer', contentPadding: '86px 6px 6px' }),
  define('uml-use-case', '用例', 'UML Use Case', 'uml', 176, 84, 'ellipse=1', ['功能', 'use case'], { contentPadding: '12px 24px' }),
  define('uml-class', '类', 'UML Class', 'uml', 184, 132, 'swimlane;startSize=34', ['类图', '属性', '方法', 'class'], { textPlacement: 'header', contentPadding: '8px 12px' }),
  define('uml-package', '包', 'UML Package', 'uml', 190, 120, 'shape=folder', ['模块', '命名空间', 'package'], { contentPadding: '30px 12px 10px' }),
  define('uml-component', '组件', 'UML Component', 'uml', 184, 100, 'shape=component', ['模块', '接口', 'component'], { contentPadding: '10px 18px 10px 32px' }),
  define('uml-state', '状态', 'UML State', 'uml', 176, 80, 'rounded=1;arcSize=18', ['状态机', 'state']),
  define('uml-note', 'UML 注释', 'UML Note', 'uml', 176, 96, 'shape=note', ['注释', '说明', 'uml note'], { textPlacement: 'left', contentPadding: '12px 22px 12px 12px' }),

  define('rectangle', '矩形', 'Rectangle', 'basic', 176, 80, 'rounded=0', ['方框', 'rectangle']),
  define('rounded-rectangle', '圆角矩形', 'Rounded Rectangle', 'basic', 176, 80, 'rounded=1;arcSize=12', ['圆角', 'rounded rectangle']),
  define('ellipse', '椭圆', 'Ellipse', 'basic', 160, 88, 'ellipse=1', ['圆形', 'oval', 'ellipse'], { contentPadding: '12px 22px' }),
  define('triangle', '三角形', 'Triangle', 'basic', 112, 96, 'shape=triangle', ['三角', 'triangle'], { contentPadding: '28px 18px 8px' }),
  define('hexagon', '六边形', 'Hexagon', 'basic', 168, 84, 'shape=hexagon', ['六边形', 'hexagon'], { contentPadding: '10px 24px' }),
  define('cloud', '云', 'Cloud', 'basic', 176, 108, 'ellipse;shape=cloud', ['云服务', 'cloud'], { contentPadding: '20px 26px' }),
  define('callout', '标注气泡', 'Callout', 'basic', 176, 104, 'shape=callout', ['对话', '气泡', 'callout'], { contentPadding: '10px 14px 24px' }),

  define('note', '便笺', 'Note', 'container', 176, 96, 'shape=note', ['备注', '注释', 'note'], { textPlacement: 'left', contentPadding: '12px 22px 12px 12px' }),
  define('group', '分组容器', 'Group / Container', 'container', 420, 280, 'swimlane;startSize=28', ['容器', '分组', 'container', 'group'], { minWidth: 220, minHeight: 140, textPlacement: 'header', contentPadding: '8px 12px' }),
  define('swimlane', '泳道', 'Swimlane', 'container', 440, 180, 'swimlane;horizontal=0;startSize=40', ['职责', '泳道图', 'lane', 'swimlane'], { minWidth: 260, minHeight: 110, textPlacement: 'lane', contentPadding: '10px 8px' }),
  define('image', '视觉参考', 'Visual Reference', 'internal', 420, 280, 'rounded=0', ['图片', '参考', 'image'], { minWidth: 120, minHeight: 80, visible: false }),
];

const registryMap = new Map(SHAPE_REGISTRY.map((definition) => [definition.kind, definition]));

export const VISIBLE_SHAPES = SHAPE_REGISTRY.filter((definition) => definition.visible);

export function getShapeDefinition(kind: ShapeKind): ShapeDefinition {
  return registryMap.get(kind) ?? registryMap.get('process')!;
}

export function isShapeKind(value: unknown): value is ShapeKind {
  return typeof value === 'string' && registryMap.has(value as ShapeKind);
}
