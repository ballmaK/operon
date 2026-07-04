import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type {
  Approval,
  ApprovalStatus,
  CreateApprovalRequest,
} from '@operon/shared-types';

export class ApprovalRepo {
  constructor(private readonly db: Database.Database) {}

  list(status?: ApprovalStatus): Approval[] {
    if (status) {
      return this.db
        .prepare(
          `SELECT id, action_type AS actionType, task_id AS taskId, summary, status,
                  expires_at AS expiresAt, created_at AS createdAt, updated_at AS updatedAt
           FROM approvals WHERE status = ? ORDER BY created_at DESC`,
        )
        .all(status) as Approval[];
    }
    return this.db
      .prepare(
        `SELECT id, action_type AS actionType, task_id AS taskId, summary, status,
                expires_at AS expiresAt, created_at AS createdAt, updated_at AS updatedAt
         FROM approvals ORDER BY created_at DESC`,
      )
      .all() as Approval[];
  }

  findById(id: string): Approval | null {
    const row = this.db
      .prepare(
        `SELECT id, action_type AS actionType, task_id AS taskId, summary, status,
                expires_at AS expiresAt, created_at AS createdAt, updated_at AS updatedAt
         FROM approvals WHERE id = ?`,
      )
      .get(id) as Approval | undefined;
    return row ?? null;
  }

  create(input: CreateApprovalRequest): Approval {
    const now = new Date().toISOString();
    const expiresAt =
      input.expiresAt ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const approval: Approval = {
      id: randomUUID(),
      actionType: input.actionType,
      taskId: input.taskId ?? null,
      summary: input.summary,
      status: 'pending',
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO approvals
         (id, action_type, task_id, summary, status, expires_at, created_at, updated_at)
         VALUES (@id, @actionType, @taskId, @summary, @status, @expiresAt, @createdAt, @updatedAt)`,
      )
      .run(approval);
    return approval;
  }

  approve(id: string): Approval | null {
    return this.setStatus(id, 'approved');
  }

  reject(id: string): Approval | null {
    return this.setStatus(id, 'rejected');
  }

  findPendingSkillInvoke(taskId: string): Approval | null {
    const row = this.db
      .prepare(
        `SELECT id, action_type AS actionType, task_id AS taskId, summary, status,
                expires_at AS expiresAt, created_at AS createdAt, updated_at AS updatedAt
         FROM approvals WHERE task_id = ? AND action_type = 'skill_invoke' AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(taskId) as Approval | undefined;
    return row ?? null;
  }

  findApprovedSkillInvoke(taskId: string): Approval | null {
    const row = this.db
      .prepare(
        `SELECT id, action_type AS actionType, task_id AS taskId, summary, status,
                expires_at AS expiresAt, created_at AS createdAt, updated_at AS updatedAt
         FROM approvals WHERE task_id = ? AND action_type = 'skill_invoke' AND status = 'approved'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(taskId) as Approval | undefined;
    return row ?? null;
  }

  private setStatus(id: string, status: ApprovalStatus): Approval | null {
    const current = this.findById(id);
    if (!current || current.status !== 'pending') return null;
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE approvals SET status = ?, updated_at = ? WHERE id = ?`)
      .run(status, now, id);
    return this.findById(id);
  }
}
