import { BaseAdapter } from './base';
import { AIAdapterConfig, AIMessage, RequestTemplate } from './interface';

export class ClaudeAdapter extends BaseAdapter {
  buildHeaders(config: AIAdapterConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.getApiKey(config),
      'anthropic-version': '2023-06-01',
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

    // Standard Claude format
    return {
      model: config.model,
      max_tokens: config.max_tokens || 4096,
      messages,
      stream: config.stream,
      temperature: config.temperature,
    };
  }

  async parseResponse(response: Response): Promise<any> {
    const data = await response.json();
    return {
      text: this.extractTextFromResponse(data),
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
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.delta?.text || json.content?.[0]?.text;
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