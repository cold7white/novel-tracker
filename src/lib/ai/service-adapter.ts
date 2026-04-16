import { getAdapter } from './adapter/factory';
import type { AIAdapterConfig, AIMessage } from './adapter/interface';

// Updated AI service using the adapter pattern

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface AIConfig {
  provider?: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  generation?: {
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  };
  input?: {
    messages?: AIMessage[];
  };
  request_template?: any;
}

// Convert legacy config to adapter config
function toAdapterConfig(config: AIConfig): AIAdapterConfig {
  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    temperature: config.generation?.temperature,
    top_p: config.generation?.top_p,
    max_tokens: config.generation?.max_tokens,
    stream: config.generation?.stream,
    request_template: config.request_template,
  };
}

// Convert messages for prompt replacement
function processMessages(config: AIConfig, title?: string, author?: string): AIMessage[] {
  let messages = config.input?.messages || [];

  // Use default prompt if none provided
  if (!messages || messages.length === 0) {
    const defaultPrompt = buildDefaultPrompt(title, author);
    messages = defaultPrompt;
  }

  // Replace placeholders
  const processedMessages = messages.map((message) => {
    if (message.content.includes('{{书名}}')) {
      return {
        ...message,
        content: message.content
          .replace(/{{书名}}/g, title || '书名')
          .replace(/{{作者名}}/g, author || '作者名'),
      };
    }
    return message;
  });

  return processedMessages;
}

// Default prompt builder
function buildDefaultPrompt(title?: string, author?: string): AIMessage[] {
  const userContent = `请为《${title || '书名'}》（作者：${author || '作者名'}）生成书籍信息`;

  return [
    {
      role: 'system',
      content: `# 角色
你是一位书籍信息整理与推荐助手，负责从书籍本身及全网公开的社交/平台数据中提取信息，并根据"书籍客观特征 + 社交热度信号"推荐相似作品。不引入主观评价（如"必读""经典"）。

# 任务
请为《${title || '书名'}》（作者：${author || '作者名'}）生成以下三部分内容，采用简洁美观的排版。

## 排版要求
- 使用纯文本 + 少量 Markdown（仅限 **粗体**、- 列表、> 引用块）。
- 各板块之间用一个空行分隔。
- 基本信息每项一行，用 **字段**：值 格式。
- 类似小说推荐用 > 引用块，每个推荐之间空一行。

## 输出格式

**书名**：《${title || '书名'}》
**作者**：${author || '作者名'}（笔名 · 首发平台）

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

# 约束
- 禁止出现"必读""经典""口碑爆棚"等主观评价词。
- 热度信号必须基于真实可查的平台数据，不得编造具体数字或虚假链接。`
    },
    {
      role: 'user',
      content: userContent,
    },
  ];
}

// Unified streaming function using adapters
export async function streamBookInfoWithAdapter(
  config: AIConfig,
  callbacks: StreamCallbacks,
  title?: string,
  author?: string,
  signal?: AbortSignal
): Promise<void> {
  try {
    const adapterConfig = toAdapterConfig(config);
    const messages = processMessages(config, title, author);
    const adapter = getAdapter(adapterConfig);

    // Build request
    const url = adapterConfig.baseUrl.includes('://')
      ? adapterConfig.baseUrl
      : `https://${adapterConfig.baseUrl}`;

    let requestUrl = url;
    if (url.includes('generativelanguage.googleapis.com')) {
      // Special handling for Gemini
      requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${adapterConfig.model}:streamGenerateContent?key=${encodeURIComponent(adapterConfig.apiKey)}`;
    } else {
      // For other APIs, append the endpoint
      const endpoint = adapterConfig.request_template?.url || '/chat/completions';
      if (!url.endsWith(endpoint)) {
        requestUrl = url + endpoint;
      }
    }

    const headers = adapter.buildHeaders(adapterConfig);
    const body = adapter.buildBody(adapterConfig, messages);

    console.log('Adapter Request:', {
      url: requestUrl,
      method: 'POST',
      headers,
      body: adapterConfig.request_template ? '[custom template]' : JSON.stringify(body),
    });

    // Make request
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    // Use adapter to handle streaming
    if (adapterConfig.stream) {
      await adapter.parseStreamResponse(response, callbacks.onChunk);
    } else {
      const result = await adapter.parseResponse(response);
      callbacks.onChunk(result.text);
    }

    callbacks.onDone();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }
    callbacks.onError(error as Error);
  }
}

// Non-streaming version
export async function fetchBookInfoWithAdapter(
  config: AIConfig,
  title?: string,
  author?: string,
  signal?: AbortSignal
): Promise<string> {
  const adapterConfig = toAdapterConfig(config);
  const messages = processMessages(config, title, author);
  const adapter = getAdapter(adapterConfig);

  // Build request
  const url = adapterConfig.baseUrl.includes('://')
    ? adapterConfig.baseUrl
    : `https://${adapterConfig.baseUrl}`;

  let requestUrl = url;
  if (url.includes('generativelanguage.googleapis.com')) {
    requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${adapterConfig.model}:generateContent?key=${encodeURIComponent(adapterConfig.apiKey)}`;
  } else {
    const endpoint = adapterConfig.request_template?.url || '/chat/completions';
    if (!url.endsWith(endpoint)) {
      requestUrl = url + endpoint;
    }
  }

  const headers = adapter.buildHeaders(adapterConfig);
  const body = adapter.buildBody(adapterConfig, messages);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
  }

  const result = await adapter.parseResponse(response);
  return result.text;
}

// Export provider type utility
export { getAdapter, ProviderType } from './adapter/factory';