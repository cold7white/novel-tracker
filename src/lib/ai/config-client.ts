import type {
  APIProviderConfig,
  APIRequestConfig,
  StreamConfig,
  PromptConfig,
  AIConfig
} from '../types/ai-config';
import type { AISettings } from '../types/ai';

// 配置缓存
let configCache: AIConfig | null = null;
let lastConfigUpdate = 0;

// 获取 AI 配置（支持配置代码）
export function getAIConfigWithCode(): AIConfig {
  const now = Date.now();

  // 如果配置缓存存在且未过期（5分钟），直接返回
  if (configCache && now - lastConfigUpdate < 5 * 60 * 1000) {
    return configCache;
  }

  // 尝试从 localStorage 读取配置代码
  const configCode = localStorage.getItem('ai-config-code');
  if (configCode) {
    try {
      // 执行配置代码
      const config = executeConfigCode(configCode);
      configCache = config;
      lastConfigUpdate = now;
      return config;
    } catch (error) {
      console.error('配置代码执行失败:', error);
    }
  }

  // 使用默认配置
  configCache = getDefaultConfig();
  lastConfigUpdate = now;
  return configCache;
}

// 执行配置代码
function executeConfigCode(code: string): AIConfig {
  // 创建安全的执行环境
  const func = new Function('require', 'exports', code);
  const exports = {};

  // 限制可用的模块
  const require = (module: string) => {
    if (module === './config-presets') {
      // 导入预设配置
      return {
        API_CONFIG_PRESETS: require('../ai/config-presets').API_CONFIG_PRESETS,
        findConfigPreset: require('../ai/config-presets').findConfigPreset
      };
    }
    throw new Error(`模块 "${module}" 不允许在配置代码中使用`);
  };

  func(require, exports);

  if (!exports || typeof exports !== 'object') {
    throw new Error('配置代码必须导出一个配置对象');
  }

  const config = exports as AIConfig;

  // 验证配置格式
  validateConfig(config);

  return config;
}

// 验证配置格式
function validateConfig(config: AIConfig): void {
  if (!config.version || !config.providers || !Array.isArray(config.providers)) {
    throw new Error('配置必须包含 version 和 providers 字段');
  }

  // 验证每个提供商配置
  config.providers.forEach(provider => {
    if (!provider.id || !provider.name || !provider.request || !provider.response) {
      throw new Error(`提供商 "${provider.id}" 缺少必要的字段`);
    }
  });
}

// 获取默认配置
function getDefaultConfig(): AIConfig {
  return {
    version: '1.0.0',
    providers: [],
    defaults: {
      provider: 'custom',
      model: '',
      apiUrl: ''
    },
    global: {
      timeout: 30000,
      retryAttempts: 3,
      debug: false
    }
  };
}

// 获取当前配置
export function getCurrentConfig(): APIProviderConfig | null {
  const fullConfig = getFullAISettings();
  const configCode = getAIConfigWithCode();

  if (!fullConfig || !fullConfig.provider) {
    return null;
  }

  // 查找对应的配置
  const providerConfig = configCode.providers.find(p =>
    p.id === fullConfig.provider || p.name === fullConfig.provider
  );

  if (!providerConfig) {
    // 如果没有找到，使用默认的 OpenAI 兼容配置
    const defaultConfig = require('./config-presets').openAICompatibleConfig;
    if (fullConfig.customConfig) {
      return {
        ...defaultConfig,
        ...fullConfig.customConfig
      };
    }
    return defaultConfig;
  }

  return providerConfig;
}

