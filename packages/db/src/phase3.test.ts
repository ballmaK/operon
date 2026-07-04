import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import {
  openDatabase,
  closeDatabase,
  HandoffRepo,
  BlockerRepo,
  RhythmScheduleRepo,
  RhythmReportRepo,
  RhythmService,
  ApprovalRepo,
  DepartmentRepo,
  ObjectiveRepo,
  TranscriptRepo,
  seedTestFixture,
} from './index.js';

describe('M08/M04 phase3', () => {
  let dataDir: string;
  let db: ReturnType<typeof openDatabase> | undefined;

  afterEach(() => {
    if (db) closeDatabase(db);
    db = undefined;
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('handoff lifecycle sent → accepted → replied', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p3-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);

    const depts = new DepartmentRepo(db);
    const mkt = depts.create({ companyId: fx.companyId, name: 'Marketing' });

    const handoffs = new HandoffRepo(db);
    const h = handoffs.create({
      companyId: fx.companyId,
      fromDepartmentId: fx.departmentId,
      toDepartmentId: mkt.id,
      contextSummary: 'Release build ready',
      request: 'Write release notes',
      expectedProofType: 'file',
    });
    expect(h.status).toBe('sent');
    expect(handoffs.countPendingForDepartment(mkt.id)).toBe(1);

    handoffs.updateStatus(h.id, 'accepted');
    const replied = handoffs.updateStatus(h.id, 'replied', 'Notes published');
    expect(replied?.status).toBe('replied');
    expect(handoffs.inboxForDepartment(mkt.id)).toHaveLength(1);
  });

  it('rhythm report generation', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-p3-'));
    db = openDatabase({ dataDir });
    const fx = seedTestFixture(db, dataDir);

    const rhythm = new RhythmService(
      db,
      new RhythmScheduleRepo(db),
      new RhythmReportRepo(db),
      new BlockerRepo(db),
      new ObjectiveRepo(db),
      new DepartmentRepo(db),
      new HandoffRepo(db),
      new ApprovalRepo(db),
      new TranscriptRepo(db),
    );

    new BlockerRepo(db).create({
      companyId: fx.companyId,
      description: 'Waiting on API keys',
      objectiveId: fx.objectiveId,
    });
    new ObjectiveRepo(db).setStatus(fx.objectiveId, 'active');

    const report = rhythm.generateReport(fx.companyId, 'daily');
    expect(report.reportType).toBe('daily');
    expect(report.blockers.length).toBeGreaterThan(0);
  });
});
