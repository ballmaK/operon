/** Sidecar health response — M12 GET /health */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
}

/** Company workspace entity — M01 / M09 */
export interface Company {
  id: string;
  name: string;
  status: 'active' | 'archived';
  localPath: string;
  createdAt: string;
  updatedAt: string;
}

/** Department bounded context — M02 / M09 */
export interface Department {
  id: string;
  companyId: string;
  name: string;
  charter: string;
  createdAt: string;
  updatedAt: string;
}

/** Top-level measurable goal — M01 / M05 */
export interface Objective {
  id: string;
  companyId: string;
  title: string;
  constraints: string | null;
  status: 'draft' | 'active' | 'paused' | 'blocked' | 'completed' | 'archived';
  priority: 'P0' | 'P1' | 'P2' | null;
  createdAt: string;
  updatedAt: string;
}

/** Append-only audit log entry — M09 */
export interface TranscriptEntry {
  id: string;
  companyId: string;
  actor: 'owner' | 'lead' | 'worker' | 'system';
  actionType:
    | 'input'
    | 'plan'
    | 'dispatch'
    | 'tool'
    | 'proof'
    | 'synthesis'
    | 'decision'
    | 'handoff';
  payload: Record<string, unknown>;
  relatedEntity: { type: string; id: string } | null;
  timestamp: string;
}

export const SIDECAR_DEFAULT_PORT = 3721;
export const OPERON_VERSION = '0.1.0';
