import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { openDatabase, closeDatabase } from './database.js';
import { CompanyRepo } from './repos/company-repo.js';
import { TranscriptRepo } from './repos/transcript-repo.js';

describe('M09 SQLite schema', () => {
  let dataDir: string;

  afterEach(() => {
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('creates Company, Department, Objective, Transcript tables with WAL', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as Array<{ name: string }>;

    expect(tables.map((t) => t.name)).toEqual([
      'companies',
      'departments',
      'objectives',
      'transcripts',
    ]);

    const journalMode = db.pragma('journal_mode', { simple: true }) as string;
    expect(journalMode.toLowerCase()).toBe('wal');

    closeDatabase(db);
  });

  it('CompanyRepo CRUD creates and lists companies', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });
    const repo = new CompanyRepo(db);

    const created = repo.create({ name: 'Acme Corp', localPath: 'companies/acme' });
    expect(created.name).toBe('Acme Corp');
    expect(created.status).toBe('active');

    expect(repo.findById(created.id)?.name).toBe('Acme Corp');
    expect(repo.list()).toHaveLength(1);

    closeDatabase(db);
  });

  it('TranscriptRepo append is insert-only with company filter', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });
    const companies = new CompanyRepo(db);
    const transcripts = new TranscriptRepo(db);

    const company = companies.create({ name: 'Test Co', localPath: 'companies/test' });
    const entry = transcripts.append({
      companyId: company.id,
      actor: 'system',
      actionType: 'input',
      payload: { message: 'hello' },
    });

    expect(entry.actor).toBe('system');
    expect(transcripts.query(company.id)).toHaveLength(1);
    expect(transcripts.query('other-company-id')).toHaveLength(0);

    closeDatabase(db);
  });
});
