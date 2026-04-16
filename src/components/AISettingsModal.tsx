import React, { useState } from 'react';
import { type AISettings } from '../types/ai';
import { saveFullAISettings, getFullAISettings } from '../lib/ai/service';
import { getConfigCode, saveConfigCode } from '../lib/ai/config-client';
import { API_CONFIG_PRESETS } from '../lib/ai/config-presets';
import { customConfig, modifiedConfig, newProviderConfig } from '../lib/ai/config-example';
import { openAICompatibleConfig, geminiConfig, claudeConfig, zhipuGLMConfig, kimiConfig } from '../lib/ai/config-presets';
import './AISettingsModal.css';

interface AISettingsModalProps {
  onClose: () => void;
  onSave: (settings: AISettings) => void;
  title?: string;
  author?: string;
}

// ============================================================
// 通用配置模板：通过 request_template 完全自定义请求
// ============================================================
//
// 【基础字段】
// api_key     → 你的 API 密钥
// base_url    → API 基础地址（不含 /chat/completions）
// model       → 模型名称
// stream      → 是否流式输出
// temperature → 创造性（0~1）
// max_tokens  → 最大回复长度
//
// 【高级自定义】
// request_template → 直接覆盖整个 fetch 请求配置！
//    url           → API 完整 URL（{{api_key}}、{{model}} 等会被替换）
//    method        → GET/POST 等
//    headers       → 请求头对象
//    body          → 请求体对象
//    content_path  → 非流式响应内容路径（如 'data.content'）
//    delta_path    → 流式响应增量内容路径（如 'choices[0].delta.content'）
//
// ============================================================
const INITIAL_CONFIG = {
  api_key: '',
  base_url: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'glm-4-flash',
  stream: true,
  temperature: 0.7,
  max_tokens: 2048,

  // 完整自定义请求配置（可选，不写时使用默认）
  request_template: {
    url: '{{base_url}}/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{api_key}}',
    },
    body: {
      model: '{{model}}',
      messages: '{{messages}}',
      stream: '{{stream}}',
      temperature: '{{temperature}}',
      max_tokens: '{{max_tokens}}',
    },
    content_path: 'choices[0].message.content',
    delta_path: 'choices[0].delta.content',
  },
};

// 获取初始prompt配置的函数
const getInitialInputConfig = (title?: string, author?: string) => {
  const bookTitle = title || '{{书名}}';
  const bookAuthor = author || '{{作者名}}';

  return {
    messages: [
      {
        role: 'system',
        content: `# 角色
你是一位书籍信息整理与推荐助手，负责从书籍本身及全网公开的社交/平台数据中提取信息，并根据"书籍客观特征 + 社交热度信号"推荐相似作品。不引入主观评价（如"必读""经典"）。

# 任务
请为《${bookTitle}》（作者：${bookAuthor}）生成以下三部分内容，采用简洁美观的排版。

## 排版要求
- 使用纯文本 + 少量 Markdown（仅限 \`**粗体**\`、\`- 列表\`、\`>\` 引用块）。
- 各板块之间用一个空行分隔。
- 基本信息每项一行，用 \`**字段**：值\` 格式。
- 类似小说推荐用 \`>\` 引用块，每个推荐之间空一行。

## 输出格式

**书名**：《${bookTitle}》
**作者**：${bookAuthor}（笔名 · 首发平台）

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
- 推荐理由必须同时包含"客观特征相似"和"热度信号"两部分。`
      },
      {
        role: 'user',
        content: `请为《${bookTitle}》（作者：${bookAuthor}）生成书籍信息`
      }
    ]
  };
};

