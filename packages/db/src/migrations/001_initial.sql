-- M09 initial schema: Company, Department, Objective, Transcript
-- All tenant tables include company_id for DP-01 filtering

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  local_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  charter TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);

CREATE TABLE IF NOT EXISTS objectives (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  constraints TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'active', 'paused', 'blocked', 'completed', 'archived')
  ),
  priority TEXT CHECK (priority IN ('P0', 'P1', 'P2')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_objectives_company ON objectives(company_id);

CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  actor TEXT NOT NULL CHECK (actor IN ('owner', 'lead', 'worker', 'system')),
  action_type TEXT NOT NULL CHECK (
    action_type IN ('input', 'plan', 'dispatch', 'tool', 'proof', 'synthesis', 'decision', 'handoff')
  ),
  payload_json TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transcripts_company_time ON transcripts(company_id, timestamp);
