// AI 服务 V2 - 基于配置驱动的 API 客户端
// 支持通过配置代码自定义任何 API 请求结构

import type {
  APIProviderConfig
} from '../types/ai-config';
import type { AISettings } from '../types/ai';
import {
  getAIConfigWithCode,
  getCurrentConfig,
  buildRequest,
  processStreamResponse,
  parseResponse
} from './config-client';

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

const DEFAULT_PROMPT_TEMPLATE = `# 角色
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

// 保存完整的 AI 配置（包含自定义配置）
export function saveFullAISettings(config: any): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(config));
}

// 检测是否为 Gemini 模型（向后兼容）
function isGeminiModel(model: string): boolean {
  return model.toLowerCase().includes('gemini') ||
         model.toLowerCase().includes('google') ||
         model.toLowerCase().startsWith('gemini-');
}

// 检测是否为 Gemini 提供商（向后兼容）
function isGeminiProvider(apiUrl: string): boolean {
  return apiUrl.includes('generativelanguage.googleapis.com');
}

// 检测是否为 Claude 提供商（向后兼容）
function isClaudeProvider(apiUrl: string): boolean {
  return apiUrl.includes('api.anthropic.com');
}

// 获取 AI 配置（优先 localStorage，fallback 环境变量）- 向后兼容
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

// 获取完整的 AI 配置（包含 input）- 向后兼容
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

// 获取配置驱动的配置
export function getAIConfigWithProvider(): APIProviderConfig | null {
  return getCurrentConfig();
}

export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!(config && config.apiKey);
}

// 构建默认提示词
function buildPrompt(title: string, author: string): AIMessage[] {
  const userContent = DEFAULT_PROMPT_TEMPLATE
    .replace(/\{title\}/g, title)
    .replace(/\{author\}/g, author || '未知');

  return [
    {
      role: 'user',
      content: userContent,
    },
  ];
}

// 流式调用 AI API - V2 版本
export async function streamBookInfoV2(
  title: string,
  author: string,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const configProvider = getAIConfigWithProvider();

  if (!configProvider) {
    callbacks.onError(new Error('AI 配置未找到，请先在设置中配置'));
    return;
  }

  try {
    // 获取完整配置以获取 API 密钥
    const fullConfig = getFullAISettings();
    if (!fullConfig?.apiKey) {
      callbacks.onError(new Error('AI API 密钥未配置，请先在设置中配置'));
      return;
    }

    // 构建请求
    const { url, options } = buildRequest(title, author, configProvider);

    // 添加中断信号
    if (signal) {
      (options.signal as AbortSignal).addEventListener('abort', () => {
        callbacks.onError(new Error('请求已取消'));
      });
    }

    // 调试信息
    if (configProvider.global?.debug) {
      console.log('AI API Request:', {
        url,
        method: options.method,
        headers: options.headers,
        body: JSON.parse(options.body as string || '{}')
      });
    }

    // 发送请求
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorMessage = `${configProvider.name} API 请求失败 (${response.status}): ${errorText}`;

      if (configProvider.response.parseError) {
        errorMessage = configProvider.response.parseError({
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }

      callbacks.onError(new Error(errorMessage));
      return;
    }

    // 获取流配置
    const streamConfig = configProvider.stream;
    if (!streamConfig) {
      callbacks.onError(new Error('流式配置未找到'));
      return;
    }

    // 处理流式响应
    let accumulatedText = '';

    for await (const chunk of processStreamResponse(response, streamConfig)) {
      accumulatedText += chunk;
      callbacks.onChunk(accumulatedText);
    }

    callbacks.onDone();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }

    let errorMessage = (error as Error).message;

    // 如果配置有自定义错误解析，使用它
    const configProvider = getAIConfigWithProvider();
    if (configProvider?.response?.parseError) {
      errorMessage = configProvider.response.parseError(error);
    }

    callbacks.onError(new Error(errorMessage));
  }
}

// 非流式调用 AI API - V2 版本
export async function fetchBookInfoV2(
  title: string,
  author: string,
  signal?: AbortSignal
): Promise<string> {
  const configProvider = getAIConfigWithProvider();

  if (!configProvider) {
    throw new Error('AI 配置未找到，请先在设置中配置');
  }

  try {
    // 获取完整配置以获取 API 密钥
    const fullConfig = getFullAISettings();
    if (!fullConfig?.apiKey) {
      throw new Error('AI API 密钥未配置，请先在设置中配置');
    }

    // 构建请求（非流式）
    const streamConfig = { ...configProvider.stream };
    streamConfig.format = 'json'; // 强制使用 JSON 格式
    delete streamConfig.extractChunk;
    delete streamConfig.onDone;
    delete streamConfig.onError;

    const { url, options } = buildRequest(title, author, configProvider);

    // 添加中断信号
    if (signal) {
      (options.signal as AbortSignal).addEventListener('abort', () => {
        throw new Error('请求已取消');
      });
    }

    // 发送请求
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorMessage = `${configProvider.name} API 请求失败 (${response.status}): ${errorText}`;

      if (configProvider.response.parseError) {
        errorMessage = configProvider.response.parseError({
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }

      throw new Error(errorMessage);
    }

    // 解析响应
    const data = await response.json();
    return parseResponse(data, configProvider.response);
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }

    let errorMessage = (error as Error).message;

    // 如果配置有自定义错误解析，使用它
    if (configProvider?.response?.parseError) {
      errorMessage = configProvider.response.parseError(error);
    }

    throw new Error(errorMessage);
  }
}

// 向后兼容的流式调用
export async function streamBookInfo(
  title: string,
  author: string,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  // 优先使用 V2 版本
  const configProvider = getAIConfigWithProvider();

  if (configProvider) {
    return streamBookInfoV2(title, author, callbacks, signal);
  }

  // 如果没有配置，使用旧版本
  const config = getAIConfig();

  if (!config.apiKey) {
    callbacks.onError(new Error('AI API 密钥未配置，请先在设置中配置'));
    return;
  }

  const isGemini = isGeminiProvider(config.apiUrl) || isGeminiModel(config.model);
  const isClaude = isClaudeProvider(config.apiUrl) && !isGemini;

  try {
    if (isGemini) {
      // 使用 Google Gemini API
      const modelId = config.model;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: DEFAULT_PROMPT_TEMPLATE
                .replace(/\{title\}/g, title)
                .replace(/\{author\}/g, author || '未知')
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Gemini API 请求失败 (${response.status}): ${errorText}`);
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
          messages: [{
            role: 'user',
            content: DEFAULT_PROMPT_TEMPLATE
              .replace(/\{title\}/g, title)
              .replace(/\{author\}/g, author || '未知')
          }],
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
      const response = await fetch(`${config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{
            role: 'user',
            content: DEFAULT_PROMPT_TEMPLATE
              .replace(/\{title\}/g, title)
              .replace(/\{author\}/g, author || '未知')
          }],
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
      }

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

      callbacks.onDone();
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }
    callbacks.onError(error as Error);
  }
}

// 非流式调用（备用）- 向后兼容
export async function fetchBookInfo(
  title: string,
  author: string,
  signal?: AbortSignal
): Promise<string> {
  // 优先使用 V2 版本
  try {
    return await fetchBookInfoV2(title, author, signal);
  } catch {
    // 如果 V2 版本失败，使用旧版本
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
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: DEFAULT_PROMPT_TEMPLATE
              .replace(/\{title\}/g, title)
              .replace(/\{author\}/g, author || '未知')
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (isClaudeProvider(config.apiUrl)) {
    // 使用官方 Claude API
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
        messages: [{
          role: 'user',
          content: DEFAULT_PROMPT_TEMPLATE
            .replace(/\{title\}/g, title)
            .replace(/\{author\}/g, author || '未知')
        }],
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
    const response = await fetch(`${config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{
          role: 'user',
          content: DEFAULT_PROMPT_TEMPLATE
            .replace(/\{title\}/g, title)
            .replace(/\{author\}/g, author || '未知')
        }],
        temperature: 0.7,
        max_tokens: 4096,
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

// 自动检测 API 类型并调用
export async function streamBookInfoAuto(
  title: string,
  author: string,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  // 优先使用 V2 配置驱动版本
  const configProvider = getAIConfigWithProvider();
  if (configProvider) {
    return streamBookInfoV2(title, author, callbacks, signal);
  }

  // 回退到传统版本
  return streamBookInfo(title, author, callbacks, signal);
}

export async function fetchBookInfoAuto(
  title: string,
  author: string,
  signal?: AbortSignal
): Promise<string> {
  // 优先使用 V2 配置驱动版本
  try {
    return await fetchBookInfoV2(title, author, signal);
  } catch {
    // 回退到传统版本
  }

  return fetchBookInfo(title, author, signal);
}