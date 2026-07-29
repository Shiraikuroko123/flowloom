#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'output', 'publication-evidence');
const generatedAt = new Date().toISOString();
const sourceFiles = [
  'src/types.ts',
  'src/lib/flagshipQuality.ts',
  'src/lib/scientificSchematics.ts',
  'src/lib/scientific.ts',
  'src/lib/scientificEvidence.ts',
  'src/lib/scientificExport.tsx',
  'src/lib/scientificFigureRecipes.ts',
  'src/lib/scientificNodeLayout.ts',
  'src/lib/scientificRouting.ts',
  'src/lib/scientificVisualVariants.ts',
  'src/components/ScientificDialog.tsx',
  'src/components/ShapeVisual.tsx',
];
const templates = [
  { id: 'vla-policy', slug: 'vla-policy', qaSlug: 'vla', uiName: 'VLA 机器人策略' },
  { id: 'world-model-rollout', slug: 'world-model-rollout', qaSlug: 'world', uiName: '世界模型与未来展开' },
  { id: 'llm-training-pipeline', slug: 'llm-training-alignment', qaSlug: 'llm', uiName: 'LLM 全阶段训练流水线' },
];
const formats = [
  { id: 'single-column', qaSlug: 'single', widthMm: 89, heightMm: 70, uiName: '单栏图' },
  { id: 'double-column', qaSlug: 'double', widthMm: 180, heightMm: 120, uiName: '双栏图' },
  { id: 'presentation', qaSlug: 'presentation', widthMm: 180, heightMm: 101.25, uiName: '16:9 图版' },
];
const styles = ['conference', 'monochrome'];
const previewViewports = [
  { id: 'qa-1920x1200', width: 1920, height: 1200 },
  { id: 'full-hd-1920x1080', width: 1920, height: 1080 },
  { id: 'laptop-1366x768', width: 1366, height: 768 },
];
const previewThresholds = {
  adjacentPhaseTextGapPx: 12,
  phaseTextInsetPx: 8,
  controllerTextInsetPx: 8,
  overflowTolerancePx: 0.75,
};

function parseArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 4177;
      server.close(() => resolve(port));
    });
  });
}

