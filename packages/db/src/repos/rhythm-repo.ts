import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { RhythmReport, RhythmReportType, RhythmSchedule, WeeklyDay } from '@operon/shared-types';

export class RhythmScheduleRepo {
  constructor(private readonly db: Database.Database) {}

  get(companyId: string): RhythmSchedule {
    const row = this.db
      .prepare(`SELECT * FROM rhythm_schedules WHERE company_id = ?`)
      .get(companyId) as ScheduleRow | undefined;
    if (row) return this.mapSchedule(row);

    const now = new Date().toISOString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const schedule: RhythmSchedule = {
      companyId,
      dailyTime: '09:00',
      weeklyDay: 'mon',
      timezone: tz,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO rhythm_schedules (company_id, daily_time, weekly_day, timezone, updated_at)
         VALUES (@companyId, @dailyTime, @weeklyDay, @timezone, @updatedAt)`,
      )
      .run(schedule);
    return schedule;
  }

  upsert(input: Partial<RhythmSchedule> & { companyId: string }): RhythmSchedule {
    const existing = this.get(input.companyId);
    const updated: RhythmSchedule = {
      companyId: input.companyId,
      dailyTime: input.dailyTime ?? existing.dailyTime,
      weeklyDay: input.weeklyDay ?? existing.weeklyDay,
      timezone: input.timezone ?? existing.timezone,
      updatedAt: new Date().toISOString(),
    };
    this.db
      .prepare(
        `UPDATE rhythm_schedules SET daily_time = ?, weekly_day = ?, timezone = ?, updated_at = ?
         WHERE company_id = ?`,
      )
      .run(updated.dailyTime, updated.weeklyDay, updated.timezone, updated.updatedAt, updated.companyId);
    return updated;
  }

  private mapSchedule(row: ScheduleRow): RhythmSchedule {
    return {
      companyId: row.company_id,
      dailyTime: row.daily_time,
      weeklyDay: row.weekly_day as WeeklyDay,
      timezone: row.timezone,
      updatedAt: row.updated_at,
    };
  }
}

export class RhythmReportRepo {
  constructor(private readonly db: Database.Database) {}

  create(report: Omit<RhythmReport, 'id' | 'createdAt'>): RhythmReport {
    const now = new Date().toISOString();
    const full: RhythmReport = { ...report, id: randomUUID(), createdAt: now };
    this.db
      .prepare(
        `INSERT INTO rhythm_reports
         (id, company_id, report_type, blockers_json, pending_decisions_count,
          proofs_delivered_count, departments_waiting_json, objective_summaries_json, created_at)
         VALUES (@id, @companyId, @reportType, @blockersJson, @pendingDecisionsCount,
                 @proofsDeliveredCount, @departmentsWaitingJson, @objectiveSummariesJson, @createdAt)`,
      )
      .run({
        id: full.id,
        companyId: full.companyId,
        reportType: full.reportType,
        blockersJson: JSON.stringify(full.blockers),
        pendingDecisionsCount: full.pendingDecisionsCount,
        proofsDeliveredCount: full.proofsDeliveredCount,
        departmentsWaitingJson: JSON.stringify(full.departmentsWaiting),
        objectiveSummariesJson: JSON.stringify(full.objectiveSummaries),
        createdAt: full.createdAt,
      });
    return full;
  }

  list(companyId: string, limit = 20): RhythmReport[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM rhythm_reports WHERE company_id = ?
         ORDER BY created_at DESC LIMIT ?`,
      )
      .all(companyId, limit) as ReportRow[];
    return rows.map((r) => this.mapReport(r));
  }

  latest(companyId: string, reportType?: RhythmReportType): RhythmReport | null {
    const row = reportType
      ? (this.db
          .prepare(
            `SELECT * FROM rhythm_reports WHERE company_id = ? AND report_type = ?
             ORDER BY created_at DESC LIMIT 1`,
          )
          .get(companyId, reportType) as ReportRow | undefined)
      : (this.db
          .prepare(
            `SELECT * FROM rhythm_reports WHERE company_id = ?
             ORDER BY created_at DESC LIMIT 1`,
          )
          .get(companyId) as ReportRow | undefined);
    return row ? this.mapReport(row) : null;
  }

  private mapReport(row: ReportRow): RhythmReport {
    return {
      id: row.id,
      companyId: row.company_id,
      reportType: row.report_type as RhythmReportType,
      blockers: JSON.parse(row.blockers_json),
      pendingDecisionsCount: row.pending_decisions_count,
      proofsDeliveredCount: row.proofs_delivered_count,
      departmentsWaiting: JSON.parse(row.departments_waiting_json),
      objectiveSummaries: JSON.parse(row.objective_summaries_json),
      createdAt: row.created_at,
    };
  }
}

interface ScheduleRow {
  company_id: string;
  daily_time: string;
  weekly_day: string;
  timezone: string;
  updated_at: string;
}

interface ReportRow {
  id: string;
  company_id: string;
  report_type: string;
  blockers_json: string;
  pending_decisions_count: number;
  proofs_delivered_count: number;
  departments_waiting_json: string;
  objective_summaries_json: string;
  created_at: string;
}
