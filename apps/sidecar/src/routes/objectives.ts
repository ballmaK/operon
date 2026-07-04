import { Router, type Request, type Response } from 'express';
import type { ControlLoopService } from '@operon/db';
import type { DepartmentRepo } from '@operon/db';
import type { ObjectiveRepo } from '@operon/db';
import type { TranscriptRepo } from '@operon/db';
import {
  validateObjectiveTitle,
  validateObjectiveConstraints,
  nextStatus,
} from '@operon/db';

export interface ObjectivesRouterDeps {
  objectives: ObjectiveRepo;
  departments: DepartmentRepo;
  controlLoop: ControlLoopService;
  transcripts: TranscriptRepo;
}

function findObjectiveOr404(
  objectives: ObjectiveRepo,
  id: string,
  res: Response,
) {
  const objective = objectives.findById(id);
  if (!objective) {
    res.status(404).json({ error: 'Objective not found' });
    return null;
  }
  return objective;
}

export function objectivesRouter(deps: ObjectivesRouterDeps): Router {
  const router = Router();

  router.get('/objectives/:id', (req: Request, res: Response) => {
    const objective = findObjectiveOr404(deps.objectives, String(req.params.id), res);
    if (!objective) return;
    const loop = deps.controlLoop.getByObjective(objective.id);
    res.json({ ...objective, controlLoop: loop });
  });

  router.put('/objectives/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const existing = findObjectiveOr404(deps.objectives, id, res);
    if (!existing) return;

    if (existing.status !== 'draft' && existing.status !== 'paused') {
      res.status(400).json({ error: '仅草稿或暂停状态可编辑' });
      return;
    }

    try {
      const title =
        req.body?.title !== undefined ? validateObjectiveTitle(req.body.title) : undefined;
      const constraints =
        req.body?.constraints !== undefined
          ? validateObjectiveConstraints(req.body.constraints)
          : undefined;
      const priority = req.body?.priority as 'P0' | 'P1' | 'P2' | undefined;
      const updated = deps.objectives.update(id, { title, constraints, priority });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid input' });
    }
  });

  router.post('/objectives/:id/start', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const objective = findObjectiveOr404(deps.objectives, id, res);
    if (!objective) return;

    try {
      nextStatus(objective.status, 'start');
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid transition' });
      return;
    }

    let departmentId = (req.body as { departmentId?: string }).departmentId;
    if (!departmentId) {
      const depts = deps.departments.listByCompany(objective.companyId);
      if (depts.length === 0) {
        res.status(400).json({ error: '请先创建部门' });
        return;
      }
      departmentId = depts[0].id;
    }

    deps.objectives.setStatus(id, 'active');
    deps.transcripts.append({
      companyId: objective.companyId,
      actor: 'owner',
      actionType: 'input',
      payload: { action: 'objective_start', objectiveId: id },
      relatedEntity: { type: 'objective', id },
    });

    try {
      const loop = deps.controlLoop.start(id, departmentId);
      res.json({ objective: deps.objectives.findById(id), loop });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'start failed' });
    }
  });

  router.post('/objectives/:id/pause', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const objective = findObjectiveOr404(deps.objectives, id, res);
    if (!objective) return;
    try {
      const status = nextStatus(objective.status, 'pause');
      res.json(deps.objectives.setStatus(id, status));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid transition' });
    }
  });

  router.post('/objectives/:id/resume', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const objective = findObjectiveOr404(deps.objectives, id, res);
    if (!objective) return;
    try {
      const status = nextStatus(objective.status, 'resume');
      res.json(deps.objectives.setStatus(id, status));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid transition' });
    }
  });

  router.post('/objectives/:id/complete', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const objective = findObjectiveOr404(deps.objectives, id, res);
    if (!objective) return;
    try {
      const status = nextStatus(objective.status, 'complete');
      const updated = deps.objectives.setStatus(id, status);
      deps.transcripts.append({
        companyId: objective.companyId,
        actor: 'owner',
        actionType: 'decision',
        payload: { action: 'objective_complete', objectiveId: id },
        relatedEntity: { type: 'objective', id },
      });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid transition' });
    }
  });

  router.post('/objectives/:id/messages', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const objective = findObjectiveOr404(deps.objectives, id, res);
    if (!objective) return;

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      res.status(400).json({ error: 'message required' });
      return;
    }

    const entry = deps.transcripts.append({
      companyId: objective.companyId,
      actor: 'owner',
      actionType: 'input',
      payload: { action: 'owner_message', objectiveId: id, message },
      relatedEntity: { type: 'objective', id },
    });
    res.status(201).json(entry);
  });

  return router;
}
