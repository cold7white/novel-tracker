# AI 配置页面集成指南

## 概述

新的 AI 配置页面 (`AIConfigPageNew.tsx`) 提供了一个现代化的左右布局界面，用于配置和调用各种 AI 服务。

## 页面特点

### 🎨 设计布局
- **左侧**：AI 配置面板（固定宽度 400px）
- **右侧**：Prompt 输入和结果展示区域
- **右下角**：操作按钮（固定定位）

### ✨ 主要功能
1. **Provider 选择**：支持 OpenAI Compatible、Claude、Gemini、Custom
2. **API 配置**：API Key、Base URL、Model
3. **高级设置**：可折叠的面板，包含 temperature、top_p、max_tokens、stream
4. **Prompt 编辑**：System Prompt 和 User Prompt 分开编辑
5. **实时生成**：点击生成按钮后实时显示结果
6. **自动保存**：成功调用后自动保存配置到 localStorage

## 使用方法

### 1. 基础集成

```typescript
import AIConfigPageNew from './components/AIConfigPageNew';

function MyComponent() {
  return (
    <AIConfigPageNew onClose={() => console.log('配置关闭')} />
  );
}
```

### 2. 自定义集成

```typescript
import AIConfigPageNew from './components/AIConfigPageNew';

function CustomAIPage() {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div>
      <button onClick={() => setShowConfig(true)}>
        打开 AI 配置
      </button>
      
      {showConfig && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <AIConfigPageNew
            onClose={() => setShowConfig(false)}
          />
        </div>
      )}
    </div>
  );
}
```

### 3. 模态框集成

```typescript
import { useState } from 'react';
import AIConfigPageNew from './components/AIConfigPageNew';

function App() {
  const [showAIConfig, setShowAIConfig] = useState(false);

  return (
    <div>
      <button 
        className="open-ai-config"
        onClick={() => setShowAIConfig(true)}
      >
        AI 配置
      </button>

      {/* 模态框样式 */}
      {showAIConfig && (
        <div className="modal-overlay" onClick={() => setShowAIConfig(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <AIConfigPageNew onClose={() => setShowAIConfig(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
```

## 数据结构

```typescript
interface AIConfig {
  provider: string;           // 提供商类型
  apiKey: string;            // API 密钥
  baseURL: string;           // API 基础地址
  model: string;             // 模型名称
  temperature: number;       // 温度 (0-2)
  top_p: number;            // Top P (0-1)
  maxTokens: number;        // 最大令牌数
  stream: boolean;          // 是否流式输出
}

interface PromptConfig {
  systemPrompt: string;     // 系统提示
  userPrompt: string;       // 用户提示
}
```

## 样式定制

### 基础样式

```css
/* 覆盖默认样式 */
.ai-config-container {
  height: 100vh;
}

.config-panel {
  width: 450px;  /* 调整宽度 */
}

.prompt-textarea {
  font-size: 16px;  /* 调整字体大小 */
}
```

### 深色主题

```css
/* 深色主题变量 */
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent-color: #2196F3;
}

.ai-config-container {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.config-panel {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
}

.form-select,
.form-input,
.prompt-textarea {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}
```

## 功能扩展

### 1. 添加新的 Provider

在 `AIConfigPageNew.tsx` 中的 `providerPresets` 对象添加新的预设：

```typescript
const providerPresets = {
  'openai-compatible': { ... },
  claude: { ... },
  gemini: { ... },
  custom: { ... },
  // 添加新的提供商
  'your-provider': {
    name: 'Your Provider',
    url: 'https://api.your-provider.com/v1',
    model: 'your-model',
  },
};
```

### 2. 自定义结果展示

创建自定义的结果组件：

```typescript
const CustomResultDisplay = ({ result }: { result: string }) => {
  return (
    <div className="custom-result">
      <div className="result-header">AI 返回结果：</div>
      <div className="result-content">{result}</div>
    </div>
  );
};
```

然后在 `AIConfigPageNew.tsx` 中替换结果展示部分：

```typescript
// 替换原有的 result-section
{result && <CustomResultDisplay result={result} />}
```

### 3. 添加预设模板

```typescript
const promptPresets = {
  'book-summary': {
    system: `你是一位书籍总结助手...`,
    user: `请为《{{书名}}》写一个摘要...`,
  },
  'character-analysis': {
    system: `你是一位角色分析专家...`,
    user: `分析《{{书名}}》中的主角...`,
  },
};

// 在组件中添加预设选择
const [preset, setPreset] = useState('');

const handlePresetChange = (presetKey: string) => {
  setPreset(presetKey);
  if (promptPresets[presetKey]) {
    setPromptConfig(promptPresets[presetKey]);
  }
};
```

## 常见问题

### Q: 如何配置自定义 API？
A: 选择 "Custom" 作为 Provider，然后填写相应的 API Key、Base URL 和 Model。

### Q: 如何保存多个配置？
A: 当前版本使用 localStorage 自动保存。如需多个配置，可以扩展为配置管理器。

### Q: 如何处理大文件或长文本？
A: 可以调整 maxTokens 参数来控制输出长度。

### Q: 如何支持更多模型？
A: 在配置中直接填写模型名称，系统会自动适配到相应的 API。

## 性能优化

### 1. 防抖处理

```typescript
import { useDebouncedCallback } from 'use-debounce';

const saveConfig = useDebouncedCallback(() => {
  localStorage.setItem('ai-config', JSON.stringify(config));
}, 1000);
```

### 2. 分块处理大响应

```typescript
// 在 parseStreamResponse 中分块处理
onChunk: (text) => {
  setResult(prev => {
    const chunkSize = 1000;
    if (prev.length + text.length > chunkSize) {
      return prev.slice(prev.length - chunkSize) + text;
    }
    return prev + text;
  });
}
```

### 3. 错误重试机制

```typescript
const [retryCount, setRetryCount] = useState(0);

const handleCallAI = async () => {
  try {
    await callAIWithRetry(config, 3);
    setRetryCount(0);
  } catch (error) {
    setRetryCount(prev => prev + 1);
    // 显示重试按钮
  }
};
```

这个集成指南提供了完整的使用说明，可以根据实际需求进行调整和扩展。