import type { Objective, ControlLoop } from '@operon/shared-types';

export const OBJECTIVE_STATUS_LABEL: Record<Objective['status'], string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  blocked: '阻塞',
  completed: '已完成',
  archived: '已归档',
};

export const CONTROL_LOOP_PHASE_LABEL: Record<ControlLoop['phase'], string> = {
  understand: '理解',
  plan: '规划',
  dispatch: '派发',
  collect: '收集',
  synthesize: '综合',
  decide: '决策',
};

export function objectiveActions(status: Objective['status']): Array<
  'start' | 'pause' | 'resume' | 'complete' | 'message'
> {
  switch (status) {
    case 'draft':
      return ['start', 'message'];
    case 'active':
      return ['pause', 'complete', 'message'];
    case 'paused':
      return ['resume', 'message'];
    default:
      return ['message'];
  }
}

export function controlLoopProgress(phase: ControlLoop['phase'] | null): number {
  const order = ['understand', 'plan', 'dispatch', 'collect', 'synthesize', 'decide'];
  if (!phase) return 0;
  const idx = order.indexOf(phase);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / order.length) * 100);
}
