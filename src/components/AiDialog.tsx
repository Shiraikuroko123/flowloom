import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Paperclip,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { AiAttachment, AiConfig, FlowEdge, FlowNode } from '../types';
import { generateDiagram, isScientificAiScenario, readAiAttachment } from '../lib/aiClient';
import { aiPayloadToGraph } from '../lib/fileAdapters';
import { layoutGraph, normalizeGraph } from '../lib/diagram';
import { createId } from '../lib/id';
import { IconButton } from './IconButton';

const CONFIG_KEY = 'flowloom.ai.config.v1';
const SECRET_KEY = 'flowloom.ai.key.v1';

const scenarioOptions = [
  '通用业务流程',
  '软件架构与数据流',
  '审批与权限',
  '故障响应与运维',
  '客户旅程与服务蓝图',
  '教学与决策树',
  '大模型 / 多模态论文示意图',
  'VLA / 具身智能系统图',
  '训练、推理与数据闭环',
];

function loadConfig(): AiConfig {
  const defaults: AiConfig = {
    baseUrl: import.meta.env.VITE_AI_BASE_URL || 'http://127.0.0.1:3000/v1',
    apiKey: '',
    model: import.meta.env.VITE_AI_MODEL || '',
    rememberKey: false,
  };
  try {
    const stored = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? '{}') as Partial<AiConfig>;
    const rememberKey = Boolean(stored.rememberKey);
    return {
      ...defaults,
      ...stored,
      rememberKey,
      apiKey: rememberKey ? localStorage.getItem(SECRET_KEY) ?? '' : '',
    };
  } catch {
    return defaults;
  }
}

function saveConfig(config: AiConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    baseUrl: config.baseUrl,
    model: config.model,
    rememberKey: config.rememberKey,
  }));
  if (config.rememberKey && config.apiKey) localStorage.setItem(SECRET_KEY, config.apiKey);
  else localStorage.removeItem(SECRET_KEY);
}

interface AiDialogProps {
  open: boolean;
  referenceNode?: FlowNode;
  onClose: () => void;
  onApply: (title: string, nodes: FlowNode[], edges: FlowEdge[]) => void;
}

export function AiDialog({ open, referenceNode, onClose, onApply }: AiDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [scenario, setScenario] = useState(scenarioOptions[0]);
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [config, setConfig] = useState<AiConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<'idle' | 'reading' | 'generating' | 'success'>('idle');
  const [error, setError] = useState('');
  const scientificScenario = isScientificAiScenario(scenario);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const referenceAttachment = useMemo<AiAttachment | null>(() => {
    if (!referenceNode?.data.imageUrl) return null;
    const mimeType = referenceNode.data.imageUrl.match(/^data:([^;,]+)/)?.[1] ?? 'image/png';
    if (!mimeType.startsWith('image/')) return null;
    return {
      name: referenceNode.data.sourceRef ?? referenceNode.data.label,
      mimeType,
      content: referenceNode.data.imageUrl,
      kind: 'image',
    };
  }, [referenceNode]);

  const handleFiles = async (files: FileList | File[]) => {
    setStatus('reading');
    setError('');
    try {
      const next = await Promise.all(Array.from(files).slice(0, 8).map(readAiAttachment));
      setAttachments((current) => [...current, ...next].slice(0, 8));
      setStatus('idle');
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : '附件读取失败。');
      setStatus('idle');
    }
  };

  const submit = async () => {
    if (!prompt.trim() && attachments.length === 0 && !referenceAttachment) {
      setError('请输入流程场景或添加来源文件。');
      return;
    }
    saveConfig(config);
    setError('');
    setStatus('generating');
    abortRef.current = new AbortController();
    try {
      const requestPrompt = prompt.trim() || (scientificScenario
        ? 'Reconstruct the supplied source as an original editable scientific system schematic.'
        : 'Reconstruct the supplied source as an editable flowchart.');
      const requestAttachments = referenceAttachment ? [referenceAttachment, ...attachments] : attachments;
      const payload = await generateDiagram({
        prompt: requestPrompt,
        scenario,
        attachments: requestAttachments,
        config,
        signal: abortRef.current.signal,
      });
      const parsed = aiPayloadToGraph(payload);
      const positioned = parsed.nodes.some((node) => node.position.x || node.position.y)
        ? normalizeGraph(parsed.nodes, parsed.edges)
        : layoutGraph(parsed.nodes, parsed.edges, parsed.direction);
      const scientificRootIndex = positioned.nodes.findIndex((node) => node.data.schematicRole === 'frame');
      const rootIndex = scientificRootIndex >= 0 ? scientificRootIndex : 0;
      const finalNodes = scientificScenario ? positioned.nodes.map((node, index) => index === rootIndex ? {
        ...node,
        data: {
          ...node.data,
          scientificRole: 'schematic-root' as const,
          schematicRole: node.data.schematicRole ?? 'frame',
          provenance: {
            id: createId('provenance'),
            kind: 'scientific-schematic' as const,
            sourceName: 'CCSwitch AI scientific schematic',
            sourceFormat: 'OpenAI-compatible structured JSON',
            sourceData: JSON.stringify({ scenario, prompt: requestPrompt, attachments: requestAttachments.map((item) => item.name) }),
            engine: config.model,
            generatedAt: new Date().toISOString(),
            schematic: {
              templateId: 'ai-generated' as const,
              style: 'conference' as const,
              density: 'detailed' as const,
              language: /[\p{Script=Han}]/u.test(requestPrompt) ? 'zh' as const : 'en' as const,
              generatedBy: 'ai' as const,
              prompt: requestPrompt,
            },
          },
        },
      } : node) : positioned.nodes;
      onApply(parsed.title, finalNodes, positioned.edges);
      setStatus('success');
      window.setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 420);
    } catch (generationError) {
      if ((generationError as Error).name === 'AbortError') {
        setStatus('idle');
        return;
      }
      const message = generationError instanceof Error ? generationError.message : 'AI 生成失败。';
      setError(/Failed to fetch/i.test(message) ? '无法访问 AI 接口。请检查 CCSwitch 端点、服务状态与浏览器 CORS 设置。' : message);
      setStatus('idle');
    }
  };

  const close = () => {
    abortRef.current?.abort();
    setError('');
    setStatus('idle');
    onClose();
  };

  return (
    <dialog ref={dialogRef} className="app-dialog ai-dialog" onClose={onClose} onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="dialog-header">
        <div className="dialog-title"><span className="dialog-title__icon"><Sparkles size={18} /></span><div><h2>AI 图形设计</h2><p>{scientificScenario ? '论文系统示意图 · OpenAI 兼容接口' : '结构化流程图 · OpenAI 兼容接口'}</p></div></div>
        <IconButton label="关闭" icon={<X size={18} />} onClick={close} />
      </div>

      <div className="ai-dialog__content">
        <div className="ai-compose">
          <label className="field-stack">
            <span className="field-label">场景</span>
            <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
              {scenarioOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="field-stack">
            <span className="field-label">需求与上下文</span>
            <textarea
              rows={8}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={scientificScenario
                ? '例如：绘制一个 VLA 机器人策略图。双视觉编码器与语言指令进入 VLM 主干，动作专家预测 16 步动作块，并显示机器人环境反馈回路。'
                : '例如：为企业客户退款申请设计审批流程，包含金额分级、风控复核、超时升级和失败回退。'}
              autoFocus
            />
          </label>

          <div className="attachment-list">
            {referenceAttachment && (
              <div className="attachment-chip is-reference"><ImageIcon size={15} /><span>{referenceAttachment.name}</span><small>当前参考图</small></div>
            )}
            {attachments.map((attachment, index) => (
              <div className="attachment-chip" key={`${attachment.name}-${index}`}>
                {attachment.kind === 'image' ? <ImageIcon size={15} /> : <FileText size={15} />}
                <span>{attachment.name}</span>
                <button aria-label={`移除 ${attachment.name}`} onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <label className="file-drop compact-file-drop">
            <Paperclip size={17} />
            <span>{status === 'reading' ? '正在读取…' : '添加文本、数据或图片'}</span>
            <input type="file" multiple accept="image/*,.txt,.md,.csv,.json,.yaml,.yml,.xml,.mmd,.dot,.puml" onChange={(event) => event.target.files && handleFiles(event.target.files)} />
          </label>

          {error && <div className="inline-message inline-message--error" role="alert">{error}</div>}
        </div>

        <div className={`ai-settings ${showSettings ? 'is-open' : ''}`}>
          <button className="settings-toggle" onClick={() => setShowSettings((value) => !value)} aria-expanded={showSettings}>
            接口设置 <span>{config.model || '未配置模型'}</span>
          </button>
          {showSettings && (
            <div className="ai-settings__fields">
              <label className="field-stack"><span className="field-label">Base URL</span><input value={config.baseUrl} onChange={(event) => setConfig({ ...config, baseUrl: event.target.value })} placeholder="http://127.0.0.1:3000/v1" /></label>
              <label className="field-stack"><span className="field-label">模型</span><input value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value })} placeholder="模型名称" /></label>
              <label className="field-stack"><span className="field-label">API Key</span><input type="password" value={config.apiKey} onChange={(event) => setConfig({ ...config, apiKey: event.target.value })} autoComplete="off" placeholder="可留空" /></label>
              <label className="toggle-row"><input type="checkbox" checked={config.rememberKey} onChange={(event) => setConfig({ ...config, rememberKey: event.target.checked })} /> 在此浏览器保存 Key</label>
            </div>
          )}
        </div>
      </div>

      <div className="dialog-footer">
        <button className="secondary-button" onClick={close}>取消</button>
        {status === 'generating' ? (
          <button className="primary-button" onClick={() => abortRef.current?.abort()}><LoaderCircle className="spin" size={16} /> 停止生成</button>
        ) : status === 'success' ? (
          <button className="primary-button" disabled><Check size={16} /> 已生成</button>
        ) : (
          <button className="primary-button" onClick={submit}><Sparkles size={16} /> {scientificScenario ? '生成论文示意图' : '生成流程图'}</button>
        )}
      </div>
    </dialog>
  );
}
