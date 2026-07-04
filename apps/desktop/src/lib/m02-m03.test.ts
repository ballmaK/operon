import { describe, expect, it } from 'vitest';
import { isTaskRunning, transcriptSummary, TASK_STATUS_LABEL } from './m02-m03.js';

describe('m02-m03 helpers', () => {
  it('labels running task status', () => {
    expect(TASK_STATUS_LABEL.running).toBe('执行中');
    expect(isTaskRunning('running')).toBe(true);
    expect(isTaskRunning('done')).toBe(false);
  });

  it('summarizes transcript payload', () => {
    expect(transcriptSummary({ message: 'Focus on enterprise' })).toBe('Focus on enterprise');
    expect(transcriptSummary({ action: 'objective_start' })).toBe('objective_start');
  });
});
