import { Router, type Request, type Response } from 'express';
import type { ApprovalRepo, SandboxManager } from '@operon/db';
import { getSkill } from '@operon/db';
import type { CreateSandboxSessionRequest, InvokeSkillRequest } from '@operon/shared-types';

export function sandboxRouter(sandbox: SandboxManager, approvals: ApprovalRepo): Router {
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

  router.post('/invoke', async (req: Request, res: Response) => {
    try {
      const body = req.body as InvokeSkillRequest;
      if (!body.sessionId || !body.skillCode || !body.agentRunId) {
        res.status(400).json({ error: 'sessionId, skillCode, agentRunId required' });
        return;
      }

      const skill = getSkill(body.skillCode);
      if (skill?.riskLevel === 'high') {
        const approved = approvals.findApprovedSkillInvoke(body.agentRunId);
        if (!approved) {
          const pending = approvals.findPendingSkillInvoke(body.agentRunId);
          if (!pending) {
            const created = approvals.create({
              actionType: 'skill_invoke',
              taskId: body.agentRunId,
              summary: `High-risk skill: ${body.skillCode}`,
            });
            res.status(403).json({ error: 'Approval required (AU-01)', approvalId: created.id });
            return;
          }
          res.status(403).json({ error: 'Approval pending', approvalId: pending.id });
          return;
        }
      }

      if (body.skillCode === 'file_write') {
        const relativePath = String(body.params.relativePath ?? 'output.txt');
        const content = String(body.params.content ?? '');
        const result = sandbox.invokeFileWrite(body.sessionId, { relativePath, content });
        res.json({ skillCode: body.skillCode, ...result });
        return;
      }
      if (body.skillCode === 'browser_screenshot') {
        const url = typeof body.params.url === 'string' ? body.params.url : undefined;
        const result = await sandbox.invokeBrowserScreenshot(body.sessionId, { url });
        res.json({ skillCode: body.skillCode, ...result });
        return;
      }
      if (body.skillCode === 'code_run') {
        const code = String(body.params.code ?? 'console.log("hi")');
        const language = typeof body.params.language === 'string' ? body.params.language : undefined;
        const result = sandbox.invokeCodeRun(body.sessionId, { code, language });
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
