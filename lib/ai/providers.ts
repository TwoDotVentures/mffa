import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export type AIProvider = 'anthropic' | 'openai' | 'google' | 'groq' | 'ollama';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  bestFor: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  // Anthropic
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', bestFor: 'Complex reasoning, nuance' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', bestFor: 'Complex reasoning, nuance' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic', bestFor: 'Balanced performance' },

  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', bestFor: 'Balanced cost/quality' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', bestFor: 'Fast and affordable' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', bestFor: 'Complex tasks' },

  // Google
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', bestFor: 'Speed, low cost' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', provider: 'google', bestFor: 'Long context' },

  // Groq (using OpenAI-compatible API)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', bestFor: 'Ultra-fast inference' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'groq', bestFor: 'Fast inference' },
];

export function getModelsForProvider(provider: AIProvider): AIModel[] {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
}

export function getDefaultModelForProvider(provider: AIProvider): string {
  const models = getModelsForProvider(provider);
  return models[0]?.id || '';
}

export interface ModelConfig {
  provider: AIProvider;
  modelId: string;
  apiKey?: string;
  temperature?: number;
}

/**
 * Get the AI SDK model instance based on provider and model ID.
 * API keys can be provided directly or via environment variables.
 */
export function getModel(config: ModelConfig) {
  const { provider, modelId, apiKey } = config;

  switch (provider) {
    case 'anthropic': {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('Anthropic API key not configured');
      // In AI SDK v6, the API key is set via environment variable ANTHROPIC_API_KEY
      process.env.ANTHROPIC_API_KEY = key;
      return anthropic(modelId);
    }

    case 'openai': {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OpenAI API key not configured');
      process.env.OPENAI_API_KEY = key;
      return openai(modelId);
    }

    case 'google': {
      const key = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!key) throw new Error('Google AI API key not configured');
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
      return google(modelId);
    }

    case 'groq': {
      // Groq uses OpenAI-compatible API
      const key = apiKey || process.env.GROQ_API_KEY;
      if (!key) throw new Error('Groq API key not configured');
      // For Groq we need to create a custom provider instance
      process.env.OPENAI_API_KEY = key;
      return openai(modelId);
    }

    case 'ollama': {
      // Ollama uses OpenAI-compatible API locally
      return openai(modelId);
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google AI',
  groq: 'Groq',
  ollama: 'Ollama (Local)',
};
