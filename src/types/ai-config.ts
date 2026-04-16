// AI 配置系统类型定义

// API 请求配置
export interface APIRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
  params?: Record<string, string>;
  timeout?: number;
}

// API 响应配置
export interface APIResponseConfig {
  contentType: 'json' | 'text' | 'sse' | 'stream';
  extractContent: (response: any) => string;
  isError: (response: any) => boolean;
  parseError?: (error: any) => string;
}

// 流式响应处理配置
export interface StreamConfig {
  format: 'sse' | 'json-lines' | 'raw';
  delimiter?: string;
  extractChunk: (chunk: any) => string;
  onDone?: (finalChunk?: any) => void;
  onError?: (error: any) => void;
}

// AI 提示词配置
export interface PromptConfig {
  system?: string;
  user?: string;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  placeholders?: {
    [key: string]: string;
  };
}

// 生成参数配置
export interface GenerationConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  [key: string]: any;
}

// API 提供商配置
export interface APIProviderConfig {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  category: 'openai-compatible' | 'gemini' | 'claude' | 'custom';
  // API 端点配置
  endpoints: {
    chat: string;
    models?: string;
    embeddings?: string;
  };
  // 默认模型
  defaultModels?: string[];
  // 请求配置
  request: APIRequestConfig;
  // 响应配置
  response: APIResponseConfig;
  // 流式配置
  stream?: StreamConfig;
  // 提示词配置
  prompt?: PromptConfig;
  // 生成参数
  generation?: GenerationConfig;
  // 认证配置
  auth: {
    type: 'bearer' | 'api-key' | 'custom';
    header?: string;
    key?: string;
    position?: 'header' | 'body' | 'query';
  };
  // 自定义函数（可选）
  customFunctions?: {
    buildRequest?: (title: string, author: string, config: APIProviderConfig) => any;
    parseResponse?: (response: any, config: APIProviderConfig) => string;
    parseStream?: (chunk: any, config: APIProviderConfig) => string;
  };
}

// 完整的 AI 配置
export interface AIConfig {
  version: string;
  providers: APIProviderConfig[];
  defaults: {
    provider: string;
    model: string;
    apiUrl: string;
    [key: string]: any;
  };
  // 全局配置
  global: {
    timeout: number;
    retryAttempts: number;
    debug: boolean;
  };

  // 适配器所需字段
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  generation?: GenerationConfig;
  request_template?: any;

  // 新增字段以支持适配器配置
  provider?: string;
  baseURL?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  stream?: boolean;
}

// 配置预设
export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<APIProviderConfig>;
}