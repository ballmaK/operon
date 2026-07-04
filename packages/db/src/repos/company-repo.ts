import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Company } from '@operon/shared-types';

export class CompanyRepo {
  constructor(private readonly db: Database.Database) {}

  create(input: { name: string; localPath?: string }): Company {
    const now = new Date().toISOString();
    const id = randomUUID();
    const company: Company = {
      id,
      name: input.name,
      status: 'active',
      localPath: input.localPath ?? `companies/${id}`,
      createdAt: now,
      updatedAt: now,
    };

    this.db
      .prepare(
        `INSERT INTO companies (id, name, status, local_path, created_at, updated_at)
         VALUES (@id, @name, @status, @localPath, @createdAt, @updatedAt)`,
      )
      .run(company);

    return company;
  }

  findById(id: string): Company | null {
    const row = this.db
      .prepare(
        `SELECT id, name, status, local_path AS localPath, created_at AS createdAt, updated_at AS updatedAt
         FROM companies WHERE id = ?`,
      )
      .get(id) as Company | undefined;
    return row ?? null;
  }

  list(): Company[] {
    return this.db
      .prepare(
        `SELECT id, name, status, local_path AS localPath, created_at AS createdAt, updated_at AS updatedAt
         FROM companies ORDER BY created_at DESC`,
      )
      .all() as Company[];
  }

  findByName(name: string): Company | null {
    const row = this.db
      .prepare(
        `SELECT id, name, status, local_path AS localPath, created_at AS createdAt, updated_at AS updatedAt
         FROM companies WHERE name = ? COLLATE NOCASE`,
      )
      .get(name.trim()) as Company | undefined;
    return row ?? null;
  }
}
