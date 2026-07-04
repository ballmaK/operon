import { describe, expect, it, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase, closeDatabase } from './database.js';
import {
  ModelConfigRepo,
  seedDefaultModelConfigs,
  CredentialRepo,
  ModelRouter,
  SandboxManager,
  MVP_SKILLS,
} from './index.js';

describe('M11 model configs', () => {
  let dataDir: string;

  afterEach(() => {
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('seeds five default role configs', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });
    seedDefaultModelConfigs(db);
    const repo = new ModelConfigRepo(db);
    expect(repo.list()).toHaveLength(5);
    expect(repo.getByRole('lead_plan')?.modelName).toBe('gpt-4o');
    closeDatabase(db);
  });

  it('ModelRouter completeStub requires credential (MR-01)', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });
    seedDefaultModelConfigs(db);
    const configs = new ModelConfigRepo(db);
    const credentials = new CredentialRepo(db, dataDir);
    const router = new ModelRouter(configs, credentials);

    expect(() =>
      router.completeStub({
        role: 'worker_default',
        agentRunId: 'run-1',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    ).toThrow(/Missing API credential/);

    credentials.upsert({ provider: 'openai', apiKey: 'sk-test1234567890' });
    const result = router.completeStub({
      role: 'worker_default',
      agentRunId: 'run-1',
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(result.stub).toBe(true);
    expect(result.provider).toBe('openai');
    closeDatabase(db);
  });
});

describe('M10 sandbox', () => {
  let dataDir: string;

  afterEach(() => {
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('registers six MVP skills', () => {
    expect(MVP_SKILLS).toHaveLength(6);
    expect(MVP_SKILLS.some((s) => s.code === 'file_write')).toBe(true);
  });

  it('SandboxManager create/destroy and file_write', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sbx-'));
    const mgr = new SandboxManager(dataDir);
    const session = mgr.create({ runtimeType: 'subprocess', agentRunId: 'run-a' });
    expect(session.status).toBe('SBX_READY');

    const out = mgr.invokeFileWrite(session.id, {
      relativePath: 'notes.txt',
      content: 'proof content',
    });
    expect(out.bytes).toBeGreaterThan(0);

    const abs = join(dataDir, session.workDirRelative, 'notes.txt');
    expect(readFileSync(abs, 'utf8')).toBe('proof content');

    expect(mgr.destroy(session.id)).toBe(true);
    expect(existsSync(abs)).toBe(false);
  });
});
