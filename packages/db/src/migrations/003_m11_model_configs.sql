-- M11: model routing configs

CREATE TABLE IF NOT EXISTS model_configs (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL UNIQUE CHECK (
    role IN ('lead_plan', 'lead_synth', 'worker_code', 'worker_research', 'worker_default')
  ),
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  api_base_url TEXT,
  temperature REAL NOT NULL DEFAULT 0.3,
  max_tokens INTEGER NOT NULL DEFAULT 8192,
  input_price_per_million REAL NOT NULL DEFAULT 0,
  output_price_per_million REAL NOT NULL DEFAULT 0,
  fallback_provider TEXT,
  fallback_model_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
