import { Router, type Request, type Response } from 'express';
import type { CredentialRepo } from '@operon/db';

export function credentialsRouter(credentials: CredentialRepo): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(credentials.list());
  });

  router.put('/', (req: Request, res: Response) => {
    const { provider, apiKey } = req.body as { provider?: string; apiKey?: string };
    if (!provider || !apiKey) {
      res.status(400).json({ error: 'provider and apiKey required' });
      return;
    }
    const saved = credentials.upsert({ provider, apiKey });
    res.json(saved);
  });

  return router;
}
