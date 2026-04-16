// 最简单的配置代码示例
const simpleConfig = {
  version: "1.0.0",
  providers: [{
    "id": "openai",
    "name": "OpenAI",
    "category": "openai-compatible",
    "endpoints": {
      "chat": "https://api.openai.com/v1/chat/completions"
    },
    "defaultModels": ["gpt-4o"],
    "request": {
      "method": "POST",
      "url": "https://api.openai.com/v1/chat/completions",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer {{apiKey}}"
      },
      "body": {
        "model": "{{model}}",
        "messages": [],
        "temperature": 0.7,
        "max_tokens": 4096,
        "stream": true
      }
    },
    "response": {
      "contentType": "json",
      "extractContent": (response) => {
        return response.choices?.[0]?.delta?.content || response.choices?.[0]?.message?.content || "";
      },
      "isError": (response) => {
        return response.error || response.status >= 400;
      }
    },
    "stream": {
      "format": "sse",
      "extractChunk": (chunk) => {
        if (chunk === "data: [DONE]") return "";
        try {
          const json = JSON.parse(chunk.slice(6));
          return json.choices?.[0]?.delta?.content || "";
        } catch {
          return "";
        }
      }
    },
    "auth": {
      "type": "bearer",
      "header": "Authorization"
    }
  }],
  "defaults": {
    "provider": "openai",
    "model": "gpt-4o"
  },
  "global": {
    "timeout": 30000,
    "debug": false
  }
};

console.log("简单配置:", JSON.stringify(simpleConfig, null, 2));