import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type {
  ControlLoop,
  ControlLoopPhase,
  ControlLoopStatus,
} from '@operon/shared-types';

export class ControlLoopRepo {
  constructor(private readonly db: Database.Database) {}

  findRunningByObjective(objectiveId: string): ControlLoop | null {
    const row = this.db
      .prepare(
        `SELECT * FROM control_loops
         WHERE objective_id = ? AND status IN ('running', 'waiting_owner')
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(objectiveId) as Row | undefined;
    return this.mapRow(row);
  }

  create(objectiveId: string, companyId: string): ControlLoop {
    const now = new Date().toISOString();
    const loop: ControlLoop = {
      id: randomUUID(),
      objectiveId,
      companyId,
      phase: 'understand',
      status: 'running',
      iteration: 1,
      waitReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO control_loops
         (id, objective_id, company_id, phase, status, iteration, wait_reason, created_at, updated_at)
         VALUES (@id, @objectiveId, @companyId, @phase, @status, @iteration, NULL, @createdAt, @updatedAt)`,
      )
      .run(loop);
    return loop;
  }

  updatePhase(
    id: string,
    phase: ControlLoopPhase,
    status?: ControlLoopStatus,
    waitReason?: string | null,
  ): ControlLoop | null {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE control_loops SET phase = ?, status = COALESCE(?, status),
         wait_reason = ?, updated_at = ? WHERE id = ?`,
      )
      .run(phase, status ?? null, waitReason ?? null, now, id);
    return this.findById(id);
  }

  findById(id: string): ControlLoop | null {
    return this.mapRow(
      this.db.prepare(`SELECT * FROM control_loops WHERE id = ?`).get(id) as Row | undefined,
    );
  }

  findByObjective(objectiveId: string): ControlLoop | null {
    const row = this.db
      .prepare(`SELECT * FROM control_loops WHERE objective_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(objectiveId) as Row | undefined;
    return this.mapRow(row);
  }

  complete(id: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE control_loops SET status = 'completed', updated_at = ? WHERE id = ?`)
      .run(now, id);
  }

  private mapRow(row: Row | undefined): ControlLoop | null {
    if (!row) return null;
    return {
      id: row.id,
      objectiveId: row.objective_id,
      companyId: row.company_id,
      phase: row.phase as ControlLoopPhase,
      status: row.status as ControlLoopStatus,
      iteration: row.iteration,
      waitReason: row.wait_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface Row {
  id: string;
  objective_id: string;
  company_id: string;
  phase: string;
  status: string;
  iteration: number;
  wait_reason: string | null;
  created_at: string;
  updated_at: string;
}
