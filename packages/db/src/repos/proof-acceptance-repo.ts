import type Database from 'better-sqlite3';
import type { ProofAcceptanceStatus } from '@operon/shared-types';

export class ProofAcceptanceRepo {
  constructor(private readonly db: Database.Database) {}

  get(workerRunId: string): ProofAcceptanceStatus {
    const row = this.db
      .prepare(`SELECT status FROM proof_acceptance WHERE worker_run_id = ?`)
      .get(workerRunId) as { status: ProofAcceptanceStatus } | undefined;
    return row?.status ?? 'pending';
  }

  set(workerRunId: string, status: ProofAcceptanceStatus): ProofAcceptanceStatus {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO proof_acceptance (worker_run_id, status, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(worker_run_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
      )
      .run(workerRunId, status, now);
    return status;
  }
}
