// AI 配置类型定义

export interface AISettings {
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
}

export interface AIProvider {
  key: string;
  name: string;
  nameEn?: string;
  apiUrl: string;
  models: AIProviderModel[];
}

export interface AIProviderModel {
  id: string;
  name: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    key: 'custom',
    name: '自定义',
    apiUrl: '',
    models: [],
  },
  {
    key: 'claude-official',
    name: 'Claude Official',
    nameEn: 'Claude Official',
    apiUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-20241218', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    ],
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    nameEn: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    ],
  },
  {
    key: 'zhipu-glm',
    name: 'Zhipu GLM',
    nameEn: 'Zhipu GLM',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4v', name: 'GLM-4V' },
      { id: 'glm-4-air', name: 'GLM-4-Air' },
      { id: 'glm-4-flash', name: 'GLM-4-Flash' },
      { id: 'glm-4.7-flash', name: 'GLM-4.7-Flash' },
    ],
  },
  {
    key: 'zhipu-glm-en',
    name: 'Zhipu GLM En',
    nameEn: 'Zhipu GLM En',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4', name: 'GLM-4 En' },
      { id: 'glm-4-air', name: 'GLM-4 Air En' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash En' },
    ],
  },
  {
    key: 'bailian',
    name: 'Bailian (百炼)',
    nameEn: 'Bailian',
    apiUrl: 'https://bailian-api.console.aliyun.com/api/v1',
    models: [
      { id: 'qwen-max', name: 'Qwen Max' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
    ],
  },
  {
    key: 'kimi',
    name: 'Kimi',
    nameEn: 'Kimi',
    apiUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K' },
    ],
  },
  {
    key: 'minimax',
    name: 'MiniMax',
    nameEn: 'MiniMax',
    apiUrl: 'https://api.minimax.chat/v1',
    models: [
      { id: 'abab6.5s-chat', name: 'ABAB 6.5S Chat' },
      { id: 'abab6.5g-chat', name: 'ABAB 6.5G Chat' },
      { id: 'abab6.5-chat', name: 'ABAB 6.5 Chat' },
    ],
  },
  {
    key: 'minimax-en',
    name: 'MiniMax En',
    nameEn: 'MiniMax En',
    apiUrl: 'https://api.minimax.chat/v1',
    models: [
      { id: 'abab6.5s-chat', name: 'ABAB 6.5S Chat' },
      { id: 'abab6.5g-chat', name: 'ABAB 6.5G Chat' },
    ],
  },
  {
    key: 'doubao-seed',
    name: 'DouBaoSeed',
    nameEn: 'DouBao Seed',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-pro-32k', name: 'Doubao Pro 32K' },
      { id: 'doubao-pro-4k', name: 'Doubao Pro 4K' },
      { id: 'doubao-lite-32k', name: 'Doubao Lite 32K' },
    ],
  },
  {
    key: 'siliconflow',
    name: 'SiliconFlow',
    nameEn: 'SiliconFlow',
    apiUrl: 'https://api.siliconflow.cn/v1',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B' },
    ],
  },
  {
    key: 'siliconflow-en',
    name: 'SiliconFlow En',
    nameEn: 'SiliconFlow En',
    apiUrl: 'https://api.siliconflow.cn/v1',
    models: [
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
    ],
  },
  {
    key: 'dmxapi',
    name: 'DMXAPI',
    nameEn: 'DMXAPI',
    apiUrl: 'https://api.dmxapi.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    ],
  },
  {
    key: 'packycode',
    name: 'PackyCode',
    nameEn: 'PackyCode',
    apiUrl: 'https://api.packycode.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    ],
  },
  {
    key: 'cubence',
    name: 'Cubence',
    nameEn: 'Cubence',
    apiUrl: 'https://api.cubence.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    ],
  },
  {
    key: 'aigocode',
    name: 'AIGoCode',
    nameEn: 'AIGoCode',
    apiUrl: 'https://api.aigocode.com/v1',
    models: [
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
  },
  {
    key: 'rightcode',
    name: 'RightCode',
    nameEn: 'RightCode',
    apiUrl: 'https://api.rightcode.ai/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    ],
  },
  {
    key: 'openai',
    name: 'OpenAI',
    nameEn: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'o1-preview', name: 'O1 Preview' },
      { id: 'o1-mini', name: 'O1 Mini' },
    ],
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    nameEn: 'Google Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
  },
];

export function getProviderByKey(key: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.key === key);
}

export function getDefaultSettings(): AISettings {
  return {
    provider: '',
    apiKey: '',
    apiUrl: '',
    model: '',
  };
}
