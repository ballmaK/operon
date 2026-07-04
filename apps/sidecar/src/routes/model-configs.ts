import { Router, type Request, type Response } from 'express';
import type { ModelConfigRepo, ModelRouter } from '@operon/db';
import type { LlmRole } from '@operon/shared-types';

const ROLES: LlmRole[] = [
  'lead_plan',
  'lead_synth',
  'worker_code',
  'worker_research',
  'worker_default',
];

export function modelConfigsRouter(
  configs: ModelConfigRepo,
  modelRouter?: ModelRouter,
): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(configs.list());
  });

  router.put('/:role', (req: Request, res: Response) => {
    const role = String(req.params.role) as LlmRole;
    if (!ROLES.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    const { provider, modelName, apiBaseUrl, temperature, maxTokens } = req.body as {
      provider?: string;
      modelName?: string;
      apiBaseUrl?: string;
      temperature?: number;
      maxTokens?: number;
    };
    if (!provider || !modelName) {
      res.status(400).json({ error: 'provider and modelName required' });
      return;
    }
    const updated = configs.upsert({
      role,
      provider,
      modelName,
      apiBaseUrl: apiBaseUrl ?? null,
      temperature,
      maxTokens,
    });
    res.json(updated);
  });

  router.post('/test', (req: Request, res: Response) => {
    if (!modelRouter) {
      res.status(501).json({ error: 'Model router not configured' });
      return;
    }
    const role = req.body?.role as LlmRole | undefined;
    if (!role || !ROLES.includes(role)) {
      res.status(400).json({ error: 'Valid role required' });
      return;
    }
    try {
      const result = modelRouter.testConnection(role);
      res.json({
        ok: result.ok,
        role,
        provider: result.config.provider,
        modelName: result.config.modelName,
        message: result.message,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test failed';
      res.status(400).json({ ok: false, role, message });
    }
  });

  return router;
}
