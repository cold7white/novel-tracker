import React, { useState, useEffect } from 'react';
import { AI_PROVIDERS, getProviderByKey } from '../types/ai';
import { saveFullAISettings, getFullAISettings } from '../lib/ai/service';
import { ProviderType } from '../lib/ai/adapter/factory';

interface AIConfigPageProps {
  onClose: () => void;
  onSave?: (settings: any) => void;
}

interface AIFormState {
  providerType: string;
  selectedProvider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  top_p: number;
  maxTokens: number;
  stream: boolean;
  systemPrompt: string;
  userPrompt: string;
  customConfig: {
    url: string;
    method: string;
    headers: string;
    body: string;
    contentPath: string;
    deltaPath: string;
  };
  showAdvanced: boolean;
}

const DEFAULT_PROMPTS = {
  system: `# 角色
你是一位书籍信息整理与推荐助手，负责从书籍本身及全网公开的社交/平台数据中提取信息，并根据"书籍客观特征 + 社交热度信号"推荐相似作品。不引入主观评价（如"必读""经典"）。

# 任务
请为《{{书名}}》（作者：{{作者名}}）生成以下三部分内容，采用简洁美观的排版。

## 排版要求
- 使用纯文本 + 少量 Markdown（仅限 **粗体**、- 列表、> 引用块）。
- 各板块之间用一个空行分隔。
- 基本信息每项一行，用 **字段**：值 格式。
- 类似小说推荐用 > 引用块，每个推荐之间空一行。

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
- 热度信号必须基于真实可查的平台数据，不得编造具体数字或虚假链接。`,
  user: `请为《{{书名}}》（作者：{{作者名}}）生成书籍信息`,
};

