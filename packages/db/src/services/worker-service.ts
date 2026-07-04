import type { Proof, SpawnWorkerRequest, WorkerRun } from '@operon/shared-types';
import type { ModelRouter } from '../model-router.js';
import type { SandboxManager } from '../sandbox-manager.js';
import type { TranscriptRepo } from '../repos/transcript-repo.js';
import type { TaskRepo } from '../repos/task-repo.js';
import type { WorkerRunRepo } from '../repos/worker-run-repo.js';
import type { WorkerRunMetricsRepo } from '../repos/worker-run-metrics-repo.js';
import { assertSkillAllowed, validateWorkerSpawn } from '../validation/worker-input.js';

export class WorkerService {
  constructor(
    private readonly runs: WorkerRunRepo,
    private readonly tasks: TaskRepo,
    private readonly sandbox: SandboxManager,
    private readonly transcripts: TranscriptRepo,
    private readonly companyIdForTask: (taskId: string) => string,
    private readonly metrics: WorkerRunMetricsRepo,
    private readonly modelRouter: ModelRouter,
  ) {}

  spawn(input: SpawnWorkerRequest): WorkerRun {
    validateWorkerSpawn(input);
    const task = this.tasks.findById(input.taskId);
    if (!task) throw new Error('Task not found');

    const session = this.sandbox.create({
      runtimeType: 'subprocess',
      agentRunId: input.taskId,
    });

    const run = this.runs.create(input, session.id);
    this.runs.updateStatus(run.id, 'running');
    this.tasks.updateStatus(task.id, 'running', run.id);

    this.transcripts.append({
      companyId: task.companyId,
      actor: 'worker',
      actionType: 'dispatch',
      payload: { workerRunId: run.id, taskId: task.id },
      relatedEntity: { type: 'worker', id: run.id },
    });

    return { ...run, status: 'running' };
  }

  getStatus(id: string): (WorkerRun & { metrics?: ReturnType<WorkerRunMetricsRepo['get']> }) | null {
    const run = this.runs.findById(id);
    if (!run) return null;
    const metrics = this.metrics.get(id);
    return metrics ? { ...run, metrics } : run;
  }

  /** ReAct: LLM step + up to 2 file_write steps then submit proof */
  async runReact(workerRunId: string): Promise<WorkerRun> {
    const run = this.runs.findById(workerRunId);
    if (!run) throw new Error('Worker run not found');
    if (run.status === 'done' || run.status === 'failed') return run;

    const skill = 'file_write';
    assertSkillAllowed(skill, run.allowedSkills);

    if (!run.sandboxSessionId) throw new Error('Missing sandbox session');

    const llm = await this.modelRouter.complete({
      role: 'worker_default',
      agentRunId: run.id,
      messages: [
        { role: 'system', content: 'You are a Worker agent. Produce concise file content.' },
        { role: 'user', content: run.brief },
      ],
    });
    this.metrics.addLlmUsage(run.id, {
      inputTokens: llm.inputTokens,
      outputTokens: llm.outputTokens,
      estimatedCostUsd: llm.estimatedCostUsd,
    });

    const steps = [
      { path: 'step-1.txt', content: llm.content.slice(0, 500) || `Step 1: ${run.brief.slice(0, 200)}` },
      { path: 'proof.txt', content: run.brief.slice(0, 500) },
    ];

    for (const step of steps) {
      const written = this.sandbox.invokeFileWrite(run.sandboxSessionId, {
        relativePath: step.path,
        content: step.content,
      });
      this.transcripts.append({
        companyId: this.companyIdForTask(run.taskId),
        actor: 'worker',
        actionType: 'tool',
        payload: { skill, ...written },
        relatedEntity: { type: 'worker', id: run.id },
      });
    }

    this.metrics.upsert(run.id, { reactSteps: steps.length });

    const proof: Proof = {
      type: 'file',
      path: 'proof.txt',
      summary: `Worker proof via ${skill} (${steps.length} steps)`,
    };

    this.runs.updateStatus(run.id, 'done', proof);
    this.tasks.updateStatus(run.taskId, 'done');
    this.sandbox.destroy(run.sandboxSessionId);

    this.transcripts.append({
      companyId: this.companyIdForTask(run.taskId),
      actor: 'worker',
      actionType: 'proof',
      payload: { proof },
      relatedEntity: { type: 'worker', id: run.id },
    });

    return this.runs.findById(run.id)!;
  }
}
