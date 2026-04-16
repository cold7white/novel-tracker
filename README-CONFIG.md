# AI 配置系统使用指南

## 概述

Novel Tracker 现在支持通过配置代码自定义 API 请求结构，可以适配任何 AI 服务提供商。

## 使用方法

### 1. 基础配置（适合大多数用户）

在 AI 设置中，你可以通过简单的 JSON 配置来设置 API：

```json
{
  "api_key": "你的API密钥",
  "base_url": "https://api.example.com/v1",
  "model": "gpt-4o",
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### 2. 高级配置（适合开发者）

如果你需要完全自定义 API 请求，可以使用配置代码功能。

#### 2.1 打开配置代码编辑器

在 AI 设置模态框中：
- 点击"配置代码"标签
- 点击"导入配置代码"按钮
- 选择或粘贴配置代码

#### 2.2 配置代码示例

```javascript
// 完整的配置代码示例
const config = {
  version: '1.0.0',
  providers: [
    {
      id: 'my-api',
      name: '我的API',
      category: 'custom',
      endpoints: {
        chat: 'https://api.example.com/v1/chat/completions'
      },
      defaultModels: ['my-model-1'],
      request: {
        method: 'POST',
        url: 'https://api.example.com/v1/chat/completions',
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
        contentType: 'json',
        extractContent: (response) => {
          return response.choices?.[0]?.message?.content || '';
        },
        isError: (response) => {
          return response.error || response.status >= 400;
        }
      },
      stream: {
        format: 'sse',
        extractChunk: (chunk) => {
          if (chunk === 'data: [DONE]') return '';
          const json = JSON.parse(chunk.slice(6));
          return json.choices?.[0]?.delta?.content || '';
        }
      },
      auth: {
        type: 'bearer',
        header: 'Authorization'
      }
    }
  ],
  defaults: {
    provider: 'my-api',
    model: 'my-model-1'
  },
  global: {
    timeout: 30000,
    retryAttempts: 3,
    debug: false
  }
};
```

### 3. 预设模板

系统提供了几个预设模板：

1. **OpenAI 兼容模板** - 适配大多数 OpenAI 兼容的 API
2. **Cohere API 模板** - 适配 Cohere 文本生成 API
3. **自定义模板** - 完全自定义的示例

点击相应按钮即可加载模板。

## 配置说明

### 占位符

配置支持以下占位符，系统会自动替换：
- `{{apiKey}}` - API 密钥
- `{{model}}` - 模型名称
- `{{title}}` - 书名
- `{{author}}` - 作者
- `{{base_url}}` - API 基础地址

### 请求配置

- `url`: API 端点
- `method`: HTTP 方法
- `headers`: 请求头
- `body`: 请求体
- `params`: URL 参数

### 响应配置

- `contentType`: 响应内容类型
- `extractContent`: 提取内容的函数
- `isError`: 判断是否为错误的函数
- `parseError`: 解析错误信息的函数

### 流式配置

- `format`: 流格式（'sse', 'json-lines', 'raw'）
- `extractChunk`: 提取流式块的函数
- `onDone`: 完成时的回调
- `onError`: 错误时的回调

## 导入/导出配置

### 导出配置

1. 点击"配置代码"标签
2. 点击"导出"按钮
3. 配置会下载为 JSON 文件

### 导入配置

1. 点击"配置代码"标签
2. 点击"导入配置代码"按钮
3. 粘贴配置代码并确认

## 迁移现有配置

如果你已有配置，系统会自动兼容：

- 旧配置会继续工作
- 你可以逐步迁移到新的配置格式
- 通过"高级配置"按钮可以在两种模式间切换

## 故障排除

### 常见问题

1. **配置不生效**
   - 检查 JSON 格式是否正确
   - 确保所有必需字段都已填写
   - 查看浏览器控制台错误信息

2. **API 调用失败**
   - 检查 API 密钥是否正确
   - 确认 API URL 和模型名称
   - 验证请求格式是否符合 API 要求

3. **流式响应不工作**
   - 检查 stream 配置
   - 确认 API 是否支持流式响应
   - 验证响应解析逻辑

### 调试模式

在配置中设置 `global.debug: true` 可以查看详细的请求和响应信息。

## 示例配置文件

参考 `src/lib/ai/config-example.ts` 查看更多示例。