const AISettingsModal: React.FC<AISettingsModalProps> = ({ onClose, onSave, title, author }) => {
  // 初始化时优先加载已保存的配置，没有则用默认模板
  const getSavedOrDefaultConfig = () => {
    const saved = getFullAISettings();
    if (saved) {
      // 检查是否有配置代码
      const codeConfig = getConfigCode();
      if (codeConfig) {
        return codeConfig;
      }

      // 构建展示用的简化配置（合并所有格式）
      const config: any = {
        api_key: saved.provider?.api_key || saved.api_key || '',
        base_url: saved.provider?.base_url || saved.base_url || '',
        model: saved.model?.name || saved.model || '',
        stream: saved.generation?.stream ?? saved.stream ?? true,
        temperature: saved.generation?.temperature ?? saved.temperature ?? 0.7,
        max_tokens: saved.generation?.max_tokens ?? saved.max_tokens ?? 2048,
      };
      // 加载 request_template（如果存在）
      if (saved.request_template) config.request_template = saved.request_template;

      if (config.api_key || config.base_url || config.model) {
        return JSON.stringify(config, null, 2);
      }
    }
    return JSON.stringify(INITIAL_CONFIG, null, 2);
  };

  const getSavedOrDefaultPrompts = () => {
    const saved = getFullAISettings();
    if (saved && saved.input && saved.input.messages) {
      const sys = saved.input.messages.find((m: any) => m.role === 'system');
      const usr = saved.input.messages.find((m: any) => m.role === 'user');
      return {
        systemPrompt: sys ? sys.content : getInitialInputConfig(title, author).messages[0].content,
        userPrompt: usr ? usr.content : getInitialInputConfig(title, author).messages[1].content,
      };
    }
    return {
      systemPrompt: getInitialInputConfig(title, author).messages[0].content,
      userPrompt: getInitialInputConfig(title, author).messages[1].content,
    };
  };

  const initialPrompts = getSavedOrDefaultPrompts();
  const [configCode, setConfigCode] = useState<string>(getSavedOrDefaultConfig());
  const [systemPrompt, setSystemPrompt] = useState<string>(initialPrompts.systemPrompt);
  const [userPrompt, setUserPrompt] = useState<string>(initialPrompts.userPrompt);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);

  const handleSave = () => {
    try {
      console.log('保存AI配置:', configCode);
      const simple = JSON.parse(configCode);

      // 检查是否为新的配置格式
      if (simple.version && simple.providers) {
        // 新的配置格式：保存配置代码
        saveConfigCode(configCode);

        // 同时保存兼容的旧格式配置
        const finalConfig = {
          provider: {
            name: simple.providers[0]?.name || 'custom',
            api_key: simple.providers[0]?.auth?.apiKey || simple.api_key || '',
            base_url: simple.providers[0]?.endpoints?.chat?.replace('/chat/completions', '') || simple.base_url || '',
            endpoint: '/chat/completions',
            headers: { 'Content-Type': 'application/json' },
          },
          model: { name: simple.providers[0]?.defaultModels?.[0] || simple.model || '' },
          generation: {
            stream: simple.providers[0]?.generation?.stream ?? true,
            temperature: simple.providers[0]?.generation?.temperature ?? 0.7,
            max_tokens: simple.providers[0]?.generation?.max_tokens ?? 2048,
            top_p: simple.providers[0]?.generation?.top_p ?? 0.9,
          },
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          },
        };
        saveFullAISettings(finalConfig);
      } else {
        // 旧的配置格式：保持原有逻辑
        const finalConfig = {
          ...simple,
          // 确保 provider 结构存在（兼容旧代码）
          provider: {
            name: 'custom',
            api_key: simple.api_key || '',
            base_url: simple.base_url || '',
            endpoint: '/chat/completions',
            headers: { 'Content-Type': 'application/json' },
          },
          model: { name: simple.model || '' },
          generation: {
            stream: simple.stream ?? true,
            temperature: simple.temperature ?? 0.7,
            max_tokens: simple.max_tokens ?? 2048,
            top_p: 0.9,
          },
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          },
        };
        saveFullAISettings(finalConfig);
      }

      // 构造 AISettings 回传给父组件（用于更新状态）
      const settings: AISettings = {
        provider: 'custom',
        apiKey: simple.api_key || '',
        apiUrl: simple.base_url || '',
        model: simple.model || '',
      };
      onSave(settings);
      onClose();
    } catch (error) {
      console.error('保存AI配置失败:', error);
      alert(`配置保存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfigCode(e.target.value);
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value);
  };

  const handleUserPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserPrompt(e.target.value);
  };

  return (
    <div className="ai-settings-overlay" onClick={onClose}>
      <div className="ai-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="ai-settings-header">
          <h3>AI 配置</h3>
          <button className="ai-settings-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="ai-settings-body">
          {!showConfig ? (
            <div className="ai-settings-content">
              {/* 左侧：配置代码框 */}
              <div className="ai-settings-code-section">
                <div className="ai-settings-code-header">
                  <h4>配置代码</h4>
                  <button
                    className="config-btn"
                    onClick={() => setShowConfig(true)}
                  >
                    高级配置
                  </button>
                </div>
                <textarea
                  className="ai-settings-code"
                  value={JSON.stringify({
                    api_key: '',
                    base_url: 'https://api.openai.com/v1',
                    model: 'gpt-4o',
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 2048
                  }, null, 2)}
                  readOnly
                  spellCheck={false}
                  placeholder="配置代码将在这里显示..."
                />
              </div>

              {/* 右侧：Prompt输入框 */}
              <div className="ai-settings-prompt-section">
                <div className="ai-settings-prompt-header">
                  <h4>Prompt 设置</h4>
                </div>

                {/* System Prompt */}
                <div className="ai-settings-prompt-field">
                  <label>System Prompt</label>
                  <textarea
                    className="ai-settings-prompt-input"
                    value={systemPrompt}
                    onChange={handleSystemPromptChange}
                    placeholder="输入系统提示..."
                    rows={14}
                  />
                </div>

                {/* User Prompt */}
                <div className="ai-settings-prompt-field">
                  <label>User Prompt</label>
                  <textarea
                    className="ai-settings-prompt-input"
                    value={userPrompt}
                    onChange={handleUserPromptChange}
                    placeholder="输入用户提示..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="ai-settings-content">
              {/* 配置代码 */}
              <div className="ai-settings-code-section">
                <div className="ai-settings-code-header">
                  <h4>配置代码</h4>
                  <div className="config-code-actions">
                    <button
                      className="config-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(configCode);
                        alert('配置代码已复制到剪贴板');
                      }}
                                          >
                      复制
                    </button>
                    <button
                      className="config-btn"
                      onClick={() => {
                        const blob = new Blob([configCode], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'ai-config.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                                          >
                      导出
                    </button>
                    <button
                      className="config-btn"
                      onClick={() => setShowPresets(!showPresets)}
                                          >
                      {showPresets ? '隐藏' : '预设'}模板
                    </button>
                  </div>
                </div>
                <textarea
                  className="ai-settings-code"
                  value={configCode}
                  onChange={handleConfigChange}
                  spellCheck={false}
                  placeholder="配置代码将在这里显示..."
                />

                {/* 预设模板选择器 */}
                {showPresets && (
                  <div className="config-presets">
                    <h5>选择预设模板</h5>
                    <div className="preset-grid">
                      <button
                        className="preset-card"
                        onClick={() => {
                          const configStr = JSON.stringify(openAICompatibleConfig, null, 2);
                          setConfigCode(configStr);
                          alert('已加载 OpenAI 兼容 API 配置');
                        }}
                      >
                        <div className="preset-header">
                          <span className="preset-icon">🚀</span>
                          <h6>OpenAI 兼容</h6>
                        </div>
                        <p className="preset-desc">支持 GPT、Claude、DeepSeek 等大多数 API</p>
                        <div className="preset-tags">
                          <span className="preset-tag">OpenAI</span>
                          <span className="preset-tag">Claude</span>
                          <span className="preset-tag">DeepSeek</span>
                        </div>
                      </button>

                      <button
                        className="preset-card"
                        onClick={() => {
                          const configStr = JSON.stringify(geminiConfig, null, 2);
                          setConfigCode(configStr);
                          alert('已加载 Google Gemini 配置');
                        }}
                      >
                        <div className="preset-header">
                          <span className="preset-icon">🤖</span>
                          <h6>Google Gemini</h6>
                        </div>
                        <p className="preset-desc">Google 官方 Gemini API</p>
                        <div className="preset-tags">
                          <span className="preset-tag">Gemini</span>
                          <span className="preset-tag">Google</span>
                        </div>
                      </button>

                      <button
                        className="preset-card"
                        onClick={() => {
                          const configStr = JSON.stringify(claudeConfig, null, 2);
                          setConfigCode(configStr);
                          alert('已加载 Claude 官方配置');
                        }}
                      >
                        <div className="preset-header">
                          <span className="preset-icon">🧠</span>
                          <h6>Claude 官方</h6>
                        </div>
                        <p className="preset-desc">Anthropic 官方 Claude API</p>
                        <div className="preset-tags">
                          <span className="preset-tag">Claude</span>
                          <span className="preset-tag">Anthropic</span>
                        </div>
                      </button>

                      <button
                        className="preset-card"
                        onClick={() => {
                          const configStr = JSON.stringify(zhipuGLMConfig, null, 2);
                          setConfigCode(configStr);
                          alert('已加载智谱 GLM 配置');
                        }}
                      >
                        <div className="preset-header">
                          <span className="preset-icon">🐉</span>
                          <h6>智谱 GLM</h6>
                        </div>
                        <p className="preset-desc">清华大学智谱 AI GLM 模型</p>
                        <div className="preset-tags">
                          <span className="preset-tag">GLM</span>
                          <span className="preset-tag">智谱</span>
                        </div>
                      </button>

                      <button
                        className="preset-card"
                        onClick={() => {
                          const configStr = JSON.stringify(kimiConfig, null, 2);
                          setConfigCode(configStr);
                          alert('已加载月之暗面 Kimi 配置');
                        }}
                      >
                        <div className="preset-header">
                          <span className="preset-icon">🌙</span>
                          <h6>Kimi</h6>
                        </div>
                        <p className="preset-desc">月之暗面 Kimi 大模型</p>
                        <div className="preset-tags">
                          <span className="preset-tag">Kimi</span>
                          <span className="preset-tag">月之暗面</span>
                        </div>
                      </button>

                      <button
                        className="preset-card"
                        onClick={() => {
                          const configStr = JSON.stringify(modifiedConfig, null, 2);
                          setConfigCode(configStr);
                          alert('已加载自定义配置示例');
                        }}
                      >
                        <div className="preset-header">
                          <span className="preset-icon">⚙️</span>
                          <h6>自定义示例</h6>
                        </div>
                        <p className="preset-desc">展示自定义 API 配置的完整示例</p>
                        <div className="preset-tags">
                          <span className="preset-tag">自定义</span>
                          <span className="preset-tag">示例</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ai-settings-footer">
          <button className="cancel-edit-btn" onClick={onClose}>取消</button>
          <button
            className="save-btn"
            onClick={handleSave}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettingsModal;