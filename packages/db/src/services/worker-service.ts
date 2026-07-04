import type { Proof, SpawnWorkerRequest, WorkerRun } from '@operon/shared-types';
import type { SandboxManager } from '../sandbox-manager.js';
import type { TranscriptRepo } from '../repos/transcript-repo.js';
import type { TaskRepo } from '../repos/task-repo.js';
import type { WorkerRunRepo } from '../repos/worker-run-repo.js';
import { assertSkillAllowed, validateWorkerSpawn } from '../validation/worker-input.js';

export class WorkerService {
  constructor(
    private readonly runs: WorkerRunRepo,
    private readonly tasks: TaskRepo,
    private readonly sandbox: SandboxManager,
    private readonly transcripts: TranscriptRepo,
    private readonly companyIdForTask: (taskId: string) => string,
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

  getStatus(id: string): WorkerRun | null {
    return this.runs.findById(id);
  }

  /** ReAct stub: one file_write then submit proof (WK-03 destroy sandbox) */
  runReactStub(workerRunId: string): WorkerRun {
    const run = this.runs.findById(workerRunId);
    if (!run) throw new Error('Worker run not found');
    if (run.status === 'done' || run.status === 'failed') return run;

    const skill = 'file_write';
    assertSkillAllowed(skill, run.allowedSkills);

    if (!run.sandboxSessionId) throw new Error('Missing sandbox session');

    const written = this.sandbox.invokeFileWrite(run.sandboxSessionId, {
      relativePath: 'proof.txt',
      content: run.brief.slice(0, 500),
    });

    const proof: Proof = {
      type: 'file',
      path: written.writtenPath,
      summary: `Worker proof via ${skill}`,
    };

    this.transcripts.append({
      companyId: this.companyIdForTask(run.taskId),
      actor: 'worker',
      actionType: 'tool',
      payload: { skill, ...written },
      relatedEntity: { type: 'worker', id: run.id },
    });

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
