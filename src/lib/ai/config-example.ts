// 配置代码示例
// 将此代码保存到 localStorage 的 "ai-config-code" 中，即可使用自定义 API 配置

// 示例：创建一个自定义 API 配置
const customConfig = {
  version: '1.0.0',
  providers: [
    {
      id: 'my-custom-api',
      name: '我的自定义 API',
      category: 'custom',
      description: '一个完全自定义的 API 示例',
      endpoints: {
        chat: 'https://api.example.com/v1/chat/completions'
      },
      defaultModels: ['my-model-1', 'my-model-2'],
      request: {
        method: 'POST',
        url: 'https://api.example.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {{apiKey}}',
          'X-Custom-Header': 'MyApp'
        },
        body: {
          model: '{{model}}',
          messages: [],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
          // 自定义参数
          custom_param1: 'value1',
          custom_param2: '{{title}}' // 支持占位符
        }
      },
      response: {
        contentType: 'json',
        extractContent: (response) => {
          // 自定义响应解析逻辑
          return response.data?.content || response.result?.text || '';
        },
        isError: (response) => {
          return response.error || response.code !== 200;
        },
        parseError: (error) => {
          return error.message || `Error: ${error.code}`;
        }
      },
      stream: {
        format: 'sse',
        extractChunk: (chunk) => {
          // 自定义流式响应解析
          if (chunk === 'data: [DONE]') return '';
          try {
            const json = JSON.parse(chunk.slice(6));
            return json.data?.content || json.result?.text || '';
          } catch {
            return '';
          }
        }
      },
      prompt: {
        system: '你是一个专业的书籍推荐助手',
        user: '请分析《{{title}}》这本书',
        placeholders: {
          title: '{{title}}',
          author: '{{author}}'
        }
      },
      generation: {
        temperature: 0.8,
        max_tokens: 2048,
        top_p: 0.9
      },
      auth: {
        type: 'bearer',
        header: 'Authorization'
      }
    }
  ],
  defaults: {
    provider: 'my-custom-api',
    model: 'my-model-1',
    apiUrl: 'https://api.example.com/v1'
  },
  global: {
    timeout: 30000,
    retryAttempts: 3,
    debug: true
  }
};

// 示例：基于现有配置修改
const modifiedConfig = {
  version: '1.0.0',
  providers: [
    {
      // 基于 OpenAI 兼容 API 修改
      id: 'modified-openai',
      name: '修改后的 OpenAI 兼容 API',
      category: 'openai-compatible',
      endpoints: {
        chat: '/chat/completions'
      },
      defaultModels: ['gpt-4o', 'claude-3-5-sonnet'],
      // 修改请求格式
      request: {
        method: 'POST',
        url: '/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {{apiKey}}'
        },
        body: {
          model: '{{model}}',
          messages: [],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
          // 添加自定义参数
          use_json_format: false
        }
      },
      // 修改响应解析
      response: {
        contentType: 'sse',
        extractContent: (response) => {
          return response.choices?.[0]?.delta?.content ||
                 response.choices?.[0]?.message?.content ||
                 response.content || '';
        },
        isError: (response) => {
          return response.error || response.status >= 400;
        }
      },
      // 修改流式处理
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
      prompt: {
        system: '你是一位专业的书籍信息分析专家',
        user: '请详细分析《{{title}}》并给出推荐',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的书籍信息分析专家'
          },
          {
            role: 'user',
            content: '请详细分析《{{title}}》（作者：{{author}}）并给出推荐'
          }
        ]
      },
      generation: {
        temperature: 0.5,
        max_tokens: 8192,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true
      },
      auth: {
        type: 'bearer',
        header: 'Authorization'
      }
    }
  ],
  defaults: {
    provider: 'modified-openai',
    model: 'gpt-4o',
    apiUrl: 'https://api.openai.com/v1'
  },
  global: {
    timeout: 30000,
    retryAttempts: 3,
    debug: false
  }
};

// 示例：添加新的 API 提供商
const newProviderConfig = {
  version: '1.0.0',
  providers: [
    // 添加新的 API 配置
    {
      id: 'cohere-api',
      name: 'Cohere',
      category: 'openai-compatible',
      description: 'Cohere 文本生成 API',
      endpoints: {
        chat: 'https://api.cohere.com/v1/chat'
      },
      defaultModels: ['command-r-plus', 'command-r', 'command'],
      request: {
        method: 'POST',
        url: 'https://api.cohere.com/v1/chat',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {{apiKey}}'
        },
        body: {
          message: '请分析《{{title}}》',
          model: '{{model}}',
          max_tokens: 4096,
          stream: true
        }
      },
      response: {
        contentType: 'json',
        extractContent: (response) => {
          return response.text || '';
        },
        isError: (response) => {
          return response.error || response.message;
        }
      },
      stream: {
        format: 'sse',
        extractChunk: (chunk) => {
          if (chunk === 'data: [DONE]') return '';
          try {
            const json = JSON.parse(chunk.slice(6));
            return json.text || '';
          } catch {
            return '';
          }
        }
      },
      prompt: {
        system: '你是一位专业的书籍推荐助手',
        user: '{{title}}'
      },
      generation: {
        max_tokens: 4096,
        stream: true
      },
      auth: {
        type: 'bearer',
        header: 'Authorization'
      }
    }
  ],
  defaults: {
    provider: 'cohere-api',
    model: 'command-r-plus',
    apiUrl: 'https://api.cohere.com/v1'
  },
  global: {
    timeout: 30000,
    retryAttempts: 3,
    debug: false
  }
};

// 导出配置（根据需要选择一个）
export { customConfig, modifiedConfig, newProviderConfig };

// 使用方法：
// 1. 选择其中一个配置对象
// 2. 将其转换为字符串：JSON.stringify(yourConfig)
// 3. 在浏览器控制台中执行：
//    localStorage.setItem('ai-config-code', JSON.stringify(yourConfig))
// 4. 刷新页面，新的配置就会生效