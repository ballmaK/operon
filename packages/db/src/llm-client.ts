import type { LlmCompleteRequest, LlmCompleteResponse, ModelConfig } from '@operon/shared-types';
import { estimateLlmCost } from './model-defaults.js';

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function callOpenAiCompatible(
  config: ModelConfig,
  apiKey: string,
  request: LlmCompleteRequest,
): Promise<LlmCompleteResponse> {
  const base = (config.apiBaseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: request.messages,
      temperature: config.temperature,
      max_tokens: Math.min(config.maxTokens, 4096),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = body.choices?.[0]?.message?.content ?? '';
  const inputTokens = body.usage?.prompt_tokens ?? estimateTokens(request.messages.map((m) => m.content).join('\n'));
  const outputTokens = body.usage?.completion_tokens ?? estimateTokens(content);

  return {
    role: request.role,
    provider: config.provider,
    modelName: config.modelName,
    content,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateLlmCost(inputTokens, outputTokens, config),
    stub: false,
  };
}

export async function callOllama(
  config: ModelConfig,
  request: LlmCompleteRequest,
): Promise<LlmCompleteResponse> {
  const base = (config.apiBaseUrl ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.modelName,
      messages: request.messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama HTTP ${res.status}`);
  }

  const body = (await res.json()) as { message?: { content?: string } };
  const content = body.message?.content ?? '';
  const inputTokens = estimateTokens(request.messages.map((m) => m.content).join('\n'));
  const outputTokens = estimateTokens(content);

  return {
    role: request.role,
    provider: 'ollama',
    modelName: config.modelName,
    content,
    inputTokens,
    outputTokens,
    estimatedCostUsd: 0,
    stub: false,
  };
}

export async function pingOllama(apiBaseUrl?: string | null): Promise<boolean> {
  const base = (apiBaseUrl ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
