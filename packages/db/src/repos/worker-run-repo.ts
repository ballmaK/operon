import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Proof, SpawnWorkerRequest, WorkerRun, WorkerStatus } from '@operon/shared-types';

export class WorkerRunRepo {
  constructor(private readonly db: Database.Database) {}

  create(input: SpawnWorkerRequest, sandboxSessionId: string): WorkerRun {
    const now = new Date().toISOString();
    const run: WorkerRun = {
      id: randomUUID(),
      taskId: input.taskId,
      brief: input.brief,
      minimalMemory: input.minimalMemory,
      allowedSkills: input.allowedSkills,
      status: 'spawning',
      sandboxSessionId,
      proof: null,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO worker_runs
         (id, task_id, brief, minimal_memory, allowed_skills_json, status,
          sandbox_session_id, proof_json, created_at, updated_at)
         VALUES (@id, @taskId, @brief, @minimalMemory, @skills, @status,
                 @sandboxSessionId, NULL, @createdAt, @updatedAt)`,
      )
      .run({
        id: run.id,
        taskId: run.taskId,
        brief: run.brief,
        minimalMemory: run.minimalMemory,
        skills: JSON.stringify(run.allowedSkills),
        status: run.status,
        sandboxSessionId: run.sandboxSessionId,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      });
    return run;
  }

  findById(id: string): WorkerRun | null {
    return this.mapRow(
      this.db.prepare(`SELECT * FROM worker_runs WHERE id = ?`).get(id) as Row | undefined,
    );
  }

  listByTask(taskId: string): WorkerRun[] {
    const rows = this.db
      .prepare(`SELECT * FROM worker_runs WHERE task_id = ? ORDER BY created_at DESC`)
      .all(taskId) as Row[];
    return rows.map((r) => this.mapRow(r)!);
  }

  updateStatus(id: string, status: WorkerStatus, proof?: Proof | null): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE worker_runs SET status = ?, proof_json = COALESCE(?, proof_json), updated_at = ? WHERE id = ?`,
      )
      .run(status, proof ? JSON.stringify(proof) : null, now, id);
  }

  private mapRow(row: Row | undefined): WorkerRun | null {
    if (!row) return null;
    return {
      id: row.id,
      taskId: row.task_id,
      brief: row.brief,
      minimalMemory: row.minimal_memory,
      allowedSkills: JSON.parse(row.allowed_skills_json) as string[],
      status: row.status as WorkerStatus,
      sandboxSessionId: row.sandbox_session_id,
      proof: row.proof_json ? (JSON.parse(row.proof_json) as Proof) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface Row {
  id: string;
  task_id: string;
  brief: string;
  minimal_memory: string;
  allowed_skills_json: string;
  status: string;
  sandbox_session_id: string | null;
  proof_json: string | null;
  created_at: string;
  updated_at: string;
}
