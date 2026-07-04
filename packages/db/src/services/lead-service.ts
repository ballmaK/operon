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

  async plan(objectiveId: string, departmentId: string): Promise<Task[]> {
    const objective = this.objectives.findById(objectiveId);
    if (!objective) throw new Error('Objective not found');

    const llm = await this.modelRouter.complete({
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

    const brief = llm.content.slice(0, 500) || `Deliver proof for objective: ${objective.title}`;
    const task = this.tasks.create({
      companyId: objective.companyId,
      objectiveId,
      departmentId,
      brief: brief.slice(0, 3000),
      allowedSkills: ['file_write'],
      expectedProofType: 'file',
    });

    this.transcripts.append({
      companyId: objective.companyId,
      actor: 'lead',
      actionType: 'plan',
      payload: { taskId: task.id, brief: task.brief, llmStub: llm.stub },
      relatedEntity: { type: 'task', id: task.id },
    });

    return [task];
  }

  async dispatch(taskId: string, minimalMemory: string): Promise<{ taskId: string; workerRunId: string }> {
    const task = this.tasks.findById(taskId);
    if (!task) throw new Error('Task not found');

    const run = this.workers.spawn({
      taskId,
      brief: task.brief,
      minimalMemory,
      allowedSkills: task.allowedSkills,
    });

    const completed = await this.workers.runReact(run.id);

    return { taskId, workerRunId: completed.id };
  }

  async synthesize(objectiveId: string, departmentId: string): Promise<SynthesisReport> {
    const objective = this.objectives.findById(objectiveId);
    if (!objective) throw new Error('Objective not found');

    const doneTasks = this.tasks.listByObjective(objectiveId).filter((t) => t.status === 'done');
    const proofs = doneTasks.map((t) => ({
      type: 'file' as const,
      path: t.id,
      summary: t.brief,
    }));

    const llm = await this.modelRouter.complete({
      role: 'lead_synth',
      agentRunId: `synth-${objectiveId}`,
      messages: [
        { role: 'system', content: 'Synthesize worker proofs into a concise summary.' },
        { role: 'user', content: `Proofs: ${JSON.stringify(proofs)}` },
      ],
    });

    const summary = llm.content.slice(0, 2000) || `Synthesized ${proofs.length} proof(s) for ${objective.title}`;
    const delta = `## Synthesis ${new Date().toISOString()}\n- ${summary}\n`;
    const { version } = this.memory.appendWithBackup(objective.companyId, departmentId, delta);

    this.transcripts.append({
      companyId: objective.companyId,
      actor: 'lead',
      actionType: 'synthesis',
      payload: { summary, memoryVersion: version, llmStub: llm.stub },
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
