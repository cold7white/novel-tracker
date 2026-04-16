// AI 服务 - 支持 OpenAI 兼容 API 和 Google Gemini API
// 支持所有 OpenAI 兼容的提供商：Deepseek, SiliconFlow, Groq, OpenAI 等

import type { AISettings } from '../../types/ai';

const AI_SETTINGS_KEY = 'ai-settings';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIStreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

const AI_PROMPT_TEMPLATE = `# 角色
你是一位书籍信息整理与推荐助手，负责从书籍本身及全网公开的社交/平台数据中提取信息，并根据"书籍客观特征 + 社交热度信号"推荐相似作品。不引入主观评价（如"必读""经典"）。

# 任务
请为《{title}》（作者：{author}）生成以下三部分内容，采用简洁美观的排版。

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
> （每本推荐至少包含一个客观特征和一个热度信号，两者缺一不可）

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

// 从 localStorage 加载 AI 设置
export function loadAISettings(): AISettings | null {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}

// 保存 AI 设置到 localStorage
export function saveAISettings(settings: AISettings): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

// 保存完整的 AI 配置（包含 input）
export function saveFullAISettings(config: any): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(config));
}

// 检测是否为 Gemini 模型
function isGeminiModel(model: string): boolean {
  return model.toLowerCase().includes('gemini') ||
         model.toLowerCase().includes('google') ||
         model.toLowerCase().startsWith('gemini-');
}

// 检测是否为 Gemini 提供商
function isGeminiProvider(apiUrl: string): boolean {
  return apiUrl.includes('generativelanguage.googleapis.com');
}

// 检测是否为 Claude 提供商
function isClaudeProvider(apiUrl: string): boolean {
  return apiUrl.includes('api.anthropic.com');
}

// 检测是否为 OpenAI 兼容 API（供外部使用）
export function isOpenAICompatible(apiUrl: string): boolean {
  return !isGeminiProvider(apiUrl) && !isClaudeProvider(apiUrl);
}

// 获取 AI 配置（优先 localStorage，fallback 环境变量）
function getAIConfig(): AISettings {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) {
      const config = JSON.parse(stored);

      // 格式一：saveFullAISettings 保存的完整配置（含 provider 对象、model 对象）
      if (config.provider && typeof config.provider === 'object' && config.provider.api_key) {
        const baseUrl = config.provider.base_url || '';
        const endpoint = config.provider.endpoint || '/chat/completions';
        // 拼接完整 API URL，避免重复拼接 /chat/completions
        const apiUrl = baseUrl.endsWith(endpoint)
          ? baseUrl.slice(0, -endpoint.length)
          : baseUrl;
        return {
          provider: config.provider.name || 'custom',
          apiKey: config.provider.api_key,
          apiUrl: apiUrl,
          model: (config.model && config.model.name) ? config.model.name : (config.model || ''),
        };
      }

      // 格式二：saveAISettings 保存的扁平化配置（含 apiKey、apiUrl、model 字符串）
      if (config.apiKey && config.apiUrl && config.model) {
        return {
          provider: typeof config.provider === 'string' ? config.provider : 'custom',
          apiKey: config.apiKey,
          apiUrl: config.apiUrl,
          model: typeof config.model === 'string' ? config.model : config.model.name,
        };
      }
    }
  } catch {
    // 忽略解析错误
  }

  // Fallback to env vars
  return {
    provider: 'env',
    apiKey: import.meta.env.VITE_AI_API_KEY || '',
    apiUrl: import.meta.env.VITE_AI_API_URL || 'https://api.siliconflow.cn/v1',
    model: import.meta.env.VITE_AI_MODEL || 'deepseek-ai/DeepSeek-V3',
  };
}

// 获取完整的 AI 配置（包含 input）
export function getFullAISettings(): any {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}

// 构建 Gemini API 的请求体
function buildGeminiRequest(title: string, author: string): any {
  const userContent = AI_PROMPT_TEMPLATE
    .replace(/\{title\}/g, title)
    .replace(/\{author\}/g, author || '未知');

  return {
    contents: [{
      parts: [{
        text: userContent
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    }
  };
}

export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!(config && config.apiKey);
}

function buildPrompt(title: string, author: string): AIMessage[] {
  const userContent = AI_PROMPT_TEMPLATE
    .replace(/\{title\}/g, title)
    .replace(/\{author\}/g, author || '未知');

  return [
    {
      role: 'user',
      content: userContent,
    },
  ];
}

// 流式调用 AI API
export async function streamBookInfo(
  title: string,
  author: string,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const fullConfig = getFullAISettings();
  let promptConfig;

  if (fullConfig && fullConfig.input && fullConfig.input.messages) {
    // 使用自定义的prompt配置
    promptConfig = fullConfig.input.messages;
  } else {
    // 使用默认的prompt模板
    promptConfig = buildPrompt(title, author);
  }

  // 替换prompt中的占位符
  const systemMessage = promptConfig.find((m: any) => m.role === 'system');
  const userMessage = promptConfig.find((m: any) => m.role === 'user');

  if (systemMessage && systemMessage.content.includes('{{书名}}')) {
    systemMessage.content = systemMessage.content
      .replace(/{{书名}}/g, title)
      .replace(/{{作者名}}/g, author);
  }

  if (userMessage && userMessage.content.includes('{{书名}}')) {
    userMessage.content = userMessage.content
      .replace(/{{书名}}/g, title)
      .replace(/{{作者名}}/g, author);
  }

  const config = getAIConfig();

  if (!config.apiKey) {
    callbacks.onError(new Error('AI API 密钥未配置，请先在设置中配置'));
    return;
  }

  const isGemini = isGeminiProvider(config.apiUrl) || isGeminiModel(config.model);
  // 只有 URL 明确指向 api.anthropic.com 时才走官方 Claude 路由；
  // 用户配置了自定义代理 URL 时，即使模型名含 "claude" 也走 OpenAI 兼容路由
  const isClaude = isClaudeProvider(config.apiUrl) && !isGemini;

  try {
    if (isGemini) {
      // 使用 Google Gemini API
      const modelId = config.model; // 直接使用用户选择的模型名称

      // 调试信息
      console.log('Gemini API Request:', {
        modelId,
        apiUrl: config.apiUrl,
        hasApiKey: !!config.apiKey
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildGeminiRequest(title, author)),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `Gemini API 请求失败 (${response.status}): ${errorText}`;

        // 调试信息
        console.error('Gemini API Error:', {
          status: response.status,
          errorText,
          modelId,
          fullUrl: `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${config.apiKey.substring(0, 10)}...`
        });

        // 如果是模型不存在错误，提示用户使用正确的模型名称
        if (response.status === 404 && errorText.includes('is not found')) {
          errorMessage += '\n\n提示：请确保使用正确的模型名称，如：\n- gemini-2.0-flash-exp\n- gemini-1.5-pro\n- gemini-1.5-flash\n\n您可以在设置中选择一个预设模型。';
        }

        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const json = JSON.parse(trimmed);
            if (json.candidates && json.candidates[0]) {
              const content = json.candidates[0].content?.parts?.[0]?.text;
              if (content) {
                currentText += content;
                callbacks.onChunk(currentText);
              }
            }
          } catch {
            // 忽略解析错误的行
          }
        }
      }

      callbacks.onDone();
    } else if (isClaude) {
      // 使用 Claude API
      const modelId = config.model;

      const response = await fetch(`https://api.anthropic.com/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          messages: promptConfig,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Claude API 请求失败 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      callbacks.onChunk(content);
      callbacks.onDone();
    } else {
      // 使用 OpenAI 兼容 API
      // 从 fullConfig 读取用户配置的生成参数
      const stream = fullConfig?.generation?.stream ?? true;
      const temperature = fullConfig?.generation?.temperature ?? 0.7;
      const max_tokens = fullConfig?.generation?.max_tokens ?? 4096;

      const response = await fetch(`${config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: promptConfig,
          stream,
          temperature,
          max_tokens,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
      }

      if (stream) {
        // 流式响应：逐块读取 SSE 数据
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                callbacks.onChunk(content);
              }
            } catch {
              // 忽略解析错误的行
            }
          }
        }
      } else {
        // 非流式响应：等待完整 JSON 返回
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        callbacks.onChunk(content);
      }

      callbacks.onDone();
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }
    callbacks.onError(error as Error);
  }
}

// ─── streamBookInfoV2：接受完整配置对象，不从 localStorage 读取 ───────────────

interface AIConfigV2Input {
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

export async function streamBookInfoV2(
  title: string,
  author: string,
  config: AIConfigV2Input,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  if (!config.apiKey) {
    callbacks.onError(new Error('AI API 密钥未配置，请先在设置中配置'));
    return;
  }

  // 替换占位符
  const sysPrompt = config.systemPrompt
    .replace(/{{书名}}/g, title)
    .replace(/{{作者名}}/g, author || '未知');
  const usrPrompt = config.userPrompt
    .replace(/{{书名}}/g, title)
    .replace(/{{作者名}}/g, author || '未知');

  const messages = [
    { role: 'system' as const, content: sysPrompt },
    { role: 'user' as const, content: usrPrompt },
  ];

  const isGemini =
    config.baseURL.includes('generativelanguage.googleapis.com') ||
    config.provider === 'gemini';
  const isClaude = config.baseURL.includes('api.anthropic.com');

  try {
    if (isGemini) {
      // ── Google Gemini ──────────────────────────────────────────────────────
      const geminiBody = {
        contents: [{ parts: [{ text: `${sysPrompt}\n\n${usrPrompt}` }] }],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.max_tokens,
          topP: config.top_p,
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?key=${encodeURIComponent(config.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
          signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Gemini API 请求失败 (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const json = JSON.parse(trimmed);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) callbacks.onChunk(text);
          } catch {
            // ignore parse errors
          }
        }
      }
      callbacks.onDone();

    } else if (isClaude) {
      // ── Anthropic Claude ───────────────────────────────────────────────────
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.max_tokens,
          messages,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Claude API 请求失败 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      callbacks.onChunk(text);
      callbacks.onDone();

    } else {
      // ── OpenAI Compatible（含 Custom HTTP）──────────────────────────────────
      const baseURL = config.baseURL.endsWith('/')
        ? config.baseURL.slice(0, -1)
        : config.baseURL;

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: config.stream,
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
      }

      if (config.stream) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法读取响应流');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (!trimmed.startsWith('data: ')) continue;
            try {
              const json = JSON.parse(trimmed.slice(6));
              const text = json.choices?.[0]?.delta?.content;
              if (text) callbacks.onChunk(text);
            } catch {
              // ignore
            }
          }
        }
      } else {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        callbacks.onChunk(text);
      }

      callbacks.onDone();
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') return;
    callbacks.onError(error as Error);
  }
}

// 非流式调用（备用）
export async function fetchBookInfo(
  title: string,
  author: string,
  signal?: AbortSignal
): Promise<string> {
  const fullConfig = getFullAISettings();
  let promptConfig;

  if (fullConfig && fullConfig.input && fullConfig.input.messages) {
    // 使用自定义的prompt配置
    promptConfig = fullConfig.input.messages;
  } else {
    // 使用默认的prompt模板
    promptConfig = buildPrompt(title, author);
  }

  // 替换prompt中的占位符
  const systemMessage = promptConfig.find((m: any) => m.role === 'system');
  const userMessage = promptConfig.find((m: any) => m.role === 'user');

  if (systemMessage && systemMessage.content.includes('{{书名}}')) {
    systemMessage.content = systemMessage.content
      .replace(/{{书名}}/g, title)
      .replace(/{{作者名}}/g, author);
  }

  if (userMessage && userMessage.content.includes('{{书名}}')) {
    userMessage.content = userMessage.content
      .replace(/{{书名}}/g, title)
      .replace(/{{作者名}}/g, author);
  }

  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error('AI API 密钥未配置');
  }

  if (isGeminiProvider(config.apiUrl)) {
    // 使用 Google Gemini API
    const modelId = config.model;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildGeminiRequest(title, author)),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (isClaudeProvider(config.apiUrl)) {
    // 使用官方 Claude API（仅当 URL 明确为 api.anthropic.com 时）
    const modelId = config.model;
    const response = await fetch(`https://api.anthropic.com/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        messages: promptConfig,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Claude API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } else {
    // 使用 OpenAI 兼容 API
    const messages = promptConfig;
    // 从 fullConfig 读取用户配置的生成参数
    const temperature = fullConfig?.generation?.temperature ?? 0.7;
    const max_tokens = fullConfig?.generation?.max_tokens ?? 4096;

    const response = await fetch(`${config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}