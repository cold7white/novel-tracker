import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AISettings } from '../types/ai';
import { streamBookInfoV2 } from '../lib/ai/service';
import { useNovels } from '../contexts/NovelContext';
import './AIBookTab.css';

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

interface AIConfigV2 {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  stream: boolean;
  systemPrompt: string;
  userPrompt: string;
}

interface StoredConfig extends AIConfigV2 {
  aiResult?: string;
}

// ─── 常量 ─────────────────────────────────────────────────────────────────────

const CONFIG_KEY = 'ai-config-v2';

const PROVIDER_URLS: Record<string, string> = {
  openai:   'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  glm:      'https://open.bigmodel.cn/api/paas/v4',
  minimax:  'https://api.minimax.chat/v1',
  qwen:     'https://dashscope.aliyuncs.com/compatible-mode/v1',
  kimi:     'https://api.moonshot.cn/v1',
  claude:   'https://api.anthropic.com/v1',
  gemini:   'https://generativelanguage.googleapis.com/v1beta',
  custom:   '',
};

const PROVIDER_LABELS: Record<string, string> = {
  custom:   '自定义',
  openai:   'OpenAI',
  deepseek: 'DeepSeek',
  glm:      'GLM',
  minimax:  'MiniMax',
  qwen:     'Qwen',
  kimi:     'Kimi',
  claude:   'Claude',
  gemini:   'Gemini',
};

const PROVIDER_ORDER = ['custom', 'openai', 'deepseek', 'glm', 'minimax', 'qwen', 'kimi', 'claude', 'gemini'];

const DEFAULT_SYSTEM_PROMPT = `# 角色
你是一位书籍信息整理与推荐助手，负责从书籍本身及全网公开的社交/平台数据中提取信息，并根据"书籍客观特征 + 社交热度信号"推荐相似作品。不引入主观评价（如"必读""经典"）。

# 任务
请为《{{书名}}》（作者：{{作者名}}）生成以下三部分内容，采用简洁美观的排版。

## 排版要求
- 使用纯文本 + 少量 Markdown（仅限 \`**粗体**\`、\`- 列表\`、\`>\` 引用块）。
- 各板块之间用一个空行分隔。
- 基本信息每项一行，用 \`**字段**：值\` 格式。
- 类似小说推荐用 \`>\` 引用块，每个推荐之间空一行。

## 输出格式

**书名**：《{{书名}}》
**作者**：{{作者名}}（笔名 · 首发平台）

**发布平台**：xxx
**时间**：xxx
**连载状态**：已完结 / 连载中
**字数**：xxx 万字
**标签**：#标签1 #标签2 #标签3
**主角**：主角名（身份/特点）

内容简介：
（自由撰写，允许完整剧透，可分段，不设字数上限）

类似小说推荐：
> **《推荐1》** · 作者：XXX
> 推荐依据：
> - 客观特征：与本书共享【标签A】【标签B】，主角类型相似，背景均为【XX】。
> - 热度信号：在【起点月票榜/小红书/知乎】上被高频提及 / 高赞书评关联 / 同类读者共同收藏。

> **《推荐2》** · 作者：XXX
> 推荐依据：……

（若无合适推荐，写"无公开匹配信息"）

# 数据来源说明（AI内部使用，不输出）
可参考以下外部信号（需真实可查，禁止编造）：
- 小说平台：起点月票榜/推荐榜、书友"喜欢这本书的人也喜欢"列表
- 社交平台：小红书笔记中与本书同屏出现的高频书籍、知乎"本书类似作品推荐"的高赞回答
- 书评聚合：豆瓣"同类书单"标签、读者标记的"喜欢这本书的人也喜欢"

# 约束
- 禁止出现"必读""经典""口碑爆棚"等主观评价词。
- 热度信号必须基于真实可查的平台数据（可概括表述，如"小红书高赞笔记中常与本书一同推荐"），不得编造具体数字或虚假链接。
- 推荐理由必须同时包含"客观特征相似"和"热度信号"两部分。`;

const DEFAULT_USER_PROMPT = `请为《{{书名}}》（作者：{{作者名}}）生成书籍信息`;

