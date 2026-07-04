import { Router, type Request, type Response } from 'express';
import { MVP_SKILLS } from '@operon/db';

export function skillsRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(MVP_SKILLS);
  });

  return router;
}
