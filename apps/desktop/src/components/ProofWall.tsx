import { useEffect, useState } from 'react';
import type { ProofWallItem } from '@operon/shared-types';
import {
  acceptProof,
  listProofsFiltered,
  rejectProof,
} from '../lib/sidecar-api';

interface ProofWallProps {
  port: number;
  companyId: string;
}

export function ProofWall({ port, companyId }: ProofWallProps) {
  const [proofs, setProofs] = useState<ProofWallItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const refresh = () => {
    setLoading(true);
    void listProofsFiltered(port, companyId, {
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    })
      .then(setProofs)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [port, companyId, typeFilter, statusFilter]);

  const review = async (id: string, action: 'accept' | 'reject') => {
    if (action === 'accept') await acceptProof(port, id);
    else await rejectProof(port, id);
    refresh();
  };

  return (
    <section className="proof-wall">
      <div className="section-header">
        <h2>证明墙</h2>
        <div className="proof-filters">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">全部类型</option>
            <option value="file">file</option>
            <option value="screenshot">screenshot</option>
            <option value="test">test</option>
            <option value="url">url</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            <option value="pending">pending</option>
            <option value="accepted">accepted</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
      </div>

      {loading ? <p className="hint">加载中…</p> : null}

      {proofs.length === 0 && !loading ? (
        <p className="hint">尚无证明。Worker 完成任务后会在此展示。</p>
      ) : (
        <div className="proof-grid">
          {proofs.map((p) => (
            <article key={p.id} className="proof-card">
              <div className="proof-card-icon">{p.type.slice(0, 1).toUpperCase()}</div>
              <div>
                <h3>{p.summary}</h3>
                <p className="proof-meta">
                  <span className="badge">{p.objectiveTitle}</span>
                  <span className={`acceptance ${p.acceptanceStatus}`}>{p.acceptanceStatus}</span>
                  <span className="hint">{new Date(p.createdAt).toLocaleString()}</span>
                </p>
                {p.path ? <code className="proof-path">{p.path}</code> : null}
                {p.acceptanceStatus === 'pending' ? (
                  <div className="proof-actions">
                    <button type="button" className="btn-primary btn-sm" onClick={() => void review(p.workerRunId, 'accept')}>
                      验收
                    </button>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => void review(p.workerRunId, 'reject')}>
                      拒绝
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
