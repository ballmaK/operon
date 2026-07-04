import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import {
  openDatabase,
  closeDatabase,
  buildOperonServices,
  ModelRouter,
  ModelConfigRepo,
  CredentialRepo,
  ApprovalRepo,
  SandboxManager,
  seedDefaultModelConfigs,
} from './index.js';
import { seedTestFixture } from './test-fixtures.js';

describe('Phase 5 — real runtime stubs', () => {
  let dataDir: string;
  let db: ReturnType<typeof openDatabase> | undefined;

  afterEach(() => {
    if (db) closeDatabase(db);
    db = undefined;
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('ModelRouter.complete returns stub with usage', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p5-'));
    db = openDatabase({ dataDir });
    seedDefaultModelConfigs(db);
    const credentials = new CredentialRepo(db, dataDir);
    credentials.upsert({ provider: 'openai', apiKey: 'sk-test1234567890' });
    const router = new ModelRouter(new ModelConfigRepo(db), credentials);

    const res = await router.complete({
      role: 'worker_default',
      agentRunId: 'run-1',
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(res.stub).toBe(true);
    expect(res.inputTokens).toBeGreaterThan(0);
    expect(res.content).toContain('hello');
  });

  it('high-risk skill requires approval', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p5-'));
    db = openDatabase({ dataDir });
    const approvals = new ApprovalRepo(db);
    expect(approvals.findApprovedSkillInvoke('agent-1')).toBeNull();
    const pending = approvals.create({
      actionType: 'skill_invoke',
      taskId: 'agent-1',
      summary: 'code_run',
    });
    expect(approvals.findPendingSkillInvoke('agent-1')?.id).toBe(pending.id);
    approvals.approve(pending.id);
    expect(approvals.findApprovedSkillInvoke('agent-1')?.status).toBe('approved');
  });

  it('control loop advance completes decide phase', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p5-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { controlLoop } = buildOperonServices(db, dataDir);
    const loop = await controlLoop.start(fx.objectiveId, fx.departmentId);
    expect(loop.waitReason).toMatch(/Owner decision/);
    const done = controlLoop.advanceDecide(loop.id);
    expect(done.status).toBe('completed');
  });

  it('playwright screenshot uses stub in test env', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p5-'));
    const sandbox = new SandboxManager(dataDir);
    const session = sandbox.create({ runtimeType: 'playwright', agentRunId: 'pw-1' });
    const shot = await sandbox.invokeBrowserScreenshot(session.id, { url: 'https://example.com' });
    expect(shot.usedPlaywright).toBe(false);
    expect(shot.screenshotPath).toBe('screenshot.png');
  });
});
