import React, { useState, useEffect } from 'react';
import { streamBookInfoWithAdapter } from '../lib/ai/service-adapter';

interface AIConfigPageNewProps {
  onClose?: () => void;
}

interface AIConfig {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  top_p: number;
  maxTokens: number;
  stream: boolean;
}

interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
}

const AIConfigPageNew: React.FC<AIConfigPageNewProps> = ({ onClose }) => {
  // State for AI configuration
  const [config, setConfig] = useState<AIConfig>({
    provider: '',
    apiKey: '',
    baseURL: '',
    model: '',
    temperature: 0.7,
    top_p: 1,
    maxTokens: 4096,
    stream: false,
  });

  // State for prompt configuration
  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    systemPrompt: '',
    userPrompt: '',
  });

  // UI states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Provider presets
  const providerPresets = {
    'openai-compatible': {
      name: 'OpenAI Compatible',
      url: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    },
    claude: {
      name: 'Claude',
      url: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241218',
    },
    gemini: {
      name: 'Gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-2.0-flash-exp',
    },
  };

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);

        // Load prompts if available
        const savedPrompt = localStorage.getItem('ai-prompt');
        if (savedPrompt) {
          const parsedPrompt = JSON.parse(savedPrompt);
          setPromptConfig({
            systemPrompt: parsedPrompt.systemPrompt || '',
            userPrompt: parsedPrompt.userPrompt || '',
          });
        }
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    } else {
      // Set default prompts
      setPromptConfig({
        systemPrompt: `# 角色
你是一位书籍信息整理与推荐助手，负责从书籍本身及全网公开的社交/平台数据中提取信息，并根据"书籍客观特征 + 社交热度信号"推荐相似作品。不引入主观评价（如"必读""经典"）。

# 任务
请为《{{书名}}》（作者：{{作者名}}）生成以下三部分内容，采用简洁美观的排版。

## 排版要求
- 使用纯文本 + 少量 Markdown（仅限 \`**粗体**\`、\`- 列表\`、\`>\` 引用块）。
- 各板块之间用一个空行分隔。
- 基本信息每项一行，用 \`**字段**：值\` 格式。
- 类似小说推荐用 \`>\` 引用块，每个推荐之间空一行。

## 输出格式

**书名**：《书名》
**作者**：作者名（笔名 · 首发平台）

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

# 约束
- 禁止出现"必读""经典""口碑爆棚"等主观评价词。
- 热度信号必须基于真实可查的平台数据（可概括表述，如"小红书高赞笔记中常与本书一同推荐"），不得编造具体数字或虚假链接。
- 推荐理由必须同时包含"客观特征相似"和"热度信号"两部分。`,
        userPrompt: `请为《{{书名}}》（作者：{{作者名}}）生成书籍信息`,
      });
    }
  }, []);

  const handleProviderChange = (provider: string) => {
    const preset = providerPresets[provider as keyof typeof providerPresets];
    setConfig(prev => ({
      ...prev,
      provider,
      baseURL: preset?.url || '',
      model: preset?.model || '',
    }));
  };

  const handleConfigChange = (field: keyof AIConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handlePromptChange = (field: keyof PromptConfig, value: string) => {
    setPromptConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveConfig = () => {
    localStorage.setItem('ai-config', JSON.stringify(config));
    localStorage.setItem('ai-prompt', JSON.stringify(promptConfig));
  };

  const clearPrompt = () => {
    setPromptConfig({
      systemPrompt: promptConfig.systemPrompt,
      userPrompt: '',
    });
    setResult('');
    setError('');
  };

  const handleCallAI = async () => {
    setIsCalling(true);
    setError('');
    setResult('');

    try {
      // Build the config for the adapter
      const adapterConfig = {
        ...config,
        baseUrl: config.baseURL,
        input: {
          messages: [
            { role: 'system' as const, content: promptConfig.systemPrompt },
            { role: 'user' as const, content: promptConfig.userPrompt },
          ],
        },
      };

      // Call the AI service
      await streamBookInfoWithAdapter(
        adapterConfig,
        {
          onChunk: (text: string) => {
            setResult(prev => prev + text);
          },
          onDone: () => {
            setIsCalling(false);
            saveConfig(); // Auto-save on success
          },
          onError: (err: Error) => {
            setError(err.message);
            setIsCalling(false);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsCalling(false);
    }
  };

  return (
    <div className="ai-config-container">
      <div className="ai-config-layout">
        {/* 左侧配置面板 */}
        <div className="config-panel">
          <div className="panel-header">
            <h2>AI 配置</h2>
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                ×
              </button>
            )}
          </div>

          <div className="panel-content">
            {/* Provider 选择 */}
            <div className="form-group">
              <label>Provider（提供商）</label>
              <select
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="form-select"
              >
                <option value="">请选择提供商</option>
                <option value="openai-compatible">OpenAI Compatible</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* API Key */}
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="输入 API 密钥"
                className="form-input"
              />
            </div>

            {/* Base URL */}
            <div className="form-group">
              <label>Base URL</label>
              <input
                type="text"
                value={config.baseURL}
                onChange={(e) => handleConfigChange('baseURL', e.target.value)}
                placeholder="输入 API 基础地址"
                className="form-input"
              />
            </div>

            {/* Model */}
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                placeholder="输入模型名称"
                className="form-input"
              />
            </div>

            {/* 高级配置折叠面板 */}
            <div className="advanced-toggle">
              <button
                className="toggle-btn"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '隐藏' : '显示'}高级配置
              </button>
            </div>

            {showAdvanced && (
              <div className="advanced-config">
                {/* Temperature */}
                <div className="form-group">
                  <label>
                    Temperature ({config.temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    className="form-range"
                  />
                </div>

                {/* Top P */}
                <div className="form-group">
                  <label>
                    Top P ({config.top_p})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.top_p}
                    onChange={(e) => handleConfigChange('top_p', parseFloat(e.target.value))}
                    className="form-range"
                  />
                </div>

                {/* Max Tokens */}
                <div className="form-group">
                  <label>Max Tokens</label>
                  <input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>

                {/* Stream */}
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.stream}
                      onChange={(e) => handleConfigChange('stream', e.target.checked)}
                    />
                    启用流式输出
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="content-area">
          {/* Prompt 输入区 */}
          <div className="prompt-section">
            <h3>Prompt 配置</h3>

            {/* System Prompt */}
            <div className="form-group">
              <label>System Prompt</label>
              <textarea
                value={promptConfig.systemPrompt}
                onChange={(e) => handlePromptChange('systemPrompt', e.target.value)}
                className="prompt-textarea"
                rows={12}
                placeholder="输入系统提示..."
              />
            </div>

            {/* User Prompt */}
            <div className="form-group">
              <label>User Prompt</label>
              <textarea
                value={promptConfig.userPrompt}
                onChange={(e) => handlePromptChange('userPrompt', e.target.value)}
                className="prompt-textarea"
                rows={6}
                placeholder="输入用户提示..."
              />
            </div>
          </div>

          {/* 结果展示区 */}
          {result && (
            <div className="result-section">
              <h3>生成结果</h3>
              <div className="result-content">
                <pre>{result}</pre>
              </div>
            </div>
          )}

          {error && (
            <div className="error-section">
              <h3>错误信息</h3>
              <div className="error-content">
                <pre>{error}</pre>
              </div>
            </div>
          )}

          {/* 右下角操作按钮 */}
          <div className="action-buttons">
            <button
              className="btn-cancel"
              onClick={clearPrompt}
              disabled={isCalling}
            >
              取消
            </button>
            <button
              className="btn-generate"
              onClick={handleCallAI}
              disabled={isCalling || !config.apiKey || !config.provider || !promptConfig.userPrompt}
            >
              {isCalling ? '生成中...' : '生成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPageNew;