import { BaseAdapter } from './base';
import type { AIAdapterConfig, AIMessage, RequestTemplate } from './interface';

export class CustomAdapter extends BaseAdapter {
  buildHeaders(config: AIAdapterConfig): Record<string, string> {
    if (config.request_template) {
      const template = config.request_template as RequestTemplate;
      const headers = { ...template.headers };

      // Replace {{apiKey}} placeholder
      if (headers && headers['Authorization']?.includes('{{apiKey}}')) {
        headers['Authorization'] = headers['Authorization'].replace(
          '{{apiKey}}',
          this.getApiKey(config)
        );
      }

      return headers || {
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
    };
  }

  buildBody(config: AIAdapterConfig, messages: AIMessage[]): any {
    if (!config.request_template) {
      throw new Error('Custom adapter requires request_template configuration');
    }

    const template = config.request_template as RequestTemplate;
    const body = { ...template.body };

    // Prepare replacements
    const replacements: Record<string, any> = {
      apiKey: this.getApiKey(config),
      baseUrl: this.getBaseUrl(config),
      model: config.model,
      temperature: config.temperature,
      top_p: config.top_p,
      max_tokens: config.max_tokens,
      stream: config.stream,
      messages,
      // Also support {{prompt}} for backward compatibility
      prompt: this.extractPromptFromMessages(messages),
    };

    // Stringify and replace placeholders
    let bodyStr = JSON.stringify(body);
    Object.entries(replacements).forEach(([key, value]) => {
      if (value !== undefined) {
        const placeholder = `{{${key}}}`;
        bodyStr = bodyStr.replace(
          new RegExp(placeholder, 'g'),
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      }
    });

    return JSON.parse(bodyStr);
  }

  private extractPromptFromMessages(messages: AIMessage[]): string {
    // For backward compatibility, try to extract the prompt
    const userMessage = messages.find(m => m.role === 'user');
    return userMessage?.content || '';
  }

  async parseResponse(response: Response): Promise<any> {
    // Custom adapter doesn't have access to request_template in response
    // Use default path
    const path = 'text';

    if (response.body) {
      // Check if the response has readable stream
      const data = await response.json();
      return {
        text: this.extractTextFromResponse(data, path),
        done: true,
      };
    }

    // Fallback for non-streaming responses
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return {
        text: this.extractTextFromResponse(data, path),
        done: true,
      };
    } catch {
      // If it's not JSON, return raw text
      return {
        text,
        done: true,
      };
    }
  }

  async parseStreamResponse(response: Response, onChunk: (chunk: string) => void): Promise<void> {
    // Custom adapter doesn't have access to request_template in response
    // Use default path
    const path = '';

    if (response.body) {
      const reader = response.body.getReader();
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
            // Check if it's SSE format (data: {...})
            if (trimmed.startsWith('data: ')) {
              const json = JSON.parse(trimmed.slice(6));
              const chunk = await this.parseStreamChunk(json, path);
              onChunk(chunk);
            } else {
              // Try to parse as JSON directly
              const json = JSON.parse(trimmed);
              const chunk = await this.parseStreamChunk(json, path);
              onChunk(chunk);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}