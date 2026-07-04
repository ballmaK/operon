import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { openDatabase, closeDatabase } from './database.js';
import { CompanyRepo } from './repos/company-repo.js';
import { TranscriptRepo } from './repos/transcript-repo.js';
import { CredentialRepo } from './repos/credential-repo.js';
import { UserRepo, seedDefaultOwner } from './repos/user-repo.js';
import { ApprovalRepo } from './repos/approval-repo.js';

describe('M09 SQLite schema', () => {
  let dataDir: string;

  afterEach(() => {
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('creates core and M16 tables with WAL', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as Array<{ name: string }>;

    expect(tables.map((t) => t.name)).toEqual([
      'api_credentials',
      'approvals',
      'companies',
      'control_loops',
      'departments',
      'model_configs',
      'objectives',
      'tasks',
      'transcripts',
      'users',
      'worker_runs',
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

    closeDatabase(db);
  });
});

describe('M16 auth repos', () => {
  let dataDir: string;

  afterEach(() => {
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('seedDefaultOwner creates single Owner user', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });
    const first = seedDefaultOwner(db);
    const second = seedDefaultOwner(db);
    expect(first.displayName).toBe('Owner');
    expect(second.id).toBe(first.id);
    closeDatabase(db);
  });

  it('CredentialRepo stores encrypted keys with mask only in list', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });
    const repo = new CredentialRepo(db, dataDir);
    const saved = repo.upsert({ provider: 'openai', apiKey: 'sk-test1234567890' });
    expect(saved.maskedKey).toBe('sk-***7890');
    expect(saved.maskedKey).not.toContain('test1234');
    expect(repo.getDecrypted('openai')).toBe('sk-test1234567890');
    closeDatabase(db);
  });

  it('ApprovalRepo approve/reject only when pending', () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-db-'));
    const db = openDatabase({ dataDir });
    const repo = new ApprovalRepo(db);
    const pending = repo.create({
      actionType: 'skill_invoke',
      summary: 'Run code_run in sandbox',
    });
    const approved = repo.approve(pending.id);
    expect(approved?.status).toBe('approved');
    expect(repo.approve(pending.id)).toBeNull();
    closeDatabase(db);
  });
});
