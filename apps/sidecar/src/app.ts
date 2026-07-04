import express, { type Express } from 'express';
import {
  openDatabase,
  closeDatabase,
  CredentialRepo,
  ApprovalRepo,
  TranscriptRepo,
  UserRepo,
  ModelConfigRepo,
  ModelRouter,
  SandboxManager,
  bootstrapAuth,
  buildOperonServices,
  CompanyRepo,
  DepartmentRepo,
  ObjectiveRepo,
  TaskRepo,
  WorkerRunRepo,
  listAssetsForCompany,
  listProofsForCompany,
} from '@operon/db';
import { OPERON_VERSION, type HealthResponse } from '@operon/shared-types';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { credentialsRouter } from './routes/credentials.js';
import { approvalsRouter } from './routes/approvals.js';
import { modelConfigsRouter } from './routes/model-configs.js';
import { llmRouter } from './routes/llm.js';
import { skillsRouter } from './routes/skills.js';
import { sandboxRouter } from './routes/sandbox.js';
import { workersRouter } from './routes/workers.js';
import { leadsRouter } from './routes/leads.js';
import { controlLoopsRouter } from './routes/control-loops.js';
import { companiesRouter } from './routes/companies.js';
import { objectivesRouter } from './routes/objectives.js';
import { tasksRouter } from './routes/tasks.js';
import { proofsRouter } from './routes/proofs.js';

export interface SidecarOptions {
  dataDir?: string;
}

export interface SidecarContext {
  dataDir: string;
  ownerId: string;
}

export function createApp(options: SidecarOptions = {}): Express {
  const app = express();
  app.use(express.json());

  const dataDir =
    options.dataDir ?? mkdtempSync(join(tmpdir(), 'operon-sidecar-'));
  const db = openDatabase({ dataDir });
  const { ownerId } = bootstrapAuth(db);

  const credentials = new CredentialRepo(db, dataDir);
  const approvals = new ApprovalRepo(db);
  const transcripts = new TranscriptRepo(db);
  const users = new UserRepo(db);
  const modelConfigs = new ModelConfigRepo(db);
  const modelRouter = new ModelRouter(modelConfigs, credentials);
  const sandbox = new SandboxManager(dataDir);
  const services = buildOperonServices(db, dataDir);
  const companies = new CompanyRepo(db);
  const departments = new DepartmentRepo(db);
  const objectives = new ObjectiveRepo(db);
  const tasks = new TaskRepo(db);
  const workerRuns = new WorkerRunRepo(db);

  app.locals.db = db;
  app.locals.sidecar = { dataDir, ownerId } satisfies SidecarContext;

  app.get('/health', (_req, res) => {
    const body: HealthResponse = {
      status: 'ok',
      version: OPERON_VERSION,
    };
    res.json(body);
  });

  app.get('/api/v1/owner', (_req, res) => {
    res.json(users.getOwner());
  });

  app.use('/api/v1/credentials', credentialsRouter(credentials));
  app.use('/api/v1', companiesRouter({ companies, departments, objectives, tasks, transcripts, dataDir }));
  app.use(
    '/api/v1',
    objectivesRouter({
      objectives,
      departments,
      controlLoop: services.controlLoop,
      transcripts,
    }),
  );
  app.use(
    '/api/v1',
    tasksRouter({
      departments,
      tasks,
      runs: workerRuns,
      workers: services.worker,
    }),
  );
  app.use('/api/v1', proofsRouter({
    listProofs: (companyId) => listProofsForCompany(db, companyId),
    listAssets: (companyId) => listAssetsForCompany(db, companyId),
    transcripts,
    dataDir,
  }));
  app.use('/api/v1/approvals', approvalsRouter(approvals, transcripts));
  app.use('/api/v1/model-configs', modelConfigsRouter(modelConfigs));
  app.use('/api/v1/skills', skillsRouter());
  app.use('/api/v1', controlLoopsRouter(services.controlLoop));
  app.use('/internal/llm', llmRouter(modelRouter));
  app.use('/internal/sandbox', sandboxRouter(sandbox));
  app.use('/internal/workers', workersRouter(services.worker));
  app.use('/internal/leads', leadsRouter(services.lead));

  return app;
}

export function closeSidecarApp(app: Express): void {
  const db = app.locals.db as { close?: () => void } | undefined;
  if (db && typeof db.close === 'function') {
    closeDatabase(db as Parameters<typeof closeDatabase>[0]);
    app.locals.db = undefined;
  }
}
