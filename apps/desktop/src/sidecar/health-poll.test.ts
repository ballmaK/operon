import { describe, expect, it, vi } from 'vitest';
import { pollSidecarHealth, sidecarBaseUrl } from './health-poll.js';

describe('pollSidecarHealth', () => {
  it('returns health when sidecar responds ok', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', version: '0.1.0' }),
    });

    const result = await pollSidecarHealth('http://127.0.0.1:3721', {
      maxAttempts: 1,
      fetchFn,
    });

    expect(result.version).toBe('0.1.0');
    expect(fetchFn).toHaveBeenCalledWith('http://127.0.0.1:3721/health');
  });

  it('retries until sidecar is ready', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', version: '0.1.0' }),
      });

    const result = await pollSidecarHealth('http://127.0.0.1:3721', {
      maxAttempts: 3,
      intervalMs: 1,
      fetchFn,
    });

    expect(result.status).toBe('ok');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('throws after max attempts', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('down'));

    await expect(
      pollSidecarHealth('http://127.0.0.1:3721', {
        maxAttempts: 2,
        intervalMs: 1,
        fetchFn,
      }),
    ).rejects.toThrow(/failed after 2 attempts/);
  });
});

describe('sidecarBaseUrl', () => {
  it('uses default M12 port 3721', () => {
    expect(sidecarBaseUrl(3721)).toBe('http://127.0.0.1:3721');
  });
});
