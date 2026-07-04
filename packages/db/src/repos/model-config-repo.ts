import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { LlmRole, ModelConfig } from '@operon/shared-types';
import { DEFAULT_MODEL_CONFIGS } from '../model-defaults.js';

export class ModelConfigRepo {
  constructor(private readonly db: Database.Database) {}

  list(): ModelConfig[] {
    return this.db
      .prepare(
        `SELECT id, role, provider, model_name AS modelName, api_base_url AS apiBaseUrl,
                temperature, max_tokens AS maxTokens,
                input_price_per_million AS inputPricePerMillion,
                output_price_per_million AS outputPricePerMillion,
                fallback_provider AS fallbackProvider,
                fallback_model_name AS fallbackModelName,
                created_at AS createdAt, updated_at AS updatedAt
         FROM model_configs ORDER BY role`,
      )
      .all() as ModelConfig[];
  }

  getByRole(role: LlmRole): ModelConfig | null {
    const row = this.db
      .prepare(
        `SELECT id, role, provider, model_name AS modelName, api_base_url AS apiBaseUrl,
                temperature, max_tokens AS maxTokens,
                input_price_per_million AS inputPricePerMillion,
                output_price_per_million AS outputPricePerMillion,
                fallback_provider AS fallbackProvider,
                fallback_model_name AS fallbackModelName,
                created_at AS createdAt, updated_at AS updatedAt
         FROM model_configs WHERE role = ?`,
      )
      .get(role) as ModelConfig | undefined;
    return row ?? null;
  }
}

export function seedDefaultModelConfigs(db: Database.Database): void {
  const count = db
    .prepare(`SELECT COUNT(*) AS c FROM model_configs`)
    .get() as { c: number };
  if (count.c > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO model_configs
     (id, role, provider, model_name, api_base_url, temperature, max_tokens,
      input_price_per_million, output_price_per_million,
      fallback_provider, fallback_model_name, created_at, updated_at)
     VALUES (@id, @role, @provider, @modelName, @apiBaseUrl, @temperature, @maxTokens,
             @inputPricePerMillion, @outputPricePerMillion,
             @fallbackProvider, @fallbackModelName, @createdAt, @updatedAt)`,
  );

  for (const cfg of DEFAULT_MODEL_CONFIGS) {
    insert.run({ id: randomUUID(), ...cfg, createdAt: now, updatedAt: now });
  }
}
