import { describe, expect, it } from 'vitest';
import { OPERON_VERSION, SIDECAR_DEFAULT_PORT } from './index.js';

describe('@operon/shared-types', () => {
  it('exports default sidecar port from M12 PRD', () => {
    expect(SIDECAR_DEFAULT_PORT).toBe(3721);
  });

  it('exports operon version', () => {
    expect(OPERON_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
