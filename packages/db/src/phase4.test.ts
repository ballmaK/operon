import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import {
  openDatabase,
  closeDatabase,
  KeyResultRepo,
  ProofAcceptanceRepo,
  SandboxManager,
  ObjectiveRepo,
  buildOperonServices,
} from './index.js';
import { seedTestFixture } from './test-fixtures.js';
import { listProofsForCompany } from './proof-query.js';

describe('Phase 4 — OKR, proof acceptance, sandbox', () => {
  let dataDir: string;
  let db: ReturnType<typeof openDatabase> | undefined;

  afterEach(() => {
    if (db) closeDatabase(db);
    db = undefined;
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('KeyResult CRUD and rollup', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p4-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const krs = new KeyResultRepo(db);
    const kr = krs.create(fx.objectiveId, fx.companyId, { title: 'Ship 3 proofs', targetValue: 3 });
    expect(kr.status).toBe('open');
    krs.rollupFromProofs(fx.objectiveId, 3);
    const updated = krs.findById(kr.id)!;
    expect(updated.currentValue).toBe(3);
    expect(updated.status).toBe('completed');
  });

  it('proof acceptance filter', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p4-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    new ObjectiveRepo(db).setStatus(fx.objectiveId, 'active');
    const { controlLoop } = buildOperonServices(db, dataDir);
    controlLoop.start(fx.objectiveId, fx.departmentId);

    const proofs = listProofsForCompany(db, fx.companyId);
    expect(proofs.length).toBeGreaterThan(0);
    const acceptance = new ProofAcceptanceRepo(db);
    acceptance.set(proofs[0].workerRunId, 'accepted');
    expect(listProofsForCompany(db, fx.companyId, { acceptanceStatus: 'accepted' })).toHaveLength(1);
  });

  it('sandbox playwright and docker stubs', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p4-'));
    const sandbox = new SandboxManager(dataDir);
    const pw = sandbox.create({ runtimeType: 'playwright', agentRunId: 'run-1' });
    const shot = sandbox.invokeBrowserScreenshot(pw.id, { url: 'https://example.com' });
    expect(shot.screenshotPath).toBe('screenshot.png');

    const dk = sandbox.create({ runtimeType: 'docker', agentRunId: 'run-2' }, true);
    const out = sandbox.invokeCodeRun(dk.id, { code: 'echo hi' });
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('docker-stub');
  });
});
