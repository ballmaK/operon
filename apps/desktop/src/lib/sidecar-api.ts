import type {
  Company,
  Department,
  Objective,
  ControlLoop,
  TranscriptEntry,
  Approval,
  Task,
  WorkerRun,
  ProofWallItem,
  AssetItem,
  Handoff,
  CreateHandoffRequest,
  Blocker,
  RhythmSchedule,
  RhythmReport,
  DepartmentSummary,
  ApiCredentialView,
  ModelConfig,
  LlmRole,
  ModelConfigTestResult,
  KeyResult,
  CreateKeyResultRequest,
  AssetRevealResponse,
} from '@operon/shared-types';
import { SIDECAR_DEFAULT_PORT } from '@operon/shared-types';

export function sidecarBaseUrl(port = SIDECAR_DEFAULT_PORT): string {
  return `http://127.0.0.1:${port}`;
}

async function requestJson<T>(
  port: number,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${sidecarBaseUrl(port)}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return body;
}

export async function listCompanies(port: number): Promise<Company[]> {
  return requestJson<Company[]>(port, '/api/v1/companies');
}

export async function createCompany(port: number, name: string): Promise<Company> {
  return requestJson<Company>(port, '/api/v1/companies', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createDepartment(
  port: number,
  companyId: string,
  name: string,
): Promise<Department> {
  return requestJson<Department>(port, `/api/v1/companies/${companyId}/departments`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function listDepartments(port: number, companyId: string): Promise<DepartmentSummary[]> {
  return requestJson<DepartmentSummary[]>(port, `/api/v1/companies/${companyId}/departments`);
}

export async function listObjectives(port: number, companyId: string): Promise<Objective[]> {
  return requestJson<Objective[]>(port, `/api/v1/companies/${companyId}/objectives`);
}

export async function listTranscripts(
  port: number,
  companyId: string,
  opts: { limit?: number; offset?: number; actor?: string; actionType?: string } = {},
): Promise<TranscriptEntry[]> {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.offset) params.set('offset', String(opts.offset));
  if (opts.actor) params.set('actor', opts.actor);
  if (opts.actionType) params.set('actionType', opts.actionType);
  const qs = params.toString();
  return requestJson<TranscriptEntry[]>(
    port,
    `/api/v1/companies/${companyId}/transcripts${qs ? `?${qs}` : ''}`,
  );
}

export async function correctTranscript(
  port: number,
  input: { companyId: string; message: string; relatedEntity?: { type: string; id: string } },
): Promise<TranscriptEntry> {
  return requestJson<TranscriptEntry>(port, '/api/v1/transcripts/correct', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listDepartmentTasks(port: number, departmentId: string): Promise<Task[]> {
  return requestJson<Task[]>(port, `/api/v1/departments/${departmentId}/tasks`);
}

export async function getTask(port: number, taskId: string): Promise<Task> {
  return requestJson<Task>(port, `/api/v1/tasks/${taskId}`);
}

export async function listTaskRuns(port: number, taskId: string): Promise<WorkerRun[]> {
  return requestJson<WorkerRun[]>(port, `/api/v1/tasks/${taskId}/runs`);
}

export async function getWorkerRun(port: number, workerRunId: string): Promise<WorkerRun> {
  return requestJson<WorkerRun>(port, `/api/v1/workers/${workerRunId}`);
}

export async function listProofs(port: number, companyId: string): Promise<ProofWallItem[]> {
  return requestJson<ProofWallItem[]>(port, `/api/v1/companies/${companyId}/proofs`);
}

export async function listAssets(port: number, companyId: string): Promise<AssetItem[]> {
  return requestJson<AssetItem[]>(port, `/api/v1/companies/${companyId}/assets`);
}

export async function getAssetContent(
  port: number,
  assetId: string,
  path: string,
): Promise<{ content: string; truncated: boolean }> {
  return requestJson(port, `/api/v1/assets/${assetId}/content?path=${encodeURIComponent(path)}`);
}

export async function listPendingApprovals(port: number): Promise<Approval[]> {
  return requestJson<Approval[]>(port, '/api/v1/approvals?status=pending');
}

export async function getObjective(
  port: number,
  objectiveId: string,
): Promise<Objective & { controlLoop: ControlLoop | null }> {
  return requestJson(port, `/api/v1/objectives/${objectiveId}`);
}

export async function updateObjective(
  port: number,
  objectiveId: string,
  input: { title?: string; constraints?: string; priority?: string },
): Promise<Objective> {
  return requestJson<Objective>(port, `/api/v1/objectives/${objectiveId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function startObjective(
  port: number,
  objectiveId: string,
  departmentId?: string,
): Promise<{ objective: Objective | null; loop: ControlLoop }> {
  return requestJson(port, `/api/v1/objectives/${objectiveId}/start`, {
    method: 'POST',
    body: JSON.stringify(departmentId ? { departmentId } : {}),
  });
}

export async function pauseObjective(port: number, objectiveId: string): Promise<Objective> {
  return requestJson<Objective>(port, `/api/v1/objectives/${objectiveId}/pause`, {
    method: 'POST',
    body: '{}',
  });
}

export async function resumeObjective(port: number, objectiveId: string): Promise<Objective> {
  return requestJson<Objective>(port, `/api/v1/objectives/${objectiveId}/resume`, {
    method: 'POST',
    body: '{}',
  });
}

export async function completeObjective(port: number, objectiveId: string): Promise<Objective> {
  return requestJson<Objective>(port, `/api/v1/objectives/${objectiveId}/complete`, {
    method: 'POST',
    body: '{}',
  });
}

export async function sendObjectiveMessage(
  port: number,
  objectiveId: string,
  message: string,
): Promise<TranscriptEntry> {
  return requestJson<TranscriptEntry>(port, `/api/v1/objectives/${objectiveId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function createObjective(
  port: number,
  companyId: string,
  input: { title: string; constraints?: string; priority?: string },
): Promise<Objective> {
  return requestJson<Objective>(port, `/api/v1/companies/${companyId}/objectives`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function startControlLoop(
  port: number,
  objectiveId: string,
  departmentId: string,
): Promise<ControlLoop> {
  return requestJson<ControlLoop>(port, `/api/v1/objectives/${objectiveId}/loop/start`, {
    method: 'POST',
    body: JSON.stringify({ departmentId }),
  });
}

export interface WizardLaunchResult {
  company: Company;
  department: Department;
  objective: Objective;
  loop: ControlLoop | null;
}

export async function runCompanyWizard(
  port: number,
  input: {
    companyName: string;
    objectiveTitle: string;
    constraints?: string;
    departmentName: string;
    launchLoop: boolean;
  },
): Promise<WizardLaunchResult> {
  const company = await createCompany(port, input.companyName);
  const department = await createDepartment(port, company.id, input.departmentName);
  const objective = await createObjective(port, company.id, {
    title: input.objectiveTitle,
    constraints: input.constraints,
    priority: 'P0',
  });

  let loop: ControlLoop | null = null;
  if (input.launchLoop) {
    try {
      loop = await startControlLoop(port, objective.id, department.id);
    } catch {
      loop = null;
    }
  }

  return { company, department, objective, loop };
}

export async function createHandoff(port: number, input: CreateHandoffRequest): Promise<Handoff> {
  return requestJson<Handoff>(port, '/api/v1/handoffs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listHandoffInbox(port: number, departmentId: string): Promise<Handoff[]> {
  return requestJson<Handoff[]>(port, `/api/v1/departments/${departmentId}/handoffs/inbox`);
}

export async function getHandoffPendingCount(port: number, departmentId: string): Promise<number> {
  const res = await requestJson<{ count: number }>(
    port,
    `/api/v1/departments/${departmentId}/handoffs/pending-count`,
  );
  return res.count;
}

export async function acceptHandoff(port: number, handoffId: string): Promise<Handoff> {
  return requestJson<Handoff>(port, `/api/v1/handoffs/${handoffId}/accept`, {
    method: 'POST',
    body: '{}',
  });
}

export async function rejectHandoff(port: number, handoffId: string): Promise<Handoff> {
  return requestJson<Handoff>(port, `/api/v1/handoffs/${handoffId}/reject`, {
    method: 'POST',
    body: '{}',
  });
}

export async function replyHandoff(port: number, handoffId: string, replySummary: string): Promise<Handoff> {
  return requestJson<Handoff>(port, `/api/v1/handoffs/${handoffId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ replySummary }),
  });
}

export async function getRhythmSchedule(port: number, companyId: string): Promise<RhythmSchedule> {
  return requestJson<RhythmSchedule>(port, `/api/v1/rhythm/schedule?companyId=${companyId}`);
}

export async function updateRhythmSchedule(
  port: number,
  input: Partial<RhythmSchedule> & { companyId: string },
): Promise<RhythmSchedule> {
  return requestJson<RhythmSchedule>(port, '/api/v1/rhythm/schedule', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function listRhythmReports(port: number, companyId: string): Promise<RhythmReport[]> {
  return requestJson<RhythmReport[]>(port, `/api/v1/rhythm/reports?companyId=${companyId}`);
}

export async function getLatestRhythmReport(
  port: number,
  companyId: string,
  type?: 'daily' | 'weekly',
): Promise<RhythmReport> {
  const qs = type ? `&type=${type}` : '';
  return requestJson<RhythmReport>(port, `/api/v1/rhythm/reports/latest?companyId=${companyId}${qs}`);
}

export async function triggerRhythmReport(
  port: number,
  companyId: string,
  reportType: 'daily' | 'weekly' = 'daily',
): Promise<RhythmReport> {
  return requestJson<RhythmReport>(port, '/api/v1/rhythm/trigger', {
    method: 'POST',
    body: JSON.stringify({ companyId, reportType }),
  });
}

export async function listBlockers(port: number, companyId: string): Promise<Blocker[]> {
  return requestJson<Blocker[]>(port, `/api/v1/blockers?companyId=${companyId}`);
}

export async function resolveBlocker(port: number, blockerId: string): Promise<Blocker> {
  return requestJson<Blocker>(port, `/api/v1/blockers/${blockerId}/resolve`, {
    method: 'POST',
    body: '{}',
  });
}

export async function listAllApprovals(port: number, status?: string): Promise<Approval[]> {
  const qs = status ? `?status=${status}` : '';
  return requestJson<Approval[]>(port, `/api/v1/approvals${qs}`);
}

export async function approveRequest(port: number, approvalId: string): Promise<Approval> {
  return requestJson<Approval>(port, `/api/v1/approvals/${approvalId}/approve`, {
    method: 'POST',
    body: '{}',
  });
}

export async function rejectRequest(port: number, approvalId: string): Promise<Approval> {
  return requestJson<Approval>(port, `/api/v1/approvals/${approvalId}/reject`, {
    method: 'POST',
    body: '{}',
  });
}

export async function listCredentials(port: number): Promise<ApiCredentialView[]> {
  return requestJson<ApiCredentialView[]>(port, '/api/v1/credentials');
}

export async function upsertCredential(
  port: number,
  provider: string,
  apiKey: string,
): Promise<ApiCredentialView> {
  return requestJson<ApiCredentialView>(port, '/api/v1/credentials', {
    method: 'PUT',
    body: JSON.stringify({ provider, apiKey }),
  });
}

export async function listModelConfigs(port: number): Promise<ModelConfig[]> {
  return requestJson<ModelConfig[]>(port, '/api/v1/model-configs');
}

export async function updateModelConfig(
  port: number,
  role: LlmRole,
  input: { provider: string; modelName: string; apiBaseUrl?: string | null },
): Promise<ModelConfig> {
  return requestJson<ModelConfig>(port, `/api/v1/model-configs/${role}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function testModelConfig(port: number, role: LlmRole): Promise<ModelConfigTestResult> {
  return requestJson<ModelConfigTestResult>(port, '/api/v1/model-configs/test', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function listKeyResults(port: number, objectiveId: string): Promise<KeyResult[]> {
  return requestJson<KeyResult[]>(port, `/api/v1/objectives/${objectiveId}/key-results`);
}

export async function createKeyResult(
  port: number,
  objectiveId: string,
  input: CreateKeyResultRequest,
): Promise<KeyResult> {
  return requestJson<KeyResult>(port, `/api/v1/objectives/${objectiveId}/key-results`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function completeKeyResult(port: number, keyResultId: string): Promise<KeyResult> {
  return requestJson<KeyResult>(port, `/api/v1/key-results/${keyResultId}/complete`, {
    method: 'POST',
    body: '{}',
  });
}

export async function listProofsFiltered(
  port: number,
  companyId: string,
  filters: { type?: string; status?: string } = {},
): Promise<ProofWallItem[]> {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return requestJson<ProofWallItem[]>(
    port,
    `/api/v1/companies/${companyId}/proofs${qs ? `?${qs}` : ''}`,
  );
}

export async function acceptProof(port: number, workerRunId: string): Promise<{ acceptanceStatus: string }> {
  return requestJson(port, `/api/v1/proofs/${workerRunId}/accept`, { method: 'POST', body: '{}' });
}

export async function rejectProof(port: number, workerRunId: string): Promise<{ acceptanceStatus: string }> {
  return requestJson(port, `/api/v1/proofs/${workerRunId}/reject`, { method: 'POST', body: '{}' });
}

export async function revealAsset(port: number, assetId: string, path: string): Promise<AssetRevealResponse> {
  return requestJson<AssetRevealResponse>(port, `/api/v1/assets/${assetId}/reveal`, {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}
