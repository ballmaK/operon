-- M05/M06/M07: tasks, worker_runs, control_loops

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  objective_id TEXT NOT NULL REFERENCES objectives(id),
  department_id TEXT NOT NULL REFERENCES departments(id),
  brief TEXT NOT NULL,
  allowed_skills_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'proof', 'done', 'failed', 'cancelled')
  ),
  expected_proof_type TEXT NOT NULL CHECK (
    expected_proof_type IN ('file', 'screenshot', 'test', 'url')
  ),
  worker_run_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_objective ON tasks(objective_id);

CREATE TABLE IF NOT EXISTS worker_runs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  brief TEXT NOT NULL,
  minimal_memory TEXT NOT NULL,
  allowed_skills_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('spawning', 'running', 'done', 'failed')),
  sandbox_session_id TEXT,
  proof_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS control_loops (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL REFERENCES objectives(id),
  company_id TEXT NOT NULL REFERENCES companies(id),
  phase TEXT NOT NULL CHECK (
    phase IN ('understand', 'plan', 'dispatch', 'collect', 'synthesize', 'decide')
  ),
  status TEXT NOT NULL CHECK (
    status IN ('running', 'waiting_owner', 'completed', 'error')
  ),
  iteration INTEGER NOT NULL DEFAULT 1,
  wait_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_control_loops_objective ON control_loops(objective_id);
