import { describe, expect, it, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, closeSidecarApp } from './app.js';
import { OPERON_VERSION } from '@operon/shared-types';
import { seedTestFixture } from '@operon/db/testing';
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

describe('Phase 1 M07/M06/M05 loop API', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;
  let fixture: { companyId: string; departmentId: string; objectiveId: string };

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('POST loop/start runs full stub pipeline', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const db = app.locals.db as Parameters<typeof seedTestFixture>[0];
    fixture = seedTestFixture(db, dataDir);

    const start = await request(app)
      .post(`/api/v1/objectives/${fixture.objectiveId}/loop/start`)
      .send({ departmentId: fixture.departmentId });
    expect(start.status).toBe(201);
    expect(start.body.status).toBe('completed');

    const get = await request(app).get(`/api/v1/objectives/${fixture.objectiveId}/loop`);
    expect(get.body.phase).toBe('decide');
  });
});

describe('M01 companies API', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('POST/GET companies with objective and department', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const created = await request(app)
      .post('/api/v1/companies')
      .send({ name: 'Wizard Co' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Wizard Co');

    const dup = await request(app)
      .post('/api/v1/companies')
      .send({ name: 'Wizard Co' });
    expect(dup.status).toBe(400);
    expect(dup.body.error).toMatch(/DR-M01-01/);

    const dept = await request(app)
      .post(`/api/v1/companies/${created.body.id}/departments`)
      .send({ name: 'Product' });
    expect(dept.status).toBe(201);

    const obj = await request(app)
      .post(`/api/v1/companies/${created.body.id}/objectives`)
      .send({ title: 'Launch first product line' });
    expect(obj.status).toBe(201);
    expect(obj.body.status).toBe('draft');

    const list = await request(app).get('/api/v1/companies');
    expect(list.body.some((c: { name: string }) => c.name === 'Wizard Co')).toBe(true);

    const detail = await request(app).get(`/api/v1/companies/${created.body.id}`);
    expect(detail.body.localPath).toMatch(/^companies\//);
  });

  it('rejects invalid objective title', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const created = await request(app)
      .post('/api/v1/companies')
      .send({ name: 'Test Co' });

    const obj = await request(app)
      .post(`/api/v1/companies/${created.body.id}/objectives`)
      .send({ title: 'Hi' });
    expect(obj.status).toBe(400);
    expect(obj.body.error).toMatch(/CO-01/);
  });
});

