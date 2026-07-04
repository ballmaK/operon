import type {
  Company,
  Department,
  Objective,
  ControlLoop,
  TranscriptEntry,
  Approval,
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

export async function listDepartments(port: number, companyId: string): Promise<Department[]> {
  return requestJson<Department[]>(port, `/api/v1/companies/${companyId}/departments`);
}

export async function listObjectives(port: number, companyId: string): Promise<Objective[]> {
  return requestJson<Objective[]>(port, `/api/v1/companies/${companyId}/objectives`);
}

export async function listTranscripts(
  port: number,
  companyId: string,
  limit = 5,
): Promise<TranscriptEntry[]> {
  return requestJson<TranscriptEntry[]>(
    port,
    `/api/v1/companies/${companyId}/transcripts?limit=${limit}`,
  );
}

export async function listPendingApprovals(port: number): Promise<Approval[]> {
  const all = await requestJson<Approval[]>(port, '/api/v1/approvals');
  return all.filter((a) => a.status === 'pending');
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
