-- M08 handoffs, M04 rhythm & blockers

CREATE TABLE IF NOT EXISTS handoffs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  from_department_id TEXT NOT NULL REFERENCES departments(id),
  to_department_id TEXT NOT NULL REFERENCES departments(id),
  context_summary TEXT NOT NULL,
  asset_refs_json TEXT NOT NULL DEFAULT '[]',
  request TEXT NOT NULL,
  expected_proof_type TEXT NOT NULL CHECK (
    expected_proof_type IN ('file', 'screenshot', 'test', 'url')
  ),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (
    status IN ('sent', 'accepted', 'replied', 'rejected')
  ),
  reply_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handoffs_to_dept ON handoffs(to_department_id, status);

CREATE TABLE IF NOT EXISTS blockers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  objective_id TEXT REFERENCES objectives(id),
  department_id TEXT REFERENCES departments(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blockers_company ON blockers(company_id, status);

CREATE TABLE IF NOT EXISTS rhythm_schedules (
  company_id TEXT PRIMARY KEY REFERENCES companies(id),
  daily_time TEXT NOT NULL DEFAULT '09:00',
  weekly_day TEXT NOT NULL DEFAULT 'mon' CHECK (
    weekly_day IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
  ),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rhythm_reports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  blockers_json TEXT NOT NULL DEFAULT '[]',
  pending_decisions_count INTEGER NOT NULL DEFAULT 0,
  proofs_delivered_count INTEGER NOT NULL DEFAULT 0,
  departments_waiting_json TEXT NOT NULL DEFAULT '[]',
  objective_summaries_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rhythm_reports_company ON rhythm_reports(company_id, created_at DESC);
