import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { ApiCredentialView, UpsertCredentialRequest } from '@operon/shared-types';
import { CredentialCipher, maskApiKey } from '../crypto/credential-cipher.js';

export class CredentialRepo {
  private readonly cipher: CredentialCipher;

  constructor(
    private readonly db: Database.Database,
    dataDir: string,
  ) {
    this.cipher = new CredentialCipher(dataDir);
  }

  list(): ApiCredentialView[] {
    return this.db
      .prepare(
        `SELECT id, provider, masked_key AS maskedKey, created_at AS createdAt, updated_at AS updatedAt
         FROM api_credentials ORDER BY provider`,
      )
      .all() as ApiCredentialView[];
  }

  upsert(input: UpsertCredentialRequest): ApiCredentialView {
    const now = new Date().toISOString();
    const existing = this.db
      .prepare(`SELECT id FROM api_credentials WHERE provider = ?`)
      .get(input.provider) as { id: string } | undefined;

    const ciphertext = this.cipher.encrypt(input.apiKey);
    const maskedKey = maskApiKey(input.apiKey);

    if (existing) {
      this.db
        .prepare(
          `UPDATE api_credentials
           SET ciphertext = @ciphertext, masked_key = @maskedKey, updated_at = @now
           WHERE provider = @provider`,
        )
        .run({
          provider: input.provider,
          ciphertext,
          maskedKey,
          now,
        });
      return this.db
        .prepare(
          `SELECT id, provider, masked_key AS maskedKey, created_at AS createdAt, updated_at AS updatedAt
           FROM api_credentials WHERE provider = ?`,
        )
        .get(input.provider) as ApiCredentialView;
    }

    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO api_credentials (id, provider, ciphertext, masked_key, created_at, updated_at)
         VALUES (@id, @provider, @ciphertext, @maskedKey, @createdAt, @updatedAt)`,
      )
      .run({
        id,
        provider: input.provider,
        ciphertext,
        maskedKey,
        createdAt: now,
        updatedAt: now,
      });

    return {
      id,
      provider: input.provider,
      maskedKey,
      createdAt: now,
      updatedAt: now,
    };
  }

  getDecrypted(provider: string): string | null {
    const row = this.db
      .prepare(`SELECT ciphertext FROM api_credentials WHERE provider = ?`)
      .get(provider) as { ciphertext: string } | undefined;
    if (!row) return null;
    return this.cipher.decrypt(row.ciphertext);
  }
}
