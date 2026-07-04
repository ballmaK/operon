import { describe, expect, it, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CredentialCipher, maskApiKey } from './credential-cipher.js';

describe('CredentialCipher', () => {
  let dataDir: string;

  afterEach(() => {
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('encrypts and decrypts without storing plaintext shape', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-crypto-'));
    const cipher = new CredentialCipher(dataDir);
    const secret = 'sk-test-secret-key-1234';
    const encrypted = cipher.encrypt(secret);
    expect(encrypted).not.toContain(secret);
    expect(cipher.decrypt(encrypted)).toBe(secret);
  });

  it('reuses key file on second instance', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-crypto-'));
    const a = new CredentialCipher(dataDir);
    const payload = a.encrypt('same-key');
    const b = new CredentialCipher(dataDir);
    expect(b.decrypt(payload)).toBe('same-key');
  });
});

describe('maskApiKey', () => {
  it('masks middle and shows last 4 chars', () => {
    expect(maskApiKey('sk-abcdefghijklmnop')).toBe('sk-***mnop');
  });
});
