import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATION_SQL = readFileSync(join(__dirname, 'migrations', '001_initial.sql'), 'utf-8');

export interface DatabaseOptions {
  dataDir: string;
  filename?: string;
}

export function openDatabase(options: DatabaseOptions): Database.Database {
  mkdirSync(options.dataDir, { recursive: true });
  const dbPath = join(options.dataDir, options.filename ?? 'operon.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(MIGRATION_SQL);
  return db;
}

export function closeDatabase(db: Database.Database): void {
  db.close();
}
