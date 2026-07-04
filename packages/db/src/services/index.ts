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
import { KeyResultRepo } from '../repos/key-result-repo.js';
import { WorkerService } from './worker-service.js';
import { LeadService } from './lead-service.js';
import { ControlLoopService } from './control-loop-service.js';

export { WorkerService, LeadService, ControlLoopService };

export interface OperonServices {
  worker: WorkerService;
  lead: LeadService;
  controlLoop: ControlLoopService;
}

export interface OperonServiceDeps {
  db: Database.Database;
  dataDir: string;
  tasks: TaskRepo;
  transcripts: TranscriptRepo;
  runs: WorkerRunRepo;
  sandbox: SandboxManager;
  modelRouter: ModelRouter;
  objectives: ObjectiveRepo;
}

/** Build agent services from pre-instantiated repos (shared composition root) */
export function buildOperonServicesFromRepos(deps: OperonServiceDeps): OperonServices {
  const memory = new MemoryRepo(deps.dataDir);
  const loops = new ControlLoopRepo(deps.db);
  const keyResults = new KeyResultRepo(deps.db);

  const companyIdForTask = (taskId: string) =>
    deps.tasks.findById(taskId)?.companyId ?? '00000000-0000-0000-0000-000000000000';

  const worker = new WorkerService(
    deps.runs,
    deps.tasks,
    deps.sandbox,
    deps.transcripts,
    companyIdForTask,
  );
  const lead = new LeadService(
    deps.objectives,
    deps.tasks,
    memory,
    worker,
    deps.transcripts,
    deps.modelRouter,
  );
  const controlLoop = new ControlLoopService(loops, deps.objectives, lead, deps.transcripts, keyResults);

  return { worker, lead, controlLoop };
}

/** Convenience for tests — creates its own repo instances */
export function buildOperonServices(db: Database.Database, dataDir: string): OperonServices {
  const tasks = new TaskRepo(db);
  const transcripts = new TranscriptRepo(db);
  const runs = new WorkerRunRepo(db);
  const sandbox = new SandboxManager(dataDir);
  const credentials = new CredentialRepo(db, dataDir);
  const modelConfigs = new ModelConfigRepo(db);
  const modelRouter = new ModelRouter(modelConfigs, credentials);
  const objectives = new ObjectiveRepo(db);

  return buildOperonServicesFromRepos({
    db,
    dataDir,
    tasks,
    transcripts,
    runs,
    sandbox,
    modelRouter,
    objectives,
  });
}
