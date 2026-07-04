import { Router, type Request, type Response } from 'express';
import type { ModelConfigRepo } from '@operon/db';

export function modelConfigsRouter(configs: ModelConfigRepo): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(configs.list());
  });

  return router;
}
