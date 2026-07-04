import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import {
  openDatabase,
  closeDatabase,
  buildOperonServices,
  ControlLoopService,
  ControlLoopRepo,
  seedTestFixture,
} from './index.js';

describe('M07/M06/M05 core loop', () => {
  let dataDir: string;
  let db: ReturnType<typeof openDatabase> | undefined;

  afterEach(() => {
    if (db) closeDatabase(db);
    db = undefined;
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
    dataDir = '';
  });

  it('worker spawn validates brief and minimalMemory', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { worker, lead } = buildOperonServices(db, dataDir);
    const tasks = lead.plan(fx.objectiveId, fx.departmentId);

    expect(() =>
      worker.spawn({
        taskId: tasks[0].id,
        brief: 'x'.repeat(3001),
        minimalMemory: '',
        allowedSkills: ['file_write'],
      }),
    ).toThrow(/3000/);
  });

  it('worker ReAct stub completes with proof', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { worker, lead } = buildOperonServices(db, dataDir);
    const tasks = lead.plan(fx.objectiveId, fx.departmentId);
    const run = worker.spawn({
      taskId: tasks[0].id,
      brief: 'Write proof file',
      minimalMemory: 'ctx',
      allowedSkills: ['file_write'],
    });
    const done = worker.runReactStub(run.id);
    expect(done.status).toBe('done');
    expect(done.proof?.type).toBe('file');
  });

  it('lead synthesize appends Memory.md with backup', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { lead } = buildOperonServices(db, dataDir);
    lead.plan(fx.objectiveId, fx.departmentId);
    lead.dispatch(
      lead.plan(fx.objectiveId, fx.departmentId)[0].id,
      'mem',
    );
    const report = lead.synthesize(fx.objectiveId, fx.departmentId);
    expect(report.proofs.length).toBeGreaterThan(0);
    lead.synthesize(fx.objectiveId, fx.departmentId);
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

  it('control loop runs phases and completes (CL-01)', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-loop-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);
    const { controlLoop } = buildOperonServices(db, dataDir);

    const loop = controlLoop.start(fx.objectiveId, fx.departmentId);
    expect(loop.status).toBe('completed');
    expect(loop.phase).toBe('decide');

    const loops = new ControlLoopRepo(db);
    loops.create(fx.objectiveId, fx.companyId);
    expect(() => controlLoop.start(fx.objectiveId, fx.departmentId)).toThrow(/CL-01/);
  });

  it('ControlLoopService.nextPhase follows six phases', () => {
    expect(ControlLoopService.nextPhase('understand')).toBe('plan');
    expect(ControlLoopService.nextPhase('decide')).toBeNull();
  });
});
