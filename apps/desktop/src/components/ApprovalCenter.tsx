import { useCallback, useEffect, useState } from 'react';
import type { Approval } from '@operon/shared-types';
import {
  approveRequest,
  listAllApprovals,
  rejectRequest,
} from '../lib/sidecar-api';

interface ApprovalCenterProps {
  port: number;
  onChange?: () => void;
}

export function ApprovalCenter({ port, onChange }: ApprovalCenterProps) {
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAllApprovals(port, 'pending'));
    } finally {
      setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      if (action === 'approve') await approveRequest(port, id);
      else await rejectRequest(port, id);
      await refresh();
      onChange?.();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="approval-center">
      <div className="section-header">
        <h2>审批中心</h2>
        <span className="hint">P-M16-01 — 高风险技能与敏感操作</span>
      </div>
      {loading ? <p className="hint">加载中…</p> : null}
      {items.length === 0 && !loading ? (
        <p className="hint">暂无待审批项。</p>
      ) : (
        <ul className="approval-list">
          {items.map((a) => (
            <li key={a.id} className="approval-row">
              <div>
                <strong>{a.actionType}</strong>
                <p>{a.summary}</p>
                <span className="hint">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <div className="approval-actions">
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  disabled={busyId === a.id}
                  onClick={() => void act(a.id, 'approve')}
                >
                  批准
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  disabled={busyId === a.id}
                  onClick={() => void act(a.id, 'reject')}
                >
                  拒绝
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
