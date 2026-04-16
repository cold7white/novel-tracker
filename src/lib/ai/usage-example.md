# AI Adapter Usage Examples

## Overview

The new AI adapter system provides a unified interface for calling various AI providers through the adapter pattern. This system supports:

1. **OpenAI Compatible** - OpenAI, DeepSeek, GLM, MiniMax, Moonshot, etc.
2. **Claude (Anthropic)** - Official Claude API
3. **Gemini** - Google Gemini API
4. **Custom HTTP** - Fully customizable API requests

## Basic Usage

### 1. Using the Adapter System

```typescript
import { streamBookInfoWithAdapter, fetchBookInfoWithAdapter } from './lib/ai/service-adapter';

// Configuration object
const config = {
  provider: 'openai-compatible', // or 'claude', 'gemini', 'custom'
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  generation: {
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1,
  },
  input: {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Please help me with this task.' },
    ],
  },
};

// Streaming call
await streamBookInfoWithAdapter(
  config,
  'Book Title',
  'Author Name',
  {
    onChunk: (text) => console.log('Received chunk:', text),
    onDone: () => console.log('Stream completed'),
    onError: (error) => console.error('Stream error:', error),
  }
);

// Non-streaming call
try {
  const result = await fetchBookInfoWithAdapter(
    config,
    'Book Title',
    'Author Name'
  );
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error);
}
```

### 2. Provider-Specific Configuration

#### OpenAI Compatible (OpenAI, DeepSeek, GLM, etc.)
```typescript
const openAIConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  generation: {
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  },
};
```

#### Claude (Anthropic)
```typescript
const claudeConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.anthropic.com/v1',
  model: 'claude-3-5-sonnet-20241218',
  generation: {
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  },
};
```

#### Gemini (Google)
```typescript
const geminiConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-2.0-flash-exp',
  generation: {
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  },
};
```

#### Custom HTTP
```typescript
const customConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://your-custom-api.com',
  model: 'custom-model',
  request_template: {
    url: '{{baseUrl}}/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{apiKey}}',
      'Custom-Header': 'custom-value',
    },
    body: {
      model: '{{model}}',
      messages: '{{messages}}',
      temperature: '{{temperature}}',
      max_tokens: '{{max_tokens}}',
      stream: '{{stream}}',
    },
    content_path: 'choices[0].message.content',
    delta_path: 'choices[0].delta.content',
  },
};
```

## Advanced Features

### 1. Custom Request Templates

For advanced customization, you can define request templates with variable substitution:

```javascript
const customRequestConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com',
  model: 'model-name',
  request_template: {
    url: '{{baseUrl}}/generate',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer {{apiKey}}',
      'X-Custom-Header': '{{model}}',
    },
    body: {
      prompt: '{{prompt}}',
      model: '{{model}}',
      settings: {
        temperature: {{temperature}},
        max_tokens: {{max_tokens}},
      },
    },
    content_path: 'result.text',
    delta_path: 'response.delta.content',
  },
};
```

### 2. Variable Substitution

The template system supports these variables:
- `{{apiKey}}` - Your API key
- `{{baseUrl}}` - Base URL without endpoint
- `{{model}}` - Model name
- `{{temperature}}` - Temperature value
- `{{top_p}}` - Top-p value
- `{{max_tokens}}` - Max tokens value
- `{{stream}}` - Boolean stream flag
- `{{messages}}` - Full messages array (as JSON string)
- `{{prompt}}` - Single prompt string (for backward compatibility)

### 3. Error Handling

```typescript
try {
  await streamBookInfoWithAdapter(
    config,
    'Title',
    'Author',
    {
      onChunk: (text) => console.log(text),
      onDone: () => console.log('Done'),
      onError: (error) => {
        console.error('AI Error:', error);
        // Handle specific error types
        if (error.message.includes('401')) {
          // Invalid API key
        } else if (error.message.includes('429')) {
          // Rate limited
        }
      },
    }
  );
} catch (error) {
  // Handle fetch errors
}
```

### 4. Abortable Requests

```typescript
const controller = new AbortController();
const signal = controller.signal;

// Start request
streamBookInfoWithAdapter(
  config,
  'Title',
  'Author',
  callbacks,
  signal
);

// Cancel after 5 seconds
setTimeout(() => {
  controller.abort();
}, 5000);
```

## Migration from Old System

If you're using the old `service.ts` system, migration is straightforward:

### Old Way:
```typescript
import { streamBookInfo } from './lib/ai/service';
await streamBookInfo(title, author, callbacks);
```

### New Way:
```typescript
import { streamBookInfoWithAdapter } from './lib/ai/service-adapter';
const config = getFullAISettings(); // Load from localStorage
await streamBookInfoWithAdapter(config, title, author, callbacks);
```

The new system provides more flexibility and better separation of concerns while maintaining compatibility with existing configurations.