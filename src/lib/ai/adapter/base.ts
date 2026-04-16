import type { AIAdapter, AIAdapterConfig, AIResponse } from './interface';

export abstract class BaseAdapter implements AIAdapter {
  abstract buildHeaders(config: AIAdapterConfig): Record<string, string>;
  abstract buildBody(config: AIAdapterConfig, messages: any[]): any;
  abstract parseResponse(response: Response): Promise<AIResponse>;
  abstract parseStreamResponse(response: Response, onChunk: (chunk: string) => void): Promise<void>;

  protected getApiKey(config: AIAdapterConfig): string {
    return config.apiKey;
  }

  protected getBaseUrl(config: AIAdapterConfig): string {
    return config.baseUrl;
  }

  protected extractTextFromResponse(data: any, path: string = ''): string {
    if (!path) return data.content || data.text || '';

    const keys = path.split('.');
    let current = data;

    for (const key of keys) {
      if (key.includes('[') && key.includes(']')) {
        // Handle array indices like 'choices[0]'
        const match = key.match(/(\w+)\[(\d+)\]/);
        if (match) {
          const [, arrayKey, index] = match;
          current = current[arrayKey]?.[parseInt(index)];
        } else {
          return '';
        }
      } else {
        current = current[key];
      }

      if (current === undefined) return '';
    }

    return current?.content || current?.text || '';
  }

  protected async parseStreamChunk(data: any, path: string = ''): Promise<string> {
    if (!path) {
      return data.content || data.text || '';
    }

    return this.extractTextFromResponse(data, path);
  }
}