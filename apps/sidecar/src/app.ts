import express, { type Express } from 'express';
import { OPERON_VERSION, type HealthResponse } from '@operon/shared-types';

export interface SidecarOptions {
  dataDir?: string;
}

export function createApp(_options: SidecarOptions = {}): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    const body: HealthResponse = {
      status: 'ok',
      version: OPERON_VERSION,
    };
    res.json(body);
  });

  return app;
}
