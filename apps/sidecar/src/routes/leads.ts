import { Router, type Request, type Response } from 'express';
import type { LeadService } from '@operon/db';

export function leadsRouter(lead: LeadService): Router {
  const router = Router();

  router.post('/plan', async (req: Request, res: Response) => {
    try {
      const { objectiveId, departmentId } = req.body as {
        objectiveId?: string;
        departmentId?: string;
      };
      if (!objectiveId || !departmentId) {
        res.status(400).json({ error: 'objectiveId and departmentId required' });
        return;
      }
      res.json(await lead.plan(objectiveId, departmentId));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'plan failed' });
    }
  });

  router.post('/dispatch', async (req: Request, res: Response) => {
    try {
      const { taskId, minimalMemory } = req.body as {
        taskId?: string;
        minimalMemory?: string;
      };
      if (!taskId) {
        res.status(400).json({ error: 'taskId required' });
        return;
      }
      res.json(await lead.dispatch(taskId, minimalMemory ?? ''));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'dispatch failed' });
    }
  });

  router.post('/synthesize', async (req: Request, res: Response) => {
    try {
      const { objectiveId, departmentId } = req.body as {
        objectiveId?: string;
        departmentId?: string;
      };
      if (!objectiveId || !departmentId) {
        res.status(400).json({ error: 'objectiveId and departmentId required' });
        return;
      }
      res.json(await lead.synthesize(objectiveId, departmentId));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'synthesize failed' });
    }
  });

  return router;
}
