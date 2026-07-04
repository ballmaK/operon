import type { Proof, ProofType } from '@operon/shared-types';

export interface ProofWallItem {
  id: string;
  type: ProofType;
  path: string | null;
  url: string | null;
  summary: string;
  acceptanceStatus: 'pending' | 'accepted' | 'rejected';
  objectiveId: string;
  objectiveTitle: string;
  taskId: string;
  workerRunId: string;
  createdAt: string;
}

export interface AssetItem {
  id: string;
  name: string;
  type: 'file' | 'markdown' | 'image' | 'code' | 'other';
  path: string;
  version: number;
  taskId: string;
  objectiveTitle: string;
  createdAt: string;
}

export interface DepartmentSummary {
  id: string;
  companyId: string;
  name: string;
  charter: string;
  activeTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptQueryParams {
  limit?: number;
  offset?: number;
  actor?: string;
  actionType?: string;
}

export interface TranscriptCorrectRequest {
  companyId: string;
  message: string;
  relatedEntity?: { type: string; id: string };
}
