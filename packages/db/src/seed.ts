import type Database from 'better-sqlite3';
import { seedDefaultOwner } from './repos/user-repo.js';

export const AUDIT_COMPANY_ID = '00000000-0000-0000-0000-000000000000';

export function seedAuditCompany(db: Database.Database): void {
  const row = db.prepare(`SELECT id FROM companies WHERE id = ?`).get(AUDIT_COMPANY_ID);
  if (row) return;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO companies (id, name, status, local_path, created_at, updated_at)
     VALUES (?, 'System Audit', 'active', 'system/audit', ?, ?)`,
  ).run(AUDIT_COMPANY_ID, now, now);
}

export function bootstrapAuth(db: Database.Database): { ownerId: string } {
  seedAuditCompany(db);
  const owner = seedDefaultOwner(db);
  return { ownerId: owner.id };
}
