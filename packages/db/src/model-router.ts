import type {
  LlmCompleteRequest,
  LlmCompleteResponse,
  ModelConfig,
} from '@operon/shared-types';
import type { CredentialRepo } from './repos/credential-repo.js';
import type { ModelConfigRepo } from './repos/model-config-repo.js';
import { estimateLlmCost } from './model-defaults.js';
import { callOllama, callOpenAiCompatible, pingOllama } from './llm-client.js';

export class ModelRouter {
  constructor(
    private readonly configs: ModelConfigRepo,
    private readonly credentials: CredentialRepo,
  ) {}

  resolveConfig(role: LlmCompleteRequest['role']): ModelConfig {
    const config = this.configs.getByRole(role);
    if (!config) throw new Error(`Model config missing for role: ${role}`);
    return config;
  }

  assertCredential(config: ModelConfig): void {
    if (config.provider === 'ollama') return;
    const key = this.credentials.getDecrypted(config.provider);
    if (!key) {
      throw new Error(`Missing API credential for provider: ${config.provider}`);
    }
  }

  async testConnection(role: LlmCompleteRequest['role']): Promise<{ ok: boolean; message: string; config: ModelConfig }> {
    const config = this.resolveConfig(role);
    if (config.provider === 'ollama') {
      const ok = await pingOllama(config.apiBaseUrl);
      return {
        ok,
        message: ok ? 'Ollama reachable' : 'Ollama not reachable at localhost:11434',
        config,
      };
    }
    this.assertCredential(config);
    return { ok: true, message: 'Credential present', config };
  }

  completeStub(request: LlmCompleteRequest): LlmCompleteResponse {
    const config = this.resolveConfig(request.role);
    this.assertCredential(config);

    const inputText = request.messages.map((m) => m.content).join('\n');
    const inputTokens = Math.max(1, Math.ceil(inputText.length / 4));
    const outputTokens = 32;
    const content = `[stub:${config.modelName}] ${request.messages.at(-1)?.content ?? ''}`;

    return {
      role: request.role,
      provider: config.provider,
      modelName: config.modelName,
      content,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateLlmCost(inputTokens, outputTokens, config),
      stub: true,
    };
  }

  /** Real HTTP when credentials/network available; stub fallback in tests or on error */
  async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
    if (process.env.OPERON_LLM_STUB === '1') {
      return this.completeStub(request);
    }

    const config = this.resolveConfig(request.role);

    try {
      if (config.provider === 'ollama') {
        const ok = await pingOllama(config.apiBaseUrl);
        if (!ok) return this.completeStub(request);
        return await callOllama(config, request);
      }

      this.assertCredential(config);
      const apiKey = this.credentials.getDecrypted(config.provider)!;
      return await callOpenAiCompatible(config, apiKey, request);
    } catch {
      return this.completeStub(request);
    }
  }
}
