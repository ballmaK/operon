import { Router, type Request, type Response } from 'express';
import type { BlockerRepo } from '@operon/db';
import type { RhythmService } from '@operon/db';
import type { RhythmReportRepo, RhythmScheduleRepo } from '@operon/db';
import type { WeeklyDay } from '@operon/shared-types';

export interface RhythmRouterDeps {
  schedules: RhythmScheduleRepo;
  reports: RhythmReportRepo;
  blockers: BlockerRepo;
  rhythm: RhythmService;
}

export function rhythmRouter(deps: RhythmRouterDeps): Router {
  const router = Router();

  router.get('/rhythm/schedule', (req: Request, res: Response) => {
    const companyId = String(req.query.companyId ?? '');
    if (!companyId) {
      res.status(400).json({ error: 'companyId required' });
      return;
    }
    res.json(deps.schedules.get(companyId));
  });

  router.put('/rhythm/schedule', (req: Request, res: Response) => {
    const companyId = String(req.body?.companyId ?? '');
    if (!companyId) {
      res.status(400).json({ error: 'companyId required' });
      return;
    }
    res.json(
      deps.schedules.upsert({
        companyId,
        dailyTime: req.body?.dailyTime as string | undefined,
        weeklyDay: req.body?.weeklyDay as WeeklyDay | undefined,
        timezone: req.body?.timezone as string | undefined,
      }),
    );
  });

  router.get('/rhythm/reports', (req: Request, res: Response) => {
    const companyId = String(req.query.companyId ?? '');
    if (!companyId) {
      res.status(400).json({ error: 'companyId required' });
      return;
    }
    res.json(deps.reports.list(companyId));
  });

  router.get('/rhythm/reports/latest', (req: Request, res: Response) => {
    const companyId = String(req.query.companyId ?? '');
    const reportType = req.query.type as 'daily' | 'weekly' | undefined;
    if (!companyId) {
      res.status(400).json({ error: 'companyId required' });
      return;
    }
    const latest = deps.reports.latest(companyId, reportType);
    if (!latest) {
      res.status(404).json({ error: 'No report yet' });
      return;
    }
    res.json(latest);
  });

  router.post('/rhythm/trigger', (req: Request, res: Response) => {
    const companyId = String(req.body?.companyId ?? '');
    const reportType = (req.body?.reportType as 'daily' | 'weekly') ?? 'daily';
    if (!companyId) {
      res.status(400).json({ error: 'companyId required' });
      return;
    }
    res.status(201).json(deps.rhythm.generateReport(companyId, reportType));
  });

  router.get('/blockers', (req: Request, res: Response) => {
    const companyId = String(req.query.companyId ?? '');
    if (!companyId) {
      res.status(400).json({ error: 'companyId required' });
      return;
    }
    const status = req.query.status as 'open' | 'resolved' | undefined;
    res.json(deps.blockers.listByCompany(companyId, status));
  });

  router.post('/blockers/:id/resolve', (req: Request, res: Response) => {
    const updated = deps.blockers.resolve(String(req.params.id));
    if (!updated) {
      res.status(404).json({ error: 'Blocker not found' });
      return;
    }
    res.json(updated);
  });

  return router;
}
