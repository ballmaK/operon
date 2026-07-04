-- Phase 4: KeyResult (OKR P1) + proof acceptance

CREATE TABLE IF NOT EXISTS key_results (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL REFERENCES objectives(id),
  company_id TEXT NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  target_value REAL,
  current_value REAL NOT NULL DEFAULT 0,
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_key_results_objective ON key_results(objective_id);

CREATE TABLE IF NOT EXISTS proof_acceptance (
  worker_run_id TEXT PRIMARY KEY REFERENCES worker_runs(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  updated_at TEXT NOT NULL
);
