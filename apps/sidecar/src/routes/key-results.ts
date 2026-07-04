import { Router, type Request, type Response } from 'express';
import type { KeyResultRepo, ObjectiveRepo } from '@operon/db';

export function keyResultsRouter(
  objectives: ObjectiveRepo,
  keyResults: KeyResultRepo,
): Router {
  const router = Router();

  router.get('/objectives/:id/key-results', (req: Request, res: Response) => {
    const objective = objectives.findById(String(req.params.id));
    if (!objective) {
      res.status(404).json({ error: 'Objective not found' });
      return;
    }
    res.json(keyResults.listByObjective(objective.id));
  });

  router.post('/objectives/:id/key-results', (req: Request, res: Response) => {
    const objective = objectives.findById(String(req.params.id));
    if (!objective) {
      res.status(404).json({ error: 'Objective not found' });
      return;
    }
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (title.length < 3) {
      res.status(400).json({ error: 'Key Result title must be at least 3 characters' });
      return;
    }
    const kr = keyResults.create(objective.id, objective.companyId, {
      title,
      targetValue: req.body?.targetValue ?? null,
      unit: req.body?.unit ?? null,
    });
    res.status(201).json(kr);
  });

  router.post('/key-results/:id/complete', (req: Request, res: Response) => {
    const updated = keyResults.setStatus(String(req.params.id), 'completed');
    if (!updated) {
      res.status(404).json({ error: 'Key Result not found' });
      return;
    }
    res.json(updated);
  });

  return router;
}
