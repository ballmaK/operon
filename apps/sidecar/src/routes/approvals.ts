import { Router, type Request, type Response } from 'express';
import type { ApprovalRepo, TranscriptRepo } from '@operon/db';
import { AUDIT_COMPANY_ID } from '@operon/db';

export function approvalsRouter(
  approvals: ApprovalRepo,
  transcripts: TranscriptRepo,
): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    res.json(approvals.list(status as Parameters<ApprovalRepo['list']>[0]));
  });

  router.post('/', (req: Request, res: Response) => {
    const created = approvals.create(req.body);
    res.status(201).json(created);
  });

  router.post('/:id/approve', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const updated = approvals.approve(id);
    if (!updated) {
      res.status(404).json({ error: 'Approval not found or not pending' });
      return;
    }
    transcripts.append({
      companyId: AUDIT_COMPANY_ID,
      actor: 'owner',
      actionType: 'decision',
      payload: { approvalId: updated.id, decision: 'approved', summary: updated.summary },
      relatedEntity: { type: 'approval', id: updated.id },
    });
    res.json(updated);
  });

  router.post('/:id/reject', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const updated = approvals.reject(id);
    if (!updated) {
      res.status(404).json({ error: 'Approval not found or not pending' });
      return;
    }
    transcripts.append({
      companyId: AUDIT_COMPANY_ID,
      actor: 'owner',
      actionType: 'decision',
      payload: { approvalId: updated.id, decision: 'rejected', summary: updated.summary },
      relatedEntity: { type: 'approval', id: updated.id },
    });
    res.json(updated);
  });

  return router;
}
