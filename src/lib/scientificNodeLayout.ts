import type { FlowNodeData, ShapeKind } from '../types';
import { estimateSvgTextWidth } from './diagram';
import { PUBLICATION_TYPOGRAPHY } from './scientific';
import { getShapeDefinition } from './shapeRegistry';

export interface ScientificNodeTextLayout {
  descriptionFontSize: number;
  descriptionLineHeight: number;
  descriptionLines: string[];
  descriptionStartY: number;
  labelLineHeight: number;
  labelLines: string[];
  labelStartY: number;
  visualHeight: number;
}

export const SCIENTIFIC_NODE_TEXT_PADDING_X = 10;
export const SCIENTIFIC_FRAME_TEXT_PADDING_X = 13;
export const SCIENTIFIC_FRAME_TEXT_PADDING_Y = 8;

export function isScientificShapeKind(kind: ShapeKind): boolean {
  return kind.startsWith('scientific-');
}

export function scientificNodeTextPaddingX(data: FlowNodeData): number {
  const configured = Number(data.scientificTextPaddingX);
  if (Number.isFinite(configured) && configured >= 0) return configured;
  return data.schematicRole === 'frame' || data.schematicRole === 'phase'
    ? SCIENTIFIC_FRAME_TEXT_PADDING_X
    : SCIENTIFIC_NODE_TEXT_PADDING_X;
}

export function scientificNodeTextMaxWidth(data: FlowNodeData, width: number): number {
  return Math.max(1, width - scientificNodeTextPaddingX(data) * 2);
}

export function scientificNodeTextPaddingY(data: FlowNodeData): number {
  const configured = Number(data.scientificTextPaddingY);
  return Number.isFinite(configured) && configured >= 0
    ? configured
    : SCIENTIFIC_FRAME_TEXT_PADDING_Y;
}

