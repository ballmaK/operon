import express, { type Express } from 'express';
import {
  openDatabase,
  closeDatabase,
  bootstrapAuth,
  buildSidecarContext,
  shouldRunDailyReview,
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
import { handoffsRouter } from './routes/handoffs.js';
import { rhythmRouter } from './routes/rhythm.js';
import { keyResultsRouter } from './routes/key-results.js';

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
  const ctx = buildSidecarContext(db, dataDir);

  app.locals.db = db;
  app.locals.sidecar = { dataDir, ownerId } satisfies SidecarContext;

  app.locals.rhythmTimer = setInterval(() => {
    for (const co of ctx.companies.list().filter((c) => c.status === 'active')) {
      const schedule = ctx.rhythmSchedules.get(co.id);
      if (shouldRunDailyReview(schedule)) {
        try {
          ctx.rhythm.generateReport(co.id, 'daily');
        } catch {
          /* MVP: ignore scheduler errors */
        }
      }
    }
  }, 60_000);

  app.get('/health', (_req, res) => {
    const body: HealthResponse = {
      status: 'ok',
      version: OPERON_VERSION,
    };
    res.json(body);
  });

  app.get('/api/v1/owner', (_req, res) => {
    res.json(ctx.users.getOwner());
  });

  app.use('/api/v1/credentials', credentialsRouter(ctx.credentials));
  app.use(
    '/api/v1',
    companiesRouter({
      companies: ctx.companies,
      departments: ctx.departments,
      objectives: ctx.objectives,
      tasks: ctx.tasks,
      transcripts: ctx.transcripts,
      dataDir,
    }),
  );
  app.use(
    '/api/v1',
    objectivesRouter({
      objectives: ctx.objectives,
      departments: ctx.departments,
      controlLoop: ctx.services.controlLoop,
      transcripts: ctx.transcripts,
    }),
  );
  app.use(
    '/api/v1',
    tasksRouter({
      departments: ctx.departments,
      tasks: ctx.tasks,
      runs: ctx.workerRuns,
      workers: ctx.services.worker,
    }),
  );
  app.use(
    '/api/v1',
    proofsRouter({
      db: ctx.db,
      proofAcceptance: ctx.proofAcceptance,
      transcripts: ctx.transcripts,
      dataDir,
    }),
  );
  app.use('/api/v1', keyResultsRouter(ctx.objectives, ctx.keyResults));
  app.use('/api/v1', handoffsRouter({ handoffs: ctx.handoffs, departments: ctx.departments, transcripts: ctx.transcripts }));
  app.use(
    '/api/v1',
    rhythmRouter({
      schedules: ctx.rhythmSchedules,
      reports: ctx.rhythmReports,
      blockers: ctx.blockers,
      rhythm: ctx.rhythm,
    }),
  );
  app.use('/api/v1/approvals', approvalsRouter(ctx.approvals, ctx.transcripts));
  app.use('/api/v1/model-configs', modelConfigsRouter(ctx.modelConfigs, ctx.modelRouter));
  app.use('/api/v1/skills', skillsRouter());
  app.use('/api/v1', controlLoopsRouter(ctx.services.controlLoop));
  app.use('/internal/llm', llmRouter(ctx.modelRouter));
  app.use('/internal/sandbox', sandboxRouter(ctx.sandbox, ctx.approvals));
  app.use('/internal/workers', workersRouter(ctx.services.worker));
  app.use('/internal/leads', leadsRouter(ctx.services.lead));

  return app;
}

export function closeSidecarApp(app: Express): void {
  const timer = app.locals.rhythmTimer as ReturnType<typeof setInterval> | undefined;
  if (timer) clearInterval(timer);

  const db = app.locals.db as { close?: () => void } | undefined;
  if (db && typeof db.close === 'function') {
    closeDatabase(db as Parameters<typeof closeDatabase>[0]);
    app.locals.db = undefined;
  }
}
