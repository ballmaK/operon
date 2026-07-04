import { useState, useEffect } from 'react';
import type { Company } from '@operon/shared-types';
import { useControlRoom } from '../hooks/useControlRoom';
import { ObjectiveCard } from './ObjectiveCard';
import {
  completeObjective,
  createObjective,
  getObjective,
  pauseObjective,
  resumeObjective,
  sendObjectiveMessage,
  startObjective,
  updateObjective,
} from '../lib/sidecar-api';

interface ControlRoomProps {
  port: number;
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  onCreateCompany: () => void;
}

export function ControlRoom({
  port,
  companies,
  selectedCompanyId,
  onSelectCompany,
  onCreateCompany,
}: ControlRoomProps) {
  const company = companies.find((c) => c.id === selectedCompanyId) ?? companies[0] ?? null;
  const { data, loading, error, refresh } = useControlRoom(port, company);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newConstraints, setNewConstraints] = useState('');
  const [loopMap, setLoopMap] = useState<Record<string, Awaited<ReturnType<typeof getObjective>>['controlLoop']>>({});

  useEffect(() => {
    if (!port || data.objectives.length === 0) return;
    void Promise.all(
      data.objectives.map(async (obj) => {
        try {
          const detail = await getObjective(port, obj.id);
          return [obj.id, detail.controlLoop] as const;
        } catch {
          return [obj.id, null] as const;
        }
      }),
    ).then((entries) => {
      setLoopMap(Object.fromEntries(entries));
    });
  }, [port, data.objectives]);

  const loadLoop = async (objectiveId: string) => {
    const detail = await getObjective(port, objectiveId);
    setLoopMap((prev) => ({ ...prev, [objectiveId]: detail.controlLoop }));
  };

  const withBusy = async (objectiveId: string, fn: () => Promise<void>) => {
    setBusyId(objectiveId);
    try {
      await fn();
      await refresh();
      await loadLoop(objectiveId);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    if (!company || newTitle.trim().length < 5) return;
    setBusyId('create');
    try {
      await createObjective(port, company.id, {
        title: newTitle.trim(),
        constraints: newConstraints.trim() || undefined,
        priority: 'P0',
      });
      setNewTitle('');
      setNewConstraints('');
      setShowCreate(false);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (!company) return null;

  return (
    <div className="control-room">
      <header className="control-room-topbar">
        <select
          className="company-select"
          value={company.id}
          onChange={(e) => onSelectCompany(e.target.value)}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="topbar-item muted">运营节奏 · 即将推出</span>
        <span className="topbar-item">
          审批
          {data.pendingApprovals > 0 ? (
            <span className="approval-badge">{data.pendingApprovals}</span>
          ) : null}
        </span>
        <span className="topbar-item muted">设置</span>
        <button type="button" className="btn-secondary btn-sm" onClick={onCreateCompany}>
          + 公司
        </button>
      </header>

      <div className="control-room-body">
        <aside className="control-room-sidebar">
          <h2>部门</h2>
          {data.departments.length === 0 ? (
            <p className="hint">暂无部门</p>
          ) : (
            <ul className="dept-nav">
              {data.departments.map((d) => (
                <li key={d.id}>{d.name}</li>
              ))}
            </ul>
          )}
        </aside>

        <main className="control-room-main">
          <section className="objectives-section">
            <div className="section-header">
              <h2>目标</h2>
              <button type="button" className="btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
                + 新建目标
              </button>
            </div>

            {showCreate ? (
              <div className="objective-create">
                <label className="wizard-field">
                  <span>目标标题</span>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="5-200 字符"
                    maxLength={200}
                  />
                </label>
                <label className="wizard-field">
                  <span>约束（选填）</span>
                  <textarea
                    value={newConstraints}
                    onChange={(e) => setNewConstraints(e.target.value)}
                    rows={2}
                    maxLength={2000}
                  />
                </label>
                <div className="wizard-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                    取消
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busyId === 'create' || newTitle.trim().length < 5}
                    onClick={() => void handleCreate()}
                  >
                    创建
                  </button>
                </div>
              </div>
            ) : null}

            {loading ? <p className="hint">加载中…</p> : null}
            {error ? <p className="error">{error}</p> : null}

            <div className="objective-grid">
              {data.objectives.map((obj) => (
                <ObjectiveCard
                  key={obj.id}
                  objective={obj}
                  controlLoop={loopMap[obj.id] ?? null}
                  busy={busyId === obj.id}
                  onStart={() =>
                    void withBusy(obj.id, async () => {
                      const deptId = data.departments[0]?.id;
                      await startObjective(port, obj.id, deptId);
                    })
                  }
                  onPause={() => void withBusy(obj.id, async () => { await pauseObjective(port, obj.id); })}
                  onResume={() => void withBusy(obj.id, async () => { await resumeObjective(port, obj.id); })}
                  onComplete={() => void withBusy(obj.id, async () => { await completeObjective(port, obj.id); })}
                  onMessage={(message) =>
                    void withBusy(obj.id, async () => {
                      await sendObjectiveMessage(port, obj.id, message);
                    })
                  }
                  onEdit={(input) =>
                    void withBusy(obj.id, async () => {
                      await updateObjective(port, obj.id, input);
                    })
                  }
                />
              ))}
            </div>

            {data.objectives.length === 0 && !loading ? (
              <p className="hint">暂无目标，点击「新建目标」开始。</p>
            ) : null}
          </section>

          <section className="dept-overview">
            <h2>部门概览</h2>
            <p className="hint">任务与 Worker 状态将在 M02 中展示。</p>
          </section>
        </main>
      </div>

      <footer className="control-room-footer">
        <h2>最近动态</h2>
        {data.transcripts.length === 0 ? (
          <p className="hint">暂无 Transcript 记录。</p>
        ) : (
          <ul className="transcript-snippet-list">
            {data.transcripts.map((t) => (
              <li key={t.id}>
                <span className="transcript-actor">{t.actor}</span>
                <span className="transcript-action">{t.actionType}</span>
                <span className="transcript-time">
                  {new Date(t.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </div>
  );
}
