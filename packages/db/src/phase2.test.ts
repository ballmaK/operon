import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import {
  openDatabase,
  closeDatabase,
  buildOperonServices,
  ControlLoopService,
} from './index.js';
import { seedTestFixture } from './test-fixtures.js';

describe('M07/M06/M05 core loop', () => {
  let dataDir: string;
  let db: ReturnType<typeof openDatabase> | undefined;

  afterEach(() => {
    if (db) closeDatabase(db);
    db = undefined;
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
    dataDir = '';
  });

  it('worker spawn validates brief and minimalMemory', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { worker, lead } = buildOperonServices(db, dataDir);
    const tasks = await lead.plan(fx.objectiveId, fx.departmentId);

    expect(() =>
      worker.spawn({
        taskId: tasks[0].id,
        brief: 'x'.repeat(3001),
        minimalMemory: '',
        allowedSkills: ['file_write'],
      }),
    ).toThrow(/3000/);
  });

  it('worker ReAct completes with proof and metrics', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { worker, lead } = buildOperonServices(db, dataDir);
    const tasks = await lead.plan(fx.objectiveId, fx.departmentId);
    const run = worker.spawn({
      taskId: tasks[0].id,
      brief: 'Write proof file',
      minimalMemory: 'ctx',
      allowedSkills: ['file_write'],
    });
    const done = await worker.runReact(run.id);
    expect(done.status).toBe('done');
    expect(done.proof?.type).toBe('file');

    const status = worker.getStatus(run.id);
    expect(status?.metrics?.reactSteps).toBe(2);
    expect(status?.metrics?.llmInputTokens).toBeGreaterThan(0);
  });

  it('lead synthesize appends Memory.md with backup', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { lead } = buildOperonServices(db, dataDir);
    await lead.plan(fx.objectiveId, fx.departmentId);
    await lead.dispatch(
      (await lead.plan(fx.objectiveId, fx.departmentId))[0].id,
      'mem',
    );
    const report = await lead.synthesize(fx.objectiveId, fx.departmentId);
    expect(report.proofs.length).toBeGreaterThan(0);
    await lead.synthesize(fx.objectiveId, fx.departmentId);
    const memPath = join(
      dataDir,
      'companies',
      fx.companyId,
      'memories',
      fx.departmentId,
      'Memory.md',
    );
    expect(existsSync(memPath)).toBe(true);
    expect(existsSync(`${memPath}.bak.1`)).toBe(true);
  });

  it('control loop pauses at decide until owner advances (CL-01)', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { controlLoop } = buildOperonServices(db, dataDir);

    const loop = await controlLoop.start(fx.objectiveId, fx.departmentId);
    expect(loop.status).toBe('waiting_owner');
    expect(loop.phase).toBe('decide');

    await expect(controlLoop.start(fx.objectiveId, fx.departmentId)).rejects.toThrow(/CL-01/);

    const completed = controlLoop.advanceDecide(loop.id);
    expect(completed.status).toBe('completed');
  });

  it('ControlLoopService.nextPhase follows six phases', () => {
    expect(ControlLoopService.nextPhase('understand')).toBe('plan');
    expect(ControlLoopService.nextPhase('decide')).toBeNull();
  });
});
