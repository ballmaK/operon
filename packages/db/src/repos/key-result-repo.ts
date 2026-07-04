import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { CreateKeyResultRequest, KeyResult, KeyResultStatus } from '@operon/shared-types';

export class KeyResultRepo {
  constructor(private readonly db: Database.Database) {}

  listByObjective(objectiveId: string): KeyResult[] {
    const rows = this.db
      .prepare(
        `SELECT id, objective_id AS objectiveId, company_id AS companyId, title,
                target_value AS targetValue, current_value AS currentValue, unit,
                status, created_at AS createdAt, updated_at AS updatedAt
         FROM key_results WHERE objective_id = ? ORDER BY created_at ASC`,
      )
      .all(objectiveId) as KeyResult[];
    return rows;
  }

  create(objectiveId: string, companyId: string, input: CreateKeyResultRequest): KeyResult {
    const now = new Date().toISOString();
    const kr: KeyResult = {
      id: randomUUID(),
      objectiveId,
      companyId,
      title: input.title.trim().slice(0, 200),
      targetValue: input.targetValue ?? null,
      currentValue: 0,
      unit: input.unit?.trim() ?? null,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO key_results
         (id, objective_id, company_id, title, target_value, current_value, unit, status, created_at, updated_at)
         VALUES (@id, @objectiveId, @companyId, @title, @targetValue, @currentValue, @unit, @status, @createdAt, @updatedAt)`,
      )
      .run(kr);
    return kr;
  }

  findById(id: string): KeyResult | null {
    const row = this.db
      .prepare(
        `SELECT id, objective_id AS objectiveId, company_id AS companyId, title,
                target_value AS targetValue, current_value AS currentValue, unit,
                status, created_at AS createdAt, updated_at AS updatedAt
         FROM key_results WHERE id = ?`,
      )
      .get(id) as KeyResult | undefined;
    return row ?? null;
  }

  setStatus(id: string, status: KeyResultStatus): KeyResult | null {
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE key_results SET status = ?, updated_at = ? WHERE id = ?`)
      .run(status, now, id);
    return this.findById(id);
  }

  /** Roll up: increment progress when loop delivers proofs; complete when target met */
  rollupFromProofs(objectiveId: string, proofCount: number): void {
    const krs = this.listByObjective(objectiveId).filter((k) => k.status === 'open');
    if (krs.length === 0) return;
    const now = new Date().toISOString();
    const stmt = this.db.prepare(
      `UPDATE key_results SET current_value = current_value + ?, updated_at = ? WHERE id = ?`,
    );
    for (const kr of krs) {
      stmt.run(proofCount, now, kr.id);
      const updated = this.findById(kr.id)!;
      if (updated.targetValue != null && updated.currentValue >= updated.targetValue) {
        this.setStatus(kr.id, 'completed');
      }
    }
  }

  completeAllOpen(objectiveId: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE key_results SET status = 'completed', updated_at = ? WHERE objective_id = ? AND status = 'open'`,
      )
      .run(now, objectiveId);
  }
}
