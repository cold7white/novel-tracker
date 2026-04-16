import { AIAdapter } from './interface';
import { OpenAIAdapter } from './openai';
import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini';
import { CustomAdapter } from './custom';
import { AIAdapterConfig } from './interface';

export enum ProviderType {
  OpenAICompatible = 'openai-compatible',
  Claude = 'claude',
  Gemini = 'gemini',
  Custom = 'custom',
}

export function getAdapter(config: AIAdapterConfig): AIAdapter {
  const { baseUrl, model } = config;

  // Determine provider type
  if (!baseUrl) {
    throw new Error('baseUrl is required');
  }

  // Check for custom template first
  if (config.request_template) {
    return new CustomAdapter();
  }

  // Check for Claude
  if (baseUrl.includes('api.anthropic.com') ||
      (model && (model.includes('claude') || model.toLowerCase().startsWith('claude-')))) {
    return new ClaudeAdapter();
  }

  // Check for Gemini
  if (baseUrl.includes('generativelanguage.googleapis.com') ||
      (model && (model.includes('gemini') || model.toLowerCase().startsWith('gemini-')))) {
    return new GeminiAdapter();
  }

  // Default to OpenAI compatible
  return new OpenAIAdapter();
}

export function getProviderType(baseUrl: string, model?: string): ProviderType {
  if (!baseUrl) {
    return ProviderType.Custom;
  }

  // Check for custom template
  // Note: This is checked outside the factory since it requires the full config

  // Check for Claude
  if (baseUrl.includes('api.anthropic.com') ||
      (model && (model.includes('claude') || model.toLowerCase().startsWith('claude-')))) {
    return ProviderType.Claude;
  }

  // Check for Gemini
  if (baseUrl.includes('generativelanguage.googleapis.com') ||
      (model && (model.includes('gemini') || model.toLowerCase().startsWith('gemini-')))) {
    return ProviderType.Gemini;
  }

  // Default to OpenAI compatible
  return ProviderType.OpenAICompatible;
}