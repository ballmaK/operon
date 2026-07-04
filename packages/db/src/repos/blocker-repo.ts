import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Blocker, BlockerStatus } from '@operon/shared-types';

export class BlockerRepo {
  constructor(private readonly db: Database.Database) {}

  listByCompany(companyId: string, status?: BlockerStatus): Blocker[] {
    const sql = status
      ? `SELECT * FROM blockers WHERE company_id = ? AND status = ? ORDER BY created_at DESC`
      : `SELECT * FROM blockers WHERE company_id = ? ORDER BY created_at DESC`;
    const rows = (status
      ? this.db.prepare(sql).all(companyId, status)
      : this.db.prepare(sql).all(companyId)) as Row[];
    return rows.map((r) => this.mapRow(r)!);
  }

  create(input: {
    companyId: string;
    description: string;
    objectiveId?: string | null;
    departmentId?: string | null;
  }): Blocker {
    const now = new Date().toISOString();
    const blocker: Blocker = {
      id: randomUUID(),
      companyId: input.companyId,
      objectiveId: input.objectiveId ?? null,
      departmentId: input.departmentId ?? null,
      description: input.description.slice(0, 500),
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO blockers
         (id, company_id, objective_id, department_id, description, status, created_at, updated_at)
         VALUES (@id, @companyId, @objectiveId, @departmentId, @description, @status, @createdAt, @updatedAt)`,
      )
      .run(blocker);
    return blocker;
  }

  resolve(id: string): Blocker | null {
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE blockers SET status = 'resolved', updated_at = ? WHERE id = ?`)
      .run(now, id);
    return this.findById(id);
  }

  findById(id: string): Blocker | null {
    return this.mapRow(
      this.db.prepare(`SELECT * FROM blockers WHERE id = ?`).get(id) as Row | undefined,
    );
  }

  listOpenForActiveObjectives(companyId: string): Blocker[] {
    const rows = this.db
      .prepare(
        `SELECT b.* FROM blockers b
         LEFT JOIN objectives o ON o.id = b.objective_id
         WHERE b.company_id = ? AND b.status = 'open'
           AND (b.objective_id IS NULL OR o.status = 'active' OR o.status = 'blocked')
         ORDER BY b.created_at DESC`,
      )
      .all(companyId) as Row[];
    return rows.map((r) => this.mapRow(r)!);
  }

  private mapRow(row: Row | undefined): Blocker | null {
    if (!row) return null;
    return {
      id: row.id,
      companyId: row.company_id,
      objectiveId: row.objective_id,
      departmentId: row.department_id,
      description: row.description,
      status: row.status as BlockerStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface Row {
  id: string;
  company_id: string;
  objective_id: string | null;
  department_id: string | null;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}