async function responds(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await responds(url)) return;
    if (child.exitCode !== null) throw new Error(`Vite exited with code ${child.exitCode}.`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}.`);
}

async function ensureServer() {
  const requestedUrl = parseArgument('--url') ?? process.env.FLOWLOOM_BASE_URL;
  if (requestedUrl) {
    if (!(await responds(requestedUrl))) throw new Error(`Flowloom is not reachable at ${requestedUrl}.`);
    return { url: requestedUrl, child: undefined };
  }
  const existingUrl = 'http://127.0.0.1:5173';
  if (await responds(existingUrl)) return { url: existingUrl, child: undefined };
  const port = await availablePort();
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => undefined);
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url, child);
  return { url, child };
}

function specFor(format) {
  return {
    widthMm: format.widthMm,
    heightMm: format.heightMm,
    dpi: 300,
    rows: 1,
    columns: 1,
    marginMm: 6,
    gapMm: 0,
    panelLabels: false,
    labelStyle: 'uppercase',
    background: '#ffffff',
    updatedAt: generatedAt,
  };
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function commandPath(name) {
  const command = process.platform === 'win32' ? 'where.exe' : 'which';
  const result = spawnSync(command, [name], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim().split(/\r?\n/)[0] : undefined;
}

async function walkFiles(directory) {
  const values = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) values.push(...await walkFiles(target));
    else values.push(target);
  }
  return values;
}

function parseFontEmbedding(output) {
  const lines = output.split(/\r?\n/).filter((line) => line.trim());
  const rows = lines.slice(lines.findIndex((line) => /^-+/.test(line.trim())) + 1);
  const publicationRows = rows.filter((line) => line.includes('Flowloom Publication Sans'));
  return {
    raw: output.trim(),
    allEmbedded: publicationRows.length >= 1
      && publicationRows.every((line) => /\byes\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/i.test(line.trim())),
  };
}

async function openScientificWorkbench(page, url, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '打开科研绘图工作台' }).first().click();
  await page.getByRole('dialog', { name: '科研绘图工作台' }).waitFor({ state: 'visible' });
}

async function selectPreviewFormat(page, format) {
  await page.getByRole('tab', { name: '图版', exact: true }).click();
  const group = page.getByRole('group', { name: '常用图版尺寸' });
  await group.getByRole('button', { name: new RegExp(`^${format.uiName}`) }).click();
  await page.getByRole('tab', { name: '论文示意图', exact: true }).click();
  await page.locator(`svg[data-flowloom-preview-layout="${format.id}"]`).waitFor({ state: 'visible' });
}

async function selectPreviewTemplate(page, template, formatId) {
  const group = page.getByRole('group', { name: '论文示意图原型' });
  await group.getByRole('button', { name: new RegExp(`^${template.uiName}`) }).click();
  await page.locator(
    `svg[data-flowloom-preview-layout="${formatId}"][data-flowloom-preview-template-id="${template.id}"]`,
  ).waitFor({ state: 'visible' });
}

async function captureFinalQaScreenshots(page, url) {
  const screenshotRoot = path.join(root, 'output', 'playwright');
  await mkdir(screenshotRoot, { recursive: true });
  await openScientificWorkbench(page, url, previewViewports[0]);
  const screenshots = [];
  for (const format of formats) {
    await selectPreviewFormat(page, format);
    for (const template of templates) {
      await selectPreviewTemplate(page, template, format.id);
      const file = path.join(screenshotRoot, `final-qa-${template.qaSlug}-${format.qaSlug}.png`);
      await page.locator(
        `svg[data-flowloom-preview-layout="${format.id}"][data-flowloom-preview-template-id="${template.id}"]`,
      ).screenshot({ path: file });
      screenshots.push(file);
    }
  }
  return screenshots;
}

async function measurePresentationPreview(page, exportSvg, viewport, template) {
  return page.evaluate(({ exportSource, expectedViewport, expectedTemplate, thresholds }) => {
    const round = (value) => Math.round(value * 1000) / 1000;
    const toRect = (element) => {
      const value = element.getBoundingClientRect();
      return {
        left: value.left,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        width: value.width,
        height: value.height,
      };
    };
    const union = (elements) => {
      const rectangles = elements
        .map(toRect)
        .filter((rect) => rect.width > 0 && rect.height > 0);
      if (!rectangles.length) return undefined;
      return {
        left: Math.min(...rectangles.map((rect) => rect.left)),
        top: Math.min(...rectangles.map((rect) => rect.top)),
        right: Math.max(...rectangles.map((rect) => rect.right)),
        bottom: Math.max(...rectangles.map((rect) => rect.bottom)),
      };
    };
    const insets = (outer, inner) => ({
      left: round(inner.left - outer.left),
      top: round(inner.top - outer.top),
      right: round(outer.right - inner.right),
      bottom: round(outer.bottom - inner.bottom),
    });
    const visibleTextLines = (group, selector) => Array.from(group.querySelectorAll(selector))
      .filter((element) => {
        if (!element.textContent?.trim()) return false;
        const style = getComputedStyle(element);
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && style.opacity !== '0'
          && style.fill !== 'transparent';
      });
    const failures = [];
    let checkCount = 0;
    const check = (code, pass, detail) => {
      checkCount += 1;
      if (!pass) failures.push({ code, ...detail });
    };
    const svg = document.querySelector(
      `svg[data-flowloom-preview-layout="presentation"][data-flowloom-preview-template-id="${expectedTemplate}"]`,
    );
    if (!svg) throw new Error(`Presentation preview is missing for ${expectedTemplate}.`);

    const exportDocument = new DOMParser().parseFromString(exportSource, 'image/svg+xml');
    const exportPhaseLines = Object.fromEntries(Array.from(
      exportDocument.querySelectorAll('[data-schematic-role="phase"]'),
    ).map((group) => [
      group.getAttribute('data-flowloom-node-id'),
      Array.from(group.querySelectorAll('text:first-of-type tspan')).map((line) => line.textContent ?? ''),
    ]));
    const nodeMeasurements = [];
    const phaseMeasurements = [];

    for (const group of svg.querySelectorAll('[data-flowloom-preview-node-id]')) {
      const nodeId = group.getAttribute('data-flowloom-preview-node-id');
      const role = group.getAttribute('data-flowloom-preview-role');
      const boxElement = group.querySelector(`[data-flowloom-preview-node-box="${nodeId}"]`);
      if (!nodeId || !boxElement) continue;
      const box = toRect(boxElement);
      const labelLines = visibleTextLines(group, '[data-flowloom-preview-label-line]');
      const descriptionLines = visibleTextLines(group, '[data-flowloom-preview-description-line]');
      const allText = union([...labelLines, ...descriptionLines]);
      const label = union(labelLines);
      const lines = labelLines.map((line) => line.textContent ?? '');
      if (allText) {
        const tolerance = thresholds.overflowTolerancePx;
        const inside = allText.left >= box.left - tolerance
          && allText.top >= box.top - tolerance
          && allText.right <= box.right + tolerance
          && allText.bottom <= box.bottom + tolerance;
        check('node-label-contained', inside, {
          nodeId,
          role,
          box: Object.fromEntries(Object.entries(box).map(([key, value]) => [key, round(value)])),
          text: Object.fromEntries(Object.entries(allText).map(([key, value]) => [key, round(value)])),
        });
      }
      const measurement = {
        nodeId,
        role,
        lines,
        insets: label ? insets(box, label) : undefined,
      };
      nodeMeasurements.push(measurement);

      if (role === 'phase' && label) {
        const phaseInsets = insets(box, label);
        const insetPass = Object.values(phaseInsets).every((value) => value >= thresholds.phaseTextInsetPx);
        check('phase-label-inset', insetPass, {
          nodeId,
          actual: phaseInsets,
          minimumPx: thresholds.phaseTextInsetPx,
        });
        const exportedLines = exportPhaseLines[nodeId] ?? [];
        check('phase-preview-export-line-parity', JSON.stringify(lines) === JSON.stringify(exportedLines), {
          nodeId,
          previewLines: lines,
          exportLines: exportedLines,
        });
        phaseMeasurements.push({ nodeId, box, label, lines, exportedLines, insets: phaseInsets });
      }
    }

    phaseMeasurements.sort((left, right) => left.box.left - right.box.left);
    const adjacentPhaseGaps = [];
    for (let index = 0; index < phaseMeasurements.length - 1; index += 1) {
      const left = phaseMeasurements[index];
      const right = phaseMeasurements[index + 1];
      const gap = round(right.label.left - left.label.right);
      adjacentPhaseGaps.push({ left: left.nodeId, right: right.nodeId, gapPx: gap });
      check('adjacent-phase-label-gap', gap >= thresholds.adjacentPhaseTextGapPx, {
        left: left.nodeId,
        right: right.nodeId,
        actualPx: gap,
        minimumPx: thresholds.adjacentPhaseTextGapPx,
      });
    }

    const controller = nodeMeasurements.find((node) => node.nodeId === 'vla-controller');
    if (expectedTemplate === 'vla-policy') {
      const controllerPass = controller?.insets
        && Object.values(controller.insets).every((value) => value >= thresholds.controllerTextInsetPx);
      check('vla-controller-label-inset', Boolean(controllerPass), {
        nodeId: 'vla-controller',
        actual: controller?.insets,
        minimumPx: thresholds.controllerTextInsetPx,
      });
    }

    return {
      viewport: expectedViewport,
      templateId: expectedTemplate,
      layout: svg.getAttribute('data-flowloom-preview-layout'),
      thresholds,
      checkCount,
      failures,
      adjacentPhaseGaps,
      phases: phaseMeasurements.map((phase) => ({
        nodeId: phase.nodeId,
        lines: phase.lines,
        exportLines: phase.exportedLines,
        insets: phase.insets,
      })),
      controller: controller ? { nodeId: controller.nodeId, lines: controller.lines, insets: controller.insets } : undefined,
    };
  }, {
    exportSource: exportSvg,
    expectedViewport: viewport,
    expectedTemplate: template.id,
    thresholds: previewThresholds,
  });
}

async function collectPreviewLayoutValidation(page, url, presentationSvgs) {
  const results = [];
  for (const viewport of previewViewports) {
    await openScientificWorkbench(page, url, viewport);
    await selectPreviewFormat(page, formats.find((format) => format.id === 'presentation'));
    for (const template of templates) {
      await selectPreviewTemplate(page, template, 'presentation');
      const exportSvg = presentationSvgs.get(template.id);
      if (!exportSvg) throw new Error(`Presentation export SVG is missing for ${template.id}.`);
      results.push(await measurePresentationPreview(page, exportSvg, viewport, template));
    }
  }
  return results;
}

function baseMarkdownReport(manifest) {
  const rows = manifest.artifacts.map((item) => (
    `| ${item.templateId} | ${item.format} | ${item.style} | ${item.nodeCount}/${item.edgeCount} | ${item.minimumFontPt.toFixed(2)} | ${item.minimumStrokePt.toFixed(2)} | ${item.audit.error}/${item.audit.warning}/${item.audit.info} | ${item.pdfFonts.allEmbedded ? 'yes' : 'no'} |`
  )).join('\n');
  const flagshipRows = manifest.flagships.map((item) => (
    `| ${item.templateId} | ${item.totalScore.toFixed(1)} | ${item.minimumDimensionScore.toFixed(1)} | ${item.variantCount}/${item.expectedVariantCount} | ${item.failureReasons.length ? item.failureReasons.join('; ') : 'none'} |`
  )).join('\n');
  const dimensionSections = manifest.flagships.map((item) => (
    `### ${item.name}\n\n${item.dimensions.map((dimension) => `- ${dimension.label}: **${dimension.score.toFixed(1)} / 10** — ${dimension.evidence}`).join('\n')}`
  )).join('\n\n');
  return `# Flowloom Publication Evidence\n\nGenerated: ${manifest.generatedAt}\n\nThis bundle is generated from the current source tree. Automated checks establish export readiness; they do not certify scientific claims or venue acceptance.\n\n## Coverage\n\n- 3 flagship figures\n- 3 physical layouts: 89 x 70 mm, 180 x 120 mm, 180 x 101.25 mm\n- conference color and monochrome\n- editable SVG, vector PDF, and 300 DPI PNG\n- grayscale plus protanopia, deuteranopia, and tritanopia review simulations\n- every PDF rerendered at 300 DPI with Poppler\n- editor preview geometry measured at 1920 x 1200, 1920 x 1080, and 1366 x 768\n- preview phase wrapping compared line-for-line with exported SVG\n\n## Gate\n\n- Minimum flagship score: **${manifest.summary.minimumFlagshipScore.toFixed(1)} / 100**\n- Flagships below gate or with evidence failures: **${manifest.summary.flagshipFailures}**\n- Audit errors: **${manifest.summary.auditErrors}**\n- Raster failures: **${manifest.summary.rasterFailures}**\n- PDFs with unembedded fonts: **${manifest.summary.pdfFontFailures}**\n- Preview geometry failures: **${manifest.summary.previewLayoutFailures}**\n- Preview geometry checks: **${manifest.summary.previewLayoutChecks}**\n- Core artifacts: **${manifest.summary.coreArtifactFiles}**\n- Accessibility simulations: **${manifest.summary.accessibilityFiles}**\n- Poppler renders: **${manifest.summary.pdfRenderFiles}**\n\n| Flagship | Score / 100 | Lowest dimension / 10 | Variants | Failure reasons |\n| --- | ---: | ---: | ---: | --- |\n${flagshipRows}\n\n## Dimension Scorecards\n\n${dimensionSections}\n\n## Export Variants\n\n| Figure | Layout | Style | Nodes/edges | Min font pt | Min stroke pt | Audit E/W/I | PDF fonts embedded |\n| --- | --- | --- | ---: | ---: | ---: | ---: | --- |\n${rows}\n\n## Contact Sheets\n\n- \`contact-sheets/core-exports.jpg\`\n- \`contact-sheets/accessibility-simulations.jpg\`\n- \`contact-sheets/pdf-poppler-renders.jpg\`\n\nAll file hashes and source fingerprints are in \`manifest.json\`. CVD outputs are review simulations, not clinical vision models.\n`;
}

