import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Objective } from '@operon/shared-types';

export interface CreateObjectiveInput {
  companyId: string;
  title: string;
  constraints?: string | null;
  priority?: 'P0' | 'P1' | 'P2' | null;
}

export class ObjectiveRepo {
  constructor(private readonly db: Database.Database) {}

  create(input: CreateObjectiveInput): Objective {
    const now = new Date().toISOString();
    const objective: Objective = {
      id: randomUUID(),
      companyId: input.companyId,
      title: input.title,
      constraints: input.constraints ?? null,
      status: 'draft',
      priority: input.priority ?? 'P0',
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO objectives
         (id, company_id, title, constraints, status, priority, created_at, updated_at)
         VALUES (@id, @companyId, @title, @constraints, @status, @priority, @createdAt, @updatedAt)`,
      )
      .run(objective);
    return objective;
  }

  listByCompany(companyId: string): Objective[] {
    return this.db
      .prepare(
        `SELECT id, company_id AS companyId, title, constraints, status, priority,
                created_at AS createdAt, updated_at AS updatedAt
         FROM objectives WHERE company_id = ? ORDER BY created_at DESC`,
      )
      .all(companyId) as Objective[];
  }

  findById(id: string): Objective | null {
    const row = this.db
      .prepare(
        `SELECT id, company_id AS companyId, title, constraints, status, priority,
                created_at AS createdAt, updated_at AS updatedAt
         FROM objectives WHERE id = ?`,
      )
      .get(id) as Objective | undefined;
    return row ?? null;
  }

  setActive(id: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE objectives SET status = 'active', updated_at = ? WHERE id = ?`)
      .run(now, id);
  }
}
