-- Phase 5: worker run LLM metrics

CREATE TABLE IF NOT EXISTS worker_run_metrics (
  worker_run_id TEXT PRIMARY KEY REFERENCES worker_runs(id),
  llm_input_tokens INTEGER NOT NULL DEFAULT 0,
  llm_output_tokens INTEGER NOT NULL DEFAULT 0,
  llm_cost_usd REAL NOT NULL DEFAULT 0,
  react_steps INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
