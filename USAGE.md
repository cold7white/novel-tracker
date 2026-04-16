# AI 配置系统使用指南

## 快速开始

### 1. 基础配置

对于大多数用户，简单的 JSON 配置就足够了：

```json
{
  "api_key": "sk-your-api-key",
  "base_url": "https://api.openai.com/v1",
  "model": "gpt-4o",
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### 2. 高级配置（完全自定义）

如果你需要适配特殊的 API，可以使用配置代码：

```javascript
// 在浏览器控制台中执行
localStorage.setItem('ai-config-code', JSON.stringify({
  version: '1.0.0',
  providers: [{
    id: 'my-api',
    name: '我的API',
    category: 'custom',
    endpoints: {
      chat: 'https://api.example.com/v1/chat'
    },
    request: {
      method: 'POST',
      url: 'https://api.example.com/v1/chat',
      headers: {
        'Authorization': 'Bearer {{apiKey}}'
      },
      body: {
        model: '{{model}}',
        messages: []
      }
    },
    response: {
      contentType: 'json',
      extractContent: (r) => r.content || ''
    }
  }]
}));
```

## 支持的 API 类型

### 内置支持
- **OpenAI 兼容 API** - GPT、Claude、DeepSeek 等
- **Google Gemini** - 官方 Gemini API
- **Claude 官方** - api.anthropic.com
- **Zhipu GLM** - 智谱清言
- **Kimi** - 月之暗面

### 自定义 API
通过配置代码，你可以适配任何 RESTful AI API。

## 占位符系统

配置中可以使用以下占位符：
- `{{apiKey}}` - API 密钥
- `{{model}}` - 模型名称
- `{{title}}` - 书名
- `{{author}}` - 作者
- `{{base_url}}` - 基础 URL

## 配置示例

### Cohere API
```javascript
{
  version: '1.0.0',
  providers: [{
    id: 'cohere',
    name: 'Cohere',
    request: {
      url: 'https://api.cohere.com/v1/chat',
      body: {
        message: '{{title}}',
        model: '{{model}}',
        stream: true
      }
    },
    response: {
      extractContent: (r) => r.text || ''
    }
  }]
}
```

### 自定义格式 API
```javascript
{
  version: '1.0.0',
  providers: [{
    id: 'custom-api',
    name: 'Custom API',
    request: {
      url: 'https://api.custom.com/complete',
      headers: {
        'X-Custom-Key': '{{apiKey}}'
      },
      body: {
        text: '{{title}}',
        model_id: '{{model}}'
      }
    },
    response: {
      extractContent: (r) => r.result.text || ''
    }
  }]
}
```

## 迁移指南

### 从旧版本迁移
1. 你的现有配置会自动继续工作
2. 可以逐步迁移到新格式
3. 在设置界面中可以在简单和高级配置间切换

### 最佳实践
1. **优先使用预设** - 大多数 API 都有预设模板
2. **调试模式** - 设置 `debug: true` 查看详细日志
3. **备份配置** - 使用导出功能备份你的配置

## 故障排除

### 常见错误
- **401 错误** - 检查 API 密钥
- **404 错误** - 检查模型名称和 URL
- **流式响应不工作** - 确认 API 支持 SSE

### 调试技巧
1. 打开浏览器开发者工具
2. 查看 Console 标签的错误信息
3. 检查 Network 标签的请求详情

## 更多资源

- [详细配置文档](README-CONFIG.md)
- [配置示例代码](src/lib/ai/config-example.ts)