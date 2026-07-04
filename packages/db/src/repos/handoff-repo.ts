import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { CreateHandoffRequest, Handoff, HandoffStatus, ProofType } from '@operon/shared-types';

export class HandoffRepo {
  constructor(private readonly db: Database.Database) {}

  create(input: CreateHandoffRequest): Handoff {
    const now = new Date().toISOString();
    const handoff: Handoff = {
      id: randomUUID(),
      companyId: input.companyId,
      fromDepartmentId: input.fromDepartmentId,
      toDepartmentId: input.toDepartmentId,
      contextSummary: input.contextSummary,
      assetRefs: input.assetRefs ?? [],
      request: input.request,
      expectedProofType: input.expectedProofType,
      status: 'sent',
      replySummary: null,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO handoffs
         (id, company_id, from_department_id, to_department_id, context_summary,
          asset_refs_json, request, expected_proof_type, status, reply_summary,
          created_at, updated_at)
         VALUES (@id, @companyId, @fromDepartmentId, @toDepartmentId, @contextSummary,
                 @assetRefsJson, @request, @expectedProofType, @status, NULL, @createdAt, @updatedAt)`,
      )
      .run({
        ...handoff,
        assetRefsJson: JSON.stringify(handoff.assetRefs),
      });
    return handoff;
  }

  findById(id: string): Handoff | null {
    return this.mapRow(
      this.db.prepare(`SELECT * FROM handoffs WHERE id = ?`).get(id) as Row | undefined,
    );
  }

  inboxForDepartment(departmentId: string): Handoff[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM handoffs WHERE to_department_id = ?
         ORDER BY created_at DESC`,
      )
      .all(departmentId) as Row[];
    return rows.map((r) => this.mapRow(r)!);
  }

  countPendingForDepartment(departmentId: string): number {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS c FROM handoffs
         WHERE to_department_id = ? AND status = 'sent'`,
      )
      .get(departmentId) as { c: number };
    return row.c;
  }

  updateStatus(id: string, status: HandoffStatus, replySummary?: string | null): Handoff | null {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE handoffs SET status = ?, reply_summary = COALESCE(?, reply_summary),
         updated_at = ? WHERE id = ?`,
      )
      .run(status, replySummary ?? null, now, id);
    return this.findById(id);
  }

  private mapRow(row: Row | undefined): Handoff | null {
    if (!row) return null;
    return {
      id: row.id,
      companyId: row.company_id,
      fromDepartmentId: row.from_department_id,
      toDepartmentId: row.to_department_id,
      contextSummary: row.context_summary,
      assetRefs: JSON.parse(row.asset_refs_json) as string[],
      request: row.request,
      expectedProofType: row.expected_proof_type as ProofType,
      status: row.status as HandoffStatus,
      replySummary: row.reply_summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface Row {
  id: string;
  company_id: string;
  from_department_id: string;
  to_department_id: string;
  context_summary: string;
  asset_refs_json: string;
  request: string;
  expected_proof_type: string;
  status: string;
  reply_summary: string | null;
  created_at: string;
  updated_at: string;
}
