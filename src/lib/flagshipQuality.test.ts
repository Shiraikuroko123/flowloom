import { describe, expect, it } from 'vitest';
import type { ScientificSchematicLayout, ScientificSchematicOptions } from '../types';
import {
  FLAGSHIP_MINIMUM_DIMENSION_SCORE,
  FLAGSHIP_QUALITY_DIMENSIONS,
  FLAGSHIP_QUALITY_SCORECARDS,
  FLAGSHIP_QUALITY_THRESHOLD,
  FLAGSHIP_TEMPLATE_IDS,
  assessFlagshipQualityScope,
} from './flagshipQuality';
import {
  defaultScientificSchematicBackbone,
  defaultScientificSchematicTitle,
} from './scientificSchematics';

function auditedOptions(templateId: typeof FLAGSHIP_TEMPLATE_IDS[number]): ScientificSchematicOptions {
  return {
    templateId,
    title: defaultScientificSchematicTitle(templateId, 'en'),
    backbone: defaultScientificSchematicBackbone(templateId, 'en'),
    style: 'conference',
    density: 'detailed',
    language: 'en',
  };
}

describe('flagship quality gate', () => {
  it('requires every flagship to independently score at least 95 with no weak dimension', () => {
    expect(Object.keys(FLAGSHIP_QUALITY_SCORECARDS)).toEqual([...FLAGSHIP_TEMPLATE_IDS]);
    for (const templateId of FLAGSHIP_TEMPLATE_IDS) {
      const scorecard = FLAGSHIP_QUALITY_SCORECARDS[templateId];
      const arithmeticTotal = Math.round(scorecard.dimensions.reduce((sum, item) => sum + item.score, 0) * 10) / 10;
      expect(scorecard.dimensions.map((item) => item.id), templateId).toEqual(
        FLAGSHIP_QUALITY_DIMENSIONS.map((item) => item.id),
      );
      expect(scorecard.totalScore, `${templateId}:arithmetic`).toBe(arithmeticTotal);
      expect(scorecard.totalScore, `${templateId}:total`).toBeGreaterThanOrEqual(FLAGSHIP_QUALITY_THRESHOLD);
      expect(scorecard.minimumDimensionScore, `${templateId}:minimum`).toBeGreaterThanOrEqual(FLAGSHIP_MINIMUM_DIMENSION_SCORE);
      expect(scorecard.dimensions.every((item) => item.score >= FLAGSHIP_MINIMUM_DIMENSION_SCORE && item.score <= 10), templateId).toBe(true);
      expect(scorecard.dimensions.every((item) => item.evidence.trim().length > 0), templateId).toBe(true);
      expect(scorecard.passed, templateId).toBe(true);
    }
  });

  it('limits the passed score to the exact audited content, styles, and layouts', () => {
    const layouts: ScientificSchematicLayout[] = ['single-column', 'double-column', 'presentation'];
    for (const templateId of FLAGSHIP_TEMPLATE_IDS) {
      for (const layout of layouts) {
        expect(assessFlagshipQualityScope(auditedOptions(templateId), layout).status, `${templateId}:${layout}:conference`).toBe('audited');
        expect(assessFlagshipQualityScope({ ...auditedOptions(templateId), style: 'monochrome' }, layout).status, `${templateId}:${layout}:monochrome`).toBe('audited');
      }
    }
  });

  it('does not let edited or unaudited variants inherit the flagship score', () => {
    const base = auditedOptions('vla-policy');
    const variants: Array<[string, ScientificSchematicOptions, ScientificSchematicLayout]> = [
      ['title', { ...base, title: 'Custom policy' }, 'double-column'],
      ['backbone', { ...base, backbone: 'Custom VLM' }, 'double-column'],
      ['density', { ...base, density: 'standard' }, 'double-column'],
      ['language', {
        ...base,
        language: 'zh',
        title: defaultScientificSchematicTitle(base.templateId, 'zh'),
        backbone: defaultScientificSchematicBackbone(base.templateId, 'zh'),
      }, 'double-column'],
      ['style', { ...base, style: 'technical' }, 'double-column'],
      ['layout', base, 'freeform'],
    ];

    for (const [name, options, layout] of variants) {
      const result = assessFlagshipQualityScope(options, layout);
      expect(result.status, name).toBe('requires-review');
      expect(result.reasons.length, name).toBeGreaterThan(0);
    }

    const nonFlagship = assessFlagshipQualityScope({
      ...base,
      templateId: 'moe-routing',
      title: defaultScientificSchematicTitle('moe-routing', 'en'),
      backbone: defaultScientificSchematicBackbone('moe-routing', 'en'),
    }, 'double-column');
    expect(nonFlagship).toEqual({ status: 'not-flagship', reasons: [] });
  });
});
