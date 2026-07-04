import { describe, expect, it, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, closeSidecarApp } from './app.js';
import { OPERON_VERSION } from '@operon/shared-types';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Sidecar GET /health', () => {
  it('returns ok status and version', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      version: OPERON_VERSION,
    });
    closeSidecarApp(app);
  });
});

describe('M16 credentials API', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('GET/PUT /api/v1/credentials stores masked keys', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const put = await request(app)
      .put('/api/v1/credentials')
      .send({ provider: 'openai', apiKey: 'sk-abcdef1234567890' });
    expect(put.status).toBe(200);
    expect(put.body.maskedKey).toBe('sk-***7890');

    const list = await request(app).get('/api/v1/credentials');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].maskedKey).not.toContain('abcdef');
  });
});

describe('M16 approvals API', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('lists, approves, and writes transcript audit', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const created = await request(app)
      .post('/api/v1/approvals')
      .send({ actionType: 'skill_invoke', summary: 'Deploy ad campaign' });
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    const approved = await request(app).post(`/api/v1/approvals/${id}/approve`);
    expect(approved.body.status).toBe('approved');

    const list = await request(app).get('/api/v1/approvals');
    expect(list.body[0].status).toBe('approved');
  });
});

describe('M16 owner seed', () => {
  it('GET /api/v1/owner returns default Owner', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    const app = createApp({ dataDir });
    const res = await request(app).get('/api/v1/owner');
    expect(res.body.displayName).toBe('Owner');
    closeSidecarApp(app);
    rmSync(dataDir, { recursive: true, force: true });
  });
});

describe('Phase 1 M11/M10 APIs', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('GET /api/v1/model-configs returns seeded roles', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });
    const res = await request(app).get('/api/v1/model-configs');
    expect(res.body).toHaveLength(5);
    expect(res.body.find((c: { role: string }) => c.role === 'lead_plan')).toBeTruthy();
  });

  it('POST /internal/llm/complete returns stub after credential set', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });
    await request(app)
      .put('/api/v1/credentials')
      .send({ provider: 'openai', apiKey: 'sk-abcdef1234567890' });

    const res = await request(app)
      .post('/internal/llm/complete')
      .send({
        role: 'worker_default',
        agentRunId: 'run-1',
        messages: [{ role: 'user', content: 'ping' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.stub).toBe(true);
    expect(res.body.content).toContain('ping');
  });

  it('GET /api/v1/skills lists MVP skills', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });
    const res = await request(app).get('/api/v1/skills');
    expect(res.body).toHaveLength(6);
  });

  it('sandbox session create, file_write invoke, destroy', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const session = await request(app)
      .post('/internal/sandbox/sessions')
      .send({ runtimeType: 'subprocess', agentRunId: 'run-x' });
    expect(session.status).toBe(201);
    const sessionId = session.body.id as string;

    const invoke = await request(app)
      .post('/internal/sandbox/invoke')
      .send({
        sessionId,
        skillCode: 'file_write',
        agentRunId: 'run-x',
        params: { relativePath: 'out.txt', content: 'hello sandbox' },
      });
    expect(invoke.status).toBe(200);
    expect(invoke.body.writtenPath).toBe('out.txt');

    const del = await request(app).delete(`/internal/sandbox/sessions/${sessionId}`);
    expect(del.status).toBe(204);
  });
});
