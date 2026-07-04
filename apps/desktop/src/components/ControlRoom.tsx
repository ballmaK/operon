import { useState, useEffect } from 'react';
import type { Company, Task } from '@operon/shared-types';
import { useControlRoom } from '../hooks/useControlRoom';
import { ObjectiveCard } from './ObjectiveCard';
import { TaskListPanel } from './TaskListPanel';
import { WorkerExecutionPanel } from './WorkerExecutionPanel';
import { TranscriptTimeline } from './TranscriptTimeline';
import { ProofWall } from './ProofWall';
import { AssetLibrary } from './AssetLibrary';
import { HandoffPanel, fetchDeptHandoffCounts } from './HandoffPanel';
import { RhythmCenter } from './RhythmCenter';
import { ApprovalCenter } from './ApprovalCenter';
import { SettingsPanel } from './SettingsPanel';
import { OkrTreePanel } from './OkrTreePanel';
import {
  completeObjective,
  createObjective,
  getObjective,
  listDepartmentTasks,
  pauseObjective,
  resumeObjective,
  sendObjectiveMessage,
  startObjective,
  updateObjective,
} from '../lib/sidecar-api';

type MainView = 'room' | 'tasks' | 'handoffs' | 'rhythm' | 'transcripts' | 'proofs' | 'assets' | 'approvals' | 'settings' | 'okr';

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
  const [view, setView] = useState<MainView>('room');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newConstraints, setNewConstraints] = useState('');
  const [loopMap, setLoopMap] = useState<Record<string, Awaited<ReturnType<typeof getObjective>>['controlLoop']>>({});
  const [handoffCounts, setHandoffCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!port || data.departments.length === 0) return;
    void fetchDeptHandoffCounts(port, data.departments).then(setHandoffCounts);
  }, [port, data.departments, view]);

  useEffect(() => {
    if (data.departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(data.departments[0].id);
    }
  }, [data.departments, selectedDeptId]);

  useEffect(() => {
    if (!selectedDeptId) {
      setTasks([]);
      return;
    }
    void listDepartmentTasks(port, selectedDeptId).then(setTasks);
  }, [port, selectedDeptId, data.objectives]);

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
    ).then((entries) => setLoopMap(Object.fromEntries(entries)));
  }, [port, data.objectives]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

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
      if (selectedDeptId) {
        const updated = await listDepartmentTasks(port, selectedDeptId);
        setTasks(updated);
      }
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

  const tabs: { id: MainView; label: string }[] = [
    { id: 'room', label: '控制室' },
    { id: 'tasks', label: '任务' },
    { id: 'handoffs', label: '交接' },
    { id: 'rhythm', label: '运营节奏' },
    { id: 'transcripts', label: '转录' },
    { id: 'okr', label: 'OKR' },
    { id: 'proofs', label: '证明墙' },
    { id: 'assets', label: '资产库' },
  ];

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
        <nav className="view-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`view-tab ${view === t.id ? 'active' : ''}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={`topbar-item btn-link ${view === 'approvals' ? 'active' : ''}`}
          onClick={() => setView('approvals')}
        >
          审批
          {data.pendingApprovals > 0 ? (
            <span className="approval-badge">{data.pendingApprovals}</span>
          ) : null}
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setView('settings')}>
          设置
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={onCreateCompany}>
          + 公司
        </button>
      </header>

      {view === 'room' ? (
        <>
          <div className="control-room-body">
            <aside className="control-room-sidebar">
              <h2>部门</h2>
              {data.departments.length === 0 ? (
                <p className="hint">暂无部门</p>
              ) : (
                <ul className="dept-nav">
                  {data.departments.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        className={`dept-nav-btn ${selectedDeptId === d.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDeptId(d.id);
                          setView('tasks');
                        }}
                      >
                        <span>{d.name}</span>
                        {d.activeTaskCount > 0 ? (
                          <span className="dept-badge">{d.activeTaskCount}</span>
                        ) : null}
                        {(handoffCounts[d.id] ?? 0) > 0 ? (
                          <span className="handoff-badge">{handoffCounts[d.id]}</span>
                        ) : null}
                      </button>
                    </li>
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
                          const deptId = selectedDeptId ?? data.departments[0]?.id;
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
            </main>
          </div>

          <footer className="control-room-footer">
            <TranscriptTimeline port={port} companyId={company.id} compact />
          </footer>
        </>
      ) : null}

      {view === 'tasks' ? (
        <div className="control-room-body tasks-view">
          <aside className="control-room-sidebar">
            <h2>部门</h2>
            <ul className="dept-nav">
              {data.departments.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`dept-nav-btn ${selectedDeptId === d.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDeptId(d.id);
                      setSelectedTaskId(null);
                    }}
                  >
                    <span>{d.name}</span>
                    {d.activeTaskCount > 0 ? (
                      <span className="dept-badge">{d.activeTaskCount}</span>
                    ) : null}
                    {(handoffCounts[d.id] ?? 0) > 0 ? (
                      <span className="handoff-badge">{handoffCounts[d.id]}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <main className="control-room-main task-split">
            <section>
              <h2>任务列表</h2>
              <TaskListPanel
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onSelect={setSelectedTaskId}
              />
            </section>
            <WorkerExecutionPanel port={port} task={selectedTask} />
          </main>
        </div>
      ) : null}

      {view === 'handoffs' ? (
        <div className="control-room-main padded">
          <HandoffPanel
            port={port}
            companyId={company.id}
            departments={data.departments}
            selectedDepartmentId={selectedDeptId}
            onPendingChange={() => void fetchDeptHandoffCounts(port, data.departments).then(setHandoffCounts)}
          />
        </div>
      ) : null}

      {view === 'rhythm' ? (
        <div className="control-room-main padded">
          <RhythmCenter port={port} companyId={company.id} />
        </div>
      ) : null}

      {view === 'transcripts' ? (
        <div className="control-room-main padded">
          <TranscriptTimeline port={port} companyId={company.id} />
        </div>
      ) : null}

      {view === 'proofs' ? (
        <div className="control-room-main padded">
          <ProofWall port={port} companyId={company.id} />
        </div>
      ) : null}

      {view === 'assets' ? (
        <div className="control-room-main padded">
          <AssetLibrary port={port} companyId={company.id} />
        </div>
      ) : null}

      {view === 'approvals' ? (
        <div className="control-room-main padded">
          <ApprovalCenter port={port} onChange={() => void refresh()} />
        </div>
      ) : null}

      {view === 'settings' ? (
        <div className="control-room-main padded">
          <SettingsPanel port={port} />
        </div>
      ) : null}

      {view === 'okr' ? (
        <div className="control-room-main padded">
          <OkrTreePanel port={port} objectives={data.objectives} />
        </div>
      ) : null}
    </div>
  );
}
