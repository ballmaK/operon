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

/** Local Owner — M16 */
export interface User {
  id: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

/** API Key (masked for API responses) — M16 */
export interface ApiCredentialView {
  id: string;
  provider: string;
  maskedKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCredentialRequest {
  provider: string;
  apiKey: string;
}

/** Owner approval gate — M16 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ApprovalActionType = 'skill_invoke' | 'spend' | 'deploy' | 'email';

export interface Approval {
  id: string;
  actionType: ApprovalActionType;
  taskId: string | null;
  summary: string;
  status: ApprovalStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApprovalRequest {
  actionType: ApprovalActionType;
  taskId?: string | null;
  summary: string;
  expiresAt?: string;
}

/** LLM routing — M11 */
export type LlmRole =
  | 'lead_plan'
  | 'lead_synth'
  | 'worker_code'
  | 'worker_research'
  | 'worker_default';

export interface ModelConfig {
  id: string;
  role: LlmRole;
  provider: string;
  modelName: string;
  apiBaseUrl: string | null;
  temperature: number;
  maxTokens: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  fallbackProvider: string | null;
  fallbackModelName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompleteRequest {
  role: LlmRole;
  messages: LlmMessage[];
  agentRunId: string;
}

export interface LlmCompleteResponse {
  role: LlmRole;
  provider: string;
  modelName: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  stub: boolean;
}

/** Runtime sandbox — M10 */
export type SkillRiskLevel = 'low' | 'medium' | 'high';
export type SkillRuntime = 'playwright' | 'docker' | 'subprocess';

export interface Skill {
  code: string;
  name: string;
  riskLevel: SkillRiskLevel;
  runtime: SkillRuntime;
  platforms: string[];
}

export type SandboxSessionStatus =
  | 'SBX_CREATING'
  | 'SBX_READY'
  | 'SBX_RUNNING'
  | 'SBX_DESTROYED';

export interface SandboxSession {
  id: string;
  runtimeType: SkillRuntime;
  workDirRelative: string;
  status: SandboxSessionStatus;
  agentRunId: string;
  createdAt: string;
}

export interface CreateSandboxSessionRequest {
  runtimeType: SkillRuntime;
  agentRunId: string;
}

export interface InvokeSkillRequest {
  sessionId: string;
  skillCode: string;
  params: Record<string, unknown>;
  agentRunId: string;
}
