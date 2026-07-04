import { useEffect, useState } from 'react';
import type { Task, WorkerRun } from '@operon/shared-types';
import { getWorkerRun, listTaskRuns } from '../lib/sidecar-api';
import { TASK_STATUS_LABEL, WORKER_STATUS_LABEL } from '../lib/m02-m03';

interface WorkerExecutionPanelProps {
  port: number;
  task: Task | null;
}

export function WorkerExecutionPanel({ port, task }: WorkerExecutionPanelProps) {
  const [runs, setRuns] = useState<WorkerRun[]>([]);
  const [liveRun, setLiveRun] = useState<WorkerRun | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task) {
      setRuns([]);
      setLiveRun(null);
      return;
    }
    setLoading(true);
    void listTaskRuns(port, task.id)
      .then(setRuns)
      .finally(() => setLoading(false));
  }, [port, task]);

  useEffect(() => {
    if (!task?.workerRunId) {
      setLiveRun(null);
      return;
    }
    const poll = () => {
      void getWorkerRun(port, task.workerRunId!).then(setLiveRun).catch(() => setLiveRun(null));
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [port, task?.workerRunId]);

  if (!task) {
    return (
      <div className="worker-panel empty">
        <p className="hint">选择左侧任务查看 Worker 执行实况。</p>
      </div>
    );
  }

  const active = liveRun ?? runs[0] ?? null;

  return (
    <div className="worker-panel">
      <h3>任务执行实况</h3>
      {loading ? <p className="hint">加载中…</p> : null}
      <dl className="worker-meta">
        <dt>任务状态</dt>
        <dd>{TASK_STATUS_LABEL[task.status]}</dd>
        <dt>预期证明</dt>
        <dd>{task.expectedProofType}</dd>
        <dt>允许技能</dt>
        <dd>{task.allowedSkills.join(', ')}</dd>
      </dl>

      {active ? (
        <div className={`worker-run-card status-${active.status}`}>
          <div className="worker-run-header">
            <span className={`task-status-dot ${active.status === 'running' ? 'running' : ''}`} />
            <strong>Worker {active.id.slice(0, 8)}</strong>
            <span className="badge">{WORKER_STATUS_LABEL[active.status]}</span>
          </div>
          <p className="worker-brief">{active.brief.slice(0, 200)}</p>
          {active.proof ? (
            <div className="worker-proof">
              <span>Proof ({active.proof.type})</span>
              <p>{active.proof.summary}</p>
              {active.proof.path ? <code>{active.proof.path}</code> : null}
            </div>
          ) : (
            <p className="hint">等待 Worker 提交证明…</p>
          )}
        </div>
      ) : (
        <p className="hint">尚无 Worker 运行记录。</p>
      )}

      {runs.length > 1 ? (
        <details className="worker-history">
          <summary>历史运行 ({runs.length})</summary>
          <ul>
            {runs.slice(1).map((r) => (
              <li key={r.id}>
                {r.id.slice(0, 8)} — {WORKER_STATUS_LABEL[r.status]}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
