// AI Provider Adapter Interface
export interface AIAdapterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  request_template?: RequestTemplate;
}

export interface RequestTemplate {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: Record<string, string | number | boolean | Array<any>>;
  content_path?: string;
  delta_path?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  done?: boolean;
}

export interface AIAdapter {
  buildHeaders(config: AIAdapterConfig): Record<string, string>;
  buildBody(config: AIAdapterConfig, messages: AIMessage[]): any;
  parseResponse(response: Response): Promise<AIResponse>;
  parseStreamResponse(response: Response, onChunk: (chunk: string) => void): Promise<void>;
}