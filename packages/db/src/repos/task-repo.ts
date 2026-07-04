import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { ProofType, Task, TaskStatus } from '@operon/shared-types';

export interface CreateTaskInput {
  companyId: string;
  objectiveId: string;
  departmentId: string;
  brief: string;
  allowedSkills: string[];
  expectedProofType: ProofType;
}

export class TaskRepo {
  constructor(private readonly db: Database.Database) {}

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      companyId: input.companyId,
      objectiveId: input.objectiveId,
      departmentId: input.departmentId,
      brief: input.brief,
      allowedSkills: input.allowedSkills,
      status: 'pending',
      expectedProofType: input.expectedProofType,
      workerRunId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO tasks
         (id, company_id, objective_id, department_id, brief, allowed_skills_json,
          status, expected_proof_type, worker_run_id, created_at, updated_at)
         VALUES (@id, @companyId, @objectiveId, @departmentId, @brief, @skills,
                 @status, @expectedProofType, NULL, @createdAt, @updatedAt)`,
      )
      .run({
        ...task,
        skills: JSON.stringify(task.allowedSkills),
        expectedProofType: task.expectedProofType,
      });
    return task;
  }

  findById(id: string): Task | null {
    return this.mapRow(
      this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as TaskRow | undefined,
    );
  }

  listByObjective(objectiveId: string): Task[] {
    const rows = this.db
      .prepare(`SELECT * FROM tasks WHERE objective_id = ? ORDER BY created_at`)
      .all(objectiveId) as TaskRow[];
    return rows.map((r) => this.mapRow(r)!);
  }

  updateStatus(id: string, status: TaskStatus, workerRunId?: string | null): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE tasks SET status = ?, worker_run_id = COALESCE(?, worker_run_id), updated_at = ? WHERE id = ?`,
      )
      .run(status, workerRunId ?? null, now, id);
  }

  private mapRow(row: TaskRow | undefined): Task | null {
    if (!row) return null;
    return {
      id: row.id,
      companyId: row.company_id,
      objectiveId: row.objective_id,
      departmentId: row.department_id,
      brief: row.brief,
      allowedSkills: JSON.parse(row.allowed_skills_json) as string[],
      status: row.status as TaskStatus,
      expectedProofType: row.expected_proof_type as ProofType,
      workerRunId: row.worker_run_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface TaskRow {
  id: string;
  company_id: string;
  objective_id: string;
  department_id: string;
  brief: string;
  allowed_skills_json: string;
  status: string;
  expected_proof_type: string;
  worker_run_id: string | null;
  created_at: string;
  updated_at: string;
}
