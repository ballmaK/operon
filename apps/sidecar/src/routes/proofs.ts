import { Router, type Request, type Response } from 'express';
import type { TranscriptRepo } from '@operon/db';
import { listAssetsForCompany, listProofsForCompany, readAssetPreview } from '@operon/db';

export interface ProofsRouterDeps {
  listProofs: (companyId: string) => ReturnType<typeof listProofsForCompany>;
  listAssets: (companyId: string) => ReturnType<typeof listAssetsForCompany>;
  transcripts: TranscriptRepo;
  dataDir: string;
}

export function proofsRouter(deps: ProofsRouterDeps): Router {
  const router = Router();

  router.get('/companies/:id/proofs', (req: Request, res: Response) => {
    res.json(deps.listProofs(String(req.params.id)));
  });

  router.get('/companies/:id/assets', (req: Request, res: Response) => {
    res.json(deps.listAssets(String(req.params.id)));
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
