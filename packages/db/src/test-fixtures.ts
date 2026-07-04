import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Department, Objective } from '@operon/shared-types';
import { CompanyRepo } from './repos/company-repo.js';
import { CredentialRepo } from './repos/credential-repo.js';
import { seedDefaultModelConfigs } from './repos/model-config-repo.js';

export interface TestFixture {
  companyId: string;
  departmentId: string;
  objectiveId: string;
}

export function seedTestFixture(db: Database.Database, dataDir: string): TestFixture {
  seedDefaultModelConfigs(db);
  const companies = new CompanyRepo(db);
  const company = companies.create({ name: `Co-${randomUUID().slice(0, 8)}`, localPath: 'companies/test' });
  const now = new Date().toISOString();
  const departmentId = randomUUID();
  db.prepare(
    `INSERT INTO departments (id, company_id, name, charter, created_at, updated_at)
     VALUES (?, ?, 'Engineering', 'Build things', ?, ?)`,
  ).run(departmentId, company.id, now, now);

  const objectiveId = randomUUID();
  db.prepare(
    `INSERT INTO objectives (id, company_id, title, constraints, status, priority, created_at, updated_at)
     VALUES (?, ?, 'Ship MVP', NULL, 'draft', 'P0', ?, ?)`,
  ).run(objectiveId, company.id, now, now);

  const credentials = new CredentialRepo(db, dataDir);
  credentials.upsert({ provider: 'openai', apiKey: 'sk-test1234567890abcdef' });

  return { companyId: company.id, departmentId, objectiveId };
}
