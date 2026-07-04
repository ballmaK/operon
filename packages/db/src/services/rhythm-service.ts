import type { RhythmReport, RhythmReportType } from '@operon/shared-types';
import type { ApprovalRepo } from '../repos/approval-repo.js';
import type { BlockerRepo } from '../repos/blocker-repo.js';
import type { DepartmentRepo } from '../repos/department-repo.js';
import type { ObjectiveRepo } from '../repos/objective-repo.js';
import { listProofsForCompany } from '../proof-query.js';
import type Database from 'better-sqlite3';
import type { RhythmReportRepo } from '../repos/rhythm-repo.js';
import type { HandoffRepo } from '../repos/handoff-repo.js';
import type { TranscriptRepo } from '../repos/transcript-repo.js';

export class RhythmService {
  constructor(
    private readonly db: Database.Database,
    private readonly schedules: { get: (companyId: string) => unknown },
    private readonly reports: RhythmReportRepo,
    private readonly blockers: BlockerRepo,
    private readonly objectives: ObjectiveRepo,
    private readonly departments: DepartmentRepo,
    private readonly handoffs: HandoffRepo,
    private readonly approvals: ApprovalRepo,
    private readonly transcripts: TranscriptRepo,
  ) {}

  generateReport(companyId: string, reportType: RhythmReportType): RhythmReport {
    const openBlockers = this.blockers.listOpenForActiveObjectives(companyId);
    const pendingApprovals = this.approvals.list('pending');
    const proofs = listProofsForCompany(this.db, companyId);
    const activeObjectives = this.objectives
      .listByCompany(companyId)
      .filter((o) => o.status === 'active' || o.status === 'blocked');

    const departmentsWaiting = this.departments
      .listByCompany(companyId)
      .filter((d) => this.handoffs.countPendingForDepartment(d.id) > 0)
      .map((d) => d.name);

    const objectiveSummaries = activeObjectives.map((o) => ({
      objectiveId: o.id,
      title: o.title,
      status: o.status,
      summary: `${o.title} — ${o.status}${o.constraints ? ` (${o.constraints.slice(0, 80)})` : ''}`,
    }));

    const report = this.reports.create({
      companyId,
      reportType,
      blockers: openBlockers.map((b) => ({
        id: b.id,
        description: b.description,
        departmentId: b.departmentId,
      })),
      pendingDecisionsCount: pendingApprovals.length,
      proofsDeliveredCount: proofs.length,
      departmentsWaiting,
      objectiveSummaries,
    });

    this.transcripts.append({
      companyId,
      actor: 'system',
      actionType: 'synthesis',
      payload: {
        action: 'rhythm_report',
        reportType,
        reportId: report.id,
        pendingDecisions: report.pendingDecisionsCount,
      },
      relatedEntity: { type: 'rhythm_report', id: report.id },
    });

    return report;
  }
}

/** MVP in-process tick: check daily time match (called from sidecar on interval) */
export function shouldRunDailyReview(
  schedule: { dailyTime: string; timezone?: string },
  now = new Date(),
): boolean {
  const [hh, mm] = schedule.dailyTime.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
  return now.getHours() === hh && now.getMinutes() === mm;
}

export function shouldRunWeeklyReview(
  schedule: { weeklyDay: string; dailyTime: string; timezone?: string },
  now = new Date(),
): boolean {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[now.getDay()];
  return today === schedule.weeklyDay && shouldRunDailyReview(schedule, now);
}