const DEFAULT_CONFIG: AIConfigV2 = {
  provider: 'custom',
  apiKey: '',
  baseURL: '',
  model: '',
  temperature: 0.7,
  top_p: 1,
  max_tokens: 4096,
  stream: false,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  userPrompt: DEFAULT_USER_PROMPT,
};

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: StoredConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AIBookTabProps {
  title: string;
  author: string;
  aiContent?: string;
  onSaveContent: (content: string) => void;
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────

const AIBookTab: React.FC<AIBookTabProps> = ({ title, author, aiContent, onSaveContent }) => {
  const { syncAISettingsToCloud } = useNovels();

  // 主页面状态
  const [content, setContent] = useState<string>(() => {
    const stored = loadConfig();
    return aiContent || stored.aiResult || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 配置页状态
  const [showConfigPage, setShowConfigPage] = useState(false);
  const [localConfig, setLocalConfig] = useState<AIConfigV2>(() => {
    const stored = loadConfig();
    const { aiResult: _r, ...cfg } = stored;
    return cfg;
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 同步外部 aiContent 变化
  useEffect(() => {
    if (aiContent) {
      setContent(aiContent);
    }
  }, [aiContent]);

  // 清理
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  // ── 配置页操作 ─────────────────────────────────────────────────────────────

  const handleOpenConfig = () => {
    // 打开时重新加载已保存的配置
    const stored = loadConfig();
    const { aiResult: _r, ...cfg } = stored;
    setLocalConfig(cfg);
    setShowAdvanced(false);
    setShowConfigPage(true);
  };

  const handleCloseConfig = () => {
    setShowConfigPage(false);
  };

  const handleProviderChange = (provider: string) => {
    setLocalConfig(prev => ({
      ...prev,
      provider,
      baseURL: PROVIDER_URLS[provider] !== undefined ? PROVIDER_URLS[provider] : prev.baseURL,
    }));
  };

  // ── 生成操作 ───────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async (configToUse: AIConfigV2) => {
    // 1. 保存配置到 localStorage
    const stored = loadConfig();
    saveConfig({ ...configToUse, aiResult: stored.aiResult });

    // 2. 同步配置到 Supabase
    const aiSettings: AISettings = {
      provider: configToUse.provider,
      apiKey: configToUse.apiKey,
      apiUrl: configToUse.baseURL,
      model: configToUse.model,
    };
    syncAISettingsToCloud(aiSettings);

    // 3. 关闭配置页
    setShowConfigPage(false);

    // 4. 重置状态，开始生成
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setContent('');
    setError(null);
    setLoading(true);

    let fullContent = '';

    await streamBookInfoV2(
      title,
      author,
      configToUse,
      {
        onChunk: (text: string) => {
          fullContent += text;
          setContent(fullContent);
        },
        onDone: () => {
          setLoading(false);
          // 保存结果到 localStorage
          saveConfig({ ...configToUse, aiResult: fullContent });
          // 保存结果到 novel（同步到 Supabase novels.ai_content）
          onSaveContent(fullContent);
        },
        onError: (err: Error) => {
          setError(err.message);
          setLoading(false);
        },
      },
      controller.signal
    );
  }, [title, author, onSaveContent, syncAISettingsToCloud]);

  const handleConfigGenerate = () => {
    handleGenerate(localConfig);
  };

  const handleRetry = () => {
    const stored = loadConfig();
    const { aiResult: _r, ...cfg } = stored;
    handleGenerate(cfg);
  };

  // ── Markdown 渲染 ─────────────────────────────────────────────────────────

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/&gt;/g, '>');

    const lines = html.split('\n');
    const result: string[] = [];
    let inBlockquote = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('> ') || line === '>') {
        if (!inBlockquote) {
          result.push('<blockquote class="ai-blockquote">');
          inBlockquote = true;
        }
        let quoteLine = line.replace(/^>\s?/, '');
        quoteLine = quoteLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (quoteLine.startsWith('- ')) {
          quoteLine = `<li>${quoteLine.slice(2)}</li>`;
        }
        result.push(`<p>${quoteLine}</p>`);
      } else {
        if (inBlockquote) {
          result.push('</blockquote>');
          inBlockquote = false;
        }
        if (line.trim() === '') {
          result.push('<br/>');
        } else {
          let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          if (processedLine.startsWith('- ')) {
            processedLine = `<li>${processedLine.slice(2)}</li>`;
          } else {
            processedLine = `<span>${processedLine}</span>`;
          }
          result.push(processedLine);
        }
      }
    }

    if (inBlockquote) result.push('</blockquote>');
    return result.join('\n');
  };

  const hasContent = content.trim().length > 0;
  const isConfigured = !!loadConfig().apiKey;

  // ── 渲染 ──────────────────────────────────────────────────────────────────

  return (
    <div className="ai-book-tab">
      {/* 工具栏：只有配置按钮 */}
      <div className="ai-book-toolbar">
        <button
          className="btn btn-secondary ai-book-config-btn"
          onClick={handleOpenConfig}
          title="AI 配置"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          配置
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="ai-book-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{error}</span>
          <button className="btn btn-primary ai-book-retry-btn" onClick={handleRetry}>重试</button>
        </div>
      )}

      {/* 加载中（无内容时） */}
      {loading && !hasContent && (
        <div className="ai-book-loading">
          <div className="ai-book-loading-dots">
            <span></span><span></span><span></span>
          </div>
          <p>AI 正在分析《{title}》...</p>
        </div>
      )}

      {/* 内容区域 */}
      {hasContent && (
        <div
          className={`ai-book-content${loading ? ' ai-book-content--streaming' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      )}

      {/* 空状态：已配置但无内容 */}
      {!hasContent && !loading && !error && (
        <div className="ai-book-empty">
          <svg width="48" height="48" viewBox="0 0 1024 1024" fill="currentColor" opacity="0.25">
            <path d="M874.2 137.8H149.8c-39.3 0-71.2 31.9-71.2 71.2v427.2c0 39.3 31.9 71.2 71.2 71.2h213.6l85.4 85.4c5.6 5.6 13 8.5 20.2 8.5s14.6-2.8 20.2-8.5l85.4-85.4h299.6c39.3 0 71.2-31.9 71.2-71.2V209c0-39.3-31.9-71.2-71.2-71.2z m28.5 498.4c0 15.7-12.8 28.5-28.5 28.5H562.6c-11.3 0-22.1 4.5-30.2 12.5L469 739.8l-63.4-63.4c-8-8-18.9-12.5-30.2-12.5H149.8c-15.7 0-28.5-12.8-28.5-28.5V209c0-15.7 12.8-28.5 28.5-28.5h724.4c15.7 0 28.5 12.8 28.5 28.5v427.2z"/>
            <path d="M512 512m-42.7 0a42.7 42.7 0 1 0 85.4 0 42.7 42.7 0 1 0-85.4 0ZM341.3 512m-42.7 0a42.7 42.7 0 1 0 85.4 0 42.7 42.7 0 1 0-85.4 0ZM682.7 512m-42.7 0a42.7 42.7 0 1 0 85.4 0 42.7 42.7 0 1 0-85.4 0Z"/>
          </svg>
          <p className="ai-book-empty-title">
            {isConfigured
              ? '点击「配置」按钮中的「生成」，让 AI 为你整理本书信息'
              : '请先点击「配置」按钮，设置 AI 参数后生成内容'}
          </p>
        </div>
      )}

      {/* 配置页（Portal） */}
      {showConfigPage && createPortal(
        <div className="ai-config-overlay" onClick={handleCloseConfig}>
          <div className="ai-config-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="ai-config-header">
              <h3 className="ai-config-title">AI 配置</h3>
              <button className="ai-config-close" onClick={handleCloseConfig}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body：左右分栏 */}
            <div className="ai-config-body">

              {/* 左侧：Config Panel */}
              <div className="ai-config-left">

                {/* Provider */}
                <div className="ai-config-field">
                  <label className="ai-config-label">Provider（提供商）</label>
                  <select
                    className="ai-config-select"
                    value={localConfig.provider}
                    onChange={e => handleProviderChange(e.target.value)}
                  >
                    {PROVIDER_ORDER.map(key => (
                      <option key={key} value={key}>{PROVIDER_LABELS[key]}</option>
                    ))}
                  </select>
                </div>

                {/* API Key */}
                <div className="ai-config-field">
                  <label className="ai-config-label">API Key</label>
                  <input
                    className="ai-config-input"
                    type="password"
                    placeholder="输入你的 API Key"
                    value={localConfig.apiKey}
                    onChange={e => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>

                {/* Base URL */}
                <div className="ai-config-field">
                  <label className="ai-config-label">Base URL</label>
                  <input
                    className="ai-config-input"
                    type="text"
                    placeholder="https://api.example.com/v1"
                    value={localConfig.baseURL}
                    onChange={e => setLocalConfig(prev => ({ ...prev, baseURL: e.target.value }))}
                  />
                </div>

                {/* Model */}
                <div className="ai-config-field">
                  <label className="ai-config-label">Model</label>
                  <input
                    className="ai-config-input"
                    type="text"
                    placeholder="例如：gpt-4o、deepseek-chat、glm-4-flash"
                    value={localConfig.model}
                    onChange={e => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>

                {/* 高级配置折叠 */}
                <button
                  className="ai-config-advanced-toggle"
                  onClick={() => setShowAdvanced(v => !v)}
                >
                  <span>高级配置</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {showAdvanced && (
                  <div className="ai-config-advanced-panel">
                    {/* temperature */}
                    <div className="ai-config-field ai-config-field--sm">
                      <label className="ai-config-label">temperature</label>
                      <input
                        className="ai-config-input"
                        type="number"
                        min="0" max="2" step="0.1"
                        value={localConfig.temperature}
                        onChange={e => setLocalConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                      />
                    </div>

                    {/* top_p */}
                    <div className="ai-config-field ai-config-field--sm">
                      <label className="ai-config-label">top_p</label>
                      <input
                        className="ai-config-input"
                        type="number"
                        min="0" max="1" step="0.05"
                        value={localConfig.top_p}
                        onChange={e => setLocalConfig(prev => ({ ...prev, top_p: parseFloat(e.target.value) || 1 }))}
                      />
                    </div>

                    {/* max_tokens */}
                    <div className="ai-config-field ai-config-field--sm">
                      <label className="ai-config-label">max_tokens</label>
                      <input
                        className="ai-config-input"
                        type="number"
                        min="256" max="32768" step="256"
                        value={localConfig.max_tokens}
                        onChange={e => setLocalConfig(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 4096 }))}
                      />
                    </div>

                    {/* stream 开关 */}
                    <div className="ai-config-field ai-config-field--sm ai-config-field--row">
                      <label className="ai-config-label">stream</label>
                      <button
                        className={`ai-switch ${localConfig.stream ? 'ai-switch--on' : ''}`}
                        onClick={() => setLocalConfig(prev => ({ ...prev, stream: !prev.stream }))}
                        type="button"
                        aria-pressed={localConfig.stream}
                      >
                        <span className="ai-switch-thumb"></span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：Prompt 输入区 */}
              <div className="ai-config-right">
                <div className="ai-config-prompt-block ai-config-prompt-block--system">
                  <label className="ai-config-label">System Prompt</label>
                  <textarea
                    className="ai-config-prompt-textarea ai-config-prompt-textarea--system"
                    value={localConfig.systemPrompt}
                    onChange={e => setLocalConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="输入系统提示词..."
                    spellCheck={false}
                  />
                </div>

                <div className="ai-config-prompt-block ai-config-prompt-block--user">
                  <label className="ai-config-label">User Prompt</label>
                  <textarea
                    className="ai-config-prompt-textarea ai-config-prompt-textarea--user"
                    value={localConfig.userPrompt}
                    onChange={e => setLocalConfig(prev => ({ ...prev, userPrompt: e.target.value }))}
                    placeholder="输入用户提示词，支持 {{书名}} 和 {{作者名}} 占位符"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="ai-config-footer">
              <button className="cancel-edit-btn" onClick={handleCloseConfig}>取消</button>
              <button
                className="save-btn"
                onClick={handleConfigGenerate}
                disabled={!localConfig.apiKey.trim() || !localConfig.model.trim()}
                title={!localConfig.apiKey.trim() ? '请先填写 API Key' : !localConfig.model.trim() ? '请先填写 Model' : '生成'}
              >
                生成
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AIBookTab;
