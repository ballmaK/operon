import { describe, expect, it } from 'vitest';
import { canTransition, nextStatus } from './objective-status.js';

describe('objective status transitions', () => {
  it('allows start from draft', () => {
    expect(canTransition('draft', 'start')).toBe(true);
    expect(nextStatus('draft', 'start')).toBe('active');
  });

  it('rejects pause from draft', () => {
    expect(canTransition('draft', 'pause')).toBe(false);
    expect(() => nextStatus('draft', 'pause')).toThrow();
  });

  it('allows complete from active', () => {
    expect(nextStatus('active', 'complete')).toBe('completed');
  });
});
