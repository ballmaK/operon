import { describe, expect, it } from 'vitest';
import { OPERON_VERSION, SIDECAR_DEFAULT_PORT } from '@operon/shared-types';

describe('@operon/desktop scaffold', () => {
  it('uses shared sidecar default port from M12 PRD', () => {
    expect(SIDECAR_DEFAULT_PORT).toBe(3721);
  });

  it('displays operon version', () => {
    expect(OPERON_VERSION).toBeTruthy();
  });
});
