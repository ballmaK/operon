import type Database from 'better-sqlite3';
import { CredentialRepo } from './repos/credential-repo.js';
import { ApprovalRepo } from './repos/approval-repo.js';
import { TranscriptRepo } from './repos/transcript-repo.js';
import { UserRepo } from './repos/user-repo.js';
import { ModelConfigRepo } from './repos/model-config-repo.js';
import { ModelRouter } from './model-router.js';
import { SandboxManager } from './sandbox-manager.js';
import { CompanyRepo } from './repos/company-repo.js';
import { DepartmentRepo } from './repos/department-repo.js';
import { ObjectiveRepo } from './repos/objective-repo.js';
import { TaskRepo } from './repos/task-repo.js';
import { WorkerRunRepo } from './repos/worker-run-repo.js';
import { HandoffRepo } from './repos/handoff-repo.js';
import { BlockerRepo } from './repos/blocker-repo.js';
import { RhythmScheduleRepo, RhythmReportRepo } from './repos/rhythm-repo.js';
import { RhythmService } from './services/rhythm-service.js';
import { listAssetsForCompany, listProofsForCompany } from './proof-query.js';
import {
  buildOperonServicesFromRepos,
  type OperonServices,
} from './services/index.js';

/** Single composition root for Sidecar — one instance per repo/service */
export interface SidecarDeps {
  credentials: CredentialRepo;
  approvals: ApprovalRepo;
  transcripts: TranscriptRepo;
  users: UserRepo;
  modelConfigs: ModelConfigRepo;
  modelRouter: ModelRouter;
  sandbox: SandboxManager;
  companies: CompanyRepo;
  departments: DepartmentRepo;
  objectives: ObjectiveRepo;
  tasks: TaskRepo;
  workerRuns: WorkerRunRepo;
  handoffs: HandoffRepo;
  blockers: BlockerRepo;
  rhythmSchedules: RhythmScheduleRepo;
  rhythmReports: RhythmReportRepo;
  services: OperonServices;
  rhythm: RhythmService;
  listProofs: (companyId: string) => ReturnType<typeof listProofsForCompany>;
  listAssets: (companyId: string) => ReturnType<typeof listAssetsForCompany>;
}

export function buildSidecarContext(
  db: Database.Database,
  dataDir: string,
): SidecarDeps {
  const credentials = new CredentialRepo(db, dataDir);
  const approvals = new ApprovalRepo(db);
  const transcripts = new TranscriptRepo(db);
  const users = new UserRepo(db);
  const modelConfigs = new ModelConfigRepo(db);
  const modelRouter = new ModelRouter(modelConfigs, credentials);
  const sandbox = new SandboxManager(dataDir);
  const companies = new CompanyRepo(db);
  const departments = new DepartmentRepo(db);
  const objectives = new ObjectiveRepo(db);
  const tasks = new TaskRepo(db);
  const workerRuns = new WorkerRunRepo(db);
  const handoffs = new HandoffRepo(db);
  const blockers = new BlockerRepo(db);
  const rhythmSchedules = new RhythmScheduleRepo(db);
  const rhythmReports = new RhythmReportRepo(db);

  const services = buildOperonServicesFromRepos({
    db,
    dataDir,
    tasks,
    transcripts,
    runs: workerRuns,
    sandbox,
    modelRouter,
    objectives,
  });

  const rhythm = new RhythmService(
    db,
    rhythmSchedules,
    rhythmReports,
    blockers,
    objectives,
    departments,
    handoffs,
    approvals,
    transcripts,
  );

  return {
    credentials,
    approvals,
    transcripts,
    users,
    modelConfigs,
    modelRouter,
    sandbox,
    companies,
    departments,
    objectives,
    tasks,
    workerRuns,
    handoffs,
    blockers,
    rhythmSchedules,
    rhythmReports,
    services,
    rhythm,
    listProofs: (companyId) => listProofsForCompany(db, companyId),
    listAssets: (companyId) => listAssetsForCompany(db, companyId),
  };
}
