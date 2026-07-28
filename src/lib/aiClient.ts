import type { AiDiagramRequest } from '../types';
import { VISIBLE_SHAPES } from './shapeRegistry';

const SHAPE_CATALOG = VISIBLE_SHAPES
  .map((definition) => `${definition.kind}=${definition.label}`)
  .join(', ');

const SYSTEM_PROMPT = `You are a senior process architect. Convert the user's context into one precise editable flowchart.
Return only a JSON object with this schema:
{
  "title": "short diagram title",
  "direction": "TB or LR",
  "nodes": [{"id":"stable-ascii-id","label":"concise visible label","description":"optional detail","kind":"a supported shape id"}],
  "edges": [{"source":"node-id","target":"node-id","label":"optional branch condition"}]
}
Rules:
- Include explicit start and end nodes.
- Every non-terminal node must connect forward; avoid orphan nodes.
- Decision nodes should usually have labeled outgoing branches.
- Use 5-18 nodes unless the source requires more.
- Preserve concrete roles, constraints, exception paths, and terminology from the source.
- Choose the most semantically accurate standard shape. Supported shape ids: ${SHAPE_CATALOG}.
- Prefer standard flowchart shapes unless the user explicitly requests BPMN or UML notation.
- Do not wrap JSON in markdown fences and do not add commentary.`;

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

function endpoint(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(clean)) return clean;
  return `${clean}/chat/completions`;
}

function buildUserContent(request: AiDiagramRequest): unknown {
  const context = [
    request.scenario ? `Scenario: ${request.scenario}` : '',
    request.prompt,
    ...request.attachments.filter((item) => item.kind === 'text').map((item) => `\n--- ${item.name} ---\n${item.content}`),
  ].filter(Boolean).join('\n\n');
  const images = request.attachments.filter((item) => item.kind === 'image');
  if (images.length === 0) return context;
  return [
    { type: 'text', text: `${context}\n\nReconstruct the supplied diagram/reference images as structured nodes and edges.` },
    ...images.map((item) => ({ type: 'image_url', image_url: { url: item.content, detail: 'high' } })),
  ];
}

async function requestCompletion(request: AiDiagramRequest, useResponseFormat: boolean) {
  const response = await fetch(endpoint(request.config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(request.config.apiKey ? { Authorization: `Bearer ${request.config.apiKey}` } : {}),
    },
    signal: request.signal,
    body: JSON.stringify({
      model: request.config.model,
      temperature: 0.15,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserContent(request) },
      ],
      ...(useResponseFormat ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`AI 接口返回 ${response.status}: ${detail.slice(0, 360)}`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export async function generateDiagram(request: AiDiagramRequest): Promise<unknown> {
  if (!request.config.baseUrl.trim()) throw new Error('请先填写 OpenAI 兼容接口地址。');
  if (!request.config.model.trim()) throw new Error('请先填写模型名称。');
  let response: Record<string, unknown>;
  try {
    response = await requestCompletion(request, true);
  } catch (error) {
    if (![400, 422].includes((error as { status?: number }).status ?? 0)) throw error;
    response = await requestCompletion(request, false);
  }
  const choices = response.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const content = message?.content;
  if (typeof content === 'string') return JSON.parse(stripCodeFence(content));
  if (Array.isArray(content)) {
    const text = content
      .map((part) => typeof part === 'object' && part && 'text' in part ? String((part as { text: unknown }).text) : '')
      .join('');
    return JSON.parse(stripCodeFence(text));
  }
  throw new Error('AI 接口没有返回可解析的内容。');
}

export async function readAiAttachment(file: File): Promise<import('../types').AiAttachment> {
  if (file.type.startsWith('image/')) {
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`无法读取 ${file.name}`));
      reader.readAsDataURL(file);
    });
    return { name: file.name, mimeType: file.type, content, kind: 'image' };
  }
  const content = typeof file.text === 'function'
    ? await file.text()
    : await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('无法读取 ' + file.name));
        reader.readAsText(file);
      });
  return { name: file.name, mimeType: file.type || 'text/plain', content: content.slice(0, 120_000), kind: 'text' };
}
