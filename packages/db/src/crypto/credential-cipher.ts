import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const KEY_FILENAME = '.operon-credential-key';

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) return '****';
  return `sk-***${apiKey.slice(-4)}`;
}

export class CredentialCipher {
  private readonly key: Buffer;

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    const keyPath = join(dataDir, KEY_FILENAME);
    if (existsSync(keyPath)) {
      this.key = readFileSync(keyPath);
    } else {
      const salt = randomBytes(16);
      this.key = scryptSync('operon-local', salt, 32);
      writeFileSync(keyPath, this.key, { mode: 0o600 });
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split(':');
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error('Invalid ciphertext format');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return decipher.update(dataB64, 'base64', 'utf8') + decipher.final('utf8');
  }
}
