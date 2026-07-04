import type Database from 'better-sqlite3';
import type { Objective } from '@operon/shared-types';

export class ObjectiveRepo {
  constructor(private readonly db: Database.Database) {}

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
