import type { ProofType } from './index.js';

export type HandoffStatus = 'sent' | 'accepted' | 'replied' | 'rejected';

export interface Handoff {
  id: string;
  companyId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  contextSummary: string;
  assetRefs: string[];
  request: string;
  expectedProofType: ProofType;
  status: HandoffStatus;
  replySummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHandoffRequest {
  companyId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  contextSummary: string;
  assetRefs?: string[];
  request: string;
  expectedProofType: ProofType;
}

export type BlockerStatus = 'open' | 'resolved';

export interface Blocker {
  id: string;
  companyId: string;
  objectiveId: string | null;
  departmentId: string | null;
  description: string;
  status: BlockerStatus;
  createdAt: string;
  updatedAt: string;
}

export type WeeklyDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface RhythmSchedule {
  companyId: string;
  dailyTime: string;
  weeklyDay: WeeklyDay;
  timezone: string;
  updatedAt: string;
}

export type RhythmReportType = 'daily' | 'weekly';

export interface RhythmReport {
  id: string;
  companyId: string;
  reportType: RhythmReportType;
  blockers: Array<{ id: string; description: string; departmentId: string | null }>;
  pendingDecisionsCount: number;
  proofsDeliveredCount: number;
  departmentsWaiting: string[];
  objectiveSummaries: Array<{ objectiveId: string; title: string; status: string; summary: string }>;
  createdAt: string;
}
