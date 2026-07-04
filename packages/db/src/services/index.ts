import type Database from 'better-sqlite3';
import { CredentialRepo } from '../repos/credential-repo.js';
import { ModelConfigRepo } from '../repos/model-config-repo.js';
import { ModelRouter } from '../model-router.js';
import { SandboxManager } from '../sandbox-manager.js';
import { TaskRepo } from '../repos/task-repo.js';
import { TranscriptRepo } from '../repos/transcript-repo.js';
import { WorkerRunRepo } from '../repos/worker-run-repo.js';
import { ControlLoopRepo } from '../repos/control-loop-repo.js';
import { ObjectiveRepo } from '../repos/objective-repo.js';
import { MemoryRepo } from '../repos/memory-repo.js';
import { WorkerService } from './worker-service.js';
import { LeadService } from './lead-service.js';
import { ControlLoopService } from './control-loop-service.js';

export { WorkerService, LeadService, ControlLoopService };

export interface OperonServices {
  worker: WorkerService;
  lead: LeadService;
  controlLoop: ControlLoopService;
}

export function buildOperonServices(db: Database.Database, dataDir: string): OperonServices {
  const tasks = new TaskRepo(db);
  const transcripts = new TranscriptRepo(db);
  const runs = new WorkerRunRepo(db);
  const sandbox = new SandboxManager(dataDir);
  const credentials = new CredentialRepo(db, dataDir);
  const modelConfigs = new ModelConfigRepo(db);
  const modelRouter = new ModelRouter(modelConfigs, credentials);
  const objectives = new ObjectiveRepo(db);
  const memory = new MemoryRepo(dataDir);
  const loops = new ControlLoopRepo(db);

  const companyIdForTask = (taskId: string) =>
    tasks.findById(taskId)?.companyId ?? '00000000-0000-0000-0000-000000000000';

  const worker = new WorkerService(runs, tasks, sandbox, transcripts, companyIdForTask);
  const lead = new LeadService(objectives, tasks, memory, worker, transcripts, modelRouter);
  const controlLoop = new ControlLoopService(loops, objectives, lead, transcripts);

  return { worker, lead, controlLoop };
}
