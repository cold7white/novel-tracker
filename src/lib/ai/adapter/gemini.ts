import { BaseAdapter } from './base';
import { AIAdapterConfig, AIMessage, RequestTemplate } from './interface';

export class GeminiAdapter extends BaseAdapter {
  buildHeaders(config: AIAdapterConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  buildBody(config: AIAdapterConfig, messages: AIMessage[]): any {
    if (config.request_template) {
      // Use custom template
      const template = config.request_template as RequestTemplate;
      const body = { ...template.body };

      // Replace variables
      const replacements = {
        apiKey: this.getApiKey(config),
        baseUrl: this.getBaseUrl(config),
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        stream: config.stream,
        messages,
      };

      // Stringify and replace placeholders
      let bodyStr = JSON.stringify(body);
      Object.entries(replacements).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        if (value !== undefined) {
          bodyStr = bodyStr.replace(
            new RegExp(placeholder, 'g'),
            typeof value === 'string' ? value : JSON.stringify(value)
          );
        }
      });

      return JSON.parse(bodyStr);
    }

    // Convert messages to Gemini format
    // For Gemini, we need to extract the user/system content and combine it
    let userContent = '';
    let systemContent = '';

    messages.forEach((message) => {
      if (message.role === 'system') {
        systemContent += message.content + '\n';
      } else if (message.role === 'user') {
        userContent += message.content + '\n';
      }
    });

    return {
      contents: [{
        parts: [{ text: userContent }]
      }],
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        topP: config.top_p ?? 1,
        maxOutputTokens: config.max_tokens ?? 4096,
        responseMimeType: "text/plain",
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ]
    };
  }

  async parseResponse(response: Response): Promise<any> {
    const data = await response.json();
    return {
      text: this.extractTextFromResponse(data, 'candidates[0].content.parts[0].text'),
      done: true,
    };
  }

  async parseStreamResponse(response: Response, onChunk: (chunk: string) => void): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const json = JSON.parse(trimmed);
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            onChunk(content);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
}