const AI_CONFIG_PAGE: React.FC<AIConfigPageProps> = ({ onClose, onSave }) => {
  const [formState, setFormState] = useState<AIFormState>({
    providerType: 'select',
    selectedProvider: 'custom',
    apiKey: '',
    baseUrl: '',
    model: '',
    temperature: 0.7,
    top_p: 1,
    maxTokens: 2048,
    stream: true,
    systemPrompt: DEFAULT_PROMPTS.system,
    userPrompt: DEFAULT_PROMPTS.user,
    customConfig: {
      url: '',
      method: 'POST',
      headers: '',
      body: '',
      contentPath: '',
      deltaPath: '',
    },
    showAdvanced: false,
  });

  const [models, setModels] = useState<any[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);

  // Load saved configurations on mount
  useEffect(() => {
    const saved = getFullAISettings();
    if (saved) {
      // Try to parse if it's a JSON string
      let config = saved;
      if (typeof saved === 'string') {
        try {
          config = JSON.parse(saved);
        } catch {
          // Not JSON, use as is
        }
      }

      // Load provider-specific settings
      if (config.provider) {
        const provider = getProviderByKey(config.provider);
        if (provider) {
          setFormState(prev => ({
            ...prev,
            selectedProvider: provider.key,
            providerType: 'provider',
            baseUrl: provider.apiUrl,
            model: provider.models[0]?.id || '',
          }));
        }
      }

      // Load prompt settings
      if (config.input?.messages) {
        const systemMsg = config.input.messages.find((m: any) => m.role === 'system');
        const userMsg = config.input.messages.find((m: any) => m.role === 'user');
        if (systemMsg) setFormState(prev => ({ ...prev, systemPrompt: systemMsg.content }));
        if (userMsg) setFormState(prev => ({ ...prev, userPrompt: userMsg.content }));
      }

      // Load generation settings
      if (config.generation) {
        setFormState(prev => ({
          ...prev,
          temperature: config.generation.temperature || 0.7,
          top_p: config.generation.top_p || 1,
          maxTokens: config.generation.max_tokens || 2048,
          stream: config.generation.stream !== false,
        }));
      }
    }
  }, []);

  // Update models when provider changes
  useEffect(() => {
    if (formState.selectedProvider !== 'custom') {
      const provider = getProviderByKey(formState.selectedProvider);
      if (provider && provider.models) {
        setModels(provider.models);
      } else {
        setModels([]);
      }
      setFormState(prev => ({
        ...prev,
        baseUrl: provider?.apiUrl || '',
      }));
    } else {
      setModels([]);
    }
  }, [formState.selectedProvider]);

  const handleProviderChange = (providerKey: string) => {
    setFormState(prev => ({
      ...prev,
      selectedProvider: providerKey,
      providerType: providerKey === 'custom' ? 'custom' : 'provider',
    }));
  };

  const handleSave = () => {
    // Build configuration object
    const config: any = {
      version: '2.0',
      providers: [{
        name: formState.selectedProvider === 'custom' ? 'Custom' : getProviderByKey(formState.selectedProvider)?.name || 'Custom',
        key: formState.selectedProvider,
        auth: {
          apiKey: formState.apiKey,
        },
        endpoints: {
          chat: formState.baseUrl + '/chat/completions',
        },
        generation: {
          stream: formState.stream,
          temperature: formState.temperature,
          top_p: formState.top_p,
          max_tokens: formState.maxTokens,
        },
        models: [{
          id: formState.model,
          name: formState.model,
        }],
      }],
      input: {
        messages: [
          { role: 'system', content: formState.systemPrompt },
          { role: 'user', content: formState.userPrompt },
        ],
      },
      ...(formState.showAdvanced && formState.selectedProvider === 'custom' && {
        request_template: {
          url: formState.customConfig.url,
          method: formState.customConfig.method,
          headers: formState.customConfig.headers ? JSON.parse(formState.customConfig.headers) : {},
          body: formState.customConfig.body ? JSON.parse(formState.customConfig.body) : {},
          content_path: formState.customConfig.contentPath,
          delta_path: formState.customConfig.deltaPath,
        },
      }),
    };

    // Save the configuration
    saveFullAISettings(config);

    // Also save a simplified version for backward compatibility
    const simplifiedConfig = {
      provider: {
        name: formState.selectedProvider,
        api_key: formState.apiKey,
        base_url: formState.baseUrl,
        endpoint: '/chat/completions',
        headers: { 'Content-Type': 'application/json' },
      },
      model: { name: formState.model },
      generation: {
        stream: formState.stream,
        temperature: formState.temperature,
        max_tokens: formState.maxTokens,
        top_p: formState.top_p,
      },
      input: {
        messages: [
          { role: 'system', content: formState.systemPrompt },
          { role: 'user', content: formState.userPrompt },
        ],
      },
    };
    saveFullAISettings(simplifiedConfig);

    onSave?.(simplifiedConfig);
    onClose();
  };

  const testConfiguration = async () => {
    // Simple test configuration
    const testConfig = {
      ...formState,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Please reply with "Test successful"' },
      ],
    };

    try {
      // This would call the new adapter-based service
      const result = await import('../lib/ai/service-adapter').then(
        module => module.fetchBookInfoWithAdapter(testConfig, 'Test Book', 'Test Author')
      );
      alert('Configuration test successful! Response: ' + result.substring(0, 100) + '...');
    } catch (error) {
      alert('Configuration test failed: ' + (error as Error).message);
    }
  };

  const handleInputChange = (field: keyof AIFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomConfigChange = (field: keyof AIFormState['customConfig'], value: string) => {
    setFormState(prev => ({
      ...prev,
      customConfig: { ...prev.customConfig, [field]: value },
    }));
  };

  return (
    <div className="ai-config-overlay" onClick={onClose}>
      <div className="ai-config-modal" onClick={e => e.stopPropagation()}>
        <div className="ai-config-header">
          <h2>AI 配置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ai-config-body">
          <div className="config-section">
            <h3>1. 选择 AI 厂商</h3>
            <div className="provider-select">
              <select
                value={formState.selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="form-select"
              >
                {AI_PROVIDERS.map(provider => (
                  <option key={provider.key} value={provider.key}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="config-section">
            <h3>2. API 设置</h3>
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={formState.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="输入 API 密钥"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Base URL</label>
              <input
                type="text"
                value={formState.baseUrl}
                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                placeholder="API 基础地址"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <select
                value={formState.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="form-select"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="config-section">
            <h3>3. 生成参数</h3>
            <div className="form-group">
              <label>Temperature ({formState.temperature})</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formState.temperature}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                className="form-range"
              />
            </div>

            <div className="form-group">
              <label>Top P ({formState.top_p})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formState.top_p}
                onChange={(e) => handleInputChange('top_p', parseFloat(e.target.value))}
                className="form-range"
              />
            </div>

            <div className="form-group">
              <label>Max Tokens</label>
              <input
                type="number"
                value={formState.maxTokens}
                onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formState.stream}
                  onChange={(e) => handleInputChange('stream', e.target.checked)}
                />
                启用流式输出
              </label>
            </div>

            <button
              className="toggle-advanced"
              onClick={() => handleInputChange('showAdvanced', !formState.showAdvanced)}
            >
              {formState.showAdvanced ? '隐藏' : '显示'}高级配置
            </button>
          </div>

          {formState.showAdvanced && formState.selectedProvider === 'custom' && (
            <div className="config-section advanced-config">
              <h3>4. 自定义 HTTP 配置</h3>
              <div className="form-group">
                <label>URL Template</label>
                <input
                  type="text"
                  value={formState.customConfig.url}
                  onChange={(e) => handleCustomConfigChange('url', e.target.value)}
                  placeholder="{{baseUrl}}/chat/completions"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Method</label>
                <select
                  value={formState.customConfig.method}
                  onChange={(e) => handleCustomConfigChange('method', e.target.value)}
                  className="form-select"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </div>

              <div className="form-group">
                <label>Headers (JSON 格式)</label>
                <textarea
                  value={formState.customConfig.headers}
                  onChange={(e) => handleCustomConfigChange('headers', e.target.value)}
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer {{apiKey}}"}'
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Body Template (JSON 格式)</label>
                <textarea
                  value={formState.customConfig.body}
                  onChange={(e) => handleCustomConfigChange('body', e.target.value)}
                  placeholder='{"model": "{{model}}", "messages": "{{messages}}", "temperature": {{temperature}}}'
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>内容路径 (Content Path)</label>
                <input
                  type="text"
                  value={formState.customConfig.contentPath}
                  onChange={(e) => handleCustomConfigChange('contentPath', e.target.value)}
                  placeholder="choices[0].message.content"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>流式路径 (Delta Path)</label>
                <input
                  type="text"
                  value={formState.customConfig.deltaPath}
                  onChange={(e) => handleCustomConfigChange('deltaPath', e.target.value)}
                  placeholder="choices[0].delta.content"
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="config-section">
            <h3>5. Prompt 配置</h3>
            <div className="form-group">
              <label>System Prompt</label>
              <textarea
                value={formState.systemPrompt}
                onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                className="form-textarea"
                rows={10}
                placeholder="输入系统提示..."
              />
            </div>

            <div className="form-group">
              <label>User Prompt</label>
              <textarea
                value={formState.userPrompt}
                onChange={(e) => handleInputChange('userPrompt', e.target.value)}
                className="form-textarea"
                rows={3}
                placeholder="输入用户提示..."
              />
            </div>
          </div>
        </div>

        <div className="ai-config-footer">
          <button className="test-btn" onClick={testConfiguration}>
            测试配置
          </button>
          <button className="cancel-btn" onClick={onClose}>
            取消
          </button>
          <button className="save-btn" onClick={handleSave}>
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPage;