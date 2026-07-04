import { describe, expect, it } from 'vitest';
import { sidecarStatusLabel } from './hooks/useSidecarStatus.js';

describe('sidecarStatusLabel', () => {
  it('maps SC_RUNNING to 运行中', () => {
    expect(sidecarStatusLabel('SC_RUNNING')).toBe('运行中');
  });

  it('maps SC_ERROR to 异常', () => {
    expect(sidecarStatusLabel('SC_ERROR')).toBe('异常');
  });
});
