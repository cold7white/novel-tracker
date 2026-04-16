import { BaseAdapter } from './base';
import { AIAdapterConfig, AIMessage, RequestTemplate } from './interface';

export class OpenAIAdapter extends BaseAdapter {
  buildHeaders(config: AIAdapterConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getApiKey(config)}`,
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
        top_p: config.top_p,
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

    // Standard OpenAI format
    return {
      model: config.model,
      messages,
      stream: config.stream,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens,
      top_p: config.top_p ?? 1,
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
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch {
          // 忽略解析错误的行
        }
      }
    }
  }
}