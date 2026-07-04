import { Router, type Request, type Response } from 'express';
import type { SandboxManager } from '@operon/db';
import type { CreateSandboxSessionRequest, InvokeSkillRequest } from '@operon/shared-types';

export function sandboxRouter(sandbox: SandboxManager): Router {
  const router = Router();

  router.post('/sessions', (req: Request, res: Response) => {
    try {
      const body = req.body as CreateSandboxSessionRequest;
      if (!body.runtimeType || !body.agentRunId) {
        res.status(400).json({ error: 'runtimeType and agentRunId required' });
        return;
      }
      const session = sandbox.create(body);
      res.status(201).json(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sandbox error';
      res.status(400).json({ error: message });
    }
  });

  router.delete('/sessions/:id', (req: Request, res: Response) => {
    const ok = sandbox.destroy(String(req.params.id));
    if (!ok) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.status(204).send();
  });

  router.post('/invoke', (req: Request, res: Response) => {
    try {
      const body = req.body as InvokeSkillRequest;
      if (!body.sessionId || !body.skillCode || !body.agentRunId) {
        res.status(400).json({ error: 'sessionId, skillCode, agentRunId required' });
        return;
      }
      if (body.skillCode === 'file_write') {
        const relativePath = String(body.params.relativePath ?? 'output.txt');
        const content = String(body.params.content ?? '');
        const result = sandbox.invokeFileWrite(body.sessionId, { relativePath, content });
        res.json({ skillCode: body.skillCode, ...result });
        return;
      }
      res.status(501).json({ error: `Skill not implemented: ${body.skillCode}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invoke error';
      res.status(400).json({ error: message });
    }
  });

  return router;
}
