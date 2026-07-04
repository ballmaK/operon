import { Router, type Request, type Response } from 'express';
import type { DepartmentRepo } from '@operon/db';
import type { TaskRepo } from '@operon/db';
import type { WorkerRunRepo } from '@operon/db';
import type { WorkerService } from '@operon/db';

export interface TasksRouterDeps {
  departments: DepartmentRepo;
  tasks: TaskRepo;
  runs: WorkerRunRepo;
  workers: WorkerService;
}

export function tasksRouter(deps: TasksRouterDeps): Router {
  const router = Router();

  router.get('/departments/:id/tasks', (req: Request, res: Response) => {
    const department = deps.departments.findById(String(req.params.id));
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    res.json(deps.tasks.listByDepartment(department.id));
  });

  router.get('/departments/:id', (req: Request, res: Response) => {
    const department = deps.departments.findById(String(req.params.id));
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    res.json({
      ...department,
      activeTaskCount: deps.tasks.countActiveByDepartment(department.id),
    });
  });

  router.get('/tasks/:id', (req: Request, res: Response) => {
    const task = deps.tasks.findById(String(req.params.id));
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  });

  router.get('/tasks/:id/runs', (req: Request, res: Response) => {
    const task = deps.tasks.findById(String(req.params.id));
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(deps.runs.listByTask(task.id));
  });

  router.get('/workers/:id', (req: Request, res: Response) => {
    const run = deps.workers.getStatus(String(req.params.id));
    if (!run) {
      res.status(404).json({ error: 'Worker run not found' });
      return;
    }
    res.json(run);
  });

  return router;
}
