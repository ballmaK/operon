import type { SynthesisReport, Task } from '@operon/shared-types';
import type { ModelRouter } from '../model-router.js';
import type { MemoryRepo } from '../repos/memory-repo.js';
import type { ObjectiveRepo } from '../repos/objective-repo.js';
import type { TaskRepo } from '../repos/task-repo.js';
import type { TranscriptRepo } from '../repos/transcript-repo.js';
import type { WorkerService } from './worker-service.js';

export class LeadService {
  constructor(
    private readonly objectives: ObjectiveRepo,
    private readonly tasks: TaskRepo,
    private readonly memory: MemoryRepo,
    private readonly workers: WorkerService,
    private readonly transcripts: TranscriptRepo,
    private readonly modelRouter: ModelRouter,
  ) {}

  plan(objectiveId: string, departmentId: string): Task[] {
    const objective = this.objectives.findById(objectiveId);
    if (!objective) throw new Error('Objective not found');

    this.modelRouter.completeStub({
      role: 'lead_plan',
      agentRunId: `plan-${objectiveId}`,
      messages: [
        { role: 'system', content: 'You are a department Lead planning tasks.' },
        {
          role: 'user',
          content: `Objective: ${objective.title}\nConstraints: ${objective.constraints ?? 'none'}`,
        },
      ],
    });

    const existing = this.tasks.listByObjective(objectiveId).filter((t) => t.status === 'pending');
    if (existing.length > 0) return existing;

    const task = this.tasks.create({
      companyId: objective.companyId,
      objectiveId,
      departmentId,
      brief: `Deliver proof for objective: ${objective.title}`.slice(0, 3000),
      allowedSkills: ['file_write'],
      expectedProofType: 'file',
    });

    this.transcripts.append({
      companyId: objective.companyId,
      actor: 'lead',
      actionType: 'plan',
      payload: { taskId: task.id, brief: task.brief },
      relatedEntity: { type: 'task', id: task.id },
    });

    return [task];
  }

  dispatch(taskId: string, minimalMemory: string): { taskId: string; workerRunId: string } {
    const task = this.tasks.findById(taskId);
    if (!task) throw new Error('Task not found');

    const run = this.workers.spawn({
      taskId,
      brief: task.brief,
      minimalMemory,
      allowedSkills: task.allowedSkills,
    });

    const completed = this.workers.runReactStub(run.id);

    return { taskId, workerRunId: completed.id };
  }

  synthesize(objectiveId: string, departmentId: string): SynthesisReport {
    const objective = this.objectives.findById(objectiveId);
    if (!objective) throw new Error('Objective not found');

    const doneTasks = this.tasks.listByObjective(objectiveId).filter((t) => t.status === 'done');
    const proofs = doneTasks.map((t) => ({
      type: 'file' as const,
      path: t.id,
      summary: t.brief,
    }));

    const summary = `Synthesized ${proofs.length} proof(s) for ${objective.title}`;
    const delta = `## Synthesis ${new Date().toISOString()}\n- ${summary}\n`;
    const { version } = this.memory.appendWithBackup(objective.companyId, departmentId, delta);

    this.transcripts.append({
      companyId: objective.companyId,
      actor: 'lead',
      actionType: 'synthesis',
      payload: { summary, memoryVersion: version },
      relatedEntity: { type: 'objective', id: objectiveId },
    });

    return {
      objectiveId,
      taskIds: doneTasks.map((t) => t.id),
      proofs,
      summary,
      memoryVersion: version,
    };
  }
}
