import type {
  APIProviderConfig,
  StreamConfig,
  APIRequestConfig,
  APIResponseConfig,
  PromptConfig,
  GenerationConfig
} from '../types/ai-config';

// 通用的 OpenAI 兼容 API 配置
export const openAICompatibleConfig: APIProviderConfig = {
  id: 'openai-compatible',
  name: 'OpenAI 兼容 API',
  category: 'openai-compatible',
  endpoints: {
    chat: '/chat/completions'
  },
  defaultModels: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'claude-3-5-sonnet',
    'deepseek-ai/DeepSeek-V3'
  ],
  request: {
    method: 'POST',
    url: '/chat/completions',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      model: '{{model}}',
      messages: [],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true
    }
  },
  response: {
    contentType: 'sse',
    extractContent: (response) => {
      const choices = response.choices;
      return choices?.[0]?.delta?.content || choices?.[0]?.message?.content || '';
    },
    isError: (response) => {
      return response.error || response.status >= 400;
    },
    parseError: (error) => {
      return error.message || error.error?.message || 'Unknown error';
    }
  },
  stream: {
    format: 'sse',
    delimiter: 'data: ',
    extractChunk: (chunk) => {
      if (chunk === 'data: [DONE]') return '';
      try {
        const json = JSON.parse(chunk.slice(6));
        return json.choices?.[0]?.delta?.content || '';
      } catch {
        return '';
      }
    },
    onDone: () => {},
    onError: (error) => {
      console.error('Stream error:', error);
    }
  },
  auth: {
    type: 'bearer',
    header: 'Authorization'
  },
  generation: {
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true
  }
};

// Google Gemini 配置
export const geminiConfig: APIProviderConfig = {
  id: 'gemini',
  name: 'Google Gemini',
  category: 'gemini',
  endpoints: {
    chat: 'https://generativelanguage.googleapis.com/v1beta/models/{{model}}:streamGenerateContent',
    models: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  defaultModels: [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-thinking-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ],
  request: {
    method: 'POST',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/{{model}}:streamGenerateContent?key={{apiKey}}',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      contents: [{
        parts: [{
          text: '{{prompt}}'
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    }
  },
  response: {
    contentType: 'json',
    extractContent: (response) => {
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
    isError: (response) => {
      return response.error || response.status >= 400;
    },
    parseError: (error) => {
      return error.error?.message || error.message || 'Unknown error';
    }
  },
  stream: {
    format: 'json',
    extractChunk: (chunk) => {
      try {
        return chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch {
        return '';
      }
    },
    onDone: () => {},
    onError: (error) => {
      console.error('Gemini stream error:', error);
    }
  },
  auth: {
    type: 'api-key',
    header: '',
    position: 'query',
    key: 'key'
  },
  prompt: {
    system: '',
    user: '{{prompt}}'
  }
};

// Claude 官方 API 配置
export const claudeConfig: APIProviderConfig = {
  id: 'claude',
  name: 'Claude Official',
  category: 'claude',
  endpoints: {
    chat: 'https://api.anthropic.com/v1/messages',
    models: 'https://api.anthropic.com/v1/models'
  },
  defaultModels: [
    'claude-3-5-sonnet-20241218',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229'
  ],
  request: {
    method: 'POST',
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '{{apiKey}}',
      'anthropic-version': '2023-06-01'
    },
    body: {
      model: '{{model}}',
      max_tokens: 4096,
      messages: []
    }
  },
  response: {
    contentType: 'json',
    extractContent: (response) => {
      return response.content?.[0]?.text || '';
    },
    isError: (response) => {
      return response.error || response.type === 'error';
    },
    parseError: (error) => {
      return error.error?.message || error.message || 'Unknown error';
    }
  },
  stream: {
    format: 'sse',
    extractChunk: (chunk) => {
      try {
        return chunk.delta?.text || '';
      } catch {
        return '';
      }
    },
    onDone: () => {},
    onError: (error) => {
      console.error('Claude stream error:', error);
    }
  },
  auth: {
    type: 'api-key',
    header: 'x-api-key'
  }
};

// Zhipu GLM 配置
export const zhipuGLMConfig: APIProviderConfig = {
  id: 'zhipu-glm',
  name: 'Zhipu GLM',
  category: 'openai-compatible',
  endpoints: {
    chat: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  },
  defaultModels: [
    'glm-4',
    'glm-4v',
    'glm-4-air',
    'glm-4-flash',
    'glm-4.7-flash'
  ],
  request: {
    method: 'POST',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{apiKey}}'
    },
    body: {
      model: '{{model}}',
      messages: [],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true
    }
  },
  response: {
    contentType: 'sse',
    extractContent: (response) => {
      return response.choices?.[0]?.delta?.content || response.choices?.[0]?.message?.content || '';
    },
    isError: (response) => {
      return response.error || response.code !== 0;
    },
    parseError: (error) => {
      return error.error?.message || error.msg || `Code: ${error.code}`;
    }
  },
  stream: {
    format: 'sse',
    extractChunk: (chunk) => {
      if (chunk === 'data: [DONE]') return '';
      try {
        const json = JSON.parse(chunk.slice(6));
        return json.choices?.[0]?.delta?.content || '';
      } catch {
        return '';
      }
    }
  },
  auth: {
    type: 'bearer'
  }
};

// Moonshot Kimi 配置
export const kimiConfig: APIProviderConfig = {
  id: 'kimi',
  name: 'Kimi',
  category: 'openai-compatible',
  endpoints: {
    chat: 'https://api.moonshot.cn/v1/chat/completions'
  },
  defaultModels: [
    'moonshot-v1-128k',
    'moonshot-v1-32k'
  ],
  request: {
    method: 'POST',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{apiKey}}'
    },
    body: {
      model: '{{model}}',
      messages: [],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true
    }
  },
  response: {
    contentType: 'sse',
    extractContent: (response) => {
      return response.choices?.[0]?.delta?.content || response.choices?.[0]?.message?.content || '';
    },
    isError: (response) => {
      return response.error || response.status >= 400;
    }
  },
  stream: {
    format: 'sse',
    extractChunk: (chunk) => {
      if (chunk === 'data: [DONE]') return '';
      try {
        const json = JSON.parse(chunk.slice(6));
        return json.choices?.[0]?.delta?.content || '';
      } catch {
        return '';
      }
    }
  },
  auth: {
    type: 'bearer'
  }
};

// 所有预设配置
export const API_CONFIG_PRESETS: APIProviderConfig[] = [
  openAICompatibleConfig,
  geminiConfig,
  claudeConfig,
  zhipuGLMConfig,
  kimiConfig
];

// 根据关键词查找配置
export function findConfigPreset(id: string): APIProviderConfig | undefined {
  return API_CONFIG_PRESETS.find(config => config.id === id);
}

// 创建自定义配置
export function createCustomConfig(
  baseConfig: APIProviderConfig,
  overrides: Partial<APIProviderConfig>
): APIProviderConfig {
  return {
    ...baseConfig,
    ...overrides,
    id: overrides.id || baseConfig.id,
    name: overrides.name || baseConfig.name,
    request: {
      ...baseConfig.request,
      ...overrides.request,
      url: overrides.request?.url || baseConfig.request.url
    },
    response: {
      ...baseConfig.response,
      ...overrides.response
    },
    stream: overrides.stream || baseConfig.stream,
    prompt: {
      ...baseConfig.prompt,
      ...overrides.prompt
    },
    generation: {
      ...baseConfig.generation,
      ...overrides.generation
    }
  };
}