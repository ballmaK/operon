import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Department } from '@operon/shared-types';

export class DepartmentRepo {
  constructor(private readonly db: Database.Database) {}

  create(input: { companyId: string; name: string; charter?: string }): Department {
    const now = new Date().toISOString();
    const department: Department = {
      id: randomUUID(),
      companyId: input.companyId,
      name: input.name.trim(),
      charter: input.charter?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO departments (id, company_id, name, charter, created_at, updated_at)
         VALUES (@id, @companyId, @name, @charter, @createdAt, @updatedAt)`,
      )
      .run(department);
    return department;
  }

  listByCompany(companyId: string): Department[] {
    return this.db
      .prepare(
        `SELECT id, company_id AS companyId, name, charter,
                created_at AS createdAt, updated_at AS updatedAt
         FROM departments WHERE company_id = ? ORDER BY created_at ASC`,
      )
      .all(companyId) as Department[];
  }
}
