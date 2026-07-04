import { useEffect, useState } from 'react';
import type { ProofWallItem } from '@operon/shared-types';
import { listProofs } from '../lib/sidecar-api';

interface ProofWallProps {
  port: number;
  companyId: string;
}

export function ProofWall({ port, companyId }: ProofWallProps) {
  const [proofs, setProofs] = useState<ProofWallItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void listProofs(port, companyId)
      .then(setProofs)
      .finally(() => setLoading(false));
  }, [port, companyId]);

  return (
    <section className="proof-wall">
      <div className="section-header">
        <h2>证明墙</h2>
        <span className="hint">TR-02：仅展示已关联 Proof 的条目</span>
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
                  <span className="hint">{new Date(p.createdAt).toLocaleString()}</span>
                </p>
                {p.path ? <code className="proof-path">{p.path}</code> : null}
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer">
                    {p.url}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
