import type { LlmRole, ModelConfig } from '@operon/shared-types';

export const DEFAULT_MODEL_CONFIGS: Array<
  Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>
> = [
  {
    role: 'lead_plan',
    provider: 'openai',
    modelName: 'gpt-4o',
    apiBaseUrl: 'https://api.openai.com/v1',
    temperature: 0.3,
    maxTokens: 8192,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    fallbackProvider: 'deepseek',
    fallbackModelName: 'deepseek-chat',
  },
  {
    role: 'lead_synth',
    provider: 'openai',
    modelName: 'gpt-4o',
    apiBaseUrl: 'https://api.openai.com/v1',
    temperature: 0.3,
    maxTokens: 8192,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    fallbackProvider: 'deepseek',
    fallbackModelName: 'deepseek-chat',
  },
  {
    role: 'worker_code',
    provider: 'openai',
    modelName: 'gpt-4o',
    apiBaseUrl: 'https://api.openai.com/v1',
    temperature: 0.1,
    maxTokens: 8192,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    fallbackProvider: 'ollama',
    fallbackModelName: 'codellama',
  },
  {
    role: 'worker_research',
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    apiBaseUrl: 'https://api.openai.com/v1',
    temperature: 0.1,
    maxTokens: 4096,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    fallbackProvider: 'deepseek',
    fallbackModelName: 'deepseek-chat',
  },
  {
    role: 'worker_default',
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    apiBaseUrl: 'https://api.openai.com/v1',
    temperature: 0.1,
    maxTokens: 4096,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    fallbackProvider: 'ollama',
    fallbackModelName: 'llama3',
  },
];

export function estimateLlmCost(
  inputTokens: number,
  outputTokens: number,
  config: Pick<ModelConfig, 'inputPricePerMillion' | 'outputPricePerMillion'>,
): number {
  return (
    (inputTokens * config.inputPricePerMillion) / 1_000_000 +
    (outputTokens * config.outputPricePerMillion) / 1_000_000
  );
}

export function pickRoleConfig(
  configs: ModelConfig[],
  role: LlmRole,
): ModelConfig {
  const found = configs.find((c) => c.role === role);
  if (!found) throw new Error(`No model config for role: ${role}`);
  return found;
}
