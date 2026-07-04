import type Database from 'better-sqlite3';

export interface WorkerRunMetrics {
  workerRunId: string;
  llmInputTokens: number;
  llmOutputTokens: number;
  llmCostUsd: number;
  reactSteps: number;
}

export class WorkerRunMetricsRepo {
  constructor(private readonly db: Database.Database) {}

  get(workerRunId: string): WorkerRunMetrics | null {
    const row = this.db
      .prepare(
        `SELECT worker_run_id AS workerRunId, llm_input_tokens AS llmInputTokens,
                llm_output_tokens AS llmOutputTokens, llm_cost_usd AS llmCostUsd,
                react_steps AS reactSteps
         FROM worker_run_metrics WHERE worker_run_id = ?`,
      )
      .get(workerRunId) as WorkerRunMetrics | undefined;
    return row ?? null;
  }

  upsert(workerRunId: string, patch: Partial<Omit<WorkerRunMetrics, 'workerRunId'>>): WorkerRunMetrics {
    const now = new Date().toISOString();
    const existing = this.get(workerRunId);
    const next: WorkerRunMetrics = {
      workerRunId,
      llmInputTokens: patch.llmInputTokens ?? existing?.llmInputTokens ?? 0,
      llmOutputTokens: patch.llmOutputTokens ?? existing?.llmOutputTokens ?? 0,
      llmCostUsd: patch.llmCostUsd ?? existing?.llmCostUsd ?? 0,
      reactSteps: patch.reactSteps ?? existing?.reactSteps ?? 0,
    };
    this.db
      .prepare(
        `INSERT INTO worker_run_metrics
         (worker_run_id, llm_input_tokens, llm_output_tokens, llm_cost_usd, react_steps, updated_at)
         VALUES (@workerRunId, @llmInputTokens, @llmOutputTokens, @llmCostUsd, @reactSteps, @updatedAt)
         ON CONFLICT(worker_run_id) DO UPDATE SET
           llm_input_tokens = excluded.llm_input_tokens,
           llm_output_tokens = excluded.llm_output_tokens,
           llm_cost_usd = excluded.llm_cost_usd,
           react_steps = excluded.react_steps,
           updated_at = excluded.updated_at`,
      )
      .run({ ...next, updatedAt: now });
    return next;
  }

  addLlmUsage(
    workerRunId: string,
    usage: { inputTokens: number; outputTokens: number; estimatedCostUsd: number },
  ): void {
    const existing = this.get(workerRunId);
    this.upsert(workerRunId, {
      llmInputTokens: (existing?.llmInputTokens ?? 0) + usage.inputTokens,
      llmOutputTokens: (existing?.llmOutputTokens ?? 0) + usage.outputTokens,
      llmCostUsd: (existing?.llmCostUsd ?? 0) + usage.estimatedCostUsd,
    });
  }
}
