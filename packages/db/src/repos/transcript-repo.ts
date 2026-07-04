import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { TranscriptEntry } from '@operon/shared-types';

export interface AppendTranscriptInput {
  companyId: string;
  actor: TranscriptEntry['actor'];
  actionType: TranscriptEntry['actionType'];
  payload: Record<string, unknown>;
  relatedEntity?: { type: string; id: string } | null;
}

export class TranscriptRepo {
  constructor(private readonly db: Database.Database) {}

  append(input: AppendTranscriptInput): TranscriptEntry {
    const entry: TranscriptEntry = {
      id: randomUUID(),
      companyId: input.companyId,
      actor: input.actor,
      actionType: input.actionType,
      payload: input.payload,
      relatedEntity: input.relatedEntity ?? null,
      timestamp: new Date().toISOString(),
    };

    this.db
      .prepare(
        `INSERT INTO transcripts
         (id, company_id, actor, action_type, payload_json, related_entity_type, related_entity_id, timestamp)
         VALUES (@id, @companyId, @actor, @actionType, @payloadJson, @relatedType, @relatedId, @timestamp)`,
      )
      .run({
        id: entry.id,
        companyId: entry.companyId,
        actor: entry.actor,
        actionType: entry.actionType,
        payloadJson: JSON.stringify(entry.payload),
        relatedType: entry.relatedEntity?.type ?? null,
        relatedId: entry.relatedEntity?.id ?? null,
        timestamp: entry.timestamp,
      });

    return entry;
  }

  query(companyId: string, limit = 50): TranscriptEntry[] {
    return this.queryFiltered(companyId, { limit });
  }

  queryFiltered(
    companyId: string,
    opts: { limit?: number; offset?: number; actor?: string; actionType?: string },
  ): TranscriptEntry[] {
    const limit = Math.min(opts.limit ?? 50, 200);
    const offset = opts.offset ?? 0;
    const conditions = ['company_id = ?'];
    const params: unknown[] = [companyId];

    if (opts.actor) {
      conditions.push('actor = ?');
      params.push(opts.actor);
    }
    if (opts.actionType) {
      conditions.push('action_type = ?');
      params.push(opts.actionType);
    }

    params.push(limit, offset);

    const rows = this.db
      .prepare(
        `SELECT id, company_id AS companyId, actor, action_type AS actionType,
                payload_json AS payloadJson, related_entity_type AS relatedType,
                related_entity_id AS relatedId, timestamp
         FROM transcripts
         WHERE ${conditions.join(' AND ')}
         ORDER BY timestamp DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params) as Array<{
      id: string;
      companyId: string;
      actor: TranscriptEntry['actor'];
      actionType: TranscriptEntry['actionType'];
      payloadJson: string;
      relatedType: string | null;
      relatedId: string | null;
      timestamp: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      companyId: row.companyId,
      actor: row.actor,
      actionType: row.actionType,
      payload: JSON.parse(row.payloadJson) as Record<string, unknown>,
      relatedEntity:
        row.relatedType && row.relatedId
          ? { type: row.relatedType, id: row.relatedId }
          : null,
      timestamp: row.timestamp,
    }));
  }
}
