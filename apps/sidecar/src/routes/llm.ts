import { Router, type Request, type Response } from 'express';
import type { ModelRouter } from '@operon/db';
import type { LlmCompleteRequest } from '@operon/shared-types';

export function llmRouter(modelRouter: ModelRouter): Router {
  const r = Router();

  r.post('/complete', (req: Request, res: Response) => {
    try {
      const body = req.body as LlmCompleteRequest;
      if (!body.role || !body.messages || !body.agentRunId) {
        res.status(400).json({ error: 'role, messages, agentRunId required' });
        return;
      }
      const result = modelRouter.completeStub(body);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'LLM error';
      res.status(400).json({ error: message });
    }
  });

  return r;
}
