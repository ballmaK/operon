import type { TaskStatus, WorkerStatus } from '@operon/shared-types';

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: '待派发',
  running: '执行中',
  proof: '待验收',
  done: '已完成',
  failed: '失败',
  cancelled: '已取消',
};

export const WORKER_STATUS_LABEL: Record<WorkerStatus, string> = {
  spawning: '启动中',
  running: '运行中',
  done: '已完成',
  failed: '失败',
};

export function isTaskRunning(status: TaskStatus): boolean {
  return status === 'running' || status === 'proof';
}

export function transcriptSummary(payload: Record<string, unknown>): string {
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.summary === 'string') return payload.summary;
  if (typeof payload.action === 'string') return payload.action;
  if (typeof payload.skill === 'string') return `skill: ${payload.skill}`;
  return JSON.stringify(payload).slice(0, 120);
}