// 从 localStorage 获取完整配置
function getFullAISettings(): any {
  try {
    const stored = localStorage.getItem('ai-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}

// 构建请求
export function buildRequest(
  title: string,
  author: string,
  config: APIProviderConfig
): {
  url: string;
  options: RequestInit;
} {
  const fullConfig = getFullAISettings();
  const apiKey = fullConfig?.apiKey || '';
  const model = fullConfig?.model || config.defaultModels?.[0] || '';

  // 替换 URL 中的占位符
  let url = config.request.url;
  url = url.replace('{{apiKey}}', apiKey);
  url = url.replace('{{model}}', model);

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.request.headers
  };

  // 添加认证头
  if (config.auth.type === 'bearer' && config.auth.header) {
    headers[config.auth.header] = `Bearer ${apiKey}`;
  } else if (config.auth.type === 'api-key' && config.auth.header) {
    headers[config.auth.header] = apiKey;
  }

  // 构建请求体
  let body: any = {};
  if (config.request.body) {
    body = JSON.parse(JSON.stringify(config.request.body));

    // 处理提示词
    if (config.prompt) {
      const prompt = buildPrompt(title, author, config.prompt);
      body = mergePrompt(body, prompt, config.request.body);
    }

    // 替换其他占位符
    body = replacePlaceholders(body, { title, author, apiKey, model });
  }

  // 处理查询参数
  const params: URLSearchParams = new URLSearchParams();
  if (config.request.params) {
    Object.entries(config.request.params).forEach(([key, value]) => {
      params.append(key, value);
    });
  }

  // 如果认证在 query 中
  if (config.auth.type === 'api-key' && config.auth.position === 'query') {
    params.append(config.auth.key || 'key', apiKey);
  }

  const queryString = params.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  return {
    url,
    options: {
      method: config.request.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config.request.timeout || 30000)
    }
  };
}

// 构建提示词
function buildPrompt(title: string, author: string, promptConfig: PromptConfig): any {
  const placeholders = {
    title,
    author: author || '未知',
    书名: title,
    作者名: author || '未知'
  };

  if (promptConfig.messages) {
    // 使用自定义消息格式
    return promptConfig.messages.map(msg => ({
      role: msg.role,
      content: replacePlaceholders(msg.content, placeholders)
    }));
  }

  // 使用系统 + 用户消息格式
  const messages: any[] = [];

  if (promptConfig.system) {
    messages.push({
      role: 'system',
      content: replacePlaceholders(promptConfig.system, placeholders)
    });
  }

  if (promptConfig.user) {
    messages.push({
      role: 'user',
      content: replacePlaceholders(promptConfig.user, placeholders)
    });
  }

  return messages;
}

// 合并提示词
function mergePrompt(body: any, prompt: any, originalBody: any): any {
  if (originalBody.messages) {
    body.messages = prompt;
  } else if (originalBody.contents && Array.isArray(originalBody.contents)) {
    body.contents[0].parts[0].text = prompt[0]?.content || '';
  } else if (originalBody.content) {
    body.content = prompt[0]?.content || '';
  }
  return body;
}

// 替换占位符
function replacePlaceholders(obj: any, placeholders: Record<string, string>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return placeholders[key] || match;
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replacePlaceholders(item, placeholders));
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replacePlaceholders(value, placeholders);
    }
    return result;
  }

  return obj;
}

// 处理流式响应
export async function* processStreamResponse(
  response: Response,
  streamConfig: StreamConfig
): AsyncGenerator<string> {
  if (streamConfig.format === 'sse') {
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

        if (trimmed.startsWith('data: ')) {
          const chunk = streamConfig.extractChunk(trimmed);
          if (chunk) {
            yield chunk;
          }
        }
      }
    }
  } else if (streamConfig.format === 'json-lines') {
    // 处理 JSON Lines 格式
    // TODO: 实现 JSON Lines 解析
  } else {
    // 原始流
    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      yield streamConfig.extractChunk(chunk);
    }
  }
}

// 解析响应
export function parseResponse(response: any, responseConfig: APIResponseConfig): string {
  if (responseConfig.extractContent) {
    return responseConfig.extractContent(response);
  }
  return '';
}

// 检查是否为错误
export function isResponseError(response: any, responseConfig: APIResponseConfig): boolean {
  if (responseConfig.isError) {
    return responseConfig.isError(response);
  }
  return false;
}

// 解析错误信息
export function parseErrorResponse(error: any, responseConfig: APIResponseConfig): string {
  if (responseConfig.parseError) {
    return responseConfig.parseError(error);
  }
  return error.message || 'Unknown error';
}

// 保存配置代码
export function saveConfigCode(code: string): void {
  localStorage.setItem('ai-config-code', code);
}

// 获取配置代码
export function getConfigCode(): string {
  return localStorage.getItem('ai-config-code') || '';
}

// 清除配置代码
export function clearConfigCode(): void {
  localStorage.removeItem('ai-config-code');
}