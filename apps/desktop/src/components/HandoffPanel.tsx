import { useCallback, useEffect, useState } from 'react';
import type { DepartmentSummary } from '@operon/shared-types';
import type { Handoff } from '@operon/shared-types';
import {
  acceptHandoff,
  createHandoff,
  getHandoffPendingCount,
  listHandoffInbox,
  rejectHandoff,
  replyHandoff,
} from '../lib/sidecar-api';

interface HandoffPanelProps {
  port: number;
  companyId: string;
  departments: DepartmentSummary[];
  selectedDepartmentId: string | null;
  onPendingChange?: () => void;
}

export function HandoffPanel({
  port,
  companyId,
  departments,
  selectedDepartmentId,
  onPendingChange,
}: HandoffPanelProps) {
  const [inbox, setInbox] = useState<Handoff[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [fromDeptId, setFromDeptId] = useState('');
  const [toDeptId, setToDeptId] = useState('');
  const [contextSummary, setContextSummary] = useState('');
  const [request, setRequest] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deptId = selectedDepartmentId ?? departments[0]?.id ?? null;

  const refresh = useCallback(async () => {
    if (!deptId) return;
    const list = await listHandoffInbox(port, deptId);
    setInbox(list);
    onPendingChange?.();
  }, [port, deptId, onPendingChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (departments.length > 0 && !fromDeptId) {
      setFromDeptId(departments[0].id);
    }
  }, [departments, fromDeptId]);

  const submitCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await createHandoff(port, {
        companyId,
        fromDepartmentId: fromDeptId,
        toDepartmentId: toDeptId,
        contextSummary,
        request,
        expectedProofType: 'file',
      });
      setShowCreate(false);
      setContextSummary('');
      setRequest('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setBusy(false);
    }
  };

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? id.slice(0, 8);

  return (
    <section className="handoff-panel">
      <div className="section-header">
        <h2>交接收件箱</h2>
        <button type="button" className="btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          + 创建 Handoff
        </button>
      </div>

      {showCreate ? (
        <div className="handoff-create">
          <label className="wizard-field">
            <span>发起部门</span>
            <select value={fromDeptId} onChange={(e) => setFromDeptId(e.target.value)}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="wizard-field">
            <span>接收部门</span>
            <select value={toDeptId} onChange={(e) => setToDeptId(e.target.value)}>
              <option value="">选择…</option>
              {departments.filter((d) => d.id !== fromDeptId).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="wizard-field">
            <span>上下文摘要</span>
            <textarea value={contextSummary} onChange={(e) => setContextSummary(e.target.value)} rows={2} maxLength={2000} />
          </label>
          <label className="wizard-field">
            <span>明确请求</span>
            <input value={request} onChange={(e) => setRequest(e.target.value)} maxLength={1000} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="wizard-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
            <button type="button" className="btn-primary" disabled={busy || !toDeptId} onClick={() => void submitCreate()}>
              发送
            </button>
          </div>
        </div>
      ) : null}

      <ul className="handoff-list">
        {inbox.length === 0 ? (
          <li className="hint">暂无交接。</li>
        ) : (
          inbox.map((h) => (
            <li key={h.id} className="handoff-item">
              <div className="handoff-item-header">
                <span>{deptName(h.fromDepartmentId)} → {deptName(h.toDepartmentId)}</span>
                <span className={`badge status-${h.status}`}>{h.status}</span>
              </div>
              <p className="handoff-request">{h.request}</p>
              <p className="hint">{h.contextSummary.slice(0, 120)}</p>
              {h.status === 'sent' ? (
                <div className="wizard-actions">
                  <button type="button" disabled={busy} onClick={() => void acceptHandoff(port, h.id).then(refresh)}>
                    接受
                  </button>
                  <button type="button" className="btn-secondary" disabled={busy} onClick={() => void rejectHandoff(port, h.id).then(refresh)}>
                    拒绝
                  </button>
                </div>
              ) : null}
              {h.status === 'accepted' ? (
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  disabled={busy}
                  onClick={() => {
                    const reply = window.prompt('回复摘要：');
                    if (reply?.trim()) void replyHandoff(port, h.id, reply.trim()).then(refresh);
                  }}
                >
                  回复交接
                </button>
              ) : null}
              {h.replySummary ? <p className="handoff-reply">回复：{h.replySummary}</p> : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export async function fetchDeptHandoffCounts(
  port: number,
  departments: DepartmentSummary[],
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    departments.map(async (d) => [d.id, await getHandoffPendingCount(port, d.id)] as const),
  );
  return Object.fromEntries(entries);
}
