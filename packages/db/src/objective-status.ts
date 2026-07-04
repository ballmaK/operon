import type { Objective } from '@operon/shared-types';

export type ObjectiveAction = 'start' | 'pause' | 'resume' | 'complete';

const TRANSITIONS: Record<ObjectiveAction, { from: Objective['status'][]; to: Objective['status'] }> = {
  start: { from: ['draft', 'paused'], to: 'active' },
  pause: { from: ['active'], to: 'paused' },
  resume: { from: ['paused'], to: 'active' },
  complete: { from: ['active'], to: 'completed' },
};

export function canTransition(
  status: Objective['status'],
  action: ObjectiveAction,
): boolean {
  return TRANSITIONS[action].from.includes(status);
}

export function nextStatus(
  status: Objective['status'],
  action: ObjectiveAction,
): Objective['status'] {
  if (!canTransition(status, action)) {
    throw new Error(`Cannot ${action} objective in status ${status}`);
  }
  return TRANSITIONS[action].to;
}

export const OBJECTIVE_STATUS_LABEL: Record<Objective['status'], string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  blocked: '阻塞',
  completed: '已完成',
  archived: '已归档',
};

export const CONTROL_LOOP_PHASE_LABEL: Record<string, string> = {
  understand: '理解',
  plan: '规划',
  dispatch: '派发',
  collect: '收集',
  synthesize: '综合',
  decide: '决策',
};