export function wrapScientificText(
  value: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  const pushCharacterWrapped = (valueToWrap: string) => {
    let line = '';
    for (const character of Array.from(valueToWrap)) {
      const candidate = line + character;
      if (line && estimateSvgTextWidth(candidate, fontSize) > maxWidth) {
        lines.push(line.trimEnd());
        line = character.trimStart();
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line.trimEnd());
  };
  for (const paragraph of value.split(/\r?\n/)) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    if (/\s/u.test(paragraph.trim())) {
      let line = '';
      for (const word of paragraph.trim().split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && estimateSvgTextWidth(candidate, fontSize) > maxWidth) {
          lines.push(line);
          if (estimateSvgTextWidth(word, fontSize) > maxWidth) {
            pushCharacterWrapped(word);
            line = '';
          } else {
            line = word;
          }
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
    } else {
      pushCharacterWrapped(paragraph);
    }
  }
  const visible = (lines.length ? lines : ['']).slice(0, Math.max(1, maxLines));
  if (lines.length > visible.length) {
    const lastIndex = visible.length - 1;
    let last = visible[lastIndex];
    while (last && estimateSvgTextWidth(`${last}...`, fontSize) > maxWidth) last = last.slice(0, -1);
    visible[lastIndex] = `${last.trimEnd()}...`;
  }
  return visible;
}

export function layoutScientificNodeContent(
  data: FlowNodeData,
  width: number,
  height: number,
): ScientificNodeTextLayout {
  const definition = getShapeDefinition(data.kind);
  const maxWidth = scientificNodeTextMaxWidth(data, width);
  const labelLines = wrapScientificText(data.label, maxWidth, data.fontSize, 2);
  const descriptionFontSize = Math.max(PUBLICATION_TYPOGRAPHY.edgeLabel, data.fontSize * 0.86);
  const descriptionLines = data.description?.trim()
    ? wrapScientificText(data.description, maxWidth, descriptionFontSize, 2)
    : [];
  const labelLineHeight = data.fontSize * 1.18;
  const descriptionLineHeight = descriptionFontSize * 1.18;
  const gap = descriptionLines.length ? Math.max(3, data.fontSize * 0.16) : 0;
  const labelAscent = data.fontSize * 0.86;
  const labelDescent = data.fontSize * 0.24;
  const labelHeight = labelAscent
    + (labelLines.length - 1) * labelLineHeight
    + labelDescent;
  const descriptionAscent = descriptionFontSize * 0.86;
  const descriptionDescent = descriptionFontSize * 0.24;
  const descriptionHeight = descriptionLines.length
    ? descriptionAscent
      + (descriptionLines.length - 1) * descriptionLineHeight
      + descriptionDescent
    : 0;
  const textHeight = labelHeight + gap + descriptionHeight;

  if (definition.textPlacement !== 'footer') {
    const top = Math.max(0, (height - textHeight) / 2);
    const labelStartY = top + labelAscent;
    return {
      descriptionFontSize,
      descriptionLineHeight,
      descriptionLines,
      descriptionStartY: top + labelHeight + gap + descriptionAscent,
      labelLineHeight,
      labelLines,
      labelStartY,
      visualHeight: height,
    };
  }

  const footerPadding = Math.max(4, data.fontSize * 0.18);
  const desiredVisualHeight = height - textHeight - footerPadding * 2;
  const minimumVisualHeight = height * (descriptionLines.length ? 0.46 : 0.52);
  const maximumVisualHeight = height * (descriptionLines.length ? 0.7 : 0.74);
  const idealVisualHeight = Math.max(minimumVisualHeight, Math.min(maximumVisualHeight, desiredVisualHeight));
  const maximumWithoutTextOverlap = Math.max(0, height - textHeight);
  const visualHeight = Math.min(idealVisualHeight, maximumWithoutTextOverlap);
  const footerHeight = Math.max(0, height - visualHeight);
  const top = visualHeight + Math.max(0, (footerHeight - textHeight) / 2);
  const labelStartY = top + labelAscent;

  return {
    descriptionFontSize,
    descriptionLineHeight,
    descriptionLines,
    descriptionStartY: top + labelHeight + gap + descriptionAscent,
    labelLineHeight,
    labelLines,
    labelStartY,
    visualHeight,
  };
}

export function layoutSchematicNodeContent(
  data: FlowNodeData,
  width: number,
  height: number,
): ScientificNodeTextLayout {
  if (isScientificShapeKind(data.kind)) return layoutScientificNodeContent(data, width, height);

  const definition = getShapeDefinition(data.kind);
  const maxWidth = scientificNodeTextMaxWidth(data, width);
  const maxLabelLines = Math.max(1, Array.from(data.label).length);
  const labelLines = wrapScientificText(data.label, maxWidth, data.fontSize, maxLabelLines);
  const descriptionFontSize = Math.max(PUBLICATION_TYPOGRAPHY.edgeLabel, data.fontSize * 0.86);
  const descriptionLines = data.description?.trim()
    ? wrapScientificText(
      data.description,
      maxWidth,
      descriptionFontSize,
      Math.max(1, Array.from(data.description).length),
    )
    : [];
  const labelLineHeight = data.fontSize * 1.2;
  const descriptionLineHeight = descriptionFontSize * 1.2;
  const isFrame = data.schematicRole === 'frame' || data.schematicRole === 'phase';
  const totalHeight = Math.max(1, labelLines.length) * labelLineHeight;
  const labelStartY = isFrame
    || definition.textPlacement === 'header'
    || definition.textPlacement === 'lane'
    || data.verticalAlign === 'top'
    ? data.fontSize + scientificNodeTextPaddingY(data)
    : definition.textPlacement === 'footer' || data.verticalAlign === 'bottom'
      ? height - totalHeight + data.fontSize - 8
      : (height - totalHeight) / 2 + data.fontSize;
  const descriptionStartY = Math.min(
    height - 5,
    labelStartY + labelLines.length * labelLineHeight + data.fontSize * 0.7,
  );

  return {
    descriptionFontSize,
    descriptionLineHeight,
    descriptionLines,
    descriptionStartY,
    labelLineHeight,
    labelLines,
    labelStartY,
    visualHeight: height,
  };
}
