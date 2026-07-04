import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

export interface DatabaseOptions {
  dataDir: string;
  filename?: string;
}

function runMigrations(db: Database.Database): void {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    db.exec(sql);
  }
}

export function openDatabase(options: DatabaseOptions): Database.Database {
  mkdirSync(options.dataDir, { recursive: true });
  const dbPath = join(options.dataDir, options.filename ?? 'operon.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  runMigrations(db);
  return db;
}

export function closeDatabase(db: Database.Database): void {
  db.close();
}
