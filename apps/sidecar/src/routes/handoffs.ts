import { Router, type Request, type Response } from 'express';
import type { DepartmentRepo } from '@operon/db';
import type { HandoffRepo } from '@operon/db';
import type { TranscriptRepo } from '@operon/db';
import { validateHandoffCreate, validateHandoffReply } from '@operon/db';
import type { ProofType } from '@operon/shared-types';

export interface HandoffsRouterDeps {
  handoffs: HandoffRepo;
  departments: DepartmentRepo;
  transcripts: TranscriptRepo;
}

export function handoffsRouter(deps: HandoffsRouterDeps): Router {
  const router = Router();

  router.post('/handoffs', (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const { contextSummary, request } = validateHandoffCreate({
        contextSummary: body.contextSummary,
        request: body.request,
        fromDepartmentId: body.fromDepartmentId,
        toDepartmentId: body.toDepartmentId,
      });

      const companyId = String(body.companyId ?? '');
      const fromDepartmentId = String(body.fromDepartmentId);
      const toDepartmentId = String(body.toDepartmentId);
      if (!companyId) {
        res.status(400).json({ error: 'companyId required' });
        return;
      }

      const fromDept = deps.departments.findById(fromDepartmentId);
      const toDept = deps.departments.findById(toDepartmentId);
      if (!fromDept || !toDept || fromDept.companyId !== companyId || toDept.companyId !== companyId) {
        res.status(400).json({ error: '部门须属同一公司（HO-02）' });
        return;
      }

      const expectedProofType = (body.expectedProofType as ProofType) ?? 'file';
      const assetRefs = Array.isArray(body.assetRefs)
        ? (body.assetRefs as string[]).filter((x) => typeof x === 'string')
        : [];

      const handoff = deps.handoffs.create({
        companyId,
        fromDepartmentId,
        toDepartmentId,
        contextSummary,
        request,
        expectedProofType,
        assetRefs,
      });

      deps.transcripts.append({
        companyId,
        actor: 'lead',
        actionType: 'handoff',
        payload: {
          action: 'handoff_sent',
          handoffId: handoff.id,
          fromDept: fromDepartmentId,
          toDept: toDepartmentId,
        },
        relatedEntity: { type: 'handoff', id: handoff.id },
      });

      res.status(201).json(handoff);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid handoff' });
    }
  });

  router.get('/departments/:id/handoffs/inbox', (req: Request, res: Response) => {
    const dept = deps.departments.findById(String(req.params.id));
    if (!dept) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    res.json(deps.handoffs.inboxForDepartment(dept.id));
  });

  router.get('/departments/:id/handoffs/pending-count', (req: Request, res: Response) => {
    const dept = deps.departments.findById(String(req.params.id));
    if (!dept) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    res.json({ count: deps.handoffs.countPendingForDepartment(dept.id) });
  });

  router.post('/handoffs/:id/accept', (req: Request, res: Response) => {
    const handoff = deps.handoffs.findById(String(req.params.id));
    if (!handoff) {
      res.status(404).json({ error: 'Handoff not found' });
      return;
    }
    if (handoff.status !== 'sent') {
      res.status(400).json({ error: '仅 sent 状态可接受' });
      return;
    }
    const updated = deps.handoffs.updateStatus(handoff.id, 'accepted');
    deps.transcripts.append({
      companyId: handoff.companyId,
      actor: 'lead',
      actionType: 'handoff',
      payload: { action: 'handoff_accepted', handoffId: handoff.id },
      relatedEntity: { type: 'handoff', id: handoff.id },
    });
    res.json(updated);
  });

  router.post('/handoffs/:id/reject', (req: Request, res: Response) => {
    const handoff = deps.handoffs.findById(String(req.params.id));
    if (!handoff) {
      res.status(404).json({ error: 'Handoff not found' });
      return;
    }
    if (handoff.status !== 'sent') {
      res.status(400).json({ error: '仅 sent 状态可拒绝' });
      return;
    }
    const updated = deps.handoffs.updateStatus(handoff.id, 'rejected');
    deps.transcripts.append({
      companyId: handoff.companyId,
      actor: 'lead',
      actionType: 'handoff',
      payload: { action: 'handoff_rejected', handoffId: handoff.id },
      relatedEntity: { type: 'handoff', id: handoff.id },
    });
    res.json(updated);
  });

  router.post('/handoffs/:id/reply', (req: Request, res: Response) => {
    const handoff = deps.handoffs.findById(String(req.params.id));
    if (!handoff) {
      res.status(404).json({ error: 'Handoff not found' });
      return;
    }
    if (handoff.status !== 'accepted') {
      res.status(400).json({ error: '须先接受再回复' });
      return;
    }
    try {
      const replySummary = validateHandoffReply(req.body?.replySummary);
      const updated = deps.handoffs.updateStatus(handoff.id, 'replied', replySummary);
      deps.transcripts.append({
        companyId: handoff.companyId,
        actor: 'lead',
        actionType: 'handoff',
        payload: { action: 'handoff_replied', handoffId: handoff.id, replySummary },
        relatedEntity: { type: 'handoff', id: handoff.id },
      });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid reply' });
    }
  });

  return router;
}
