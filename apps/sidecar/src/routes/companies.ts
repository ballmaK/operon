import { Router, type Request, type Response } from 'express';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CompanyRepo } from '@operon/db';
import type { DepartmentRepo } from '@operon/db';
import type { ObjectiveRepo } from '@operon/db';
import type { TranscriptRepo } from '@operon/db';
import type { TaskRepo } from '@operon/db';
import { AUDIT_COMPANY_ID } from '@operon/db';
import {
  validateCompanyName,
  validateObjectiveTitle,
  validateObjectiveConstraints,
} from '@operon/db';

export interface CompaniesRouterDeps {
  companies: CompanyRepo;
  departments: DepartmentRepo;
  objectives: ObjectiveRepo;
  tasks: TaskRepo;
  transcripts: TranscriptRepo;
  dataDir: string;
}

export function companiesRouter(deps: CompaniesRouterDeps): Router {
  const router = Router();

  router.get('/companies', (_req: Request, res: Response) => {
    const list = deps.companies
      .list()
      .filter((c) => c.id !== AUDIT_COMPANY_ID && c.status === 'active');
    res.json(list);
  });

  router.post('/companies', (req: Request, res: Response) => {
    try {
      const name = validateCompanyName(req.body?.name);
      if (deps.companies.findByName(name)) {
        res.status(400).json({ error: '公司名称已存在（DR-M01-01）' });
        return;
      }

      const company = deps.companies.create({ name });

      mkdirSync(join(deps.dataDir, company.localPath), { recursive: true });

      deps.transcripts.append({
        companyId: company.id,
        actor: 'owner',
        actionType: 'input',
        payload: { action: 'company_created', name },
        relatedEntity: { type: 'company', id: company.id },
      });

      res.status(201).json(company);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid input' });
    }
  });

  router.get('/companies/:id', (req: Request, res: Response) => {
    const company = deps.companies.findById(String(req.params.id));
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  });

  router.post('/companies/:id/departments', (req: Request, res: Response) => {
    const company = deps.companies.findById(String(req.params.id));
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      res.status(400).json({ error: '部门名称必填' });
      return;
    }
    const department = deps.departments.create({
      companyId: company.id,
      name,
      charter: typeof req.body?.charter === 'string' ? req.body.charter : '',
    });
    res.status(201).json(department);
  });

  router.post('/companies/:id/objectives', (req: Request, res: Response) => {
    const company = deps.companies.findById(String(req.params.id));
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    try {
      const title = validateObjectiveTitle(req.body?.title);
      const constraints = validateObjectiveConstraints(req.body?.constraints);
      const priority = req.body?.priority as 'P0' | 'P1' | 'P2' | undefined;
      const objective = deps.objectives.create({
        companyId: company.id,
        title,
        constraints,
        priority: priority ?? 'P0',
      });
      res.status(201).json(objective);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid input' });
    }
  });

  router.get('/companies/:id/objectives', (req: Request, res: Response) => {
    const company = deps.companies.findById(String(req.params.id));
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(deps.objectives.listByCompany(company.id));
  });

  router.get('/companies/:id/departments', (req: Request, res: Response) => {
    const company = deps.companies.findById(String(req.params.id));
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const departments = deps.departments.listByCompany(company.id);
    res.json(
      departments.map((d) => ({
        ...d,
        activeTaskCount: deps.tasks.countActiveByDepartment(d.id),
      })),
    );
  });

  router.get('/companies/:id/transcripts', (req: Request, res: Response) => {
    const company = deps.companies.findById(String(req.params.id));
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const limit = Math.min(Number(req.query.limit) || 5, 200);
    const offset = Number(req.query.offset) || 0;
    const actor = typeof req.query.actor === 'string' ? req.query.actor : undefined;
    const actionType =
      typeof req.query.actionType === 'string' ? req.query.actionType : undefined;
    res.json(
      deps.transcripts.queryFiltered(company.id, { limit, offset, actor, actionType }),
    );
  });

  return router;
}