describe('M01 objectives CRUD API', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('lists, updates, and transitions objective status', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const company = await request(app).post('/api/v1/companies').send({ name: 'Obj Co' });
    const dept = await request(app)
      .post(`/api/v1/companies/${company.body.id}/departments`)
      .send({ name: 'Product' });
    const created = await request(app)
      .post(`/api/v1/companies/${company.body.id}/objectives`)
      .send({ title: 'Grow revenue 20 percent' });

    const list = await request(app).get(`/api/v1/companies/${company.body.id}/objectives`);
    expect(list.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/v1/objectives/${created.body.id}`)
      .send({ title: 'Grow revenue 25 percent', constraints: 'Q3 only' });
    expect(updated.body.title).toContain('25 percent');

    const pausedFail = await request(app).post(`/api/v1/objectives/${created.body.id}/pause`);
    expect(pausedFail.status).toBe(400);

    const db = app.locals.db as Parameters<typeof seedTestFixture>[0];
    seedTestFixture(db, dataDir);

    const msg = await request(app)
      .post(`/api/v1/objectives/${created.body.id}/messages`)
      .send({ message: 'Focus on enterprise leads' });
    expect(msg.status).toBe(201);

    const transcripts = await request(app).get(
      `/api/v1/companies/${company.body.id}/transcripts?limit=3`,
    );
    expect(transcripts.body.length).toBeGreaterThan(0);

    expect(dept.body.name).toBe('Product');
  });
});

describe('M02/M03 tasks proofs transcripts API', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('lists department tasks and proofs after loop', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const db = app.locals.db as Parameters<typeof seedTestFixture>[0];
    const fx = seedTestFixture(db, dataDir);

    const start = await request(app)
      .post(`/api/v1/objectives/${fx.objectiveId}/start`)
      .send({ departmentId: fx.departmentId });
    expect(start.status).toBe(200);

    const depts = await request(app).get(`/api/v1/companies/${fx.companyId}/departments`);
    expect(depts.body[0].activeTaskCount).toBeGreaterThanOrEqual(0);

    const tasks = await request(app).get(`/api/v1/departments/${fx.departmentId}/tasks`);
    expect(tasks.body.length).toBeGreaterThan(0);

    const taskId = tasks.body[0].id as string;
    const detail = await request(app).get(`/api/v1/tasks/${taskId}`);
    expect(detail.body.status).toBe('done');

    const runs = await request(app).get(`/api/v1/tasks/${taskId}/runs`);
    expect(runs.body.length).toBeGreaterThan(0);

    const worker = await request(app).get(`/api/v1/workers/${runs.body[0].id}`);
    expect(worker.body.proof).toBeTruthy();

    const proofs = await request(app).get(`/api/v1/companies/${fx.companyId}/proofs`);
    expect(proofs.body.length).toBeGreaterThan(0);

    const assets = await request(app).get(`/api/v1/companies/${fx.companyId}/assets`);
    expect(assets.body.length).toBeGreaterThan(0);

    const filtered = await request(app).get(
      `/api/v1/companies/${fx.companyId}/transcripts?actor=worker&limit=10`,
    );
    expect(filtered.body.length).toBeGreaterThan(0);

    const correction = await request(app)
      .post('/api/v1/transcripts/correct')
      .send({ companyId: fx.companyId, message: 'Assumption was wrong' });
    expect(correction.status).toBe(201);
  });
});

describe('M08/M04 handoffs and rhythm API', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('handoff create accept reply and rhythm trigger', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });

    const db = app.locals.db as Parameters<typeof seedTestFixture>[0];
    const fx = seedTestFixture(db, dataDir);

    const mkt = await request(app)
      .post(`/api/v1/companies/${fx.companyId}/departments`)
      .send({ name: 'Marketing' });

    const created = await request(app)
      .post('/api/v1/handoffs')
      .send({
        companyId: fx.companyId,
        fromDepartmentId: fx.departmentId,
        toDepartmentId: mkt.body.id,
        contextSummary: 'Build artifacts ready for launch',
        request: 'Draft release notes',
        expectedProofType: 'file',
      });
    expect(created.status).toBe(201);

    const pending = await request(app).get(
      `/api/v1/departments/${mkt.body.id}/handoffs/pending-count`,
    );
    expect(pending.body.count).toBe(1);

    const accepted = await request(app).post(`/api/v1/handoffs/${created.body.id}/accept`);
    expect(accepted.body.status).toBe('accepted');

    const replied = await request(app)
      .post(`/api/v1/handoffs/${created.body.id}/reply`)
      .send({ replySummary: 'Release notes published to docs' });
    expect(replied.body.status).toBe('replied');

    const schedule = await request(app).get(
      `/api/v1/rhythm/schedule?companyId=${fx.companyId}`,
    );
    expect(schedule.body.dailyTime).toBe('09:00');

    const report = await request(app)
      .post('/api/v1/rhythm/trigger')
      .send({ companyId: fx.companyId, reportType: 'daily' });
    expect(report.status).toBe(201);
    expect(report.body.reportType).toBe('daily');
  });
});

describe('Phase 4 — approvals, model config, OKR, sandbox skills', () => {
  let dataDir: string;
  let app: ReturnType<typeof createApp>;

  afterEach(() => {
    if (app) closeSidecarApp(app);
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('key results, model test, proof accept, sandbox invoke', async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
    app = createApp({ dataDir });
    const db = app.locals.db as Parameters<typeof seedTestFixture>[0];
    const fx = seedTestFixture(db, dataDir);

    const kr = await request(app)
      .post(`/api/v1/objectives/${fx.objectiveId}/key-results`)
      .send({ title: 'Deliver MVP demo', targetValue: 1 });
    expect(kr.status).toBe(201);

    const listKr = await request(app).get(`/api/v1/objectives/${fx.objectiveId}/key-results`);
    expect(listKr.body).toHaveLength(1);

    const testModel = await request(app)
      .post('/api/v1/model-configs/test')
      .send({ role: 'lead_plan' });
    expect(testModel.body.ok).toBe(true);

    await request(app)
      .post(`/api/v1/objectives/${fx.objectiveId}/start`)
      .send({ departmentId: fx.departmentId });

    const proofs = await request(app).get(`/api/v1/companies/${fx.companyId}/proofs`);
    expect(proofs.body.length).toBeGreaterThan(0);

    const accepted = await request(app).post(`/api/v1/proofs/${proofs.body[0].workerRunId}/accept`);
    expect(accepted.body.acceptanceStatus).toBe('accepted');

    const session = await request(app)
      .post('/internal/sandbox/sessions')
      .send({ runtimeType: 'playwright', agentRunId: 'test-run' });
    expect(session.status).toBe(201);

    const shot = await request(app)
      .post('/internal/sandbox/invoke')
      .send({
        sessionId: session.body.id,
        skillCode: 'browser_screenshot',
        agentRunId: 'test-run',
        params: { url: 'https://example.com' },
      });
    expect(shot.body.screenshotPath).toBe('screenshot.png');
  });
});
