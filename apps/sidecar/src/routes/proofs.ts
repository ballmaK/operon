import { Router, type Request, type Response } from 'express';
import type { ProofAcceptanceRepo, TranscriptRepo } from '@operon/db';
import {
  listAssetsForCompany,
  listProofsForCompany,
  readAssetPreview,
  resolveAssetAbsolutePath,
  type ProofListFilters,
} from '@operon/db';

export interface ProofsRouterDeps {
  db: Parameters<typeof listProofsForCompany>[0];
  proofAcceptance: ProofAcceptanceRepo;
  transcripts: TranscriptRepo;
  dataDir: string;
}

export function proofsRouter(deps: ProofsRouterDeps): Router {
  const router = Router();

  router.get('/companies/:id/proofs', (req: Request, res: Response) => {
    const filters: ProofListFilters = {};
    const type = req.query.type as ProofListFilters['type'] | undefined;
    const status = req.query.status as ProofListFilters['acceptanceStatus'] | undefined;
    if (type) filters.type = type;
    if (status) filters.acceptanceStatus = status;
    res.json(listProofsForCompany(deps.db, String(req.params.id), filters));
  });

  router.get('/companies/:id/assets', (req: Request, res: Response) => {
    res.json(listAssetsForCompany(deps.db, String(req.params.id)));
  });

  router.get('/assets/:id/content', (req: Request, res: Response) => {
    const path = typeof req.query.path === 'string' ? req.query.path : '';
    if (!path) {
      res.status(400).json({ error: 'path query required' });
      return;
    }
    const preview = readAssetPreview(deps.dataDir, path);
    if (!preview) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json({ id: String(req.params.id), path, ...preview });
  });

  router.post('/assets/:id/reveal', (req: Request, res: Response) => {
    const path = typeof req.body?.path === 'string' ? req.body.path : '';
    if (!path) {
      res.status(400).json({ error: 'path required' });
      return;
    }
    const absolutePath = resolveAssetAbsolutePath(deps.dataDir, path);
    if (!absolutePath) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json({ absolutePath });
  });

  router.post('/proofs/:workerRunId/accept', (req: Request, res: Response) => {
    const status = deps.proofAcceptance.set(String(req.params.workerRunId), 'accepted');
    res.json({ workerRunId: String(req.params.workerRunId), acceptanceStatus: status });
  });

  router.post('/proofs/:workerRunId/reject', (req: Request, res: Response) => {
    const status = deps.proofAcceptance.set(String(req.params.workerRunId), 'rejected');
    res.json({ workerRunId: String(req.params.workerRunId), acceptanceStatus: status });
  });

  router.post('/transcripts/correct', (req: Request, res: Response) => {
    const companyId = req.body?.companyId as string | undefined;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!companyId || !message) {
      res.status(400).json({ error: 'companyId and message required' });
      return;
    }
    const entry = deps.transcripts.append({
      companyId,
      actor: 'owner',
      actionType: 'decision',
      payload: { action: 'owner_correction', message },
      relatedEntity: req.body?.relatedEntity ?? null,
    });
    res.status(201).json(entry);
  });

  return router;
}
