import { Router, type Request, type Response } from 'express';
import type { ControlLoopService } from '@operon/db';

export function controlLoopsRouter(loops: ControlLoopService): Router {
  const router = Router();

  router.post('/objectives/:id/loop/start', (req: Request, res: Response) => {
    try {
      const departmentId = (req.body as { departmentId?: string }).departmentId;
      if (!departmentId) {
        res.status(400).json({ error: 'departmentId required' });
        return;
      }
      const loop = loops.start(String(req.params.id), departmentId);
      res.status(201).json(loop);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'start failed' });
    }
  });

  router.get('/objectives/:id/loop', (req: Request, res: Response) => {
    const loop = loops.getByObjective(String(req.params.id));
    if (!loop) {
      res.status(404).json({ error: 'Loop not found' });
      return;
    }
    res.json(loop);
  });

  return router;
}
