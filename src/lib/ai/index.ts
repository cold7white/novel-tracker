// AI 模块统一导出

// 原始服务
export {
  loadAISettings,
  saveAISettings,
  saveFullAISettings,
  getFullAISettings,
  isAIConfigured,
  streamBookInfo,
  fetchBookInfo,
  isGeminiModel,
  isGeminiProvider,
  isClaudeProvider,
  isOpenAICompatible
} from './service';

// V2 服务（配置驱动）
export {
  streamBookInfoV2,
  fetchBookInfoV2,
  streamBookInfoAuto,
  fetchBookInfoAuto
} from './service-v2';

// 配置客户端
export {
  getAIConfigWithCode,
  getCurrentConfig,
  buildRequest,
  processStreamResponse,
  parseResponse,
  isResponseError,
  parseErrorResponse,
  saveConfigCode,
  getConfigCode,
  clearConfigCode
} from './config-client';

// 配置预设
export {
  API_CONFIG_PRESETS,
  findConfigPreset,
  createCustomConfig,
  openAICompatibleConfig,
  geminiConfig,
  claudeConfig,
  zhipuGLMConfig,
  kimiConfig
} from './config-presets';

// 配置示例
export {
  customConfig,
  modifiedConfig,
  newProviderConfig
} from './config-example';

// 类型导出
export type {
  AIConfig,
  APIProviderConfig,
  APIRequestConfig,
  APIResponseConfig,
  StreamConfig,
  PromptConfig,
  GenerationConfig,
  ConfigPreset
} from '@/types/ai-config';

export type {
  AISettings,
  AIProvider,
  AIProviderModel
} from '@/types/ai';