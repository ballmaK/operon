/** P1 entities — OKR Key Results, proof acceptance filters */

export type KeyResultStatus = 'open' | 'completed' | 'cancelled';

export interface KeyResult {
  id: string;
  objectiveId: string;
  companyId: string;
  title: string;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  status: KeyResultStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKeyResultRequest {
  title: string;
  targetValue?: number | null;
  unit?: string | null;
}

export type ProofAcceptanceStatus = 'pending' | 'accepted' | 'rejected';

export interface ModelConfigTestResult {
  ok: boolean;
  role: string;
  provider: string;
  modelName: string;
  message: string;
}

export interface AssetRevealResponse {
  absolutePath: string;
}
