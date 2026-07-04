import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { OPERON_VERSION } from '@operon/shared-types';

describe('Sidecar GET /health', () => {
  it('returns ok status and version', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      version: OPERON_VERSION,
    });
  });
});
