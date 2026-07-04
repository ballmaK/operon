import type {
  LlmCompleteRequest,
  LlmCompleteResponse,
  ModelConfig,
} from '@operon/shared-types';
import type { CredentialRepo } from './repos/credential-repo.js';
import type { ModelConfigRepo } from './repos/model-config-repo.js';
import { estimateLlmCost, pickRoleConfig } from './model-defaults.js';

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

  testConnection(role: LlmCompleteRequest['role']): { ok: boolean; message: string; config: ModelConfig } {
    const config = this.resolveConfig(role);
    this.assertCredential(config);
    return {
      ok: true,
      message: config.provider === 'ollama' ? 'Ollama localhost reachable (stub)' : 'Credential present',
      config,
    };
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
}
