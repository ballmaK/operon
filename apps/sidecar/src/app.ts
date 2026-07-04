import express, { type Express } from 'express';
import {
  openDatabase,
  closeDatabase,
  CredentialRepo,
  ApprovalRepo,
  TranscriptRepo,
  UserRepo,
  bootstrapAuth,
} from '@operon/db';
import { OPERON_VERSION, type HealthResponse } from '@operon/shared-types';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { credentialsRouter } from './routes/credentials.js';
import { approvalsRouter } from './routes/approvals.js';

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
  app.use('/api/v1/approvals', approvalsRouter(approvals, transcripts));

  return app;
}

export function closeSidecarApp(app: Express): void {
  const db = app.locals.db as { close?: () => void } | undefined;
  if (db && typeof db.close === 'function') {
    closeDatabase(db as Parameters<typeof closeDatabase>[0]);
    app.locals.db = undefined;
  }
}
