import type { ControlLoop, ControlLoopPhase } from '@operon/shared-types';
import type { ControlLoopRepo } from '../repos/control-loop-repo.js';
import type { KeyResultRepo } from '../repos/key-result-repo.js';
import type { ObjectiveRepo } from '../repos/objective-repo.js';
import type { TranscriptRepo } from '../repos/transcript-repo.js';
import type { LeadService } from './lead-service.js';

const PHASE_ORDER: ControlLoopPhase[] = [
  'understand',
  'plan',
  'dispatch',
  'collect',
  'synthesize',
  'decide',
];

export class ControlLoopService {
  constructor(
    private readonly loops: ControlLoopRepo,
    private readonly objectives: ObjectiveRepo,
    private readonly lead: LeadService,
    private readonly transcripts: TranscriptRepo,
    private readonly keyResults: KeyResultRepo,
  ) {}

  start(objectiveId: string, departmentId: string): ControlLoop {
    const objective = this.objectives.findById(objectiveId);
    if (!objective) throw new Error('Objective not found');

    const running = this.loops.findRunningByObjective(objectiveId);
    if (running) throw new Error('Control loop already running (CL-01)');

    const loop = this.loops.create(objectiveId, objective.companyId);
    this.objectives.setActive(objectiveId);

    this.transcripts.append({
      companyId: objective.companyId,
      actor: 'system',
      actionType: 'input',
      payload: { loopId: loop.id, phase: 'understand' },
      relatedEntity: { type: 'control_loop', id: loop.id },
    });

    return this.runStubPipeline(loop.id, departmentId);
  }

  getByObjective(objectiveId: string): ControlLoop | null {
    return this.loops.findByObjective(objectiveId);
  }

  private advancePhase(loopId: string, phase: ControlLoopPhase): ControlLoop | null {
    const updated = this.loops.updatePhase(loopId, phase);
    if (updated) {
      this.transcripts.append({
        companyId: updated.companyId,
        actor: 'system',
        actionType: 'plan',
        payload: { loopId, phase },
        relatedEntity: { type: 'control_loop', id: loopId },
      });
    }
    return updated;
  }

  /** MVP stub: auto-run understand→decide in one call */
  private runStubPipeline(loopId: string, departmentId: string): ControlLoop {
    let loop = this.loops.findById(loopId)!;

    loop = this.advancePhase(loopId, 'understand')!;
    loop = this.advancePhase(loopId, 'plan')!;

    const tasks = this.lead.plan(loop.objectiveId, departmentId);
    loop = this.advancePhase(loopId, 'dispatch')!;

    for (const task of tasks) {
      this.lead.dispatch(task.id, 'Minimal context for worker.');
    }

    loop = this.advancePhase(loopId, 'collect')!;
    loop = this.advancePhase(loopId, 'synthesize')!;
    this.lead.synthesize(loop.objectiveId, departmentId);
    this.keyResults.rollupFromProofs(loop.objectiveId, tasks.length);

    loop = this.advancePhase(loopId, 'decide')!;
    this.loops.complete(loopId);

    return this.loops.findById(loopId)!;
  }

  static nextPhase(current: ControlLoopPhase): ControlLoopPhase | null {
    const idx = PHASE_ORDER.indexOf(current);
    if (idx < 0 || idx >= PHASE_ORDER.length - 1) return null;
    return PHASE_ORDER[idx + 1];
  }
}
