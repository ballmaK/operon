import type Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import type { AssetItem, ProofAcceptanceStatus, ProofWallItem } from '@operon/shared-types';

interface ProofRow {
  worker_run_id: string;
  proof_json: string;
  created_at: string;
  task_id: string;
  objective_id: string;
  objective_title: string;
  acceptance_status: ProofAcceptanceStatus | null;
}

export interface ProofListFilters {
  type?: ProofWallItem['type'];
  acceptanceStatus?: ProofAcceptanceStatus;
}

export function listProofsForCompany(
  db: Database.Database,
  companyId: string,
  filters: ProofListFilters = {},
): ProofWallItem[] {
  const rows = db
    .prepare(
      `SELECT wr.id AS worker_run_id, wr.proof_json, wr.created_at,
              t.id AS task_id, o.id AS objective_id, o.title AS objective_title,
              pa.status AS acceptance_status
       FROM worker_runs wr
       JOIN tasks t ON t.id = wr.task_id
       JOIN objectives o ON o.id = t.objective_id
       LEFT JOIN proof_acceptance pa ON pa.worker_run_id = wr.id
       WHERE t.company_id = ? AND wr.proof_json IS NOT NULL
       ORDER BY wr.created_at DESC`,
    )
    .all(companyId) as ProofRow[];

  return rows
    .map((row) => {
      const proof = JSON.parse(row.proof_json) as {
        type: ProofWallItem['type'];
        path?: string;
        url?: string;
        summary: string;
      };
      return {
        id: row.worker_run_id,
        type: proof.type,
        path: proof.path ?? null,
        url: proof.url ?? null,
        summary: proof.summary,
        acceptanceStatus: row.acceptance_status ?? 'pending',
        objectiveId: row.objective_id,
        objectiveTitle: row.objective_title,
        taskId: row.task_id,
        workerRunId: row.worker_run_id,
        createdAt: row.created_at,
      };
    })
    .filter((p) => (filters.type ? p.type === filters.type : true))
    .filter((p) =>
      filters.acceptanceStatus ? p.acceptanceStatus === filters.acceptanceStatus : true,
    );
}

export function listAssetsForCompany(db: Database.Database, companyId: string): AssetItem[] {
  return listProofsForCompany(db, companyId)
    .filter((p) => p.path)
    .map((p) => ({
      id: p.workerRunId,
      name: p.path!.split(/[/\\]/).pop() ?? p.path!,
      type: inferAssetType(p.path!),
      path: p.path!,
      version: 1,
      taskId: p.taskId,
      objectiveTitle: p.objectiveTitle,
      createdAt: p.createdAt,
    }));
}

export function inferAssetType(path: string): AssetItem['type'] {
  const lower = path.toLowerCase();
  if (lower.endsWith('.md')) return 'markdown';
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(lower)) return 'image';
  if (/\.(ts|js|py|rs|go|json)$/.test(lower)) return 'code';
  if (lower.endsWith('.txt') || lower.includes('proof')) return 'file';
  return 'other';
}

export function readAssetPreview(
  dataDir: string,
  assetPath: string,
  maxBytes = 8000,
): { content: string; truncated: boolean } | null {
  const normalized = normalize(assetPath);
  if (normalized.includes('..')) return null;

  const fullPath = normalized.startsWith(dataDir)
    ? normalized
    : join(dataDir, normalized.replace(/^[/\\]+/, ''));

  if (!existsSync(fullPath)) return null;

  const buf = readFileSync(fullPath);
  const truncated = buf.length > maxBytes;
  const content = buf.subarray(0, maxBytes).toString('utf8');
  return { content, truncated };
}

export function resolveAssetAbsolutePath(dataDir: string, assetPath: string): string | null {
  const normalized = normalize(assetPath);
  if (normalized.includes('..')) return null;
  const fullPath = normalized.startsWith(dataDir)
    ? normalized
    : join(dataDir, normalized.replace(/^[/\\]+/, ''));
  return existsSync(fullPath) ? fullPath : null;
}
