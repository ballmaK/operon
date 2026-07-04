import { Router, type Request, type Response } from 'express';
import type { WorkerService } from '@operon/db';
import type { SpawnWorkerRequest } from '@operon/shared-types';

export function workersRouter(workers: WorkerService): Router {
  const router = Router();

  router.post('/spawn', (req: Request, res: Response) => {
    try {
      const body = req.body as SpawnWorkerRequest;
      const run = workers.spawn(body);
      res.status(201).json(run);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'spawn failed' });
    }
  });

  router.post('/:id/run-stub', async (req: Request, res: Response) => {
    try {
      const run = await workers.runReact(String(req.params.id));
      res.json(run);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'run failed' });
    }
  });

  router.get('/:id/status', (req: Request, res: Response) => {
    const run = workers.getStatus(String(req.params.id));
    if (!run) {
      res.status(404).json({ error: 'Worker not found' });
      return;
    }
    res.json(run);
  });

  return router;
}