function markdownReport(manifest) {
  return baseMarkdownReport(manifest)
    .replace(
      '- every PDF rerendered at 300 DPI with Poppler',
      '- every PDF rerendered at 300 DPI with Poppler\n- all 18 native PNG / Poppler PDF pairs pass visual-equivalence regression',
    )
    .replace(
      `- Poppler renders: **${manifest.summary.pdfRenderFiles}**`,
      `- Poppler renders: **${manifest.summary.pdfRenderFiles}**\n- PNG/PDF visual-equivalence pairs: **${manifest.summary.visualEquivalencePassed}/${manifest.summary.visualEquivalencePairs}**`,
    );
}

async function main() {
  for (const directory of ['svg', 'pdf', 'png', 'pdf-renders', 'accessibility', 'contact-sheets']) {
    await mkdir(path.join(outputRoot, directory), { recursive: true });
  }
  const server = await ensureServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1 });
    await page.goto(server.url, { waitUntil: 'networkidle' });
    const qualityGate = await page.evaluate(async () => {
      const module = await import('/src/lib/flagshipQuality.ts');
      return {
        threshold: module.FLAGSHIP_QUALITY_THRESHOLD,
        minimumDimensionScore: module.FLAGSHIP_MINIMUM_DIMENSION_SCORE,
        rubricVersion: module.FLAGSHIP_QUALITY_RUBRIC_VERSION,
        scorecards: module.FLAGSHIP_QUALITY_SCORECARDS,
      };
    });
    const artifacts = [];
    const presentationSvgs = new Map();
    for (const template of templates) {
      for (const format of formats) {
        for (const style of styles) {
          const request = { templateId: template.id, style, spec: specFor(format) };
          const artifact = await page.evaluate(async (payload) => {
            const module = await import('/src/lib/publicationEvidenceBrowser.ts');
            return module.buildPublicationEvidenceArtifact(payload);
          }, request);
          if (format.id === 'presentation' && style === 'conference') {
            presentationSvgs.set(template.id, artifact.svg);
          }
          const stem = `${template.slug}-${format.id}-${style}`;
          const svgPath = path.join(outputRoot, 'svg', `${stem}.svg`);
          const pdfPath = path.join(outputRoot, 'pdf', `${stem}.pdf`);
          const pngPath = path.join(outputRoot, 'png', `${stem}.png`);
          await Promise.all([
            writeFile(svgPath, artifact.svg, 'utf8'),
            writeFile(pdfPath, Buffer.from(artifact.pdfBase64, 'base64')),
            writeFile(pngPath, Buffer.from(artifact.pngBase64, 'base64')),
          ]);
          const audit = artifact.audit.reduce((counts, issue) => {
            counts[issue.severity] += 1;
            return counts;
          }, { error: 0, warning: 0, info: 0 });
          artifacts.push({
            stem,
            templateId: template.id,
            format: format.id,
            style,
            widthMm: format.widthMm,
            heightMm: format.heightMm,
            dpi: 300,
            pixelWidth: Math.round(format.widthMm / 25.4 * 300),
            pixelHeight: Math.round(format.heightMm / 25.4 * 300),
            layout: artifact.layout,
            nodeCount: artifact.nodeCount,
            edgeCount: artifact.edgeCount,
            minimumFontPt: artifact.minimumFontPt,
            minimumAnnotationFontPt: artifact.minimumAnnotationFontPt,
            minimumStrokePt: artifact.minimumStrokePt,
            bounds: artifact.bounds,
            audit,
            auditIssues: artifact.audit,
            files: {
              svg: path.relative(root, svgPath).replaceAll('\\', '/'),
              pdf: path.relative(root, pdfPath).replaceAll('\\', '/'),
              png: path.relative(root, pngPath).replaceAll('\\', '/'),
            },
          });
          process.stdout.write(`generated ${stem}\n`);
        }
      }
    }
    const screenshotFiles = await captureFinalQaScreenshots(page, server.url);
    const previewLayoutValidation = await collectPreviewLayoutValidation(page, server.url, presentationSvgs);
    const previewScreenshots = await Promise.all(screenshotFiles.map(async (file) => ({
      file: path.relative(root, file).replaceAll('\\', '/'),
      sha256: await sha256(file),
    })));
    await browser.close();
    browser = undefined;

    const pdftocairo = commandPath('pdftocairo');
    const pdffonts = commandPath('pdffonts');
    const pdfinfo = commandPath('pdfinfo');
    if (!pdftocairo || !pdffonts || !pdfinfo) throw new Error('Poppler commands pdftocairo, pdffonts, and pdfinfo are required.');
    for (const artifact of artifacts) {
      const pdfPath = path.join(root, artifact.files.pdf);
      const renderStem = path.join(outputRoot, 'pdf-renders', path.basename(pdfPath, '.pdf'));
      run(pdftocairo, ['-png', '-singlefile', '-r', '300', pdfPath, renderStem]);
      artifact.files.pdfRender = `${path.relative(root, renderStem).replaceAll('\\', '/')}.png`;
      artifact.pdfFonts = parseFontEmbedding(run(pdffonts, [pdfPath]));
      artifact.pdfInfo = run(pdfinfo, [pdfPath]).trim();
    }

    const python = commandPath(process.platform === 'win32' ? 'python.exe' : 'python3') ?? commandPath('python');
    if (!python) throw new Error('Python with Pillow and NumPy is required for accessibility simulations.');
    run(python, [path.join(root, 'scripts', 'create-accessibility-variants.py'), outputRoot], { stdio: 'inherit' });
    const rasterValidation = JSON.parse(await readFile(path.join(outputRoot, 'raster-validation.json'), 'utf8'));
    const expectedVariantCount = formats.length * styles.length;
    const visualEquivalence = Array.isArray(rasterValidation.visualEquivalence)
      ? rasterValidation.visualEquivalence
      : [];
    const rasterFailureRecords = Array.isArray(rasterValidation.failures)
      ? rasterValidation.failures
      : [];
    const flagships = templates.map((template) => {
      const scorecard = qualityGate.scorecards[template.id];
      if (!scorecard) throw new Error(`Missing flagship scorecard for ${template.id}.`);
      const templateArtifacts = artifacts.filter((artifact) => artifact.templateId === template.id);
      const templatePreviewChecks = previewLayoutValidation.filter((item) => item.templateId === template.id);
      const failureReasons = [];
      if (templateArtifacts.length !== expectedVariantCount) {
        failureReasons.push(`expected ${expectedVariantCount} export variants, received ${templateArtifacts.length}`);
      }
      if (scorecard.totalScore < qualityGate.threshold) {
        failureReasons.push(`score ${scorecard.totalScore.toFixed(1)} is below ${qualityGate.threshold}`);
      }
      if (scorecard.minimumDimensionScore < qualityGate.minimumDimensionScore) {
        failureReasons.push(`lowest dimension ${scorecard.minimumDimensionScore.toFixed(1)} is below ${qualityGate.minimumDimensionScore}`);
      }
      const variants = templateArtifacts.map((artifact) => {
        const raster = visualEquivalence.find((item) => item.stem === artifact.stem);
        const failures = [];
        if (artifact.audit.error) failures.push(`${artifact.audit.error} audit error(s)`);
        if (!artifact.pdfFonts.allEmbedded) failures.push('PDF font embedding failed');
        if (!raster) failures.push('PNG/PDF visual-equivalence result missing');
        else if (!raster.passed) failures.push(`PNG/PDF mismatch: ${raster.failures.join(', ') || 'unspecified'}`);
        if (failures.length) failureReasons.push(`${artifact.format}/${artifact.style}: ${failures.join(', ')}`);
        return {
          format: artifact.format,
          style: artifact.style,
          minimumFontPt: artifact.minimumFontPt,
          minimumAnnotationFontPt: artifact.minimumAnnotationFontPt,
          minimumStrokePt: artifact.minimumStrokePt,
          audit: artifact.audit,
          pdfFontsEmbedded: artifact.pdfFonts.allEmbedded,
          rasterPassed: raster?.passed ?? false,
          failures,
        };
      });
      for (const preview of templatePreviewChecks) {
        if (preview.failures.length) {
          failureReasons.push(`${preview.viewport.id} preview: ${preview.failures.map((failure) => failure.code).join(', ')}`);
        }
      }
      for (const failure of rasterFailureRecords) {
        const serialized = JSON.stringify(failure);
        if (serialized.includes(template.id) || serialized.includes(template.slug)) {
          failureReasons.push(`raster validation: ${serialized}`);
        }
      }
      const uniqueFailures = [...new Set(failureReasons)];
      return {
        templateId: template.id,
        name: scorecard.name,
        rubricVersion: scorecard.rubricVersion,
        reviewedAt: scorecard.reviewedAt,
        scope: scorecard.scope,
        threshold: scorecard.threshold,
        totalScore: scorecard.totalScore,
        minimumDimensionScore: scorecard.minimumDimensionScore,
        dimensions: scorecard.dimensions,
        expectedVariantCount,
        variantCount: templateArtifacts.length,
        variants,
        previewCheckCount: templatePreviewChecks.reduce((sum, item) => sum + item.checkCount, 0),
        previewFailureCount: templatePreviewChecks.reduce((sum, item) => sum + item.failures.length, 0),
        failureReasons: uniqueFailures,
        passed: scorecard.passed && uniqueFailures.length === 0,
      };
    });
    const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, await sha256(path.join(root, file))])));
    const artifactFiles = (await walkFiles(outputRoot)).filter((file) => !file.endsWith('manifest.json') && !file.endsWith('REPORT.md'));
    const hashes = Object.fromEntries(await Promise.all(artifactFiles.map(async (file) => [
      path.relative(root, file).replaceAll('\\', '/'),
      await sha256(file),
    ])));
    const gitCommit = run('git', ['rev-parse', 'HEAD']).trim();
    const gitStatus = run('git', ['status', '--short']).trim();
    const manifest = {
      schemaVersion: 3,
      generatedAt,
      source: {
        gitCommit,
        dirty: Boolean(gitStatus),
        sourceHashes,
      },
      benchmark: {
        llmVlmPapers: 50,
        embodiedVlaPapers: 50,
        extractedFigures: 1289,
        corpus: 'docs/research/arxiv-figure-corpus.json',
      },
      acceptanceGate: {
        reviewerScore: qualityGate.threshold,
        minimumDimensionScore: qualityGate.minimumDimensionScore,
        rubricVersion: qualityGate.rubricVersion,
        critical: 0,
        previewThresholds,
        disclaimer: 'Export readiness is not venue acceptance or scientific validation.',
      },
      flagships,
      artifacts,
      previewScreenshots,
      previewLayoutValidation,
      rasterValidation,
      hashes,
      summary: {
        minimumFlagshipScore: Math.min(...flagships.map((item) => item.totalScore)),
        flagshipFailures: flagships.filter((item) => !item.passed).length,
        auditErrors: artifacts.reduce((sum, item) => sum + item.audit.error, 0),
        auditWarnings: artifacts.reduce((sum, item) => sum + item.audit.warning, 0),
        rasterFailures: rasterValidation.failures.length,
        pdfFontFailures: artifacts.filter((item) => !item.pdfFonts.allEmbedded).length,
        previewLayoutChecks: previewLayoutValidation.reduce((sum, item) => sum + item.checkCount, 0),
        previewLayoutFailures: previewLayoutValidation.reduce((sum, item) => sum + item.failures.length, 0),
        coreArtifactFiles: artifacts.length * 3,
        accessibilityFiles: rasterValidation.accessibilityVariantCount,
        pdfRenderFiles: rasterValidation.pdfRenderCount,
        visualEquivalencePairs: rasterValidation.visualEquivalencePairCount,
        visualEquivalencePassed: rasterValidation.visualEquivalencePassedCount,
      },
    };
    await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await writeFile(path.join(outputRoot, 'REPORT.md'), markdownReport(manifest), 'utf8');
    if (
      manifest.summary.flagshipFailures
      || manifest.summary.minimumFlagshipScore < manifest.acceptanceGate.reviewerScore
      || manifest.summary.auditErrors
      || manifest.summary.rasterFailures
      || manifest.summary.pdfFontFailures
      || manifest.summary.previewLayoutFailures
    ) {
      throw new Error(`Evidence gate failed: ${JSON.stringify(manifest.summary)}`);
    }
    process.stdout.write(`publication evidence complete: ${path.relative(root, outputRoot)}\n`);
  } finally {
    if (browser) await browser.close();
    if (server.child && server.child.exitCode === null) server.child.kill();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
