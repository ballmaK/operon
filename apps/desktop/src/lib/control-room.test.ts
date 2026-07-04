import { describe, expect, it } from 'vitest';
import { controlLoopProgress, objectiveActions } from './control-room.js';

describe('control-room helpers', () => {
  it('shows start for draft objectives', () => {
    expect(objectiveActions('draft')).toContain('start');
  });

  it('shows pause for active objectives', () => {
    expect(objectiveActions('active')).toContain('pause');
  });

  it('computes loop progress from phase', () => {
    expect(controlLoopProgress('decide')).toBe(100);
    expect(controlLoopProgress('understand')).toBe(17);
  });
});
